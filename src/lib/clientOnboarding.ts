import { generateSetupToken, hashToken } from '@lib/clientAuth'
import { db } from '@lib/db'
import { eq } from 'drizzle-orm'

import { clients } from '@/db/schema'

export const SETUP_TOKEN_TTL_DAYS = 7

/**
 * Issue a one-time set-password token for a client: generates a high-entropy
 * token, stores only its SHA-256 hash + expiry on the row, and returns the
 * absolute /client/set-password URL to email. Used for initial onboarding,
 * admin "resend invite", and client-initiated "forgot password" — they all
 * redeem through the same single-use set-password endpoint.
 */
export async function issueSetupLink(
	clientId: number,
	origin: string,
): Promise<string> {
	const token = generateSetupToken()
	const setupTokenHash = await hashToken(token)
	const expiresAt = new Date(
		Date.now() + SETUP_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
	)

	await db
		.update(clients)
		.set({
			setupTokenHash,
			setupTokenExpiresAt: expiresAt.toISOString(),
		})
		.where(eq(clients.id, clientId))

	return `${origin}/client/set-password?token=${token}`
}
