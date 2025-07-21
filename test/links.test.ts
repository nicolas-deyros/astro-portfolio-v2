import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

interface Link {
	title: string
	url: string
	tags: string
	date: string
}

describe('Links JSON File Validation', () => {
	let linksData: Link[]

	// Load the links data
	const linksPath = join(process.cwd(), 'src', 'content', 'links.json')
	const rawData = readFileSync(linksPath, 'utf-8')

	try {
		linksData = JSON.parse(rawData)
	} catch (error) {
		throw new Error(`Invalid JSON in links.json: ${error}`)
	}

	const requiredFields = ['title', 'url', 'tags', 'date']

	it('should be a valid JSON array', () => {
		expect(Array.isArray(linksData)).toBe(true)
		expect(linksData.length).toBeGreaterThan(0)
	})

	linksData.forEach((link, index) => {
		describe(`Link ${index + 1}: "${link?.title || 'Unknown'}"`, () => {
			it('should have all required fields', () => {
				requiredFields.forEach(field => {
					expect(link).toHaveProperty(field)
					expect(link[field as keyof Link]).toBeDefined()
					expect(link[field as keyof Link]).not.toBe('')
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
				expect(linkDate.getTime()).toBeLessThanOrEqual(oneYearFromNow.getTime())

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
})
