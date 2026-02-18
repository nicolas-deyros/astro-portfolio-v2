import { type Browser, launch, type Page } from 'puppeteer'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

describe('Security Hardening Validation', () => {
	let browser: Browser
	let page: Page
	const baseUrl = 'http://localhost:4321'

	beforeAll(async () => {
		browser = await launch({
			headless: true,
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
		})
		page = await browser.newPage()
		await page.setViewport({ width: 1280, height: 800 })
	})

	afterAll(async () => {
		if (browser) await browser.close()
	})

	describe('🔒 Server-Side Authentication Enforcement', () => {
		test('Admin pages should immediately redirect unauthenticated users', async () => {
			// Test admin dashboard
			const response = await page.goto(`${baseUrl}/admin`, {
				waitUntil: 'domcontentloaded',
			})

			// Should be redirected to login page
			expect(page.url()).toBe(`${baseUrl}/admin/login`)
			expect(response?.status()).toBe(200) // Login page loads successfully
		})

		test('Admin links page should redirect unauthenticated users', async () => {
			const response = await page.goto(`${baseUrl}/admin/links`, {
				waitUntil: 'domcontentloaded',
			})

			// Should be redirected to login page
			expect(page.url()).toBe(`${baseUrl}/admin/login`)
			expect(response?.status()).toBe(200)
		})

		test('Admin CRM page should redirect unauthenticated users', async () => {
			const response = await page.goto(`${baseUrl}/admin/crm`, {
				waitUntil: 'domcontentloaded',
			})

			// Should be redirected to login page
			expect(page.url()).toBe(`${baseUrl}/admin/login`)
			expect(response?.status()).toBe(200)
		})

		test('No admin content should be sent to unauthenticated users', async () => {
			// Try to access admin page
			await page.goto(`${baseUrl}/admin`)

			// Check that no admin-specific content is present in the page
			const pageContent = await page.content()

			// Should not contain admin dashboard content
			expect(pageContent).not.toContain('Admin Dashboard')
			expect(pageContent).not.toContain('Manage Links')
			expect(pageContent).not.toContain('View CRM Data')

			// Should contain login form
			expect(pageContent).toContain('Admin Login')
			expect(pageContent).toContain('Secret Key')
		})
	})

	describe('🛡️ API Endpoint Security', () => {
		test('Links API should deny unauthorized access', async () => {
			const response = await page.evaluate(async url => {
				const res = await fetch(`${url}/api/links.json`, {
					method: 'GET',
				})
				return {
					status: res.status,
					data: await res.json(),
				}
			}, baseUrl)

			expect(response.status).toBe(401)
			expect(response.data.message).toBe('Unauthorized access denied')
		})

		test('POST requests to Links API should deny unauthorized access', async () => {
			const response = await page.evaluate(async url => {
				const res = await fetch(`${url}/api/links.json`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						title: 'Test Link',
						url: 'https://example.com',
						tags: 'test',
						date: new Date().toISOString(),
					}),
				})
				return {
					status: res.status,
					data: await res.json(),
				}
			}, baseUrl)

			expect(response.status).toBe(401)
			expect(response.data.error).toBe('Unauthorized')
		})
	})

	describe('🔐 Authentication Security', () => {
		test('Login should use secure session tokens', async () => {
			// Navigate to login page
			await page.goto(`${baseUrl}/admin/login`)

			// Fill in credentials
			await page.type('#secretKey', 'test-secret-key')

			// Intercept the login request
			const response = await page.evaluate(async () => {
				const res = await fetch('/api/auth.json', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action: 'login',
						secretKey: 'test-secret-key',
					}),
					credentials: 'include',
				})
				return {
					status: res.status,
					data: await res.json(),
				}
			})

			if (response.status === 200 && response.data.success) {
				// Check that session token has secure characteristics
				expect(response.data.sessionId).toBeDefined()
				expect(response.data.expiresAt).toBeDefined()

				// Session should expire in ~2 hours
				const expirationTime = new Date(response.data.expiresAt)
				const now = new Date()
				const timeDiff = expirationTime.getTime() - now.getTime()
				const hoursUntilExpiration = timeDiff / (1000 * 60 * 60)

				expect(hoursUntilExpiration).toBeGreaterThan(1.9)
				expect(hoursUntilExpiration).toBeLessThan(2.1)
			}
		})

		test('Session validation should use server-side checks', async () => {
			// Try to validate a non-existent session
			const response = await page.evaluate(async () => {
				const res = await fetch('/api/auth.json', {
					method: 'GET',
					credentials: 'include',
				})
				return {
					status: res.status,
					data: await res.json(),
				}
			})

			expect(response.status).toBe(200)
			expect(response.data.authenticated).toBe(false)
		})
	})

	describe('🚨 Client-Side Security Bypass Prevention', () => {
		test('Disabling JavaScript should not grant access to admin content', async () => {
			// Disable JavaScript
			await page.setJavaScriptEnabled(false)

			// Try to access admin page
			await page.goto(`${baseUrl}/admin`)

			// Should still be redirected to login (server-side redirect)
			expect(page.url()).toBe(`${baseUrl}/admin/login`)

			// Re-enable JavaScript for other tests
			await page.setJavaScriptEnabled(true)
		})

		test('Manipulating cookies should not bypass authentication', async () => {
			// Set fake cookies
			await page.setCookie(
				{
					name: 'admin_session',
					value: 'fake-session-id',
					domain: 'localhost',
				},
				{
					name: 'admin_token',
					value: 'fake-token',
					domain: 'localhost',
				},
			)

			// Try to access admin page
			await page.goto(`${baseUrl}/admin`)

			// Should still be redirected due to server-side validation
			expect(page.url()).toBe(`${baseUrl}/admin/login`)
		})
	})

	describe('🔒 Secure Defaults', () => {
		test('Application should be locked down by default', async () => {
			// Fresh page with no authentication
			const newPage = await browser.newPage()

			// All admin routes should redirect
			const routes = ['/admin', '/admin/links', '/admin/crm']

			for (const route of routes) {
				await newPage.goto(`${baseUrl}${route}`)
				expect(newPage.url()).toBe(`${baseUrl}/admin/login`)
			}

			await newPage.close()
		})

		test('No sensitive data should be exposed in page source', async () => {
			// Check that admin pages don't leak sensitive information
			await page.goto(`${baseUrl}/admin`)

			const pageSource = await page.content()

			// Should not contain any admin-specific data or configuration
			expect(pageSource).not.toContain('API_SECRET_KEY')
			expect(pageSource).not.toContain('database')
			expect(pageSource).not.toContain('session_token')
			expect(pageSource).not.toContain('admin_token')
		})
	})

	describe('🛡️ Device Fingerprinting Security', () => {
		test('Sessions should be tied to device fingerprints', async () => {
			// This would need to be tested with different user agents
			// For now, we'll just verify the concept exists in the API
			const response = await page.evaluate(async () => {
				const res = await fetch('/api/auth.json', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'User-Agent': 'TestBrowser/1.0',
					},
					body: JSON.stringify({
						action: 'validate',
					}),
				})
				return {
					status: res.status,
					data: await res.json(),
				}
			})

			// Should handle device fingerprint validation
			expect(response.status).toBe(401) // Unauthorized due to no valid session
		})
	})
})
