#!/usr/bin/env tsx

import { spawn } from 'child_process'

/**
 * Test runner that ensures proper port cleanup before running tests
 */

async function killPortProcesses() {
	console.log('🧹 Cleaning up any existing dev servers...')

	return new Promise<void>(resolve => {
		const netstat = spawn('netstat', ['-ano'], { shell: true })
		let output = ''

		netstat.stdout?.on('data', data => {
			output += data.toString()
		})

		netstat.on('close', () => {
			const lines = output.split('\n')
			const portsToKill = ['4321', '4322', '4323'] // Test ports
			const pidsToKill: string[] = []

			portsToKill.forEach(port => {
				const portLine = lines.find(
					line => line.includes(`:${port}`) && line.includes('LISTENING'),
				)
				if (portLine) {
					const pid = portLine.trim().split(/\s+/).pop()
					if (pid && !isNaN(Number(pid)) && !pidsToKill.includes(pid)) {
						pidsToKill.push(pid)
					}
				}
			})

			if (pidsToKill.length > 0) {
				console.log(`🔫 Killing processes: ${pidsToKill.join(', ')}`)
				pidsToKill.forEach(pid => {
					spawn('taskkill', ['/PID', pid, '/F'], { shell: true })
				})
				setTimeout(resolve, 3000) // Wait for cleanup
			} else {
				console.log('✅ No port conflicts found')
				resolve()
			}
		})

		netstat.on('error', () => {
			console.log('⚠️ Could not check ports, continuing...')
			resolve()
		})
	})
}

async function runTests() {
	const args = process.argv.slice(2)
	const testPattern = args[0] || 'back-to-top-isolated'

	console.log(`🧪 Running tests: ${testPattern}`)

	// Clean up ports first
	await killPortProcesses()

	// Run the specific test
	const vitest = spawn(
		'npx',
		['vitest', 'run', testPattern, '--reporter=verbose'],
		{
			stdio: 'inherit',
			shell: true,
		},
	)

	vitest.on('close', code => {
		console.log(`\n📊 Tests completed with code: ${code}`)
		process.exit(code || 0)
	})

	vitest.on('error', err => {
		console.error('❌ Failed to start tests:', err)
		process.exit(1)
	})
}

// Handle cleanup on exit
process.on('SIGINT', async () => {
	console.log('\n🛑 Cleaning up before exit...')
	await killPortProcesses()
	process.exit(0)
})

runTests().catch(console.error)
