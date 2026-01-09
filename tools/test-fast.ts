#!/usr/bin/env tsx

import { spawn } from 'child_process'

/**
 * Fast test runner for development
 * Runs specific test patterns without the overhead of all tests
 */

const args = process.argv.slice(2)
const testPattern = args[0] || 'back-to-top'

console.log(`🧪 Running tests matching: ${testPattern}`)

// Run vitest with specific pattern
const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const vitest = spawn(cmd, ['vitest', 'run', `--grep=${testPattern}`], {
	stdio: 'inherit',
	shell: true,
})

vitest.on('close', code => {
	console.log(`\n📊 Tests completed with code: ${code}`)
	process.exit(code || 0)
})

vitest.on('error', err => {
	console.error('❌ Failed to start tests:', err)
	process.exit(1)
})
