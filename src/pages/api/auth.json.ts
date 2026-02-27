import {
	ApplicationError,
	createErrorResponse,
	createSuccessResponse,
	UnauthorizedError,
	ValidationError,
} from '@lib/errors'
import {
	cleanExpiredSessions,
	createDeviceFingerprint,
	generateSecureSessionId,
	generateSecureToken,
	SESSION_DURATION_MS,
	SESSION_DURATION_SECONDS,
	validateSession,
} from '@lib/session'
import type { APIRoute } from 'astro'
import { AdminSessions, db, eq } from 'astro:db'

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
		const { action, secretKey } = body

		// Clean expired sessions on each request
		await cleanExpiredSessions()

		switch (action) {
			case 'login': {
				// Validate credentials using environment variable
				const validSecretKey =
					process.env.API_SECRET_KEY || import.meta.env.API_SECRET_KEY
				console.log({
					secretKey,
					validSecretKey,
					processEnv: process.env.API_SECRET_KEY,
					importMeta: import.meta.env.API_SECRET_KEY,
				})
				if (secretKey !== validSecretKey) {
					throw new UnauthorizedError('Invalid credentials')
				}

				// Get client information
				const clientInfo = createDeviceFingerprint(request)

				// Generate session with cryptographically secure tokens
				const sessionId = generateSecureSessionId()
				const token = generateSecureToken()
				const now = new Date()
				const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS)

				// Store session in database
				await db.insert(AdminSessions).values({
					id: sessionId,
					token,
					deviceFingerprint: clientInfo.deviceFingerprint,
					userAgent: clientInfo.userAgent,
					ip: clientInfo.ip,
					createdAt: now,
					expiresAt,
					lastActivity: now,
				})

				// Set secure cookies
				cookies.set('admin_session', sessionId, {
					httpOnly: true,
					secure: process.env.NODE_ENV === 'production',
					sameSite: 'strict',
					maxAge: SESSION_DURATION_SECONDS,
					path: '/',
				})

				cookies.set('admin_token', token, {
					httpOnly: true,
					secure: process.env.NODE_ENV === 'production',
					sameSite: 'strict',
					maxAge: SESSION_DURATION_SECONDS,
					path: '/',
				})

				return createSuccessResponse({
					message: 'Login successful',
					sessionId,
					expiresAt: expiresAt.toISOString(),
				})
			}

			case 'logout': {
				const sessionId = cookies.get('admin_session')?.value

				if (sessionId) {
					// Remove session from database
					await db.delete(AdminSessions).where(eq(AdminSessions.id, sessionId))
				}

				// Clear cookies
				cookies.delete('admin_session', { path: '/' })
				cookies.delete('admin_token', { path: '/' })

				return createSuccessResponse({ message: 'Logout successful' })
			}

			case 'validate': {
				// Use centralized session validation
				const sessionInfo = await validateSession(cookies)

				if (!sessionInfo) {
					throw new UnauthorizedError('No valid session found')
				}

				// Additional device fingerprint validation
				const clientInfo = createDeviceFingerprint(request)
				if (sessionInfo.deviceFingerprint !== clientInfo.deviceFingerprint) {
					// Suspicious activity - invalidate session
					await db
						.delete(AdminSessions)
						.where(eq(AdminSessions.id, sessionInfo.sessionId))
					cookies.delete('admin_session', { path: '/' })
					cookies.delete('admin_token', { path: '/' })
					throw new UnauthorizedError(
						'Device mismatch detected. Please login again.',
					)
				}

				return createSuccessResponse({
					message: 'Session valid',
					sessionId: sessionInfo.sessionId,
					expiresAt: sessionInfo.expiresAt,
				})
			}

			default:
				throw new ValidationError('Invalid action')
		}
	} catch (error) {
		console.error('Auth API error:', error)
		return createErrorResponse(error)
	}
}

export const GET: APIRoute = async ({ cookies }) => {
	try {
		// Clean expired sessions
		await cleanExpiredSessions()

		// Use centralized session validation
		const sessionInfo = await validateSession(cookies)

		if (!sessionInfo) {
			return createSuccessResponse({
				authenticated: false,
				message: 'No valid session found',
			})
		}

		return createSuccessResponse({
			authenticated: true,
			sessionId: sessionInfo.sessionId,
			expiresAt: sessionInfo.expiresAt,
		})
	} catch (error) {
		console.error('Auth status check error:', error)
		return createErrorResponse(error)
	}
}
