import { readdirSync, readFileSync } from 'fs'
import matter from 'gray-matter'
import { join } from 'path'
import { beforeAll, describe, expect, it } from 'vitest'

interface BlogPostData {
	title: string
	slug?: string
	date: string
	author: string
	draft: boolean
	category: string
	description?: string
	image?: { src: string; alt: string }
	tags?: string[]
}

describe('Accessibility Tests', () => {
	let blogPosts: Array<{ slug: string; content: string; data: BlogPostData }>
	let staticPages: Array<{ path: string; content: string }>

	beforeAll(async () => {
		// Load all blog posts
		const blogDir = join(process.cwd(), 'src', 'content', 'blog')
		const mdxFiles = readdirSync(blogDir).filter(file => file.endsWith('.mdx'))

		blogPosts = mdxFiles.map(file => {
			const filePath = join(blogDir, file)
			const fileContent = readFileSync(filePath, 'utf-8')
			const parsed = matter(fileContent)
			return {
				slug: file.replace('.mdx', ''),
				content: parsed.content,
				data: parsed.data as BlogPostData,
			}
		})

		// Load static pages (Astro files)
		const pagesDir = join(process.cwd(), 'src', 'pages')
		const astroFiles = getAllAstroFiles(pagesDir)

		staticPages = astroFiles.map(file => {
			const content = readFileSync(file, 'utf-8')
			return {
				path: file.replace(process.cwd(), '').replace(/\\/g, '/'),
				content,
			}
		})
	})

	describe('Image Accessibility', () => {
		it('should have alt text for all images', () => {
			blogPosts.forEach(post => {
				// Check markdown images
				const markdownImagePattern = /!\[([^\]]*)\]\([^)]+\)/g
				const markdownMatches = [...post.content.matchAll(markdownImagePattern)]

				markdownMatches.forEach(match => {
					const [fullMatch, altText] = match
					if (!altText || altText.trim().length === 0) {
						throw new Error(
							`Missing alt text for image in ${post.slug}: ${fullMatch}`,
						)
					}

					// Check for meaningful alt text (not just filename or generic text)
					const genericTexts = ['image', 'photo', 'picture', 'img', 'untitled']
					const isGeneric = genericTexts.some(
						generic =>
							altText.toLowerCase().includes(generic) &&
							altText.toLowerCase() === generic,
					)

					if (isGeneric) {
						console.warn(`Generic alt text in ${post.slug}: "${altText}"`)
					}
				})

				// Check Astro Image components
				const astroImagePattern = /<Image[^>]+alt=["']([^"']*)["'][^>]*>/g
				const astroMatches = [...post.content.matchAll(astroImagePattern)]

				astroMatches.forEach(match => {
					const [fullMatch, altText] = match
					if (!altText || altText.trim().length === 0) {
						throw new Error(
							`Missing alt text for Astro Image in ${post.slug}: ${fullMatch}`,
						)
					}
				})
			})
		})

		it('should have alt text in frontmatter image data', () => {
			blogPosts.forEach(post => {
				if (post.data.image) {
					expect(post.data.image.alt).toBeDefined()
					expect(post.data.image.alt.trim().length).toBeGreaterThan(0)
				}
			})
		})

		it('should not have decorative images without proper alt handling', () => {
			// Check for images that might be decorative but have verbose alt text
			blogPosts.forEach(post => {
				const imagePattern = /!\[([^\]]*)\]\([^)]+\)/g
				const matches = [...post.content.matchAll(imagePattern)]

				matches.forEach(match => {
					const [, altText] = match

					// Warn about very long alt text (>125 characters is generally too long)
					if (altText && altText.length > 125) {
						console.warn(
							`Alt text may be too long in ${post.slug}: "${altText}" (${altText.length} chars)`,
						)
					}
				})
			})
		})
	})

	describe('Heading Structure', () => {
		it('should have proper heading hierarchy', () => {
			blogPosts.forEach(post => {
				const headingPattern = /^(#{1,6})\s+(.+)$/gm
				const matches = [...post.content.matchAll(headingPattern)]

				if (matches.length === 0) return // Skip posts without headings

				let previousLevel = 1 // Assuming title is H1

				matches.forEach(match => {
					const [, hashes, headingText] = match
					const currentLevel = hashes.length

					// Check for proper hierarchy (no skipping levels)
					if (currentLevel > previousLevel + 1) {
						throw new Error(
							`Heading hierarchy skip in ${post.slug}: jumping from H${previousLevel} to H${currentLevel} - "${headingText}"`,
						)
					}

					// Check for empty headings
					if (!headingText.trim()) {
						throw new Error(`Empty heading in ${post.slug}`)
					}

					previousLevel = currentLevel
				})
			})
		})

		it('should not have multiple H1 headings in content', () => {
			blogPosts.forEach(post => {
				const h1Pattern = /^#{1}\s+/gm
				const h1Matches = post.content.match(h1Pattern)

				if (h1Matches && h1Matches.length > 1) {
					console.warn(
						`Multiple H1 headings found in ${post.slug} - should use H2 for sections`,
					)
				}
			})
		})

		it('should have descriptive heading text', () => {
			const genericHeadings = [
				'introduction',
				'overview',
				'details',
				'more',
				'other',
				'miscellaneous',
			]

			blogPosts.forEach(post => {
				const headingPattern = /^#{1,6}\s+(.+)$/gm
				const matches = [...post.content.matchAll(headingPattern)]

				matches.forEach(match => {
					const [, headingText] = match
					const cleanHeading = headingText.toLowerCase().trim()

					if (genericHeadings.includes(cleanHeading)) {
						console.warn(`Generic heading in ${post.slug}: "${headingText}"`)
					}

					// Check for very short headings (might not be descriptive)
					if (cleanHeading.length < 3) {
						console.warn(`Very short heading in ${post.slug}: "${headingText}"`)
					}
				})
			})
		})
	})

	describe('Link Accessibility', () => {
		it('should have descriptive link text', () => {
			const nonDescriptiveTexts = [
				'click here',
				'here',
				'link',
				'read more',
				'more',
				'this',
				'continue',
				'go',
				'visit',
				'see',
				'check',
				'view',
				'download',
				'get',
			]

			blogPosts.forEach(post => {
				const linkPattern = /\[([^\]]+)\]\([^)]+\)/g
				const matches = [...post.content.matchAll(linkPattern)]

				matches.forEach(match => {
					const [, linkText] = match
					const cleanText = linkText.toLowerCase().trim()

					// Check for non-descriptive link text
					if (nonDescriptiveTexts.includes(cleanText)) {
						console.warn(
							`Non-descriptive link text in ${post.slug}: "${linkText}"`,
						)
					}

					// Check for very short link text
					if (cleanText.length < 4 && !cleanText.match(/^[a-z]{2,3}$/i)) {
						// Allow short words like "API", "SEO"
						console.warn(`Very short link text in ${post.slug}: "${linkText}"`)
					}

					// Check for URLs as link text
					if (cleanText.startsWith('http')) {
						console.warn(`URL used as link text in ${post.slug}: "${linkText}"`)
					}
				})
			})
		})

		it('should not have links that open in new windows without indication', () => {
			// Check for target="_blank" without indication in HTML
			const allContent = [
				...blogPosts.map(p => ({
					source: `blog/${p.slug}`,
					content: p.content,
				})),
				...staticPages.map(p => ({ source: p.path, content: p.content })),
			]

			allContent.forEach(({ source, content }) => {
				const newWindowPattern = /target=["']_blank["'][^>]*>([^<]+)</g
				const matches = [...content.matchAll(newWindowPattern)]

				matches.forEach(match => {
					const [, linkText] = match

					// Check if link text indicates it opens in new window
					const hasIndication =
						/\(opens? in new (window|tab)\)|new (window|tab)|external/i.test(
							linkText,
						)

					if (!hasIndication) {
						console.warn(
							`Link opens in new window without indication in ${source}: "${linkText}"`,
						)
					}
				})
			})
		})
	})

	describe('Content Structure', () => {
		it('should have meaningful page titles in frontmatter', () => {
			blogPosts.forEach(post => {
				const title = post.data.title

				// Check for empty or very short titles
				if (!title || title.trim().length < 10) {
					throw new Error(`Title too short in ${post.slug}: "${title}"`)
				}

				// Check for generic titles
				const genericTitles = ['untitled', 'new post', 'blog post', 'article']
				if (
					genericTitles.some(generic => title.toLowerCase().includes(generic))
				) {
					console.warn(`Generic title in ${post.slug}: "${title}"`)
				}
			})
		})

		it('should have meta descriptions', () => {
			blogPosts.forEach(post => {
				if (!post.data.description) {
					console.warn(`Missing meta description in ${post.slug}`)
				} else {
					const desc = post.data.description

					// Check description length (recommended 120-160 characters)
					if (desc.length < 50) {
						console.warn(
							`Meta description too short in ${post.slug}: ${desc.length} chars`,
						)
					} else if (desc.length > 160) {
						console.warn(
							`Meta description too long in ${post.slug}: ${desc.length} chars`,
						)
					}
				}
			})
		})

		it('should have proper list structure', () => {
			blogPosts.forEach(post => {
				// Check for list items without proper list structure
				const lines = post.content.split('\n')
				let inList = false

				lines.forEach((line, index) => {
					const isListItem =
						/^\s*[-*+]\s/.test(line) || /^\s*\d+\.\s/.test(line)
					const isEmpty = line.trim() === ''

					if (isListItem) {
						inList = true
					} else if (inList && !isEmpty && !isListItem) {
						// Check if we're properly ending a list
						const nextLine = lines[index + 1]
						const isNextListItem =
							nextLine &&
							(/^\s*[-*+]\s/.test(nextLine) || /^\s*\d+\.\s/.test(nextLine))

						if (!isNextListItem) {
							inList = false
						}
					}
				})
			})
		})
	})

	describe('Language and Readability', () => {
		it('should not have excessive use of CAPS', () => {
			blogPosts.forEach(post => {
				// Find words in ALL CAPS (excluding common abbreviations)
				const capsPattern = /\b[A-Z]{4,}\b/g
				const matches = post.content.match(capsPattern) || []

				const commonAcronyms = [
					'HTML',
					'CSS',
					'HTTP',
					'HTTPS',
					'API',
					'URL',
					'JSON',
					'XML',
					'SQL',
					'CMS',
					'SEO',
					'UI',
					'UX',
				]
				const excessiveCaps = matches.filter(
					word => !commonAcronyms.includes(word),
				)

				if (excessiveCaps.length > 5) {
					console.warn(
						`Excessive use of CAPS in ${post.slug}: ${excessiveCaps.slice(0, 3).join(', ')}...`,
					)
				}
			})
		})

		it('should have reasonable paragraph lengths', () => {
			blogPosts.forEach(post => {
				const paragraphs = post.content.split('\n\n').filter(p => {
					const trimmed = p.trim()
					return (
						trimmed.length > 0 &&
						!trimmed.startsWith('#') &&
						!trimmed.startsWith('-') &&
						!trimmed.startsWith('*')
					)
				})

				paragraphs.forEach(paragraph => {
					const wordCount = paragraph.split(/\s+/).length

					// Warn about very long paragraphs (>100 words)
					if (wordCount > 100) {
						console.warn(`Long paragraph in ${post.slug}: ${wordCount} words`)
					}
				})
			})
		})
	})

	describe('Color and Contrast', () => {
		it('should not rely solely on color for information', () => {
			// Check for color-only references in content
			const colorOnlyPatterns = [
				/click the (red|green|blue|yellow|orange|purple|pink) (button|link)/i,
				/see the (red|green|blue|yellow|orange|purple|pink) (text|section)/i,
				/as shown in (red|green|blue|yellow|orange|purple|pink)/i,
			]

			blogPosts.forEach(post => {
				colorOnlyPatterns.forEach(pattern => {
					const matches = post.content.match(pattern)
					if (matches) {
						console.warn(
							`Color-only reference in ${post.slug}: "${matches[0]}"`,
						)
					}
				})
			})
		})
	})

	describe('Form Accessibility', () => {
		it('should have proper form labels', () => {
			const allContent = [
				...blogPosts.map(p => ({
					source: `blog/${p.slug}`,
					content: p.content,
				})),
				...staticPages.map(p => ({ source: p.path, content: p.content })),
			]

			allContent.forEach(({ source, content }) => {
				// Check for input elements without labels
				const inputPattern = /<input[^>]*>/g
				const matches = [...content.matchAll(inputPattern)]

				matches.forEach(match => {
					const [inputTag] = match

					// Check if input has id and corresponding label, or aria-label
					const hasId = /id=["']([^"']+)["']/.test(inputTag)
					const hasAriaLabel = /aria-label=["']([^"']+)["']/.test(inputTag)
					const hasPlaceholder = /placeholder=["']([^"']+)["']/.test(inputTag)

					if (!hasId && !hasAriaLabel) {
						console.warn(
							`Input without proper labeling in ${source}: ${inputTag}`,
						)
					}

					// Warn if relying only on placeholder
					if (!hasId && !hasAriaLabel && hasPlaceholder) {
						console.warn(`Input relying only on placeholder in ${source}`)
					}
				})
			})
		})
	})
})

// Helper function to recursively get all .astro files
function getAllAstroFiles(dir: string): string[] {
	const files: string[] = []

	try {
		const items = readdirSync(dir, { withFileTypes: true })

		for (const item of items) {
			if (item.name.startsWith('.') || item.name === 'node_modules') {
				continue
			}

			const fullPath = join(dir, item.name)

			if (item.isDirectory()) {
				files.push(...getAllAstroFiles(fullPath))
			} else if (item.name.endsWith('.astro')) {
				files.push(fullPath)
			}
		}
	} catch (error) {
		console.warn(`Could not read directory ${dir}:`, error)
	}

	return files
}
