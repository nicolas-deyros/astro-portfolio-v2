import type { AstroCookies } from 'astro'
import { AdminSessions, db, eq, lt } from 'astro:db'

export interface SessionInfo {
	sessionId: string
	token: string
	expiresAt: Date
	deviceFingerprint: string
}

/**
 * Generate a cryptographically secure session token
 * Using Web Crypto API for better security than crypto.randomUUID()
 */
export function generateSecureToken(): string {
	// Generate 32 bytes of random data
	const array = new Uint8Array(32)
	crypto.getRandomValues(array)

	// Convert to base64url (URL-safe base64)
	const base64 = btoa(String.fromCharCode(...array))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '')

	// Add timestamp for uniqueness
	const timestamp = Date.now().toString(36)

	return `${base64}.${timestamp}`
}

/**
 * Generate a cryptographically secure session ID
 */
export function generateSecureSessionId(): string {
	const array = new Uint8Array(16)
	crypto.getRandomValues(array)

	return btoa(String.fromCharCode(...array))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '')
}

/**
 * Create device fingerprint from request headers
 */
export function createDeviceFingerprint(request: Request): {
	userAgent: string
	ip: string
	deviceFingerprint: string
} {
	const userAgent = request.headers.get('user-agent') || 'unknown'
	const ip =
		request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
		request.headers.get('x-real-ip') ||
		request.headers.get('cf-connecting-ip') || // Cloudflare
		'unknown'

	// Create a more robust device fingerprint
	const fingerprint = `${userAgent}|${ip}`
	const encoder = new TextEncoder()
	const data = encoder.encode(fingerprint)

	// Use a simple hash for device fingerprint
	let hash = 0
	for (let i = 0; i < data.length; i++) {
		hash = ((hash << 5) - hash + data[i]) & 0xffffffff
	}

	// Convert to base36 for shorter representation
	const deviceFingerprint = Math.abs(hash).toString(36)

	return { userAgent, ip, deviceFingerprint }
}

/**
 * Centralized session validation function
 * This replaces all duplicated authentication logic
 */
export async function validateSession(
	cookies: AstroCookies,
): Promise<SessionInfo | null> {
	const sessionId = cookies.get('admin_session')?.value
	const token = cookies.get('admin_token')?.value

	if (!sessionId || !token) {
		return null
	}

	try {
		// Get session from database
		const session = await db
			.select()
			.from(AdminSessions)
			.where(eq(AdminSessions.id, sessionId))
			.get()

		// Validate session exists, is not expired, and token matches
		if (
			!session ||
			new Date() > new Date(session.expiresAt) ||
			session.token !== token
		) {
			// Clean up invalid session
			if (session) {
				await db.delete(AdminSessions).where(eq(AdminSessions.id, sessionId))
			}

			// Clear invalid cookies
			cookies.delete('admin_session', { path: '/' })
			cookies.delete('admin_token', { path: '/' })

			return null
		}

		// Update last activity
		await db
			.update(AdminSessions)
			.set({ lastActivity: new Date() })
			.where(eq(AdminSessions.id, sessionId))

		return {
			sessionId: session.id,
			token: session.token,
			expiresAt: session.expiresAt,
			deviceFingerprint: session.deviceFingerprint,
		}
	} catch (error) {
		console.error('Session validation error:', error)
		return null
	}
}

/**
 * Validate device fingerprint against session
 */
export async function validateDeviceFingerprint(
	sessionInfo: SessionInfo,
	request: Request,
): Promise<boolean> {
	const currentDevice = createDeviceFingerprint(request)
	return sessionInfo.deviceFingerprint === currentDevice.deviceFingerprint
}

/**
 * Server-side authentication check for Astro pages
 * Returns true if authenticated, false if should redirect
 */
export async function requireAuthentication(
	cookies: AstroCookies,
	request: Request,
): Promise<boolean> {
	const sessionInfo = await validateSession(cookies)

	if (!sessionInfo) {
		return false
	}

	// Additional device fingerprint validation
	const isValidDevice = await validateDeviceFingerprint(sessionInfo, request)

	if (!isValidDevice) {
		// Suspicious activity - invalidate session
		await db
			.delete(AdminSessions)
			.where(eq(AdminSessions.id, sessionInfo.sessionId))
		cookies.delete('admin_session', { path: '/' })
		cookies.delete('admin_token', { path: '/' })
		return false
	}

	return true
}

/**
 * Clean expired sessions
 */
export async function cleanExpiredSessions(): Promise<void> {
	try {
		const now = new Date()
		await db.delete(AdminSessions).where(lt(AdminSessions.expiresAt, now))
	} catch (error) {
		console.error('Error cleaning expired sessions:', error)
	}
}
