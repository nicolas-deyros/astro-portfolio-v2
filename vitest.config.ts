/// <reference types="vitest" />
import { getViteConfig } from 'astro/config'

export default getViteConfig({
	test: {
		/* for example, use global to avoid globals imports (describe, test, expect): */
		// globals: true,

		// Run tests with server management sequentially to avoid port conflicts
		fileParallelism: false,
		maxWorkers: 1,
		pool: 'forks',
	},
})
