#!/usr/bin/env node

/**
 * Performance Test Runner - Direct test execution
 *
 * This script runs performance tests directly using Vitest
 */

import process from 'process'
import { spawn } from 'child_process'

async function runPerformanceTests(): Promise<void> {
	console.log('🚀 Starting performance tests...')

	const testProcess = spawn(
		'npx',
		['vitest', 'run', 'test/performance.test.ts'],
		{
			stdio: 'inherit',
			shell: true,
			cwd: process.cwd(),
		},
	)

	testProcess.on('close', (code: number | null) => {
		if (code === 0) {
			console.log('✅ Performance tests completed successfully!')
			process.exit(0)
		} else {
			console.log('❌ Performance tests failed')
			process.exit(code || 1)
		}
	})

	testProcess.on('error', (error: Error) => {
		console.error('❌ Failed to start performance tests:', error.message)
		process.exit(1)
	})
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	runPerformanceTests().catch(console.error)
}

export { runPerformanceTests }
