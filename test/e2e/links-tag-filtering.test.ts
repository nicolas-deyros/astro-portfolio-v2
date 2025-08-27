import { load } from 'cheerio'
import { beforeAll, describe, expect, it } from 'vitest'

interface Link {
	id: number
	title: string
	url: string
	tags: string
	date: string
}

// Helper to get the correct server URL
function getServerUrl(): string {
	return (
		((globalThis as Record<string, unknown>).testServerUrl as string) ||
		'http://localhost:4321'
	)
}

// Note: These integration tests require a running development server
// Run `npm run dev` in another terminal before running these tests
describe.skip('Links Tag Filtering and Pagination', () => {
	let allLinks: Link[]
	const serverUrl = 'http://localhost:4321'

	beforeAll(async () => {
		// Try to connect to the development server
		// First try the standard dev port, then the test environment port
		const possibleUrls = [
			'http://localhost:4321',
			'http://localhost:4322',
			'http://localhost:3000',
		]

		let serverFound = false
		for (const url of possibleUrls) {
			try {
				const response = await fetch(`${url}/links/1`)
				if (response.status === 200) {
					console.log(`Using server at ${url}`)
					// Update serverUrl to the working one
					Object.defineProperty(globalThis, 'testServerUrl', { value: url })
					serverFound = true
					break
				}
			} catch {
				// Try next URL
			}
		}

		if (!serverFound) {
			console.log('No development server found. Skipping integration tests.')
			// Skip all tests if no server is available
			return
		}

		// Fetch all links from API for reference
		try {
			const response = await fetch(
				`${globalThis.testServerUrl || serverUrl}/api/links.json`,
			)
			allLinks = await response.json()
		} catch {
			console.log('Could not fetch links data, some tests may be skipped')
			allLinks = []
		}
	}, 30000)

	describe('Server-Side Tag Filtering', () => {
		it('should filter links by tag parameter across all pages', async () => {
			// Skip if no server available
			if (allLinks.length === 0) {
				console.log('Skipping test - no server data available')
				return
			}

			// Test with a tag that should have multiple results
			const testTag = 'AI'
			const response = await fetch(`${getServerUrl()}/links/1?tag=${testTag}`)
			expect(response.status).toBe(200)

			const html = await response.text()
			const $ = load(html)

			// Check that filtered indicator appears in title
			const title = $('h3').text()
			expect(title).toContain(`filtered by "${testTag}"`)

			// Check that all displayed links contain the tag
			const linkItems = $('.link-item')
			expect(linkItems.length).toBeGreaterThan(0)

			linkItems.each((_, element) => {
				const linkTags = $(element)
					.find('.inline-flex')
					.map((_, tag) => $(tag).text())
					.get()
				expect(
					linkTags.some(tag =>
						tag.toLowerCase().includes(testTag.toLowerCase()),
					),
				).toBe(true)
			})
		})

		it('should show all matching links regardless of original pagination', async () => {
			// Get AI links from API to compare
			const aiLinks = allLinks.filter(link => {
				const tags = link.tags
					.toLowerCase()
					.split(',')
					.map(t => t.trim())
				return tags.includes('ai')
			})

			if (aiLinks.length > 0) {
				const response = await fetch(`${serverUrl}/links/1?tag=AI`)
				const html = await response.text()
				const $ = load(html)

				const displayedLinks = $('.link-item').length

				// Should show all AI links on the first page of filtered results
				// (not limited by original pagination boundaries)
				expect(displayedLinks).toBe(Math.min(aiLinks.length, 12)) // pageSize is 12
			}
		})

		it('should preserve tag parameters in pagination URLs', async () => {
			const response = await fetch(`${serverUrl}/links/1?tag=LinkedIn`)
			const html = await response.text()
			const $ = load(html)

			// Check pagination links contain tag parameter
			const paginationLinks = $('a[href*="/links/"]')
			paginationLinks.each((_, element) => {
				const href = $(element).attr('href')
				if (href && href !== '/links/1') {
					expect(href).toContain('tag=LinkedIn')
				}
			})
		})

		it('should show clear filter button when tag is active', async () => {
			const response = await fetch(`${serverUrl}/links/1?tag=CSS`)
			const html = await response.text()
			const $ = load(html)

			// Check clear filter button is visible
			const clearButtons = $('a:contains("Clear")')
			expect(clearButtons.length).toBeGreaterThan(0)

			// Check clear button links to all links
			clearButtons.each((_, element) => {
				const href = $(element).attr('href')
				expect(href).toBe('/links/1')
			})
		})

		it('should highlight active tag filter', async () => {
			const testTag = 'LinkedIn'
			const response = await fetch(`${serverUrl}/links/1?tag=${testTag}`)
			const html = await response.text()
			const $ = load(html)

			// Find the tag filter button for LinkedIn
			const tagFilters = $('.tag-filter')
			let foundActiveTag = false

			tagFilters.each((_, element) => {
				const tagText = $(element).text().trim()
				const hasActiveStyles =
					$(element).hasClass('ring-2') || $(element).hasClass('ring-blue-500')

				if (tagText === testTag && hasActiveStyles) {
					foundActiveTag = true
				}
			})

			expect(foundActiveTag).toBe(true)
		})
	})

	describe('No Results Handling', () => {
		it('should show no results message for non-existent tags', async () => {
			const response = await fetch(`${serverUrl}/links/1?tag=NonExistentTag`)
			const html = await response.text()
			const $ = load(html)

			// Should show no results message
			const noResultsMessage = $('p:contains("No links found")')
			expect(noResultsMessage.length).toBeGreaterThan(0)

			// Should have link back to all links
			const backLink = $('a:contains("View all links")')
			expect(backLink.length).toBeGreaterThan(0)
			expect(backLink.attr('href')).toBe('/links/1')
		})
	})

	describe('URL Structure and Bookmarking', () => {
		it('should handle encoded tag parameters correctly', async () => {
			// Test with tag that might need encoding
			const response = await fetch(
				`${serverUrl}/links/1?tag=${encodeURIComponent('C++')}`,
			)
			// Should not throw error and should return 200 even if no results
			expect(response.status).toBe(200)
		})

		it('should maintain clean URLs without unnecessary parameters', async () => {
			const response = await fetch(`${serverUrl}/links/1`)
			const html = await response.text()
			const $ = load(html)

			// Check that tag filter links are properly formatted
			const tagLinks = $('.tag-filter[href*="?tag="]')
			tagLinks.each((_, element) => {
				const href = $(element).attr('href')
				expect(href).toMatch(/^\/links\/1\?tag=.+$/)
			})
		})
	})

	describe('Pagination Integration', () => {
		it('should show correct pagination for filtered results', async () => {
			// Get a tag with known number of links
			const linkedInLinks = allLinks.filter(link => {
				const tags = link.tags
					.toLowerCase()
					.split(',')
					.map(t => t.trim())
				return tags.includes('linkedin')
			})

			if (linkedInLinks.length > 0) {
				const response = await fetch(`${serverUrl}/links/1?tag=LinkedIn`)
				const html = await response.text()
				const $ = load(html)

				// Check pagination shows correct format
				const paginationText = $('span[aria-current="page"]').text()
				expect(paginationText).toMatch(/\d+ of \d+/)

				const expectedPages = Math.ceil(linkedInLinks.length / 12)
				expect(paginationText).toContain(`of ${expectedPages}`)
			}
		})
	})

	describe('Performance and SEO', () => {
		it('should return filtered results quickly', async () => {
			const startTime = Date.now()
			const response = await fetch(`${serverUrl}/links/1?tag=AI`)
			const endTime = Date.now()

			expect(response.status).toBe(200)
			expect(endTime - startTime).toBeLessThan(2000) // Should respond within 2 seconds
		})

		it('should have proper meta tags for filtered pages', async () => {
			const response = await fetch(`${serverUrl}/links/1?tag=AI`)
			const html = await response.text()
			const $ = load(html)

			// Should have title tag
			const title = $('title').text()
			expect(title).toBeTruthy()

			// Should have description meta tag
			const description = $('meta[name="description"]').attr('content')
			expect(description).toBeTruthy()
		})
	})
})
