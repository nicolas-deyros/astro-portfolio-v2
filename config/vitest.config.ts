import path from 'path'
import { defineConfig } from 'vitest/config'
import { configDefaults } from 'vitest/config'

export default defineConfig({
	test: {
		exclude: [...configDefaults.exclude, 'db/**', 'testsprite_tests/**'],
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
