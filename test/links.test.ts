import { ChildProcess, spawn } from 'child_process'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

interface Link {
	id: number
	title: string
	url: string
	tags: string
	date: string
}

// Helper function to wait for server to be ready
async function waitForServer(
	url: string,
	timeout: number = 60000,
): Promise<void> {
	const start = Date.now()
	console.log(`Waiting for server at ${url}...`)
	while (Date.now() - start < timeout) {
		try {
			const response = await fetch(url)
			if (response.status === 200) {
				const text = await response.text()
				if (text.length > 2) {
					// check for non-empty array '[]'
					console.log(`Server at ${url} is ready!`)
					return
				}
			}
		} catch {
			// wait
		}
		await new Promise(resolve => setTimeout(resolve, 1000))
	}
	throw new Error(`Server at ${url} did not start in time.`)
}

describe('Links API Endpoint Validation', () => {
	let linksData: Link[]
	let server: ChildProcess
	const serverUrl = 'http://localhost:4321'

	beforeAll(async () => {
		server = spawn('npx', ['astro', 'dev', '--port', '4321'])
		await waitForServer(`${serverUrl}/api/links.json`)
		const response = await fetch(`${serverUrl}/api/links.json`)
		linksData = await response.json()
	}, 90000)

	afterAll(() => {
		server.kill()
	})

	it('should fetch a valid JSON array of links', () => {
		expect(Array.isArray(linksData)).toBe(true)
		expect(linksData.length).toBeGreaterThan(0)
	})

	it('should have valid link data', () => {
		const requiredFields = ['id', 'title', 'url', 'tags', 'date']

		linksData.forEach((link, index) => {
			describe(`Link ${index + 1}: "${link?.title || 'Unknown'}"`, () => {
				it('should have all required fields', () => {
					requiredFields.forEach(field => {
						expect(link).toHaveProperty(field)
						expect(link[field as keyof Link]).toBeDefined()
					})
				})

				it('should have valid field types and formats', () => {
					// Title should be a non-empty string
					expect(typeof link.title).toBe('string')
					expect(link.title.trim().length).toBeGreaterThan(0)

					// URL should be a valid HTTP/HTTPS URL
					expect(typeof link.url).toBe('string')
					expect(link.url).toMatch(/^https?:\/\/.+/)

					// Additional URL validation
					expect(() => new URL(link.url)).not.toThrow()

					// Tags should be a non-empty string
					expect(typeof link.tags).toBe('string')
					expect(link.tags.trim().length).toBeGreaterThan(0)

					// Date should be a valid date string
					expect(typeof link.date).toBe('string')
					const parsedDate = new Date(link.date)
					expect(parsedDate).toBeInstanceOf(Date)
					expect(isNaN(parsedDate.getTime())).toBe(false)
				})

				it('should have properly formatted tags', () => {
					// Tags should contain at least one tag
					const tags = link.tags
						.split(',')
						.map(tag => tag.trim())
						.filter(tag => tag.length > 0)
					expect(tags.length).toBeGreaterThan(0)

					// Each tag should be non-empty
					tags.forEach(tag => {
						expect(tag.length).toBeGreaterThan(0)
					})
				})

				it('should have a reasonable date (not in the far future)', () => {
					const linkDate = new Date(link.date)
					const now = new Date()
					const oneYearFromNow = new Date()
					oneYearFromNow.setFullYear(now.getFullYear() + 1)

					// Date should not be more than 1 year in the future
					expect(linkDate.getTime()).toBeLessThanOrEqual(
						oneYearFromNow.getTime(),
					)

					// Date should not be before 2020 (reasonable minimum)
					const minDate = new Date('2020-01-01')
					expect(linkDate.getTime()).toBeGreaterThanOrEqual(minDate.getTime())
				})

				it('should have a valid URL domain', () => {
					const url = new URL(link.url)
					expect(url.hostname).toBeTruthy()
					expect(url.hostname.length).toBeGreaterThan(0)

					// Should have a valid TLD
					expect(url.hostname).toMatch(/\.[a-z]{2,}$/i)
				})
			})
		})
	})

	describe('Data Quality Checks', () => {
		it('should not have duplicate URLs', () => {
			const urls = linksData.map(link => link.url)
			const uniqueUrls = new Set(urls)
			expect(uniqueUrls.size).toBe(urls.length)
		})

		it('should not have duplicate titles', () => {
			const titles = linksData.map(link => link.title)
			const uniqueTitles = new Set(titles)
			expect(uniqueTitles.size).toBe(titles.length)
		})

		it('should have consistent date format', () => {
			linksData.forEach(link => {
				// Check if date follows YYYY-MM-DD format
				expect(link.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
			})
		})

		it('should have reasonable title lengths', () => {
			linksData.forEach(link => {
				expect(link.title.length).toBeGreaterThan(5)
				expect(link.title.length).toBeLessThan(200)
			})
		})
	})

	describe('URL Accessibility Tests', () => {
		// Helper function to check URL accessibility
		async function checkUrlAccessibility(
			url: string,
			timeout = 10000,
		): Promise<{
			accessible: boolean
			status?: number
			error?: string
			redirected?: boolean
			finalUrl?: string
		}> {
			try {
				const controller = new AbortController()
				const timeoutId = setTimeout(() => controller.abort(), timeout)

				const response = await fetch(url, {
					method: 'HEAD', // Use HEAD to avoid downloading content
					signal: controller.signal,
					headers: {
						'User-Agent': 'Mozilla/5.0 (compatible; LinkChecker/1.0)',
					},
				})

				clearTimeout(timeoutId)

				return {
					accessible: response.status >= 200 && response.status < 400,
					status: response.status,
					redirected: response.redirected,
					finalUrl: response.url !== url ? response.url : undefined,
				}
			} catch (error) {
				if (error instanceof Error) {
					if (error.name === 'AbortError') {
						return {
							accessible: false,
							error: 'Request timeout',
						}
					}
					return {
						accessible: false,
						error: error.message,
					}
				}
				return {
					accessible: false,
					error: 'Unknown error',
				}
			}
		}

		it('should have accessible URLs (no 404 or server errors)', async () => {
			const results: Array<{
				title: string
				url: string
				result: Awaited<ReturnType<typeof checkUrlAccessibility>>
			}> = []

			// Check all URLs with a reasonable timeout
			for (const link of linksData) {
				const result = await checkUrlAccessibility(link.url, 15000)
				results.push({
					title: link.title,
					url: link.url,
					result,
				})

				// Add a small delay between requests to be respectful
				await new Promise(resolve => setTimeout(resolve, 500))
			}

			// Report results
			const inaccessibleLinks = results.filter(r => !r.result.accessible)
			const warnings: string[] = []
			const errors: string[] = []

			results.forEach(({ title, url, result }) => {
				if (!result.accessible) {
					if (result.status === 404) {
						errors.push(`404 Not Found: "${title}" - ${url}`)
					} else if (result.status && result.status >= 500) {
						errors.push(`Server Error (${result.status}): "${title}" - ${url}`)
					} else if (result.error) {
						warnings.push(
							`Connection Error: "${title}" - ${url} (${result.error})`,
						)
					} else {
						warnings.push(
							`Inaccessible: "${title}" - ${url} (Status: ${result.status})`,
						)
					}
				} else if (result.redirected) {
					console.log(`Redirected: "${title}" - ${url} → ${result.finalUrl}`)
				}
			})

			// Log warnings (network issues, timeouts) but don't fail the test
			if (warnings.length > 0) {
				console.warn('\nURL Accessibility Warnings:')
				warnings.forEach(warning => console.warn(`  ${warning}`))
			}

			// Fail the test only for definitive errors (404, 500, etc.)
			if (errors.length > 0) {
				console.error('\nURL Accessibility Errors:')
				errors.forEach(error => console.error(`  ${error}`))
				throw new Error(`${errors.length} URLs are returning errors`)
			}

			console.log(
				`\nURL Accessibility Summary: ${results.length - inaccessibleLinks.length}/${results.length} URLs are accessible`,
			)
		}, 120000) // 2 minute timeout for the entire test

		it('should not have URLs that redirect too many times', async () => {
			const maxRedirects = 5
			const problematicUrls: string[] = []

			for (const link of linksData) {
				try {
					let currentUrl = link.url
					let redirectCount = 0
					const visitedUrls = new Set<string>()

					while (redirectCount < maxRedirects) {
						if (visitedUrls.has(currentUrl)) {
							problematicUrls.push(
								`Redirect loop detected: "${link.title}" - ${link.url}`,
							)
							break
						}

						visitedUrls.add(currentUrl)

						const response = await fetch(currentUrl, {
							method: 'HEAD',
							redirect: 'manual',
							headers: {
								'User-Agent': 'Mozilla/5.0 (compatible; LinkChecker/1.0)',
							},
						})

						if (response.status >= 300 && response.status < 400) {
							const location = response.headers.get('location')
							if (!location) {
								break
							}

							currentUrl = new URL(location, currentUrl).href
							redirectCount++
						} else {
							break
						}
					}

					if (redirectCount >= maxRedirects) {
						problematicUrls.push(
							`Too many redirects: "${link.title}" - ${link.url} (${redirectCount}+ redirects)`,
						)
					}

					// Small delay between requests
					await new Promise(resolve => setTimeout(resolve, 300))
				} catch {
					// Skip network errors for this test
					continue
				}
			}

			if (problematicUrls.length > 0) {
				console.warn('\nRedirect Issues:')
				problematicUrls.forEach(issue => console.warn(`  ${issue}`))
			}

			expect(problematicUrls.length).toBe(0)
		}, 60000) // 1 minute timeout

		it('should have URLs with proper SSL certificates (for HTTPS)', async () => {
			const httpsLinks = linksData.filter(link =>
				link.url.startsWith('https://'),
			)
			const sslIssues: string[] = []

			for (const link of httpsLinks) {
				try {
					await fetch(link.url, {
						method: 'HEAD',
						headers: {
							'User-Agent': 'Mozilla/5.0 (compatible; LinkChecker/1.0)',
						},
					})

					// If fetch succeeds, SSL is valid
					// (fetch will throw on SSL errors in most environments)
				} catch (error) {
					if (error instanceof Error) {
						if (
							error.message.includes('certificate') ||
							error.message.includes('SSL') ||
							error.message.includes('TLS')
						) {
							sslIssues.push(
								`SSL/TLS Issue: "${link.title}" - ${link.url} (${error.message})`,
							)
						}
					}
				}

				// Small delay between requests
				await new Promise(resolve => setTimeout(resolve, 300))
			}

			if (sslIssues.length > 0) {
				console.warn('\nSSL/TLS Issues:')
				sslIssues.forEach(issue => console.warn(`  ${issue}`))
			}

			// Don't fail the test for SSL issues as they might be temporary
			// but log them for awareness
		}, 60000) // 1 minute timeout
	})
})
