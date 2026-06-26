import { describe, expect, it } from 'vitest'

import {
	generateSetupToken,
	hashPassword,
	hashToken,
	verifyPassword,
} from '@lib/clientAuth'

// Security path: the onboarding flow stores only the SHA-256 hash of a
// high-entropy token and never the raw token or a plaintext password.
describe('client setup token', () => {
	it('generates unique, URL-safe tokens', () => {
		const a = generateSetupToken()
		const b = generateSetupToken()
		expect(a).not.toBe(b)
		// URL-safe base64 only — safe to drop straight into a query string.
		expect(a).toMatch(/^[A-Za-z0-9_-]+$/)
		expect(a.length).toBeGreaterThan(20)
	})

	it('hashes tokens deterministically (same token → same hash)', async () => {
		const token = generateSetupToken()
		expect(await hashToken(token)).toBe(await hashToken(token))
	})

	it('produces different hashes for different tokens', async () => {
		expect(await hashToken(generateSetupToken())).not.toBe(
			await hashToken(generateSetupToken()),
		)
	})

	it('hash is a 64-char hex SHA-256 digest, not the raw token', async () => {
		const token = generateSetupToken()
		const hash = await hashToken(token)
		expect(hash).toMatch(/^[0-9a-f]{64}$/)
		expect(hash).not.toBe(token)
	})

	it('empty password hash can never be verified (login blocked pre-setup)', async () => {
		// New clients are stored with passwordHash '' until they set one.
		expect(await verifyPassword('anything', '')).toBe(false)
	})

	it('a password set after onboarding verifies correctly', async () => {
		const stored = await hashPassword('correct horse battery')
		expect(await verifyPassword('correct horse battery', stored)).toBe(true)
		expect(await verifyPassword('wrong', stored)).toBe(false)
	})
})
