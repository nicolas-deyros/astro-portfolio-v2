import { type ChildProcess, spawn } from 'node:child_process'
import path from 'node:path'

// One Astro dev server shared by every server-dependent test file (the `e2e`
// Vitest project). Files must not start or kill servers themselves.
const PORT = 4321
const BASE_URL = `http://localhost:${PORT}`
const READY_TIMEOUT_MS = 120_000
// Login tests type this key into /admin/login.
const TEST_SECRET_KEY = 'test-secret-key'

let server: ChildProcess | undefined

async function isUp(): Promise<boolean> {
	try {
		return (await fetch(BASE_URL)).ok
	} catch {
		return false
	}
}

export async function setup(): Promise<void> {
	if (await isUp()) {
		throw new Error(
			`Something is already serving ${BASE_URL}. Stop it first (npx astro dev stop): ` +
				'e2e tests need their own server started with the test API_SECRET_KEY.',
		)
	}

	const env: NodeJS.ProcessEnv = {
		...process.env,
		NODE_ENV: 'development',
		API_SECRET_KEY: TEST_SECRET_KEY,
	}
	delete env.VITEST

	// Run astro's bin with node directly (no shell/npx wrapper) so kill()
	// reaches the server itself and leaves no orphan holding the port.
	const astroBin = path.resolve(
		__dirname,
		'../node_modules/astro/bin/astro.mjs',
	)
	server = spawn(process.execPath, [astroBin, 'dev', '--port', String(PORT)], {
		env,
		stdio: ['ignore', 'pipe', 'pipe'],
	})

	let output = ''
	server.stdout?.on('data', d => (output += d))
	server.stderr?.on('data', d => (output += d))

	const start = Date.now()
	while (Date.now() - start < READY_TIMEOUT_MS) {
		if (server.exitCode !== null) {
			throw new Error(`Astro dev server exited early:\n${output}`)
		}
		if (await isUp()) return
		await new Promise(resolve => setTimeout(resolve, 1000))
	}
	await teardown()
	throw new Error(
		`Astro dev server not ready after ${READY_TIMEOUT_MS}ms:\n${output}`,
	)
}

export async function teardown(): Promise<void> {
	if (!server || server.exitCode !== null) return
	const exited = new Promise(resolve => server?.once('exit', resolve))
	server.kill()
	await Promise.race([exited, new Promise(r => setTimeout(r, 5000))])
	if (server.exitCode === null) server.kill('SIGKILL')
}
