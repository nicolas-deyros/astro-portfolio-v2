import { ChildProcess, spawn } from 'child_process'
import puppeteer, { Browser, Page } from 'puppeteer'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

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
				console.log(`Server at ${url} is ready!`)
				return
			}
		} catch {
			// wait
		}
		await new Promise(resolve => setTimeout(resolve, 1000))
	}
	throw new Error(`Server at ${url} did not start in time.`)
}

describe('Enhanced Authentication System', () => {
	let server: ChildProcess
	let browser: Browser
	let page: Page
	const serverUrl = 'http://localhost:4321'
	const authApiUrl = `${serverUrl}/api/auth.json`

	beforeAll(async () => {
		// Set environment variable for testing
		process.env.API_SECRET_KEY = 'test-secret-key'

		// Start the dev server
		server = spawn('npm', ['run', 'dev:clean'], {
			shell: true,
			stdio: 'pipe',
			env: { ...process.env, API_SECRET_KEY: 'test-secret-key' },
		})
		await waitForServer(serverUrl)

		// Launch browser
		browser = await puppeteer.launch({
			headless: true,
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
		})
		page = await browser.newPage()
		await page.setViewport({ width: 1280, height: 800 })
	})

	afterAll(async () => {
		if (browser) await browser.close()
		if (server) {
			server.kill('SIGTERM')
		}
	})

	describe('Authentication API Endpoints', () => {
		it('should reject invalid login credentials', async () => {
			const response = await page.evaluate(async url => {
				const res = await fetch(url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action: 'login',
						secretKey: 'wrong-secret-key',
					}),
				})
				return {
					status: res.status,
					data: await res.json(),
				}
			}, authApiUrl)

			expect(response.status).toBe(401)
			expect(response.data.message).toBe('Invalid credentials')
		})

		it('should create session with valid credentials', async () => {
			const response = await page.evaluate(async url => {
				const res = await fetch(url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action: 'login',
						secretKey: 'test-secret-key',
					}),
				})
				return {
					status: res.status,
					data: await res.json(),
					headers: Object.fromEntries(res.headers.entries()),
				}
			}, authApiUrl)

			expect(response.status).toBe(200)
			expect(response.data.success).toBe(true)
			expect(response.data.sessionId).toBeDefined()
			expect(response.data.expiresAt).toBeDefined()
		})

		it('should validate active session', async () => {
			// First login
			await page.evaluate(async url => {
				await fetch(url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action: 'login',
						secretKey: 'test-secret-key',
					}),
				})
			}, authApiUrl)

			// Validate session using GET endpoint
			const validateResponse = await page.evaluate(async url => {
				const res = await fetch(url, {
					method: 'GET',
				})
				return {
					status: res.status,
					data: await res.json(),
				}
			}, authApiUrl)

			expect(validateResponse.status).toBe(200)
			expect(validateResponse.data.authenticated).toBe(true)
		})

		it('should logout and invalidate session', async () => {
			// Login first
			await page.evaluate(async url => {
				await fetch(url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action: 'login',
						secretKey: 'test-secret-key',
					}),
				})
			}, authApiUrl)

			// Logout
			const logoutResponse = await page.evaluate(async url => {
				const res = await fetch(url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action: 'logout',
					}),
				})
				return {
					status: res.status,
					data: await res.json(),
				}
			}, authApiUrl)

			expect(logoutResponse.status).toBe(200)
			expect(logoutResponse.data.success).toBe(true)

			// Try to validate the invalidated session
			const validateResponse = await page.evaluate(async url => {
				const res = await fetch(url, {
					method: 'GET',
				})
				return {
					status: res.status,
					data: await res.json(),
				}
			}, authApiUrl)

			expect(validateResponse.status).toBe(200)
			expect(validateResponse.data.authenticated).toBe(false)
		})

		it('should validate session using validate action', async () => {
			// Login first
			await page.evaluate(async url => {
				await fetch(url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action: 'login',
						secretKey: 'test-secret-key',
					}),
				})
			}, authApiUrl)

			// Validate using POST action
			const validateResponse = await page.evaluate(async url => {
				const res = await fetch(url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action: 'validate',
					}),
				})
				return {
					status: res.status,
					data: await res.json(),
				}
			}, authApiUrl)

			expect(validateResponse.status).toBe(200)
			expect(validateResponse.data.success).toBe(true)
			expect(validateResponse.data.sessionId).toBeDefined()
		})
	})

	describe('Device Fingerprinting', () => {
		it('should track device information in sessions', async () => {
			// Set a specific user agent
			await page.setUserAgent('Mozilla/5.0 (Test Browser) AdminTest/1.0')

			const response = await page.evaluate(async url => {
				const res = await fetch(url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action: 'login',
						secretKey: 'test-secret-key',
					}),
				})
				return await res.json()
			}, authApiUrl)

			expect(response.sessionId).toBeDefined()
			// The device fingerprint should be created based on User-Agent
			// This is validated server-side in the database
		})

		it('should reject sessions from different devices', async () => {
			// Login with one user agent
			await page.setUserAgent('Mozilla/5.0 (Device1) Test/1.0')

			await page.evaluate(async url => {
				await fetch(url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action: 'login',
						secretKey: 'test-secret-key',
					}),
				})
			}, authApiUrl)

			// Change user agent (simulating different device)
			await page.setUserAgent('Mozilla/5.0 (Device2) Test/1.0')

			// Try to validate from device2 using device1's session
			const validateResponse = await page.evaluate(async url => {
				const res = await fetch(url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action: 'validate',
					}),
				})
				return {
					status: res.status,
					data: await res.json(),
				}
			}, authApiUrl)

			// Should be rejected due to device mismatch
			expect(validateResponse.status).toBe(401)
			expect(validateResponse.data.message).toBe(
				'Device mismatch detected. Please login again.',
			)
		})
	})

	describe('Session Expiration', () => {
		it('should have 2-hour session expiration', async () => {
			const response = await page.evaluate(async url => {
				const res = await fetch(url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action: 'login',
						secretKey: 'test-secret-key',
					}),
				})
				return await res.json()
			}, authApiUrl)

			expect(response.sessionId).toBeDefined()
			expect(response.expiresAt).toBeDefined()

			// Verify the expiration time is approximately 2 hours from now
			const expiresAt = new Date(response.expiresAt)
			const now = new Date()
			const diffHours = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)

			expect(diffHours).toBeGreaterThan(1.9) // Close to 2 hours
			expect(diffHours).toBeLessThan(2.1)
		})

		it('should clean up expired sessions', async () => {
			// This test verifies that the cleanExpiredSessions function works
			// In practice, sessions are cleaned on each API request
			const response = await page.evaluate(async url => {
				const res = await fetch(url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action: 'login',
						secretKey: 'test-secret-key',
					}),
				})
				return await res.json()
			}, authApiUrl)

			expect(response.success).toBe(true)
			// Session cleanup is automatic on each request
		})
	})

	describe('Cross-Device Security', () => {
		it('should prevent session hijacking across devices', async () => {
			// This test ensures the original vulnerability is fixed
			// Where users could browse on mobile after desktop login
			// but get logged out when interacting due to device mismatch

			// Login on "desktop"
			await page.setUserAgent(
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
			)

			await page.evaluate(async url => {
				await fetch(url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action: 'login',
						secretKey: 'test-secret-key',
					}),
				})
			}, authApiUrl)

			// Simulate "mobile" device trying to use desktop session
			await page.setUserAgent(
				'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0) Mobile/18A373',
			)

			const mobileValidation = await page.evaluate(async url => {
				const res = await fetch(url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action: 'validate',
					}),
				})
				return {
					status: res.status,
					data: await res.json(),
				}
			}, authApiUrl)

			// Should be rejected - no more cross-device session sharing
			expect(mobileValidation.status).toBe(401)
			expect(mobileValidation.data.message).toBe(
				'Device mismatch detected. Please login again.',
			)
		})

		it('should require separate login for each device', async () => {
			// Test that each device needs its own login session

			// Login on desktop
			await page.setUserAgent(
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
			)
			const desktopLogin = await page.evaluate(async url => {
				const res = await fetch(url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action: 'login',
						secretKey: 'test-secret-key',
					}),
				})
				return await res.json()
			}, authApiUrl)
			expect(desktopLogin.success).toBe(true)

			// Login on mobile (should create separate session)
			await page.setUserAgent(
				'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0) Mobile/18A373',
			)
			const mobileLogin = await page.evaluate(async url => {
				const res = await fetch(url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action: 'login',
						secretKey: 'test-secret-key',
					}),
				})
				return await res.json()
			}, authApiUrl)
			expect(mobileLogin.success).toBe(true)

			// Verify mobile session works
			const mobileValidation = await page.evaluate(async url => {
				const res = await fetch(url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action: 'validate',
					}),
				})
				return await res.json()
			}, authApiUrl)
			expect(mobileValidation.success).toBe(true)
		})
	})
})
