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

describe('SEO Validation', () => {
	let blogPosts: Array<{ slug: string; content: string; data: BlogPostData }>

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

		// Load Astro pages
		const pagesDir = join(process.cwd(), 'src', 'pages')
		const astroFiles = getAllAstroFiles(pagesDir)

		// Note: astroPages would be used for page-specific SEO validation if needed
		// Currently focusing on blog post SEO validation
		console.log(
			`Loaded ${astroFiles.length} Astro pages for potential SEO validation`,
		)
	})

	describe('Meta Title Validation', () => {
		it('should have titles in all blog posts', () => {
			blogPosts.forEach(post => {
				expect(
					post.data.title,
					`Blog post ${post.slug} should have a title`,
				).toBeTruthy()
				expect(
					post.data.title.length,
					`Title in ${post.slug} should not be empty`,
				).toBeGreaterThan(0)
			})
		})

		it('should have optimal title lengths for blog posts', () => {
			const minLength = 30
			const maxLength = 60
			const warnings: string[] = []

			blogPosts.forEach(post => {
				const titleLength = post.data.title.length

				if (titleLength < minLength) {
					warnings.push(
						`Blog post ${post.slug} title is too short (${titleLength} chars): "${post.data.title}"`,
					)
				} else if (titleLength > maxLength) {
					warnings.push(
						`Blog post ${post.slug} title is too long (${titleLength} chars): "${post.data.title}"`,
					)
				}
			})

			if (warnings.length > 0) {
				console.warn('Title length warnings:')
				warnings.forEach(warning => console.warn(`  ${warning}`))
			}
		})

		it('should have unique titles across all blog posts', () => {
			const titles = blogPosts.map(post => post.data.title.toLowerCase())
			const duplicates = titles.filter(
				(title, index) => titles.indexOf(title) !== index,
			)

			if (duplicates.length > 0) {
				throw new Error(
					`Duplicate titles found: ${[...new Set(duplicates)].join(', ')}`,
				)
			}
		})

		it('should not have generic or placeholder titles', () => {
			const genericTitles = [
				'untitled',
				'new post',
				'blog post',
				'title',
				'post',
			]

			blogPosts.forEach(post => {
				const title = post.data.title.toLowerCase()
				const isGeneric = genericTitles.some(generic => title.includes(generic))

				if (isGeneric) {
					console.warn(
						`Generic title detected in ${post.slug}: "${post.data.title}"`,
					)
				}
			})
		})
	})

	describe('Meta Description Validation', () => {
		it('should have descriptions in all blog posts', () => {
			blogPosts.forEach(post => {
				expect(
					post.data.description,
					`Blog post ${post.slug} should have a description`,
				).toBeTruthy()
				expect(
					post.data.description?.length || 0,
					`Description in ${post.slug} should not be empty`,
				).toBeGreaterThan(0)
			})
		})

		it('should have optimal description lengths', () => {
			const minLength = 120
			const maxLength = 160
			const warnings: string[] = []

			blogPosts.forEach(post => {
				if (post.data.description) {
					const descLength = post.data.description.length

					if (descLength < minLength) {
						warnings.push(
							`Blog post ${post.slug} description is too short (${descLength} chars)`,
						)
					} else if (descLength > maxLength) {
						warnings.push(
							`Blog post ${post.slug} description is too long (${descLength} chars)`,
						)
					}
				}
			})

			if (warnings.length > 0) {
				console.warn('Description length warnings:')
				warnings.forEach(warning => console.warn(`  ${warning}`))
			}
		})

		it('should have unique descriptions across all blog posts', () => {
			const descriptions = blogPosts
				.filter(post => post.data.description)
				.map(post => (post.data.description || '').toLowerCase())

			const duplicates = descriptions.filter(
				(desc, index) => descriptions.indexOf(desc) !== index,
			)

			if (duplicates.length > 0) {
				throw new Error(
					`Duplicate descriptions found: ${[...new Set(duplicates)].join(', ')}`,
				)
			}
		})

		it('should not have generic descriptions', () => {
			const genericPhrases = [
				'lorem ipsum',
				'placeholder',
				'description here',
				'add description',
			]

			blogPosts.forEach(post => {
				if (post.data.description) {
					const desc = post.data.description.toLowerCase()
					const isGeneric = genericPhrases.some(phrase => desc.includes(phrase))

					if (isGeneric) {
						console.warn(
							`Generic description detected in ${post.slug}: "${post.data.description}"`,
						)
					}
				}
			})
		})
	})

	describe('Heading Structure Validation', () => {
		it('should have proper heading hierarchy in blog posts', () => {
			blogPosts.forEach(post => {
				const headings = extractHeadings(post.content)

				if (headings.length === 0) {
					console.warn(`No headings found in ${post.slug}`)
					return
				}

				// Check for proper heading hierarchy
				for (let i = 1; i < headings.length; i++) {
					const currentLevel = headings[i].level
					const previousLevel = headings[i - 1].level

					if (currentLevel > previousLevel + 1) {
						console.warn(
							`Heading hierarchy skip in ${post.slug}: H${previousLevel} to H${currentLevel}`,
						)
					}
				}
			})
		})

		it('should have meaningful heading text', () => {
			const genericHeadings = ['heading', 'title', 'section', 'part', 'chapter']

			blogPosts.forEach(post => {
				const headings = extractHeadings(post.content)

				headings.forEach(heading => {
					const text = heading.text.toLowerCase().trim()

					if (genericHeadings.includes(text)) {
						console.warn(`Generic heading in ${post.slug}: "${heading.text}"`)
					}

					if (text.length < 3) {
						console.warn(
							`Very short heading in ${post.slug}: "${heading.text}"`,
						)
					}
				})
			})
		})
	})

	describe('Content Quality Validation', () => {
		it('should have sufficient content length', () => {
			const minWordCount = 300
			const warnings: string[] = []

			blogPosts.forEach(post => {
				const wordCount = countWords(post.content)

				if (wordCount < minWordCount) {
					warnings.push(
						`Blog post ${post.slug} is too short: ${wordCount} words (minimum: ${minWordCount})`,
					)
				}
			})

			if (warnings.length > 0) {
				console.warn('Content length warnings:')
				warnings.forEach(warning => console.warn(`  ${warning}`))
			}
		})

		it('should have good keyword distribution', () => {
			blogPosts.forEach(post => {
				const words = extractWords(post.content)
				const totalWords = words.length

				if (totalWords === 0) return

				// Check for keyword stuffing (same word appears too frequently)
				const wordFreq = new Map<string, number>()
				words.forEach(word => {
					if (word.length > 3) {
						// Only check meaningful words
						wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
					}
				})

				for (const [word, count] of wordFreq.entries()) {
					const frequency = (count / totalWords) * 100

					if (frequency > 3 && count > 5) {
						// More than 3% frequency and appears more than 5 times
						console.warn(
							`Potential keyword stuffing in ${post.slug}: "${word}" appears ${count} times (${frequency.toFixed(1)}%)`,
						)
					}
				}
			})
		})
	})

	describe('Image SEO Validation', () => {
		it('should have alt text for all images', () => {
			const imagePattern = /!\[([^\]]*)\]\([^)]+\)/g

			blogPosts.forEach(post => {
				const matches = [...post.content.matchAll(imagePattern)]

				matches.forEach(match => {
					const [fullMatch, altText] = match

					if (!altText || altText.trim().length === 0) {
						console.warn(`Missing alt text in ${post.slug}: ${fullMatch}`)
					} else if (altText.length < 10) {
						console.warn(`Very short alt text in ${post.slug}: "${altText}"`)
					} else if (altText.length > 125) {
						console.warn(
							`Very long alt text in ${post.slug}: "${altText}" (${altText.length} chars)`,
						)
					}
				})
			})
		})

		it('should have descriptive alt text', () => {
			const genericAltTexts = ['image', 'picture', 'photo', 'img', 'graphic']
			const imagePattern = /!\[([^\]]*)\]\([^)]+\)/g

			blogPosts.forEach(post => {
				const matches = [...post.content.matchAll(imagePattern)]

				matches.forEach(match => {
					const [, altText] = match

					if (altText) {
						const text = altText.toLowerCase().trim()

						if (genericAltTexts.includes(text)) {
							console.warn(`Generic alt text in ${post.slug}: "${altText}"`)
						}
					}
				})
			})
		})
	})

	describe('URL Structure Validation', () => {
		it('should have SEO-friendly slugs', () => {
			blogPosts.forEach(post => {
				const slug = post.data.slug || post.slug

				// Check for SEO-friendly slug patterns
				if (!/^[a-z0-9-]+$/.test(slug)) {
					console.warn(`Non-SEO-friendly slug in ${post.slug}: "${slug}"`)
				}

				if (slug.includes('_')) {
					console.warn(
						`Underscores in slug ${post.slug}: "${slug}" (hyphens are preferred)`,
					)
				}

				if (slug.length > 60) {
					console.warn(
						`Very long slug in ${post.slug}: "${slug}" (${slug.length} chars)`,
					)
				}

				if (slug.length < 3) {
					console.warn(`Very short slug in ${post.slug}: "${slug}"`)
				}
			})
		})
	})

	describe('Schema Markup Validation', () => {
		it('should have proper frontmatter structure', () => {
			const requiredFields = ['title', 'date', 'author', 'category']
			const optionalButRecommended = ['description', 'tags', 'image']

			blogPosts.forEach(post => {
				// Check required fields
				requiredFields.forEach(field => {
					if (!post.data[field as keyof BlogPostData]) {
						throw new Error(`Missing required field "${field}" in ${post.slug}`)
					}
				})

				// Check recommended fields
				optionalButRecommended.forEach(field => {
					if (!post.data[field as keyof BlogPostData]) {
						console.warn(`Missing recommended field "${field}" in ${post.slug}`)
					}
				})

				// Validate date format
				const dateRegex = /^\d{4}-\d{2}-\d{2}$/
				if (!dateRegex.test(post.data.date)) {
					console.warn(
						`Invalid date format in ${post.slug}: "${post.data.date}" (should be YYYY-MM-DD)`,
					)
				}
			})
		})
	})

	describe('Performance SEO Factors', () => {
		it('should not have excessive external links', () => {
			const maxExternalLinks = 10
			const externalLinkPattern = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g

			blogPosts.forEach(post => {
				const matches = [...post.content.matchAll(externalLinkPattern)]

				if (matches.length > maxExternalLinks) {
					console.warn(
						`Many external links in ${post.slug}: ${matches.length} links (consider reducing for better SEO)`,
					)
				}
			})
		})

		it('should have internal linking', () => {
			const internalLinkPattern = /\[([^\]]+)\]\(\/[^)]+\)/g
			const warnings: string[] = []

			blogPosts.forEach(post => {
				const matches = [...post.content.matchAll(internalLinkPattern)]

				if (matches.length === 0) {
					warnings.push(`No internal links found in ${post.slug}`)
				}
			})

			if (warnings.length > 0) {
				console.warn('Internal linking recommendations:')
				warnings.forEach(warning => console.warn(`  ${warning}`))
			}
		})
	})
})

// Helper functions
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

function extractHeadings(
	content: string,
): Array<{ level: number; text: string }> {
	const headingPattern = /^(#{1,6})\s+(.+)$/gm
	const headings: Array<{ level: number; text: string }> = []
	let match

	while ((match = headingPattern.exec(content)) !== null) {
		const level = match[1].length
		const text = match[2].trim()
		headings.push({ level, text })
	}

	return headings
}

function countWords(content: string): number {
	// Remove markdown syntax and count words
	const cleanContent = content
		.replace(/```[\s\S]*?```/g, '') // Remove code blocks
		.replace(/`[^`]+`/g, '') // Remove inline code
		.replace(/!\[[^\]]*\]\([^)]+\)/g, '') // Remove images
		.replace(/\[[^\]]+\]\([^)]+\)/g, '') // Remove links (keep text)
		.replace(/[#*_~`]/g, '') // Remove markdown formatting
		.replace(/\s+/g, ' ') // Normalize whitespace
		.trim()

	if (!cleanContent) return 0

	return cleanContent.split(/\s+/).length
}

function extractWords(content: string): string[] {
	// Extract words for analysis, removing markdown and normalizing
	const cleanContent = content
		.replace(/```[\s\S]*?```/g, ' ') // Remove code blocks
		.replace(/`[^`]+`/g, ' ') // Remove inline code
		.replace(/!\[[^\]]*\]\([^)]+\)/g, ' ') // Remove images
		.replace(/\[[^\]]+\]\([^)]+\)/g, ' ') // Remove links
		.replace(/[#*_~`[\]()]/g, ' ') // Remove markdown formatting
		.toLowerCase()
		.replace(/[^\w\s]/g, ' ') // Remove punctuation
		.replace(/\s+/g, ' ') // Normalize whitespace
		.trim()

	if (!cleanContent) return []

	return cleanContent.split(/\s+/).filter(word => word.length > 2) // Filter short words
}
