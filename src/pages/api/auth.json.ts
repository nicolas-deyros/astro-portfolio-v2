import type { APIRoute } from 'astro'
import { AdminSessions, db, eq, lt } from 'astro:db'

export const prerender = false

function generateToken(): string {
	return crypto.randomUUID() + '-' + Date.now().toString(36)
}

function generateSessionId(): string {
	return crypto.randomUUID()
}

// Get client info for device tracking
function getClientInfo(request: Request): {
	userAgent: string
	ip: string
	deviceFingerprint: string
} {
	const userAgent = request.headers.get('user-agent') || 'unknown'
	const ip =
		request.headers.get('x-forwarded-for') ||
		request.headers.get('x-real-ip') ||
		'unknown'

	// Create a simple device fingerprint
	const deviceFingerprint = btoa(userAgent + ip).slice(0, 16)

	return { userAgent, ip, deviceFingerprint }
}

// Clean expired sessions periodically
async function cleanExpiredSessions(): Promise<void> {
	try {
		const now = new Date()
		await db.delete(AdminSessions).where(lt(AdminSessions.expiresAt, now))
	} catch (error) {
		console.error('Error cleaning expired sessions:', error)
	}
}

export const POST: APIRoute = async ({ request, cookies }) => {
	try {
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
				const clientInfo = getClientInfo(request)

				// Generate session
				const sessionId = generateSessionId()
				const token = generateToken()
				const now = new Date()
				const expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000) // 2 hours

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
					maxAge: 2 * 60 * 60, // 2 hours
					path: '/',
				})

				cookies.set('admin_token', token, {
					httpOnly: true,
					secure: process.env.NODE_ENV === 'production',
					sameSite: 'strict',
					maxAge: 2 * 60 * 60, // 2 hours
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
				const sessionId = cookies.get('admin_session')?.value
				const token = cookies.get('admin_token')?.value

				if (!sessionId || !token) {
					return new Response(
						JSON.stringify({
							success: false,
							message: 'No session found',
						}),
						{
							status: 401,
							headers: { 'Content-Type': 'application/json' },
						},
					)
				}

				// Get client information for validation
				const clientInfo = getClientInfo(request)

				// Check session in database
				const session = await db
					.select()
					.from(AdminSessions)
					.where(eq(AdminSessions.id, sessionId))
					.get()

				if (!session) {
					// Clear invalid cookies
					cookies.delete('admin_session', { path: '/' })
					cookies.delete('admin_token', { path: '/' })

					return new Response(
						JSON.stringify({
							success: false,
							message: 'Session not found',
						}),
						{
							status: 401,
							headers: { 'Content-Type': 'application/json' },
						},
					)
				}

				// Check if session is expired
				if (new Date() > new Date(session.expiresAt)) {
					// Clean up expired session
					await db.delete(AdminSessions).where(eq(AdminSessions.id, sessionId))
					cookies.delete('admin_session', { path: '/' })
					cookies.delete('admin_token', { path: '/' })

					return new Response(
						JSON.stringify({
							success: false,
							message: 'Session expired',
						}),
						{
							status: 401,
							headers: { 'Content-Type': 'application/json' },
						},
					)
				}

				// Validate token
				if (session.token !== token) {
					return new Response(
						JSON.stringify({
							success: false,
							message: 'Invalid token',
						}),
						{
							status: 401,
							headers: { 'Content-Type': 'application/json' },
						},
					)
				}

				// Validate device fingerprint for security
				if (session.deviceFingerprint !== clientInfo.deviceFingerprint) {
					// Potentially suspicious activity - invalidate session
					await db.delete(AdminSessions).where(eq(AdminSessions.id, sessionId))
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

				// Update last activity
				await db
					.update(AdminSessions)
					.set({ lastActivity: new Date() })
					.where(eq(AdminSessions.id, sessionId))

				return new Response(
					JSON.stringify({
						success: true,
						message: 'Session valid',
						sessionId,
						expiresAt: session.expiresAt,
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

		const sessionId = cookies.get('admin_session')?.value
		const token = cookies.get('admin_token')?.value

		if (!sessionId || !token) {
			return new Response(
				JSON.stringify({
					success: false,
					authenticated: false,
					message: 'No session found',
				}),
				{
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				},
			)
		}

		// Check session in database
		const session = await db
			.select()
			.from(AdminSessions)
			.where(eq(AdminSessions.id, sessionId))
			.get()

		if (
			!session ||
			new Date() > new Date(session.expiresAt) ||
			session.token !== token
		) {
			// Clean up invalid session
			if (session) {
				await db.delete(AdminSessions).where(eq(AdminSessions.id, sessionId))
			}
			cookies.delete('admin_session', { path: '/' })
			cookies.delete('admin_token', { path: '/' })

			return new Response(
				JSON.stringify({
					success: true,
					authenticated: false,
					message: 'Session invalid or expired',
				}),
				{
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				},
			)
		}

		// Update last activity
		await db
			.update(AdminSessions)
			.set({ lastActivity: new Date() })
			.where(eq(AdminSessions.id, sessionId))

		return new Response(
			JSON.stringify({
				success: true,
				authenticated: true,
				sessionId,
				expiresAt: session.expiresAt,
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
