import type { AstroCookies } from 'astro'
import { AdminSessions, db, eq, lt } from 'astro:db'

export interface SessionInfo {
	sessionId: string
	token: string
	expiresAt: Date
	deviceFingerprint: string
}

/** Encode `byteCount` random bytes as a URL-safe base64 string (no padding). */
function randomBase64Url(byteCount: number): string {
	const array = new Uint8Array(byteCount)
	crypto.getRandomValues(array)
	return btoa(String.fromCharCode(...array))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '')
}

/**
 * Generate a cryptographically secure session token.
 * 32 random bytes + a base-36 timestamp suffix for uniqueness.
 */
export function generateSecureToken(): string {
	return `${randomBase64Url(32)}.${Date.now().toString(36)}`
}

/**
 * Generate a cryptographically secure session ID (16 random bytes).
 */
export function generateSecureSessionId(): string {
	return randomBase64Url(16)
}

/**
 * Create device fingerprint from request headers.
 */
export function createDeviceFingerprint(request: Request): {
	userAgent: string
	ip: string
	deviceFingerprint: string
} {
	const userAgent = request.headers.get('user-agent') ?? 'unknown'
	const ip =
		request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
		request.headers.get('x-real-ip') ??
		request.headers.get('cf-connecting-ip') ?? // Cloudflare
		'unknown'

	const fingerprint = `${userAgent}|${ip}`
	const data = new TextEncoder().encode(fingerprint)

	let hash = 0
	for (let i = 0; i < data.length; i++) {
		hash = ((hash << 5) - hash + data[i]) & 0xffffffff
	}

	return { userAgent, ip, deviceFingerprint: Math.abs(hash).toString(36) }
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
			if (session) {
				await db.delete(AdminSessions).where(eq(AdminSessions.id, sessionId))
			}

			cookies.delete('admin_session', { path: '/' })
			cookies.delete('admin_token', { path: '/' })

			return null
		}

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

	const isValidDevice = await validateDeviceFingerprint(sessionInfo, request)

	if (!isValidDevice) {
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
