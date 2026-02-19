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
			return new Response(
				JSON.stringify({ success: false, message: 'Content-Type must be application/json' }),
				{ status: 415, headers: { 'Content-Type': 'application/json' } },
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
				if (secretKey !== validSecretKey) {
					return new Response(
						JSON.stringify({
							success: false,
							message: 'Invalid credentials',
						}),
						{
							status: 401,
							headers: { 'Content-Type': 'application/json' },
						},
					)
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

				return new Response(
					JSON.stringify({
						success: true,
						message: 'Login successful',
						sessionId,
						expiresAt: expiresAt.toISOString(),
					}),
					{
						status: 200,
						headers: { 'Content-Type': 'application/json' },
					},
				)
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

				return new Response(
					JSON.stringify({
						success: true,
						message: 'Logout successful',
					}),
					{
						status: 200,
						headers: { 'Content-Type': 'application/json' },
					},
				)
			}

			case 'validate': {
				// Use centralized session validation
				const sessionInfo = await validateSession(cookies)

				if (!sessionInfo) {
					return new Response(
						JSON.stringify({
							success: false,
							message: 'No valid session found',
						}),
						{
							status: 401,
							headers: { 'Content-Type': 'application/json' },
						},
					)
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

					return new Response(
						JSON.stringify({
							success: false,
							message: 'Device mismatch detected. Please login again.',
						}),
						{
							status: 401,
							headers: { 'Content-Type': 'application/json' },
						},
					)
				}

				return new Response(
					JSON.stringify({
						success: true,
						message: 'Session valid',
						sessionId: sessionInfo.sessionId,
						expiresAt: sessionInfo.expiresAt,
					}),
					{
						status: 200,
						headers: { 'Content-Type': 'application/json' },
					},
				)
			}

			default:
				return new Response(
					JSON.stringify({
						success: false,
						message: 'Invalid action',
					}),
					{
						status: 400,
						headers: { 'Content-Type': 'application/json' },
					},
				)
		}
	} catch (error) {
		console.error('Auth API error:', error)
		return new Response(
			JSON.stringify({
				success: false,
				message: 'Internal server error',
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			},
		)
	}
}

export const GET: APIRoute = async ({ cookies }) => {
	try {
		// Clean expired sessions
		await cleanExpiredSessions()

		// Use centralized session validation
		const sessionInfo = await validateSession(cookies)

		if (!sessionInfo) {
			return new Response(
				JSON.stringify({
					success: true,
					authenticated: false,
					message: 'No valid session found',
				}),
				{
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				},
			)
		}

		return new Response(
			JSON.stringify({
				success: true,
				authenticated: true,
				sessionId: sessionInfo.sessionId,
				expiresAt: sessionInfo.expiresAt,
			}),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			},
		)
	} catch (error) {
		console.error('Auth status check error:', error)
		return new Response(
			JSON.stringify({
				success: false,
				authenticated: false,
				message: 'Error checking authentication status',
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			},
		)
	}
}
