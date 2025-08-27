import { spawn } from 'child_process'
import puppeteer from 'puppeteer'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// Use a unique port for this test file to avoid conflicts
const TEST_PORT = 4322
const baseUrl = `http://localhost:${TEST_PORT}`

// Helper function to wait for server to be ready
async function waitForServer(
	url: string,
	timeout: number = 60000,
): Promise<void> {
	const start = Date.now()
	const checkInterval = 1000

	while (Date.now() - start < timeout) {
		try {
			const response = await fetch(url)
			if (response.status === 200) {
				const text = await response.text()
				if (text.length > 100) {
					return
				}
			}
		} catch {
			// Server not ready yet
		}

		await new Promise(resolve => setTimeout(resolve, checkInterval))
	}

	throw new Error(`Server at ${url} did not become ready within ${timeout}ms`)
}

// Helper function to kill process on specific port
async function killProcessOnPort(port: number) {
	return new Promise<void>(resolve => {
		const killPort = spawn('netstat', ['-ano'], { shell: true })
		let output = ''

		killPort.stdout?.on('data', data => {
			output += data.toString()
		})

		killPort.on('close', () => {
			const lines = output.split('\n')
			const portLine = lines.find(
				line => line.includes(`:${port}`) && line.includes('LISTENING'),
			)

			if (portLine) {
				const pid = portLine.trim().split(/\s+/).pop()
				if (pid && !isNaN(Number(pid))) {
					console.log(`🧹 Killing process ${pid} on port ${port}`)
					const killProcess = spawn('taskkill', ['/PID', pid, '/F'], {
						shell: true,
					})
					killProcess.on('close', () => {
						setTimeout(resolve, 1000) // Wait for cleanup
					})
					return
				}
			}
			resolve()
		})

		killPort.on('error', () => resolve())
	})
}

describe('Back to Top Button - Isolated', () => {
	let browser: puppeteer.Browser
	let page: puppeteer.Page
	let astroServer: ReturnType<typeof spawn> | null = null

	beforeAll(async () => {
		console.log(`🚀 Starting isolated Astro server on port ${TEST_PORT}...`)

		// Clean up any existing process on our test port
		await killProcessOnPort(TEST_PORT)
		await new Promise(resolve => setTimeout(resolve, 2000))

		// Start Astro dev server on unique port
		astroServer = spawn(
			'npx',
			['astro', 'dev', '--port', TEST_PORT.toString()],
			{
				stdio: ['ignore', 'pipe', 'pipe'],
				shell: true,
				env: { ...process.env, NODE_ENV: 'development' },
			},
		)

		// Monitor server startup
		const serverLogs: string[] = []

		if (astroServer.stdout) {
			astroServer.stdout.on('data', data => {
				const output = data.toString()
				serverLogs.push(output)
				if (output.includes('Local:') || output.includes(`${TEST_PORT}`)) {
					console.log('📡 Server:', output.trim())
				}
			})
		}

		if (astroServer.stderr) {
			astroServer.stderr.on('data', data => {
				const error = data.toString()
				serverLogs.push(error)
				console.error('🚨 Server error:', error.trim())
			})
		}

		// Wait for server with better error reporting
		try {
			console.log('⏳ Waiting for server startup...')
			await waitForServer(baseUrl, 90000)
			console.log('✅ Server ready!')
		} catch (error) {
			console.error('❌ Server startup failed:')
			console.error('Recent logs:', serverLogs.slice(-10).join(''))
			throw error
		}

		// Start browser
		browser = await puppeteer.launch({
			headless: true,
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
		})
		page = await browser.newPage()
		await page.setViewport({ width: 1280, height: 720 })

		console.log('🧪 Browser ready for testing')
	}, 120000)

	afterAll(async () => {
		console.log('🧹 Cleaning up test environment...')

		if (browser) {
			await browser.close()
		}

		if (astroServer) {
			astroServer.kill('SIGTERM')
			await new Promise(resolve => setTimeout(resolve, 2000))

			if (!astroServer.killed) {
				astroServer.kill('SIGKILL')
			}
		}

		// Final cleanup
		await killProcessOnPort(TEST_PORT)
	})

	it('should be present on blog listing page', async () => {
		await page.goto(`${baseUrl}/blog`, { waitUntil: 'domcontentloaded' })

		// Wait for element
		await page.waitForSelector('#back-to-top', { timeout: 10000 })

		const backToTopButton = await page.$('#back-to-top')
		expect(backToTopButton).toBeTruthy()

		// Check initial state
		const isHidden = await page.$eval('#back-to-top', el => {
			const style = window.getComputedStyle(el)
			return el.classList.contains('opacity-0') || style.opacity === '0'
		})
		expect(isHidden).toBe(true)
	})

	it('should appear when scrolling', async () => {
		await page.goto(`${baseUrl}/blog`, { waitUntil: 'domcontentloaded' })
		await page.waitForSelector('#back-to-top', { timeout: 10000 })

		// Check if page has scrollable content
		const hasContent = await page.evaluate(() => {
			return document.body.scrollHeight > window.innerHeight * 1.2
		})

		if (!hasContent) {
			console.log('⚠️ Skipping scroll test - insufficient content')
			return
		}

		// Scroll down
		await page.evaluate(() => {
			const scrollHeight = document.body.scrollHeight
			const viewportHeight = window.innerHeight
			const scrollTo = (scrollHeight - viewportHeight) * 0.5
			window.scrollTo({ top: scrollTo, behavior: 'instant' })
		})

		// Wait for scroll effects
		await new Promise(resolve => setTimeout(resolve, 1000))

		// Check visibility
		const isVisible = await page.$eval('#back-to-top', el => {
			const style = window.getComputedStyle(el)
			return (
				!el.classList.contains('opacity-0') &&
				style.opacity !== '0' &&
				style.display !== 'none'
			)
		})

		expect(isVisible).toBe(true)
	})

	it('should scroll to top when clicked', async () => {
		await page.goto(`${baseUrl}/blog`, { waitUntil: 'domcontentloaded' })
		await page.waitForSelector('#back-to-top', { timeout: 10000 })

		// Scroll down first
		await page.evaluate(() => {
			const scrollHeight = document.body.scrollHeight
			const viewportHeight = window.innerHeight
			window.scrollTo({
				top: (scrollHeight - viewportHeight) * 0.8,
				behavior: 'instant',
			})
		})

		await new Promise(resolve => setTimeout(resolve, 500))

		// Verify scrolled position
		const scrollPos = await page.evaluate(() => window.pageYOffset)
		expect(scrollPos).toBeGreaterThan(100)

		// Wait for button to be visible and click
		await page.waitForFunction(
			() => {
				const btn = document.querySelector('#back-to-top') as HTMLElement
				if (!btn) return false
				const style = window.getComputedStyle(btn)
				return style.opacity !== '0' && style.display !== 'none'
			},
			{ timeout: 5000 },
		)

		await page.click('#back-to-top')

		// Wait for scroll to top
		await page.waitForFunction(() => window.pageYOffset < 100, {
			timeout: 5000,
		})

		const finalPos = await page.evaluate(() => window.pageYOffset)
		expect(finalPos).toBeLessThan(100)
	})
})
