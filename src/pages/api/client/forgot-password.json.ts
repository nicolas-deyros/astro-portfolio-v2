import { issueSetupLink, SETUP_TOKEN_TTL_DAYS } from '@lib/clientOnboarding'
import { db } from '@lib/db'
import { sendClientPasswordResetEmail } from '@lib/email'
import {
	ApplicationError,
	createErrorResponse,
	createSuccessResponse,
	ValidationError,
} from '@lib/errors'
import type { APIRoute } from 'astro'
import { eq } from 'drizzle-orm'

import { clients } from '@/db/schema'

export const prerender = false

// Client-initiated password reset. Always returns success regardless of whether
// the email exists or is active — prevents account enumeration. The reset link
// is only generated and emailed when an active client actually matches.
export const POST: APIRoute = async ({ request }) => {
	try {
		const contentType = request.headers.get('content-type') ?? ''
		if (!contentType.includes('application/json')) {
			throw new ApplicationError(
				'Content-Type must be application/json',
				415,
				'UNSUPPORTED_MEDIA_TYPE',
			)
		}

		const { email } = await request.json()
		if (!email) throw new ValidationError('email is required')

		const [client] = await db
			.select({
				id: clients.id,
				name: clients.name,
				email: clients.email,
				isActive: clients.isActive,
			})
			.from(clients)
			.where(eq(clients.email, String(email).toLowerCase().trim()))
			.limit(1)

		if (client && client.isActive) {
			try {
				const resetUrl = await issueSetupLink(
					client.id,
					new URL(request.url).origin,
				)
				await sendClientPasswordResetEmail({
					name: client.name,
					email: client.email,
					resetUrl,
					expiresInDays: SETUP_TOKEN_TTL_DAYS,
				})
			} catch (mailError) {
				// Log but still return the generic success below.
				console.error('[forgot-password] reset email failed:', mailError)
			}
		}

		return createSuccessResponse({
			message: 'If that email has an account, a reset link is on its way.',
		})
	} catch (error) {
		console.error('[forgot-password] error:', error)
		return createErrorResponse(error)
	}
}
