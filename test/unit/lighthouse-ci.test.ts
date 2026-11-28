import { createRequire } from 'module'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const require = createRequire(import.meta.url)
const authenticate = require('../../config/lighthouse-auth.cjs')
const { ci } = require('../../config/lighthouserc.cjs')

const PREVIEW = 'https://preview.example.vercel.app'

function fakeBrowser(
	finalUrl: string,
	ok = true,
): Record<'page' | 'browser', Record<string, ReturnType<typeof vi.fn>>> {
	const page = {
		setCacheEnabled: vi.fn(),
		setExtraHTTPHeaders: vi.fn(),
		goto: vi.fn().mockResolvedValue({
			ok: () => ok,
			status: () => (ok ? 200 : 401),
			url: () => finalUrl,
		}),
		close: vi.fn(),
	}
	return { page, browser: { newPage: vi.fn().mockResolvedValue(page) } }
}

describe('Lighthouse CI preview authentication', () => {
	beforeEach(() => vi.stubEnv('VERCEL_AUTOMATION_BYPASS_SECRET', 'test-token'))
	afterEach(() => vi.unstubAllEnvs())

	it('requests the cookie from a static asset, keeping the secret out of URLs', async () => {
		const { page, browser } = fakeBrowser(`${PREVIEW}/favicon.ico`)

		await authenticate(browser, { url: `${PREVIEW}/blog` })

		// A cached favicon from an earlier URL would answer 304, which is not "ok".
		expect(page.setCacheEnabled).toHaveBeenCalledWith(false)
		expect(page.setExtraHTTPHeaders).toHaveBeenCalledWith({
			'x-vercel-protection-bypass': 'test-token',
			'x-vercel-set-bypass-cookie': 'true',
		})
		expect(page.goto).toHaveBeenCalledWith(`${PREVIEW}/favicon.ico`)
		expect(page.close).toHaveBeenCalled()
	})

	it('fails when the secret is missing', async () => {
		vi.stubEnv('VERCEL_AUTOMATION_BYPASS_SECRET', '')
		const { browser } = fakeBrowser(`${PREVIEW}/favicon.ico`)

		await expect(authenticate(browser, { url: PREVIEW })).rejects.toThrow(
			'VERCEL_AUTOMATION_BYPASS_SECRET is not set',
		)
		expect(browser.newPage).not.toHaveBeenCalled()
	})

	it.each([
		['an error status', `${PREVIEW}/favicon.ico`, false],
		['a redirect to the login page', 'https://vercel.com/login', true],
	])('fails and closes the page on %s', async (_, finalUrl, ok) => {
		const { page, browser } = fakeBrowser(finalUrl, ok)

		await expect(authenticate(browser, { url: PREVIEW })).rejects.toThrow(
			'Vercel protection bypass failed',
		)
		expect(page.close).toHaveBeenCalled()
	})

	it('reports the status and final path, without the query string', async () => {
		const { browser } = fakeBrowser('https://vercel.com/login?nonce=abc', false)

		await expect(authenticate(browser, { url: PREVIEW })).rejects.toThrow(
			/got 401 from https:\/\/vercel\.com\/login$/,
		)
	})
})

describe('Lighthouse CI configuration', () => {
	it('warns below 90 in every category', () => {
		for (const category of [
			'performance',
			'accessibility',
			'best-practices',
			'seo',
		]) {
			expect(ci.assert.assertions[`categories:${category}`]).toEqual([
				'warn',
				{ minScore: 0.9 },
			])
		}
	})

	it('never sends extra headers with audited pages', () => {
		expect(ci.collect.settings.extraHeaders).toBeUndefined()
	})
})
