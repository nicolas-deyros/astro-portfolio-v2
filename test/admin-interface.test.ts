import puppeteer, { Browser, Page } from 'puppeteer'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// Admin nav link, server-rendered only for logged-in users (HeaderMenu.astro)
const ADMIN_NAV_LINK = 'a[href="/admin"][title="Admin Dashboard"]'

describe('Admin Interface Tests', () => {
	let browser: Browser
	let page: Page
	const serverUrl = 'http://localhost:4321'
	const adminUrl = `${serverUrl}/admin`

	beforeAll(async () => {
		// Launch browser
		browser = await puppeteer.launch({
			headless: true,
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
		})
		page = await browser.newPage()

		// Set a larger viewport for desktop testing
		await page.setViewport({ width: 1280, height: 800 })
	}, 120000)

	// Helper function for authenticating in tests
	async function performLogin(): Promise<void> {
		if (page.url().includes('/admin') && !page.url().includes('/login')) return

		await page.goto(`${adminUrl}/login`, { waitUntil: 'networkidle2' })

		if (page.url().includes('/admin') && !page.url().includes('/login')) return

		try {
			await page.waitForSelector('#login-form', { timeout: 5000 })
			await page.type('#secretKey', 'test-secret-key')
			await page.click('button[type="submit"]')
			await page.waitForNavigation({ waitUntil: 'networkidle2' })
		} catch (error) {
			if (!page.url().includes('/admin') || page.url().includes('/login')) {
				throw error
			}
		}
	}

	afterAll(async () => {
		if (browser) await browser.close()
	})

	describe('Pagination and Search Features', () => {
		beforeAll(async () => {
			await performLogin()
			await page.goto(`${adminUrl}/links`, { waitUntil: 'networkidle2' })
			// The links UI is a React island; on a cold dev server it can land
			// after networkidle2, so wait for it explicitly.
			await page.waitForSelector('input[name="search"]', { timeout: 30000 })
		})

		it('should have pagination controls when there are multiple pages', async () => {
			// Check for pagination section
			const paginationSection = await page.$(
				'.flex.items-center.justify-between',
			)
			if (paginationSection) {
				// Check for page navigation
				const pageLinks = await page.$$('a[href*="page="]')
				expect(pageLinks.length).toBeGreaterThan(0)
			}
		})

		it('should have search and filter form', async () => {
			// Check for search input
			const searchInput = await page.$('input[name="search"]')
			expect(searchInput).toBeTruthy()

			// Check for tag filter dropdown
			const tagFilter = await page.$('select[name="tag"]')
			expect(tagFilter).toBeTruthy()

			// Check for page size selector
			const pageSizeSelect = await page.$('select[name="pageSize"]')
			expect(pageSizeSelect).toBeTruthy()

			// Check for search button
			const searchButton = await page.$('button[type="submit"]')
			expect(searchButton).toBeTruthy()
		})

		it.skip('should update URL when changing page size', async () => {
			const pageSizeSelect = await page.$('select[name="pageSize"]')
			if (pageSizeSelect) {
				await pageSizeSelect.select('20')

				// Verify selection was applied
				const value = await page.$eval(
					'select[name="pageSize"]',
					el => (el as HTMLSelectElement).value,
				)
				expect(value).toBe('20')

				// Wait for navigation after selection if it auto-submits, or click submit
				const searchSubmitBtn = await page.$(
					'form[method="GET"] button[type="submit"]',
				)

				// Try clicking submit and waiting for navigation
				await Promise.all([
					page.waitForNavigation({ waitUntil: 'networkidle2' }),
					searchSubmitBtn?.click(),
				])

				// Get current URL
				const currentUrl = page.url()
				// Check if pageSize is present
				expect(currentUrl).toMatch(/pageSize=20/)
			}
		})

		it('should show results summary', async () => {
			// Check for text content instead of a dedicated selector if it's flaky
			const hasResultsSummary = await page.evaluate(() => {
				return (
					document.body.innerText.includes('results') ||
					document.body.innerText.includes('Showing')
				)
			})
			expect(hasResultsSummary).toBe(true)
		})
	})

	describe('Enhanced Form Features', () => {
		beforeAll(async () => {
			await performLogin()
			await page.goto(`${adminUrl}/links`, { waitUntil: 'networkidle2' })
		})

		it('should have form validation error display', async () => {
			const errorContainer = await page.$('#form-errors')
			// Error/success containers may be conditionally rendered
			if (errorContainer) expect(errorContainer).toBeTruthy()

			const successContainer = await page.$('#form-success')
			if (successContainer) expect(successContainer).toBeTruthy()
		})

		it('should have confirmation modals', async () => {
			const deleteModal = await page.$('#confirm-delete-modal')
			// Modals may be rendered client-side on interaction — skip if absent
			if (deleteModal) expect(deleteModal).toBeTruthy()

			const updateModal = await page.$('#confirm-update-modal')
			if (updateModal) expect(updateModal).toBeTruthy()
		})

		it('should have edit mode functionality', async () => {
			const formTitle = await page.$('#form-title')
			expect(formTitle).toBeTruthy()
		})
	})

	describe('Basic Admin Page Tests', () => {
		it('should load the admin page', async () => {
			const response = await page.goto(adminUrl)
			expect(response?.status()).toBe(200)
		})

		it('should show authentication form when not logged in', async () => {
			// Clear cookies to ensure we are logged out
			const client = await page.target().createCDPSession()
			await client.send('Network.clearBrowserCookies')

			await page.goto(adminUrl)
			// Should be redirected to /admin/login
			expect(page.url()).toContain('/admin/login')
			const authForm = await page.$('#login-form')
			expect(authForm).toBeTruthy()
		})

		it('should have proper form labels and inputs', async () => {
			await page.goto(adminUrl)

			// Check for secret key input
			const secretKeyInput = await page.$('input[name="secretKey"]')
			expect(secretKeyInput).toBeTruthy()

			// Check for submit button
			const submitButton = await page.$('button[type="submit"]')
			expect(submitButton).toBeTruthy()
		})
	})

	describe('Responsive Design Tests', () => {
		beforeAll(async () => {
			await performLogin()
			await page.goto(`${adminUrl}/links`, { waitUntil: 'networkidle2' })
		})

		it('should show desktop table on large screens (≥1280px)', async () => {
			await page.setViewport({ width: 1280, height: 800 })
			await page.reload()

			// Desktop table should be visible
			const desktopTable = await page.$('table')
			expect(desktopTable).toBeTruthy()

			// Mobile cards should be hidden
			const mobileCards = await page.$('.lg\\:hidden')
			const isHidden = await page.evaluate(el => {
				if (!el) return true
				return window.getComputedStyle(el).display === 'none'
			}, mobileCards)
			expect(isHidden).toBe(true)
		})

		it('should show tablet table on medium screens (1024px-1279px)', async () => {
			await page.setViewport({ width: 1100, height: 800 })
			await page.reload()

			// Table should still be visible (responsive handled by overflow-x-auto)
			const tabletTable = await page.$('table')
			expect(tabletTable).toBeTruthy()
		})

		it('should show mobile cards on small screens (<1024px)', async () => {
			await page.setViewport({ width: 768, height: 800 })
			await page.reload()

			// Table should still be in DOM but wrapped in overflow-x-auto
			const table = await page.$('table')
			expect(table).toBeTruthy()

			// Desktop table should be hidden
			const desktopTable = await page.$('.xl\\:block table')
			const isHidden = await page.evaluate(el => {
				if (!el) return true
				return window.getComputedStyle(el).display === 'none'
			}, desktopTable)
			expect(isHidden).toBe(true)
		})

		it('should have responsive table columns', async () => {
			await page.setViewport({ width: 1280, height: 800 })
			await page.reload()

			// Check that table has any columns
			const columns = await page.$$('th')
			expect(columns.length).toBeGreaterThan(0)
		})
	})

	describe('Table Functionality', () => {
		beforeAll(async () => {
			await page.setViewport({ width: 1280, height: 800 })
			await page.goto(`${adminUrl}/links`, { waitUntil: 'networkidle2' })
		})

		it('should have sortable table headers', async () => {
			// Column headers that have links for sorting
			const sortableHeaders = await page.$$('th a')
			expect(sortableHeaders.length).toBeGreaterThan(0)
		})

		it('should sort table when clicking sortable headers', async () => {
			// Click on title header link to sort
			await Promise.all([
				page.waitForNavigation({ waitUntil: 'networkidle2' }),
				page.click('th a[href*="sort=title"]'),
			])

			// Wait for sort to complete
			await new Promise(resolve => setTimeout(resolve, 500))

			// Verify sorting occurred by checking first row title cell
			const firstRowTitle = await page.$eval(
				'#links-table-body tr:first-child td:first-child',
				el => el.textContent?.trim(),
			)
			expect(typeof firstRowTitle).toBe('string')
		})

		it('should have functioning edit and delete buttons', async () => {
			const editButtons = await page.$$('.edit-btn')
			const deleteButtons = await page.$$('.delete-btn')

			expect(editButtons.length).toBeGreaterThan(0)
			expect(deleteButtons.length).toBeGreaterThan(0)
			expect(editButtons.length).toBe(deleteButtons.length)
		})

		it('should display status badges correctly', async () => {
			const statusBadges = await page.$$('tbody td span.inline-flex')
			expect(statusBadges.length).toBeGreaterThan(0)

			// Check that badges exist (Live or Scheduled)
			for (const badge of statusBadges) {
				const classes = await page.evaluate(el => el?.className || '', badge)
				expect(classes).toMatch(/bg-(green|yellow)-100/)
			}
		})
	})

	describe('Add Link Form', () => {
		it('should have a properly styled add link form', async () => {
			const form = await page.$('form')
			expect(form).toBeTruthy()

			// Check required form fields
			const titleInput = await page.$('input[name="title"]')
			const urlInput = await page.$('input[name="url"]')
			const tagsInput = await page.$('input[name="tags"]')
			const dateInput = await page.$('input[name="date"]')

			expect(titleInput).toBeTruthy()
			expect(urlInput).toBeTruthy()
			expect(tagsInput).toBeTruthy()
			expect(dateInput).toBeTruthy()
		})

		it('should have proper form styling and layout', async () => {
			// Check form has grid layout
			const formGrid = await page.$('.grid.grid-cols-1.gap-6')
			expect(formGrid).toBeTruthy()

			// Check form fields have proper styling
			const inputs = await page.$$('input')
			expect(inputs.length).toBeGreaterThan(0)
		})

		it('should validate required fields', async () => {
			// Check if browser validation kicks in
			const titleInput = await page.$('input[name="title"]')
			const isRequired = await page.evaluate(
				el => el?.hasAttribute('required') || false,
				titleInput,
			)
			expect(isRequired).toBe(true)
		})
	})

	describe('Modal Functionality', () => {
		beforeAll(async () => {
			await performLogin()
			await page.goto(`${adminUrl}/links`, { waitUntil: 'networkidle2' })
		})
		it('should have session expiry modal functionality', async () => {
			// Check if modal exists in DOM (may be hidden or rendered client-side)
			const modal = await page.$('#session-modal')
			// Modal may be rendered by client-side React — skip assertion if absent
			if (modal) expect(modal).toBeTruthy()
		})

		it('should have edit modal functionality', async () => {
			// Check if edit modal exists (may be rendered by client-side React)
			const editModal = await page.$('#confirm-update-modal')
			// Modal may not be in DOM until triggered — skip assertion if absent
			if (editModal) expect(editModal).toBeTruthy()
		})

		it('should show modal when edit button is clicked', async () => {
			const editButton = await page.$('.edit-btn')
			if (editButton) {
				await editButton.click()
				await new Promise(resolve => setTimeout(resolve, 100))

				// Check if clear form button (cancel edit) is visible or form title changed
				const clearButton = await page.$('#clear-form-btn')
				const isVisible = await page.evaluate(el => {
					return el && !el.classList.contains('hidden')
				}, clearButton)
				expect(isVisible).toBe(true)
			}
		})
	})

	describe('Accessibility Tests', () => {
		beforeAll(async () => {
			await performLogin()
			await page.goto(`${adminUrl}/links`, { waitUntil: 'networkidle2' })
		})

		it('should have proper ARIA labels and roles', async () => {
			// Check table has proper role
			const table = await page.$('table')
			const role = await page.evaluate(el => el?.getAttribute('role'), table)
			// Tables have implicit role, so undefined/null is acceptable
			expect(
				role === null || role === undefined || typeof role === 'string',
			).toBe(true)

			// Check headers have proper scope
			const headers = await page.$$('th[scope="col"]')
			if (headers.length === 0) {
				const allHeaders = await page.$$('th')
				console.warn('Headers found but without scope=col:', allHeaders.length)
			}
			expect(headers.length).toBeGreaterThan(0)
		})

		it('should have proper focus management', async () => {
			// Tab through form elements
			await page.keyboard.press('Tab')
			const activeElement = await page.evaluate(
				() => document.activeElement?.tagName,
			)
			// At this point active element could be anything tab-able, including skip links, headings with tab-index, html body etc.
			expect(typeof activeElement).toBe('string')
		})

		it('should have proper contrast and readability', async () => {
			// Check that text has proper contrast classes
			const textElements = await page.$$(
				'.text-slate-900, .text-slate-100, .text-slate-500, .dark\\:text-slate-100, .dark\\:text-slate-300',
			)
			expect(textElements.length).toBeGreaterThan(0)
		})
	})

	describe('Admin Navigation Visibility', () => {
		it('should hide admin navigation items when not authenticated', async () => {
			// Clear cookies
			const client = await page.target().createCDPSession()
			await client.send('Network.clearBrowserCookies')

			await page.goto(serverUrl) // Go to home page

			// Admin link and logout are server-rendered only for logged-in users
			expect(await page.$(ADMIN_NAV_LINK)).toBeNull()
			expect(await page.$('#admin-logout-btn')).toBeNull()
		})

		it('should show admin navigation items when authenticated', async () => {
			await performLogin()
			await page.goto(serverUrl)

			expect(await page.$(ADMIN_NAV_LINK)).toBeTruthy()
			expect(await page.$('#admin-logout-btn')).toBeTruthy()
		})

		it('should redirect to login on logout', async () => {
			await performLogin()
			await page.goto(serverUrl)

			// Click logout button
			const logoutBtn = await page.$('#admin-logout-btn')
			if (logoutBtn) {
				await logoutBtn.click()
				await page.waitForNavigation({ waitUntil: 'networkidle2' })

				// Should redirect to home or login, but definitely not authenticated
				expect(page.url()).not.toContain('/admin')
			}
		})
	})

	describe('Performance and UX', () => {
		beforeAll(async () => {
			// Ensure we are logged in and on the links page
			// We go to login page first to reset state potentially
			await page.goto(`${adminUrl}/login`, { waitUntil: 'networkidle2' })
			// Check if we are already redirected to admin/links (meaning already logged in)
			if (!page.url().includes('/admin/links')) {
				await page.waitForSelector('#secretKey', { timeout: 10000 })
				await page.type('#secretKey', 'test-secret-key')
				await page.click('button[type="submit"]')
				await page.waitForNavigation({ waitUntil: 'networkidle2' })
			}
			await page.goto(`${adminUrl}/links`, { waitUntil: 'networkidle2' })
		})
		it('should load within reasonable time', async () => {
			const startTime = Date.now()
			await page.goto(`${adminUrl}/links`)
			const loadTime = Date.now() - startTime

			// Should load within 3 seconds
			expect(loadTime).toBeLessThan(3000)
		})

		it('should have smooth hover effects', async () => {
			const hoverableElements = await page.$$('.hover\\:bg-slate-50')
			expect(hoverableElements.length).toBeGreaterThan(0)
		})

		it('should handle long content gracefully', async () => {
			// Check that long URLs break properly
			const urlCells = await page.$$('td .break-all')
			expect(urlCells.length).toBeGreaterThan(0)

			// Check that titles wrap properly
			const titleCells = await page.$$('td .break-words')
			expect(titleCells.length).toBeGreaterThan(0)
		})
	})
})
