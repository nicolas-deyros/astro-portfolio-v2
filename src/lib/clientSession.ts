import { db } from '@lib/db'
import type { AstroCookies } from 'astro'
import { and, eq, lt } from 'drizzle-orm'

import { clients, clientSessions } from '@/db/schema'

export const CLIENT_SESSION_DURATION_MS = 2 * 60 * 60 * 1000 // 2 hours
export const CLIENT_SESSION_DURATION_SECONDS = 2 * 60 * 60

const TOKEN_BYTE_LENGTH = 32
const SESSION_ID_BYTE_LENGTH = 16

export interface ClientSessionInfo {
	sessionId: string
	clientId: number
	clientSlug: string
	token: string
	expiresAt: Date
	deviceFingerprint: string
}

function randomBase64Url(byteCount: number): string {
	const array = new Uint8Array(byteCount)
	crypto.getRandomValues(array)
	return btoa(String.fromCharCode(...array))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '')
}

function generateToken(): string {
	return `${randomBase64Url(TOKEN_BYTE_LENGTH)}.${Date.now().toString(36)}`
}

function generateSessionId(): string {
	return randomBase64Url(SESSION_ID_BYTE_LENGTH)
}

export function createDeviceFingerprint(request: Request): {
	userAgent: string
	ip: string
	deviceFingerprint: string
} {
	const userAgent = request.headers.get('user-agent') ?? 'unknown'
	const ip =
		request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
		request.headers.get('x-real-ip') ??
		request.headers.get('cf-connecting-ip') ??
		'unknown'

	const fingerprint = `${userAgent}|${ip}`
	const data = new TextEncoder().encode(fingerprint)
	let hash = 0
	for (let i = 0; i < data.length; i++) {
		hash = ((hash << 5) - hash + data[i]) & 0xffffffff
	}

	return { userAgent, ip, deviceFingerprint: Math.abs(hash).toString(36) }
}

export async function createClientSession(
	clientId: number,
	cookies: AstroCookies,
	request: Request,
): Promise<void> {
	const { userAgent, ip, deviceFingerprint } = createDeviceFingerprint(request)
	const sessionId = generateSessionId()
	const token = generateToken()
	const now = new Date()
	const expiresAt = new Date(now.getTime() + CLIENT_SESSION_DURATION_MS)

	await db.insert(clientSessions).values({
		id: sessionId,
		clientId,
		token,
		deviceFingerprint,
		userAgent,
		ip,
		createdAt: now.toISOString(),
		expiresAt: expiresAt.toISOString(),
		lastActivity: now.toISOString(),
	})

	const cookieOpts = {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'strict' as const,
		maxAge: CLIENT_SESSION_DURATION_SECONDS,
		path: '/',
	}

	cookies.set('client_session', sessionId, cookieOpts)
	cookies.set('client_token', token, cookieOpts)
}

export async function validateClientSession(
	cookies: AstroCookies,
): Promise<ClientSessionInfo | null> {
	const sessionId = cookies.get('client_session')?.value
	const token = cookies.get('client_token')?.value

	if (!sessionId || !token) return null

	try {
		const [row] = await db
			.select({
				session: clientSessions,
				clientSlug: clients.slug,
			})
			.from(clientSessions)
			.innerJoin(clients, eq(clientSessions.clientId, clients.id))
			.where(
				and(
					eq(clientSessions.id, sessionId),
					eq(clients.isActive, 1),
				),
			)
			.limit(1)

		if (
			!row ||
			new Date() > new Date(row.session.expiresAt) ||
			row.session.token !== token
		) {
			if (row) {
				await db
					.delete(clientSessions)
					.where(eq(clientSessions.id, sessionId))
			}
			cookies.delete('client_session', { path: '/' })
			cookies.delete('client_token', { path: '/' })
			return null
		}

		await db
			.update(clientSessions)
			.set({ lastActivity: new Date().toISOString() })
			.where(eq(clientSessions.id, sessionId))

		return {
			sessionId: row.session.id,
			clientId: row.session.clientId,
			clientSlug: row.clientSlug,
			token: row.session.token,
			expiresAt: new Date(row.session.expiresAt),
			deviceFingerprint: row.session.deviceFingerprint,
		}
	} catch (error) {
		console.error('[clientSession] validation error:', error)
		return null
	}
}

export async function destroyClientSession(
	cookies: AstroCookies,
): Promise<void> {
	const sessionId = cookies.get('client_session')?.value
	if (sessionId) {
		await db.delete(clientSessions).where(eq(clientSessions.id, sessionId))
	}
	cookies.delete('client_session', { path: '/' })
	cookies.delete('client_token', { path: '/' })
}

/**
 * Full auth chain: validates session + device fingerprint.
 * Returns ClientSessionInfo or null (caller should redirect to /client/login).
 */
export async function requireClientSession(
	cookies: AstroCookies,
	request: Request,
): Promise<ClientSessionInfo | null> {
	const info = await validateClientSession(cookies)
	if (!info) return null

	const { deviceFingerprint } = createDeviceFingerprint(request)
	if (info.deviceFingerprint !== deviceFingerprint) {
		await db
			.delete(clientSessions)
			.where(eq(clientSessions.id, info.sessionId))
		cookies.delete('client_session', { path: '/' })
		cookies.delete('client_token', { path: '/' })
		return null
	}

	return info
}

/**
 * Like requireClientSession but also verifies the session's clientSlug matches
 * the requested URL slug. Prevents client A from accessing client B's pages.
 */
export async function requireClientAccess(
	cookies: AstroCookies,
	request: Request,
	slug: string,
): Promise<ClientSessionInfo | null> {
	const info = await requireClientSession(cookies, request)
	if (!info) return null
	if (info.clientSlug !== slug) return null
	return info
}

export async function cleanExpiredClientSessions(): Promise<void> {
	try {
		await db
			.delete(clientSessions)
			.where(lt(clientSessions.expiresAt, new Date().toISOString()))
	} catch (error) {
		console.error('[clientSession] cleanup error:', error)
	}
}
