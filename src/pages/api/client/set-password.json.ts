import { hashPassword, hashToken } from '@lib/clientAuth'
import { db } from '@lib/db'
import {
	ApplicationError,
	createErrorResponse,
	createSuccessResponse,
	UnauthorizedError,
	ValidationError,
} from '@lib/errors'
import type { APIRoute } from 'astro'
import { eq } from 'drizzle-orm'

import { clients } from '@/db/schema'

export const prerender = false

const MIN_PASSWORD_LENGTH = 8

// Redeems a one-time setup token and sets the client's password.
// Single-use: the token columns are cleared on success, so the link dies.
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

		const { token, password } = await request.json()
		if (!token || !password) {
			throw new ValidationError('token and password are required')
		}
		if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
			throw new ValidationError(
				`Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
			)
		}

		const tokenHash = await hashToken(token)
		const [client] = await db
			.select()
			.from(clients)
			.where(eq(clients.setupTokenHash, tokenHash))
			.limit(1)

		if (!client || !client.setupTokenExpiresAt) {
			throw new UnauthorizedError('Invalid or already-used setup link')
		}
		if (new Date() > new Date(client.setupTokenExpiresAt)) {
			throw new UnauthorizedError('This setup link has expired')
		}

		await db
			.update(clients)
			.set({
				passwordHash: await hashPassword(password),
				setupTokenHash: null,
				setupTokenExpiresAt: null,
			})
			.where(eq(clients.id, client.id))

		return createSuccessResponse({ message: 'Password set successfully' })
	} catch (error) {
		console.error('[client-set-password] error:', error)
		return createErrorResponse(error)
	}
}
