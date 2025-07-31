import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import puppeteer from 'puppeteer'
import { spawn } from 'child_process'

// Helper function to wait for server to be ready
async function waitForServer(
	url: string,
	timeout: number = 30000,
): Promise<void> {
	const start = Date.now()
	const checkInterval = 1000 // Check every second

	while (Date.now() - start < timeout) {
		try {
			const response = await fetch(url)
			if (response.status === 200) {
				// Additional check: make sure we can actually get content
				const text = await response.text()
				if (text.length > 100) {
					// Basic sanity check
					return // Server is ready and serving content
				}
			}
		} catch {
			// Server not ready yet, continue polling
		}

		await new Promise(resolve => setTimeout(resolve, checkInterval))
	}

	throw new Error(`Server at ${url} did not become ready within ${timeout}ms`)
}

describe('Back to Top Button', () => {
	let browser: puppeteer.Browser
	let page: puppeteer.Page
	let astroServer: ReturnType<typeof spawn> | null = null
	const baseUrl = 'http://localhost:4321' // Astro default dev server

	beforeAll(async () => {
		console.log('🚀 Starting Astro dev server for back-to-top testing...')

		// Start Astro dev server with explicit port
		astroServer = spawn('npx', ['astro', 'dev', '--port', '4321'], {
			stdio: ['ignore', 'pipe', 'pipe'],
			shell: true,
			env: { ...process.env, NODE_ENV: 'development' },
		})

		// Handle server output
		if (astroServer.stdout) {
			astroServer.stdout.on('data', data => {
				const output = data.toString()
				if (output.includes('Local:')) {
					console.log('📡 Dev server output:', output.trim())
				}
			})
		}

		if (astroServer.stderr) {
			astroServer.stderr.on('data', data => {
				const error = data.toString()
				console.error('🚨 Dev server error:', error)
				// Check for common error patterns
				if (
					error.includes('EADDRINUSE') ||
					error.includes('port already in use')
				) {
					console.error(
						'❌ Port 4321 is already in use. Waiting for it to be free...',
					)
				}
			})
		}

		// Wait for server to be ready
		console.log('⏳ Waiting for Astro dev server to start...')
		await waitForServer(baseUrl, 90000) // Wait up to 90 seconds
		console.log('✅ Astro dev server is ready!')

		// Start browser for testing
		browser = await puppeteer.launch({
			headless: true,
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
		})
		page = await browser.newPage()
		console.log('🧪 Browser ready for back-to-top testing')
	}, 120000) // 2 minutes timeout for server startup

	afterAll(async () => {
		console.log('🧹 Cleaning up back-to-top test environment...')

		// Close browser
		if (browser) {
			await browser.close()
			console.log('✅ Browser closed')
		}

		// Stop Astro dev server
		if (astroServer) {
			console.log('⏹️  Stopping Astro dev server...')

			// Kill the process gracefully
			astroServer.kill('SIGTERM')

			// Wait a bit for graceful shutdown
			await new Promise(resolve => setTimeout(resolve, 3000))

			// Force kill if still running
			if (!astroServer.killed) {
				astroServer.kill('SIGKILL')
			}

			// Wait for process to fully terminate
			await new Promise(resolve => setTimeout(resolve, 2000))

			console.log('✅ Astro dev server stopped')
		}

		// Additional cleanup: kill any remaining processes on port 4321
		try {
			await new Promise(resolve => {
				const killPort = spawn('netstat', ['-ano'], { shell: true })
				let output = ''

				killPort.stdout?.on('data', data => {
					output += data.toString()
				})

				killPort.on('close', () => {
					const lines = output.split('\n')
					const port4321Line = lines.find(
						line => line.includes(':4321') && line.includes('LISTENING'),
					)

					if (port4321Line) {
						const pid = port4321Line.trim().split(/\s+/).pop()
						if (pid && !isNaN(Number(pid))) {
							console.log(
								`🧹 Cleaning up remaining process ${pid} on port 4321`,
							)
							spawn('taskkill', ['/PID', pid, '/F'], { shell: true })
						}
					}
					resolve(true)
				})

				killPort.on('error', () => resolve(true)) // Continue even if cleanup fails
			})
		} catch {
			// Ignore cleanup errors
			console.log('⚠️  Port cleanup completed')
		}
	})

	it('should be present on blog listing page', async () => {
		await page.goto(`${baseUrl}/blog`, {
			waitUntil: 'networkidle0',
		})

		const backToTopButton = await page.$('#back-to-top')
		expect(backToTopButton).toBeTruthy()

		// Check if it's initially hidden
		const isHidden = await page.$eval('#back-to-top', el =>
			el.classList.contains('opacity-0'),
		)
		expect(isHidden).toBe(true)
	})

	it('should be present on individual blog posts', async () => {
		await page.goto(`${baseUrl}/blog/ai-debate-arena-google-ai-studio`, {
			waitUntil: 'networkidle0',
		})

		const backToTopButton = await page.$('#back-to-top')
		expect(backToTopButton).toBeTruthy()
	})

	it('should be hidden on homepage', async () => {
		await page.goto(`${baseUrl}/`, {
			waitUntil: 'networkidle0',
		})

		const backToTopButton = await page.$('#back-to-top')
		expect(backToTopButton).toBeTruthy()

		// Check if it's hidden by JavaScript
		const isDisplayNone = await page.$eval(
			'#back-to-top',
			el => window.getComputedStyle(el).display === 'none',
		)
		expect(isDisplayNone).toBe(true)
	})

	it('should appear when scrolling past 25% on blog page', async () => {
		await page.goto(`${baseUrl}/blog/ai-debate-arena-google-ai-studio`, {
			waitUntil: 'networkidle0',
		})

		// Get page height
		const pageHeight = await page.evaluate(() => document.body.scrollHeight)
		const viewportHeight = await page.evaluate(() => window.innerHeight)

		// Scroll to 30% of page
		const scrollTo = (pageHeight - viewportHeight) * 0.3
		await page.evaluate(scroll => {
			window.scrollTo(0, scroll)
		}, scrollTo)

		// Wait for scroll event to process
		await new Promise(resolve => setTimeout(resolve, 500))

		// Check if button is now visible
		const isVisible = await page.$eval('#back-to-top', el =>
			el.classList.contains('opacity-100'),
		)
		expect(isVisible).toBe(true)
	})

	it('should scroll to top when clicked', async () => {
		await page.goto(`${baseUrl}/blog/ai-debate-arena-google-ai-studio`, {
			waitUntil: 'networkidle0',
		})

		// Scroll down first
		await page.evaluate(() => {
			window.scrollTo(0, document.body.scrollHeight * 0.8)
		})

		// Wait for scroll to complete
		await new Promise(resolve => setTimeout(resolve, 500))

		// Verify we're scrolled down before clicking
		const initialScrollPosition = await page.evaluate(() => window.pageYOffset)
		expect(initialScrollPosition).toBeGreaterThan(100)

		// Click the back to top button
		await page.click('#back-to-top')

		// Wait for scroll animation to complete (increased timeout)
		await new Promise(resolve => setTimeout(resolve, 2000))

		// Check if we're back at the top
		const scrollPosition = await page.evaluate(() => window.pageYOffset)
		expect(scrollPosition).toBeLessThan(50) // Increased tolerance for smooth scroll
	})
})
