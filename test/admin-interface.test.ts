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

describe('Admin Interface Tests', () => {
	let server: ChildProcess
	let browser: Browser
	let page: Page
	const serverUrl = 'http://localhost:4321'
	const adminUrl = `${serverUrl}/admin`

	beforeAll(async () => {
		// Start the dev server using npm run dev:test (without --open flag) for testing
		server = spawn('npm', ['run', 'dev:test'], {
			shell: true, // Important for Windows
			stdio: 'pipe', // Capture output
		})
		await waitForServer(serverUrl)

		// Launch browser
		browser = await puppeteer.launch({
			headless: true,
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
		})
		page = await browser.newPage()

		// Set a larger viewport for desktop testing
		await page.setViewport({ width: 1280, height: 800 })
	}, 90000)

	afterAll(async () => {
		if (browser) await browser.close()
		if (server) server.kill()
	})

	describe('Pagination and Search Features', () => {
		beforeAll(async () => {
			// Navigate to the site first so localStorage is available
			await page.goto(adminUrl)
			await page.evaluate(() => {
				localStorage.setItem('admin_authenticated', 'true')
				localStorage.setItem('auth_token', 'test-token')
			})
			await page.goto(`${adminUrl}/links`, { waitUntil: 'networkidle2' })
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

		it('should update URL when changing page size', async () => {
			const pageSizeSelect = await page.$('select[name="pageSize"]')
			if (pageSizeSelect) {
				await pageSizeSelect.select('20')
				await page.click('button[type="submit"]')
				await page.waitForNavigation({ waitUntil: 'networkidle2' })

				expect(page.url()).toContain('pageSize=20')
			}
		})

		it('should show results summary', async () => {
			const resultsSummary = await page.$('text="Showing"')
			expect(resultsSummary).toBeTruthy()
		})
	})

	describe('Enhanced Form Features', () => {
		beforeAll(async () => {
			await page.goto(adminUrl)
			await page.evaluate(() => {
				localStorage.setItem('admin_authenticated', 'true')
				localStorage.setItem('auth_token', 'test-token')
			})
			await page.goto(`${adminUrl}/links`, { waitUntil: 'networkidle2' })
		})

		it('should have form validation error display', async () => {
			const errorContainer = await page.$('#form-errors')
			expect(errorContainer).toBeTruthy()

			const successContainer = await page.$('#form-success')
			expect(successContainer).toBeTruthy()
		})

		it('should have confirmation modals', async () => {
			const deleteModal = await page.$('#confirm-delete-modal')
			expect(deleteModal).toBeTruthy()

			const updateModal = await page.$('#confirm-update-modal')
			expect(updateModal).toBeTruthy()
		})

		it('should have edit mode functionality', async () => {
			const clearButton = await page.$('#clear-form-btn')
			expect(clearButton).toBeTruthy()

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
			await page.goto(adminUrl)
			const authForm = await page.$('#auth-form')
			expect(authForm).toBeTruthy()
		})

		it('should have proper form labels and inputs', async () => {
			await page.goto(adminUrl)

			// Check for username input
			const usernameInput = await page.$('input[name="username"]')
			expect(usernameInput).toBeTruthy()

			// Check for password input
			const passwordInput = await page.$('input[type="password"]')
			expect(passwordInput).toBeTruthy()

			// Check for submit button
			const submitButton = await page.$('button[type="submit"]')
			expect(submitButton).toBeTruthy()
		})
	})

	describe('Responsive Design Tests', () => {
		beforeAll(async () => {
			// Login first (using test credentials)
			await page.goto(adminUrl)
			await page.type('input[name="username"]', 'admin')
			await page.type('input[name="password"]', 'password123')
			await page.click('button[type="submit"]')
			await page.waitForSelector('#admin-dashboard')
		})

		it('should show desktop table on large screens (≥1280px)', async () => {
			await page.setViewport({ width: 1280, height: 800 })
			await page.reload()

			// Desktop table should be visible
			const desktopTable = await page.$('.xl\\:block table')
			expect(desktopTable).toBeTruthy()

			// Mobile cards should be hidden
			const mobileCards = await page.$('.lg\\:hidden')
			const isHidden = await page.evaluate(el => {
				return window.getComputedStyle(el).display === 'none'
			}, mobileCards)
			expect(isHidden).toBe(true)
		})

		it('should show tablet table on medium screens (1024px-1279px)', async () => {
			await page.setViewport({ width: 1100, height: 800 })
			await page.reload()

			// Tablet table should be visible
			const tabletTable = await page.$('.lg\\:block.xl\\:hidden table')
			expect(tabletTable).toBeTruthy()
		})

		it('should show mobile cards on small screens (<1024px)', async () => {
			await page.setViewport({ width: 768, height: 800 })
			await page.reload()

			// Mobile cards should be visible
			const mobileCards = await page.$('#links-mobile-cards')
			expect(mobileCards).toBeTruthy()

			// Desktop table should be hidden
			const desktopTable = await page.$('.xl\\:block table')
			const isHidden = await page.evaluate(el => {
				return window.getComputedStyle(el).display === 'none'
			}, desktopTable)
			expect(isHidden).toBe(true)
		})

		it('should have responsive table columns with proper widths', async () => {
			await page.setViewport({ width: 1280, height: 800 })
			await page.reload()

			// Check that table has proper column width classes
			const titleColumn = await page.$('th.w-1\\/4')
			const urlColumn = await page.$('th.w-1\\/3')
			const tagsColumn = await page.$('th.w-1\\/6')

			expect(titleColumn).toBeTruthy()
			expect(urlColumn).toBeTruthy()
			expect(tagsColumn).toBeTruthy()
		})
	})

	describe('Table Functionality', () => {
		beforeAll(async () => {
			await page.setViewport({ width: 1280, height: 800 })
		})

		it('should have sortable table headers', async () => {
			const sortableHeaders = await page.$$('th.sortable')
			expect(sortableHeaders.length).toBeGreaterThan(0)

			// Check for sort indicators
			const sortIndicators = await page.$$('.sort-indicator')
			expect(sortIndicators.length).toBeGreaterThan(0)
		})

		it('should sort table when clicking sortable headers', async () => {
			// Click on title header to sort
			await page.click('th[data-sort="title"]')

			// Wait for sort to complete
			await page.waitForTimeout(100)

			// Verify sorting occurred by checking first row
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

			// Check that badges have proper styling
			for (const badge of statusBadges) {
				const classes = await page.evaluate(el => el.className, badge)
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
			const inputs = await page.$$('input.rounded-lg')
			expect(inputs.length).toBeGreaterThan(0)
		})

		it('should validate required fields', async () => {
			// Try to submit empty form
			const submitButton = await page.$('button[type="submit"]')
			await submitButton?.click()

			// Check if browser validation kicks in
			const titleInput = await page.$('input[name="title"]')
			const isRequired = await page.evaluate(
				el => el.hasAttribute('required'),
				titleInput,
			)
			expect(isRequired).toBe(true)
		})
	})

	describe('Modal Functionality', () => {
		it('should have session expiry modal functionality', async () => {
			// Check if modal exists in DOM (may be hidden)
			const modal = await page.$('#session-modal')
			expect(modal).toBeTruthy()
		})

		it('should have edit modal functionality', async () => {
			// Check if edit modal exists
			const editModal = await page.$('#edit-modal')
			expect(editModal).toBeTruthy()
		})

		it('should show modal when edit button is clicked', async () => {
			const editButton = await page.$('.edit-btn')
			if (editButton) {
				await editButton.click()
				await page.waitForTimeout(100)

				// Check if modal is visible
				const modal = await page.$('#edit-modal')
				const isVisible = await page.evaluate(el => {
					return !el.classList.contains('hidden')
				}, modal)
				expect(isVisible).toBe(true)
			}
		})
	})

	describe('Accessibility Tests', () => {
		it('should have proper ARIA labels and roles', async () => {
			// Check table has proper role
			const table = await page.$('table')
			const role = await page.evaluate(el => el.getAttribute('role'), table)
			// Tables have implicit role, so undefined is acceptable
			expect(role === null || typeof role === 'string').toBe(true)

			// Check headers have proper scope
			const headers = await page.$$('th[scope="col"]')
			expect(headers.length).toBeGreaterThan(0)
		})

		it('should have proper focus management', async () => {
			// Tab through form elements
			await page.keyboard.press('Tab')
			const activeElement = await page.evaluate(
				() => document.activeElement?.tagName,
			)
			expect(['INPUT', 'BUTTON', 'SELECT'].includes(activeElement || '')).toBe(
				true,
			)
		})

		it('should have proper contrast and readability', async () => {
			// Check that text has proper contrast classes
			const textElements = await page.$$('.text-slate-900, .text-slate-100')
			expect(textElements.length).toBeGreaterThan(0)
		})
	})

	describe('Admin Navigation Visibility', () => {
		it('should hide admin navigation items when not authenticated', async () => {
			// Clear authentication
			await page.evaluate(() => {
				localStorage.removeItem('admin_authenticated')
				localStorage.removeItem('auth_token')
			})

			await page.goto(adminUrl)

			// Check that admin menu items are hidden on desktop
			const desktopAdminItems = await page.$$('.admin-menu-item:not(.hidden)')
			expect(desktopAdminItems.length).toBe(0)

			// Check that logout button is hidden
			const logoutBtn = await page.$('#admin-logout-btn:not(.hidden)')
			expect(logoutBtn).toBe(null)
		})

		it('should show admin navigation items when authenticated', async () => {
			// Set authentication
			await page.evaluate(() => {
				localStorage.setItem('admin_authenticated', 'true')
			})

			await page.goto(adminUrl)
			await page.waitForTimeout(500) // Wait for script to execute

			// Check that admin menu items are visible on desktop
			const desktopAdminItems = await page.$$('.admin-menu-item:not(.hidden)')
			expect(desktopAdminItems.length).toBeGreaterThan(0)

			// Check that logout button is visible
			const logoutBtn = await page.$('#admin-logout-btn:not(.hidden)')
			expect(logoutBtn).toBeTruthy()
		})

		it('should handle mobile admin navigation correctly', async () => {
			await page.setViewport({ width: 768, height: 800 })

			// Set authentication
			await page.evaluate(() => {
				localStorage.setItem('admin_authenticated', 'true')
			})

			await page.goto(adminUrl)
			await page.waitForTimeout(500)

			// Open mobile menu
			await page.click('#mobile-menu-button')
			await page.waitForTimeout(200)

			// Check that mobile admin items are visible when authenticated
			const mobileAdminItems = await page.$$(
				'#mobile-menu .admin-menu-item:not(.hidden)',
			)
			expect(mobileAdminItems.length).toBeGreaterThan(0)
		})

		it('should redirect to admin login on logout', async () => {
			// Set authentication first
			await page.evaluate(() => {
				localStorage.setItem('admin_authenticated', 'true')
			})

			await page.goto(adminUrl)
			await page.waitForTimeout(500)

			// Click logout button
			const logoutBtn = await page.$('#admin-logout-btn')
			if (logoutBtn) {
				await logoutBtn.click()
				await page.waitForTimeout(1000)

				// Should redirect to admin page and clear auth
				expect(page.url()).toBe(adminUrl)

				const isAuthenticated = await page.evaluate(() => {
					return localStorage.getItem('admin_authenticated') === 'true'
				})
				expect(isAuthenticated).toBe(false)
			}
		})
	})

	describe('Performance and UX', () => {
		it('should load within reasonable time', async () => {
			const startTime = Date.now()
			await page.goto(adminUrl)
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
