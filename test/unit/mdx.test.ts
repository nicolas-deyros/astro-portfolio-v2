import { readdirSync, readFileSync } from 'fs'
import matter from 'gray-matter'
import { join } from 'path'
import { beforeAll, describe, expect, it } from 'vitest'

interface Frontmatter {
	title: string
	slug: string
	date: string
	author: string
	draft: boolean
	category: string
	description?: string
	image?: { src: string; alt: string }
	tags?: string[]
}

describe('Blog MDX Files Frontmatter Validation', () => {
	const blogDir = join(process.cwd(), 'src', 'content', 'blog')
	const mdxFiles = readdirSync(blogDir).filter(file => file.endsWith('.mdx'))

	// Required frontmatter fields
	const requiredFields = [
		'title',
		'slug',
		'date',
		'author',
		'draft',
		'category',
	]

	// Optional fields that are allowed
	const optionalFields = ['description', 'image', 'tags']

	mdxFiles.forEach(file => {
		describe(`${file}`, () => {
			let frontmatter: Frontmatter

			beforeAll(() => {
				const filePath = join(blogDir, file)
				const fileContent = readFileSync(filePath, 'utf-8')
				const parsed = matter(fileContent)
				frontmatter = parsed.data as Frontmatter
			})

			it('should have all required frontmatter fields', () => {
				requiredFields.forEach(field => {
					expect(frontmatter).toHaveProperty(field)
					const value = frontmatter[field as keyof Frontmatter]
					expect(value).toBeDefined()
					expect(value).not.toBe('')
				})
			})

			it('should have valid field types', () => {
				// Title should be a string
				expect(typeof frontmatter.title).toBe('string')
				expect(frontmatter.title.length).toBeGreaterThan(0)

				// Slug should be a string with no spaces or special chars
				expect(typeof frontmatter.slug).toBe('string')
				expect(frontmatter.slug).toMatch(/^[a-z0-9-]+$/)

				// Date should be a valid date string
				expect(typeof frontmatter.date).toBe('string')
				expect(new Date(frontmatter.date)).toBeInstanceOf(Date)
				expect(isNaN(new Date(frontmatter.date).getTime())).toBe(false)

				// Author should be a string
				expect(typeof frontmatter.author).toBe('string')
				expect(frontmatter.author.length).toBeGreaterThan(0)

				// Draft should be a boolean
				expect(typeof frontmatter.draft).toBe('boolean')

				// Category should be a string
				expect(typeof frontmatter.category).toBe('string')
				expect(frontmatter.category.length).toBeGreaterThan(0)
			})

			it('should not have unexpected fields', () => {
				const allowedFields = [...requiredFields, ...optionalFields]
				const actualFields = Object.keys(frontmatter)

				actualFields.forEach(field => {
					expect(allowedFields).toContain(field)
				})
			})

			it('should have valid optional fields if present', () => {
				// Description should be a string if present
				if (frontmatter.description) {
					expect(typeof frontmatter.description).toBe('string')
					expect(frontmatter.description.length).toBeGreaterThan(0)
				}

				// Image should be an object with src and alt if present
				if (frontmatter.image) {
					expect(typeof frontmatter.image).toBe('object')
					expect(frontmatter.image).toHaveProperty('src')
					expect(frontmatter.image).toHaveProperty('alt')
				}

				// Tags should be an array if present
				if (frontmatter.tags) {
					expect(Array.isArray(frontmatter.tags)).toBe(true)
				}
			})
		})
	})

	it('should have at least one MDX file', () => {
		expect(mdxFiles.length).toBeGreaterThan(0)
	})
})
