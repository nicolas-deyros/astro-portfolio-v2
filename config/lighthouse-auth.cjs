/**
 * Lighthouse CI puppeteer script: gets Vercel's protection-bypass cookie for a
 * preview deployment. Do not use Lighthouse `extraHeaders` instead: it would
 * send the secret to every third-party host the page loads.
 */
module.exports = async (browser, { url }) => {
	const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
	if (!secret) throw new Error('VERCEL_AUTOMATION_BYPASS_SECRET is not set')

	// A static asset runs no scripts, so these headers reach only the preview.
	const asset = new URL('/favicon.ico', url)
	const page = await browser.newPage()
	try {
		await page.setExtraHTTPHeaders({
			'x-vercel-protection-bypass': secret,
			'x-vercel-set-bypass-cookie': 'true',
		})
		const response = await page.goto(asset.href)
		// A rejected secret redirects to the Vercel login page, which answers 200.
		if (!response?.ok() || new URL(response.url()).origin !== asset.origin) {
			throw new Error(`Vercel protection bypass failed for ${asset.origin}`)
		}
	} finally {
		await page.close()
	}
}
