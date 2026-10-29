import { beforeAll, describe, expect, test } from 'vitest'

describe('Blog SlideDeck', () => {
	const url = 'http://localhost:4321/blog/trillion-dollar-coach-bill-campbell'
	let doc: Document

	beforeAll(async () => {
		const response = await fetch(url)
		expect(response.status).toBe(200)
		doc = new DOMParser().parseFromString(await response.text(), 'text/html')
	})

	test('renders a labelled carousel', () => {
		const deck = doc.querySelector('section[aria-roledescription="carousel"]')
		expect(deck?.getAttribute('aria-label')).toBe(
			'Trillion Dollar Coach summary',
		)
	})

	test('scroller is keyboard focusable', () => {
		const deck = doc.querySelector('section[aria-roledescription="carousel"]')
		expect(deck?.querySelector('[tabindex="0"]')).not.toBeNull()
	})

	test('renders every slide with a title', () => {
		const slides = doc.querySelectorAll('article[aria-roledescription="slide"]')
		expect(slides).toHaveLength(10)
		slides.forEach(slide => {
			expect(slide.querySelector('h3')?.textContent?.trim()).toBeTruthy()
		})
	})

	test('every slide image has descriptive alt text', () => {
		const images = doc.querySelectorAll(
			'article[aria-roledescription="slide"] img',
		)
		expect(images).toHaveLength(10)
		images.forEach(img => {
			expect(img.getAttribute('alt')?.length).toBeGreaterThan(40)
		})
	})
})
