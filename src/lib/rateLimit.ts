import { db } from '@lib/db'
import { eq } from 'drizzle-orm'

import { loginAttempts } from '@/db/schema'

const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_ATTEMPTS = 5

/** True when `key` is still allowed to attempt a login. */
export async function checkRateLimit(key: string): Promise<boolean> {
	const [row] = await db
		.select()
		.from(loginAttempts)
		.where(eq(loginAttempts.key, key))
		.limit(1)

	if (!row || Date.now() - new Date(row.windowStart).getTime() > WINDOW_MS) {
		return true
	}
	return row.count < MAX_ATTEMPTS
}

/** Record a failed attempt for `key`, starting a new window if the old one expired. */
export async function recordFailedAttempt(key: string): Promise<void> {
	const [row] = await db
		.select()
		.from(loginAttempts)
		.where(eq(loginAttempts.key, key))
		.limit(1)

	const now = new Date().toISOString()

	if (!row || Date.now() - new Date(row.windowStart).getTime() > WINDOW_MS) {
		await db
			.insert(loginAttempts)
			.values({ key, count: 1, windowStart: now })
			.onConflictDoUpdate({
				target: loginAttempts.key,
				set: { count: 1, windowStart: now },
			})
		return
	}

	await db
		.update(loginAttempts)
		.set({ count: row.count + 1 })
		.where(eq(loginAttempts.key, key))
}

/** Clear the counter for `key` after a successful login. */
export async function clearRateLimit(key: string): Promise<void> {
	await db.delete(loginAttempts).where(eq(loginAttempts.key, key))
}
