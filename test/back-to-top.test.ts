import type { Browser, Page } from 'puppeteer'
import puppeteer from 'puppeteer'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

describe('Back to Top Button', () => {
	let browser: Browser
	let page: Page
	const baseUrl = 'http://localhost:4321'

	beforeAll(async () => {
		// Start browser for testing
		browser = await puppeteer.launch({
			headless: true,
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
		})
		page = await browser.newPage()
		console.log('🧪 Browser ready for back-to-top testing')
	}, 150000)

	afterAll(async () => {
		console.log('🧹 Cleaning up back-to-top test environment...')

		// Close browser
		if (browser) {
			await browser.close()
			console.log('✅ Browser closed')
		}
	})

	it('should be present on blog listing page', async () => {
		await page.goto(`${baseUrl}/blog`, {
			waitUntil: 'domcontentloaded', // Faster than networkidle0
		})

		// Wait for element to be present
		await page.waitForSelector('#back-to-top', { timeout: 5000 })

		const backToTopButton = await page.$('#back-to-top')
		expect(backToTopButton).toBeTruthy()

		// Check if it's initially hidden with more reliable detection
		const isHidden = await page.$eval('#back-to-top', (el: Element) => {
			const style = window.getComputedStyle(el)
			return el.classList.contains('opacity-0') || style.opacity === '0'
		})
		expect(isHidden).toBe(true)
	})

	it('should be present on individual blog posts', async () => {
		// Get first available blog post dynamically instead of hardcoding
		await page.goto(`${baseUrl}/blog`, { waitUntil: 'domcontentloaded' })

		const firstPostLink = await page.$eval(
			'a[href*="/blog/"]',
			el => (el as HTMLAnchorElement).href,
		)

		await page.goto(firstPostLink, { waitUntil: 'domcontentloaded' })

		const backToTopButton = await page.$('#back-to-top')
		expect(backToTopButton).toBeTruthy()
	})

	it('should be hidden on homepage', async () => {
		await page.goto(`${baseUrl}/`, {
			waitUntil: 'domcontentloaded',
		})

		// Wait for element and any JavaScript to execute
		await page.waitForSelector('#back-to-top', { timeout: 5000 })
		await new Promise(resolve => setTimeout(resolve, 200))

		const backToTopButton = await page.$('#back-to-top')
		expect(backToTopButton).toBeTruthy()

		// Check if it's hidden by JavaScript with more comprehensive check
		const isDisplayNone = await page.$eval('#back-to-top', (el: Element) => {
			const style = window.getComputedStyle(el)
			return (
				style.display === 'none' ||
				style.visibility === 'hidden' ||
				style.opacity === '0'
			)
		})
		expect(isDisplayNone).toBe(true)
	})

	it('should appear when scrolling past 25% on blog page', async () => {
		// Navigate to blog listing first to get the first available post
		await page.goto(`${baseUrl}/blog`, { waitUntil: 'domcontentloaded' })

		// Get the first blog post link dynamically
		const firstPostLink = await page.$eval(
			'a[href*="/blog/"]',
			el => (el as HTMLAnchorElement).href,
		)

		await page.goto(firstPostLink, { waitUntil: 'domcontentloaded' })

		// Wait for back-to-top element to be available
		await page.waitForSelector('#back-to-top', { timeout: 5000 })

		// Check if page has enough content to scroll
		const { pageHeight, viewportHeight } = await page.evaluate(() => ({
			pageHeight: document.body.scrollHeight,
			viewportHeight: window.innerHeight,
		}))

		if (pageHeight <= viewportHeight * 1.2) {
			console.log('⚠️ Skipping scroll test - insufficient content')
			return
		}

		// Scroll to 30% of page with instant scroll for reliability
		const scrollTo = (pageHeight - viewportHeight) * 0.3
		await page.evaluate(scroll => {
			window.scrollTo({ top: scroll, behavior: 'instant' })
		}, scrollTo)

		// Wait for scroll event processing and any animations
		await new Promise(resolve => setTimeout(resolve, 800))

		// Check if button is now visible with retry logic
		let isVisible = false
		for (let attempt = 0; attempt < 5; attempt++) {
			try {
				isVisible = await page.$eval('#back-to-top', (el: Element) => {
					const computed = window.getComputedStyle(el)
					return (
						el.classList.contains('opacity-100') ||
						(computed.opacity !== '0' && computed.display !== 'none')
					)
				})
				if (isVisible) break

				// Wait a bit before retry
				await new Promise(resolve => setTimeout(resolve, 200))
			} catch {
				console.log(`Visibility check attempt ${attempt + 1}/5`)
			}
		}

		expect(isVisible).toBe(true)
	})

	it('should scroll to top when clicked', async () => {
		// Use blog listing page for more consistent behavior
		await page.goto(`${baseUrl}/blog`, { waitUntil: 'domcontentloaded' })

		// Scroll down significantly
		await page.evaluate(() => {
			const maxScroll = document.body.scrollHeight - window.innerHeight
			window.scrollTo({ top: maxScroll * 0.8, behavior: 'instant' })
		})

		// Wait for scroll to complete
		await new Promise(resolve => setTimeout(resolve, 500))

		// Verify we're scrolled down before clicking
		const initialScrollPosition = await page.evaluate(() => window.pageYOffset)
		expect(initialScrollPosition).toBeGreaterThan(100)

		// Wait for button to become visible and clickable with simpler check
		await page.waitForFunction(
			() => {
				const button = document.querySelector('#back-to-top')
				return button && !button.classList.contains('opacity-0')
			},
			{ timeout: 5000 },
		)

		// Click the back to top button
		await page.click('#back-to-top')

		// Wait for scroll animation to complete with function-based waiting
		await page.waitForFunction(() => window.pageYOffset < 100, {
			timeout: 5000,
		})

		// Final verification
		const scrollPosition = await page.evaluate(() => window.pageYOffset)
		expect(scrollPosition).toBeLessThan(100)
	})
})
