import { spawn } from 'child_process'
import type { Browser, Page } from 'puppeteer'
import puppeteer from 'puppeteer'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// Helper function to wait for server to be ready
async function waitForServer(
	url: string,
	timeout: number = 30000,
): Promise<void> {
	const start = Date.now()
	const checkInterval = 500 // Check every 500ms for faster response

	while (Date.now() - start < timeout) {
		try {
			const response = await fetch(url)
			if (response.status === 200) {
				const text = await response.text()
				if (text.length > 100) {
					return // Server is ready
				}
			}
		} catch {
			// Server not ready yet, continue polling
		}

		await new Promise(resolve => setTimeout(resolve, checkInterval))
	}

	throw new Error(`Server at ${url} did not become ready within ${timeout}ms`)
}

// Helper function to kill any existing processes on port 4321
async function killExistingServer(): Promise<void> {
	try {
		await new Promise<void>(resolve => {
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
						console.log(`🧹 Killing existing process ${pid} on port 4321`)
						spawn('taskkill', ['/PID', pid, '/F'], { shell: true })
						setTimeout(resolve, 2000) // Wait for cleanup
					} else {
						resolve()
					}
				} else {
					resolve()
				}
			})

			killPort.on('error', () => resolve()) // Continue even if cleanup fails
		})
	} catch {
		console.log('⚠️ Port cleanup completed')
	}
}

describe('Back to Top Button', () => {
	let browser: Browser
	let page: Page
	let astroServer: ReturnType<typeof spawn> | null = null
	const baseUrl = 'http://localhost:4321' // Astro default dev server

	beforeAll(async () => {
		console.log('🚀 Starting Astro dev server for back-to-top testing...')

		// First, clean up any existing server on port 4321
		await killExistingServer()

		// Wait a bit for cleanup to complete
		await new Promise(resolve => setTimeout(resolve, 3000))

		// Start Astro dev server with explicit port
		const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx'
		astroServer = spawn(cmd, ['astro', 'dev', '--port', '4321'], {
			stdio: ['ignore', 'pipe', 'pipe'],
			shell: true,
			env: { ...process.env, NODE_ENV: 'development' },
		})
		// Handle server output for debugging
		if (astroServer.stdout) {
			astroServer.stdout.on('data', data => {
				const output = data.toString()
				if (output.includes('Local:') || output.includes('ready in')) {
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
						'❌ Port 4321 is already in use. Server startup failed.',
					)
				}
			})
		}

		// Wait for server to be ready with improved error handling
		console.log('⏳ Waiting for Astro dev server to start...')
		try {
			await waitForServer(baseUrl, 120000) // Wait up to 2 minutes
			console.log('✅ Astro dev server is ready!')
		} catch (error) {
			console.error('❌ Failed to start server:', error)

			// Try to get server logs if available
			if (astroServer && astroServer.stdout) {
				console.log('📋 Server may have failed to start. Check logs above.')
			}

			throw error
		}

		// Start browser for testing
		browser = await puppeteer.launch({
			headless: true,
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
		})
		page = await browser.newPage()
		console.log('🧪 Browser ready for back-to-top testing')
	}, 150000) // 2.5 minutes timeout for server startup

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

		// Wait for button to become visible and clickable
		await page.waitForFunction(
			() => {
				const button = document.querySelector('#back-to-top') as HTMLElement
				if (!button) return false

				const style = window.getComputedStyle(button)
				return style.opacity !== '0' && style.display !== 'none'
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
