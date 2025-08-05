import type { APIRoute } from 'astro'

export const prerender = false

// Simple in-memory session storage (in production, use Redis or database)
const sessions = new Map<string, { token: string; expiresAt: number }>()

function generateToken() {
	return crypto.randomUUID() + '-' + Date.now().toString(36)
}

function generateSessionId() {
	return crypto.randomUUID()
}

export const POST: APIRoute = async ({ request, cookies }) => {
	try {
		const contentType = request.headers.get('content-type')
		if (!contentType || !contentType.includes('application/json')) {
			return new Response(
				JSON.stringify({
					success: false,
					message: 'Content-Type must be application/json',
				}),
				{
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				},
			)
		}

		const body = await request.json()
		const { secretKey } = body

		// Check against environment variable - use API_SECRET_KEY for consistency
		const validKey =
			import.meta.env.API_SECRET_KEY || process.env.API_SECRET_KEY

		if (!validKey) {
			return new Response(
				JSON.stringify({
					success: false,
					message: 'Admin secret key not configured',
				}),
				{
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				},
			)
		}

		if (secretKey !== validKey) {
			return new Response(
				JSON.stringify({
					success: false,
					message: 'Invalid secret key',
				}),
				{
					status: 401,
					headers: { 'Content-Type': 'application/json' },
				},
			)
		}

		// Generate session token
		const token = generateToken()
		const expiresAt = Date.now() + 24 * 60 * 60 * 1000 // 24 hours
		const sessionId = generateSessionId()

		// Store session
		sessions.set(sessionId, { token, expiresAt })

		// Set secure cookie
		cookies.set('admin_session', sessionId, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: 24 * 60 * 60, // 24 hours
			path: '/',
		})

		return new Response(
			JSON.stringify({
				success: true,
				token,
				expiresAt,
				message: 'Login successful',
			}),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			},
		)
	} catch (error) {
		console.error('Auth error:', error)
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

// Utility function to verify token for other API endpoints
export function verifyAuthToken(request: Request): boolean {
	const authHeader = request.headers.get('authorization')
	if (!authHeader?.startsWith('Bearer ')) {
		return false
	}

	const token = authHeader.slice(7)

	// Check if token exists in any active session
	for (const [, session] of sessions) {
		if (session.token === token && session.expiresAt > Date.now()) {
			return true
		}
	}

	return false
}
