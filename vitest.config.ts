/// <reference types="vitest" />
import { getViteConfig } from 'astro/config'

export default getViteConfig({
	test: {
		// Run tests with server management sequentially to avoid port conflicts
		fileParallelism: false,
		maxWorkers: 1,
		pool: 'forks',

		// Set up browser environment for Chrome AI tests
		environment: 'jsdom',

		// Optimize timeouts for faster feedback
		testTimeout: 30000, // 30s instead of default 60s
		hookTimeout: 60000, // Keep longer for server startup

		// Better reporter for CI/local development
		reporter: process.env.CI ? ['verbose', 'github-actions'] : 'verbose',

		// Retry flaky tests once in CI
		retry: process.env.CI ? 1 : 0,

		// Environment variables for test optimization
		env: {
			TEST_HEADLESS: process.env.CI ? 'true' : 'false',
			TEST_SLOWMO: process.env.CI ? '0' : '50', // Slower in local dev for debugging
		},
	},
})
