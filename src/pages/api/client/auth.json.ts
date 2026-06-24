import { db } from '@lib/db'
import { verifyPassword } from '@lib/clientAuth'
import {
	cleanExpiredClientSessions,
	createClientSession,
	destroyClientSession,
	validateClientSession,
} from '@lib/clientSession'
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

export const POST: APIRoute = async ({ request, cookies }) => {
	try {
		const contentType = request.headers.get('content-type') ?? ''
		if (!contentType.includes('application/json')) {
			throw new ApplicationError(
				'Content-Type must be application/json',
				415,
				'UNSUPPORTED_MEDIA_TYPE',
			)
		}

		const body = await request.json()
		const { action } = body

		await cleanExpiredClientSessions()

		switch (action) {
			case 'login': {
				const { email, password } = body

				if (!email || !password) {
					throw new ValidationError('Email and password are required')
				}

				const [client] = await db
					.select()
					.from(clients)
					.where(eq(clients.email, email.toLowerCase().trim()))
					.limit(1)

				if (!client || !client.isActive) {
					throw new UnauthorizedError('Invalid credentials')
				}

				const valid = await verifyPassword(password, client.passwordHash)
				if (!valid) {
					throw new UnauthorizedError('Invalid credentials')
				}

				await createClientSession(client.id, cookies, request)

				return createSuccessResponse({
					message: 'Login successful',
					clientSlug: client.slug,
				})
			}

			case 'logout': {
				await destroyClientSession(cookies)
				return createSuccessResponse({ message: 'Logout successful' })
			}

			default:
				throw new ValidationError('Invalid action')
		}
	} catch (error) {
		console.error('[client-auth] error:', error)
		return createErrorResponse(error)
	}
}

export const GET: APIRoute = async ({ cookies }) => {
	try {
		const info = await validateClientSession(cookies)
		if (!info) {
			return createSuccessResponse({ authenticated: false })
		}
		return createSuccessResponse({
			authenticated: true,
			clientSlug: info.clientSlug,
			expiresAt: info.expiresAt.toISOString(),
		})
	} catch (error) {
		console.error('[client-auth] GET error:', error)
		return createErrorResponse(error)
	}
}
