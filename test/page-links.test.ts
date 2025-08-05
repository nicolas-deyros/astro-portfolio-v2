import { existsSync,readdirSync, readFileSync } from 'fs'
import matter from 'gray-matter'
import { join } from 'path'
import { beforeAll,describe, expect, it } from 'vitest'

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

describe('Page Links Validation', () => {
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

	describe('Internal Blog Links Validation', () => {
		it('should have valid internal blog post links', () => {
			const allSlugs = blogPosts.map(post => post.data.slug || post.slug)
			// Updated pattern to exclude /blog/categories/ and /blog/tags/ paths
			const internalBlogLinkPattern =
				/(?:\[([^\]]+)\]\(\/blog\/(?!categories\/|tags\/)([^)/]+)\/?\)|href=["']\/blog\/(?!categories\/|tags\/)([^"'/]+)\/?\/?["'])/g

			const allContent = [
				...blogPosts.map(p => ({
					source: `blog/${p.slug}`,
					content: p.content,
				})),
				...staticPages.map(p => ({ source: p.path, content: p.content })),
			]

			allContent.forEach(({ source, content }) => {
				const matches = [...content.matchAll(internalBlogLinkPattern)]

				matches.forEach(match => {
					const [, , markdownSlug, hrefSlug] = match
					const targetSlug = markdownSlug || hrefSlug

					if (targetSlug && !allSlugs.includes(targetSlug)) {
						throw new Error(
							`Invalid internal blog link in ${source}: slug "${targetSlug}" not found`,
						)
					}
				})
			})
		})

		it('should have valid category links', () => {
			const allCategories = [
				...new Set(blogPosts.map(post => post.data.category).filter(Boolean)),
			]
			const categoryLinkPattern =
				/(?:\[([^\]]+)\]\(\/blog\/categories\/([^)]+)\)|href=["']\/blog\/categories\/([^"']+)["'])/g

			const allContent = [
				...blogPosts.map(p => ({
					source: `blog/${p.slug}`,
					content: p.content,
				})),
				...staticPages.map(p => ({ source: p.path, content: p.content })),
			]

			allContent.forEach(({ source, content }) => {
				const matches = [...content.matchAll(categoryLinkPattern)]

				matches.forEach(match => {
					const [, , markdownCategory, hrefCategory] = match
					const targetCategory = decodeURIComponent(
						markdownCategory || hrefCategory,
					)

					if (targetCategory && !allCategories.includes(targetCategory)) {
						throw new Error(
							`Invalid category link in ${source}: category "${targetCategory}" not found`,
						)
					}
				})
			})
		})

		it('should have valid internal page links', () => {
			const validInternalPaths = [
				'/',
				'/blog',
				'/blog/',
				'/contact',
				'/contact/',
				'/links',
				'/links/',
				'/blog/tags',
				'/blog/tags/',
				'/blog/categories',
				'/blog/categories/',
				'/404',
				'/404/',
			]

			const internalPagePattern =
				/(?:\[([^\]]+)\]\((\/[^)#?]*)|href=["'](\/[^"'#?]*))["']?/g

			const allContent = [
				...blogPosts.map(p => ({
					source: `blog/${p.slug}`,
					content: p.content,
				})),
				...staticPages.map(p => ({ source: p.path, content: p.content })),
			]

			allContent.forEach(({ source, content }) => {
				const matches = [...content.matchAll(internalPagePattern)]

				matches.forEach(match => {
					const [, , markdownPath, hrefPath] = match
					const targetPath = markdownPath || hrefPath

					if (targetPath) {
						const cleanPath = targetPath.split('#')[0].split('?')[0]

						// Skip dynamic routes
						if (
							cleanPath.startsWith('/blog/') &&
							!cleanPath.startsWith('/blog/tags/') &&
							!cleanPath.startsWith('/blog/categories/')
						) {
							return // Blog post links are checked separately
						}

						if (cleanPath.startsWith('/blog/categories/')) {
							return // Category links are checked separately
						}

						const isValid = validInternalPaths.some(
							validPath =>
								cleanPath === validPath ||
								cleanPath === validPath.replace(/\/$/, ''),
						)

						if (!isValid) {
							console.warn(
								`Potentially invalid internal page link in ${source}: path "${cleanPath}"`,
							)
						}
					}
				})
			})
		})
	})

	describe('External Links Validation', () => {
		it('should have valid external link formats', () => {
			const externalLinkPattern =
				/(?:\[([^\]]+)\]\((https?:\/\/[^)]+)\)|href=["'](https?:\/\/[^"']+)["'])/g
			const allExternalLinks = new Set<string>()

			const allContent = [
				...blogPosts.map(p => ({
					source: `blog/${p.slug}`,
					content: p.content,
				})),
				...staticPages.map(p => ({ source: p.path, content: p.content })),
			]

			allContent.forEach(({ source, content }) => {
				const matches = [...content.matchAll(externalLinkPattern)]
				matches.forEach(match => {
					const [, , markdownUrl, hrefUrl] = match
					const url = markdownUrl || hrefUrl
					if (url) {
						allExternalLinks.add(url)

						// Basic URL validation
						try {
							new URL(url)
						} catch {
							throw new Error(
								`Invalid external URL format in ${source}: "${url}"`,
							)
						}

						// Check for common URL patterns
						expect(url).toMatch(
							/^https?:\/\/.+\..+/,
							`Invalid URL format in ${source}: ${url}`,
						)
					}
				})
			})

			console.log(`Found ${allExternalLinks.size} unique external links`)
		})

		it('should not have mixed content (http links on https site)', () => {
			// This test assumes your site uses HTTPS in production
			const httpLinkPattern =
				/(?:\[([^\]]+)\]\((http:\/\/[^)]+)\)|href=["'](http:\/\/[^"']+)["'])/g

			const allContent = [
				...blogPosts.map(p => ({
					source: `blog/${p.slug}`,
					content: p.content,
				})),
				...staticPages.map(p => ({ source: p.path, content: p.content })),
			]

			const httpLinks: Array<{ source: string; url: string }> = []

			allContent.forEach(({ source, content }) => {
				const matches = [...content.matchAll(httpLinkPattern)]
				matches.forEach(match => {
					const [, , markdownUrl, hrefUrl] = match
					const url = markdownUrl || hrefUrl
					if (url) {
						httpLinks.push({ source, url })
					}
				})
			})

			if (httpLinks.length > 0) {
				console.warn('Found HTTP links that might cause mixed content issues:')
				httpLinks.forEach(({ source, url }) => {
					console.warn(`  ${source}: ${url}`)
				})
			}
		})
	})

	describe('Image Links Validation', () => {
		it('should have valid image references', () => {
			const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g

			blogPosts.forEach(post => {
				const matches = [...post.content.matchAll(imagePattern)]

				matches.forEach(match => {
					const [, altText, imagePath] = match

					if (imagePath.startsWith('/')) {
						// Internal image - check common locations
						const publicPath = join(
							process.cwd(),
							'public',
							imagePath.substring(1),
						)
						const srcAssetsPath = join(
							process.cwd(),
							'src',
							'assets',
							imagePath.substring(1),
						)

						const exists = existsSync(publicPath) || existsSync(srcAssetsPath)
						if (!exists) {
							console.warn(`Image not found in ${post.slug}: ${imagePath}`)
							console.warn(`  Checked: ${publicPath}`)
							console.warn(`  Checked: ${srcAssetsPath}`)
						}
					} else if (imagePath.startsWith('http')) {
						// External image - basic URL validation
						try {
							new URL(imagePath)
						} catch {
							throw new Error(`Invalid image URL in ${post.slug}: ${imagePath}`)
						}
					}

					// Alt text should be present (accessibility)
					if (!altText || altText.trim().length === 0) {
						console.warn(
							`Missing alt text for image in ${post.slug}: ${imagePath}`,
						)
					}
				})
			})
		})
	})

	describe('Markdown Link Syntax Validation', () => {
		it('should have properly formatted markdown links', () => {
			const malformedPatterns = [
				{
					pattern: /\[([^\]]+)\]\([^)]*\s[^)]*\)/,
					name: 'links with spaces in URL',
				},
				{ pattern: /\[([^\]]+)\]\(\)/, name: 'empty links' },
				{ pattern: /\[[^\]]*\]\([^)]*\n[^)]*\)/, name: 'multi-line links' },
				{ pattern: /\]\([^)]*\)/, name: 'links without opening bracket' },
				{ pattern: /\[[^\]]*\(/, name: 'malformed link syntax' },
			]

			blogPosts.forEach(post => {
				malformedPatterns.forEach(({ pattern, name }) => {
					const matches = post.content.match(pattern)
					if (matches) {
						console.warn(`Found ${name} in ${post.slug}:`, matches[0])
					}
				})
			})
		})

		it('should have consistent link formatting', () => {
			// Check for mixed link styles or common issues
			blogPosts.forEach(post => {
				const content = post.content

				// Check for bare URLs that should be formatted as links
				const bareUrlPattern = /(?<!\]\()https?:\/\/[^\s)]+(?!\))/g
				const bareUrls = content.match(bareUrlPattern)

				if (bareUrls && bareUrls.length > 0) {
					console.warn(
						`Found bare URLs in ${post.slug} that should be formatted as links:`,
						bareUrls,
					)
				}
			})
		})
	})

	describe('Link Accessibility', () => {
		it('should have descriptive link text', () => {
			const linkPattern = /\[([^\]]+)\]\([^)]+\)/g
			const nonDescriptiveTexts = [
				'click here',
				'here',
				'link',
				'read more',
				'more',
			]

			blogPosts.forEach(post => {
				const matches = [...post.content.matchAll(linkPattern)]

				matches.forEach(match => {
					const [, linkText] = match
					const cleanText = linkText.toLowerCase().trim()

					if (nonDescriptiveTexts.includes(cleanText)) {
						console.warn(
							`Non-descriptive link text in ${post.slug}: "${linkText}"`,
						)
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
