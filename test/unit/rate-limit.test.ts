import {
	checkRateLimit,
	clearRateLimit,
	recordFailedAttempt,
} from '@lib/rateLimit'
import { describe, expect, it } from 'vitest'

// Each test uses a unique key so runs don't interfere with each other or
// with leftover rows from previous local.db runs.
function uniqueKey(label: string): string {
	return `test:${label}:${crypto.randomUUID()}`
}

describe('rate limiting', () => {
	it('allows an attempt when no prior record exists', async () => {
		const key = uniqueKey('fresh')
		expect(await checkRateLimit(key)).toBe(true)
	})

	it('stays allowed below the attempt threshold', async () => {
		const key = uniqueKey('below-threshold')
		for (let i = 0; i < 4; i++) {
			await recordFailedAttempt(key)
		}
		expect(await checkRateLimit(key)).toBe(true)
	})

	it('blocks once the attempt threshold is reached', async () => {
		const key = uniqueKey('at-threshold')
		for (let i = 0; i < 5; i++) {
			await recordFailedAttempt(key)
		}
		expect(await checkRateLimit(key)).toBe(false)
	})

	it('clearing the counter re-allows attempts', async () => {
		const key = uniqueKey('cleared')
		for (let i = 0; i < 5; i++) {
			await recordFailedAttempt(key)
		}
		expect(await checkRateLimit(key)).toBe(false)

		await clearRateLimit(key)
		expect(await checkRateLimit(key)).toBe(true)
	})

	it('keys are independent of each other', async () => {
		const keyA = uniqueKey('a')
		const keyB = uniqueKey('b')
		for (let i = 0; i < 5; i++) {
			await recordFailedAttempt(keyA)
		}
		expect(await checkRateLimit(keyA)).toBe(false)
		expect(await checkRateLimit(keyB)).toBe(true)
	})
})
