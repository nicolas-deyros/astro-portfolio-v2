import path from 'path'
import { defineConfig } from 'vitest/config'
import { configDefaults } from 'vitest/config'

// Tests that hit the dev server at localhost:4321. They run in the `e2e`
// project, whose globalSetup starts one shared server (only when one of these
// files is in the run, so unit-only runs like test:critical stay server-free).
const SERVER_TESTS = [
	'test/admin-interface.test.ts',
	'test/auth.test.ts',
	'test/back-to-top.test.ts',
	'test/performance.test.ts',
	'test/e2e/security.test.ts',
	'test/e2e/links-tag-filtering.test.ts',
	'test/e2e/blog-slide-deck.test.ts',
]

export default defineConfig({
	test: {
		exclude: [
			...configDefaults.exclude,
			'db/**',
			'.agents/**',
			'testsprite_tests/**',
			// These tests still spawn their own dev server process, which would
			// fight the shared e2e server. back-to-top-* duplicate
			// test/back-to-top.test.ts.
			'test/back-to-top-isolated.test.ts',
			'test/back-to-top-optimized.test.ts',
			'test/date-filtering.test.ts',
			'test/e2e/links.test.ts',
		],
		projects: [
			{
				extends: true,
				test: { name: 'unit', exclude: SERVER_TESTS },
			},
			{
				extends: true,
				test: {
					name: 'e2e',
					include: SERVER_TESTS,
					globalSetup: [path.resolve(__dirname, '../test/globalSetup.ts')],
				},
			},
		],
		fileParallelism: false,
		maxWorkers: 1,
		pool: 'forks',
		environment: 'jsdom',
		testTimeout: 60000,
		hookTimeout: 120000,
		reporters: process.env.CI ? ['verbose', 'github-actions'] : ['verbose'],
		retry: process.env.CI ? 1 : 0,
		env: {
			TEST_HEADLESS: process.env.CI ? 'true' : 'false',
			TEST_SLOWMO: process.env.CI ? '0' : '50',
		},
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, '../src'),
			'@components': path.resolve(__dirname, '../src/components'),
			'@layouts': path.resolve(__dirname, '../src/layouts'),
			'@utils': path.resolve(__dirname, '../src/utils'),
			'@lib': path.resolve(__dirname, '../src/lib'),
			'@styles': path.resolve(__dirname, '../src/styles'),
			'@assets': path.resolve(__dirname, '../src/assets'),
		},
	},
	ssr: {
		external: ['libsql', '@libsql/client'],
	},
})
