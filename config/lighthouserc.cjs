// Lighthouse CI, run against Vercel previews by .github/workflows/lighthouse.yml
// The default aggregation is the best run, which hides a mostly slow page.
const minimum = ['warn', { minScore: 0.9, aggregationMethod: 'median' }]

module.exports = {
	ci: {
		collect: {
			numberOfRuns: 3,
			puppeteerScript: './config/lighthouse-auth.cjs',
			// Chrome preinstalled on GitHub's Ubuntu runners.
			chromePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
			puppeteerLaunchOptions: { args: ['--no-sandbox'] },
			settings: {
				// Vercel previews always send `x-robots-tag: noindex`.
				skipAudits: ['is-crawlable'],
				// The preview toolbar does not ship to production.
				blockedUrlPatterns: ['*://vercel.live/*'],
			},
		},
		assert: {
			assertions: {
				'categories:performance': minimum,
				'categories:accessibility': minimum,
				'categories:best-practices': minimum,
				'categories:seo': minimum,
			},
		},
	},
}
