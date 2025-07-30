#!/usr/bin/env node

/**
 * Performance Test Runner
 *
 * This script helps you run performance tests by:
 * 1. Checking if the dev server is running
 * 2. Running the performance tests
 * 3. Providing helpful instructions if something goes wrong
 */

async function checkServer() {
	try {
		const response = await fetch('http://localhost:4321')
		return response.ok
	} catch {
		return false
	}
}

import process from 'process'

async function main() {
	console.log('🔍 Checking if Astro dev server is running...')

	const isServerRunning = await checkServer()

	if (!isServerRunning) {
		console.log('❌ Astro dev server is not running')
		console.log('')
		console.log('📋 To run performance tests:')
		console.log('   1. Open a new terminal/command prompt')
		console.log('   2. Navigate to your project directory')
		console.log('   3. Run: npm run dev')
		console.log('   4. Wait for the "Local: http://localhost:4321" message')
		console.log('   5. Keep that terminal open')
		console.log('   6. In another terminal, run: npm run test:performance')
		console.log('')
		console.log('💡 Tip: You need TWO terminals running:')
		console.log('   - Terminal 1: npm run dev (keeps server running)')
		console.log('   - Terminal 2: npm run test:performance (runs tests)')
		process.exit(1)
	}

	console.log('✅ Dev server is running!')
	console.log('🚀 Running performance tests...')

	// Import and run the test command
	const { spawn } = await import('child_process')

	const testProcess = spawn('npm', ['run', 'test:performance'], {
		stdio: 'inherit',
		shell: true,
	})

	testProcess.on('close', code => {
		if (code === 0) {
			console.log('✅ Performance tests completed successfully!')
		} else {
			console.log('❌ Performance tests failed')
			process.exit(code)
		}
	})
}

main().catch(console.error)
