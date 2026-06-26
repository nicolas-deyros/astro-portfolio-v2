import { hashPassword } from '@lib/clientAuth'
import { deleteAllClientFiles } from '@lib/clientFiles'
import { issueSetupLink, SETUP_TOKEN_TTL_DAYS } from '@lib/clientOnboarding'
import { db } from '@lib/db'
import { sendClientWelcomeEmail } from '@lib/email'
import {
	ApplicationError,
	createErrorResponse,
	createSuccessResponse,
	UnauthorizedError,
	ValidationError,
} from '@lib/errors'
import { requireAuthentication } from '@lib/session'
import type { APIRoute } from 'astro'
import { eq } from 'drizzle-orm'

import { clients, clientSessions } from '@/db/schema'

export const prerender = false

async function assertAdmin(cookies: Parameters<APIRoute>[0]['cookies'], request: Request) {
	const ok = await requireAuthentication(cookies, request)
	if (!ok) throw new UnauthorizedError('Admin authentication required')
}

function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
}

export const GET: APIRoute = async ({ cookies, request }) => {
	try {
		await assertAdmin(cookies, request)
		const all = await db
			.select({
				id: clients.id,
				slug: clients.slug,
				name: clients.name,
				email: clients.email,
				isActive: clients.isActive,
				createdAt: clients.createdAt,
			})
			.from(clients)
			.orderBy(clients.name)
		return createSuccessResponse({ clients: all })
	} catch (error) {
		return createErrorResponse(error)
	}
}

export const POST: APIRoute = async ({ request, cookies }) => {
	try {
		await assertAdmin(cookies, request)

		const contentType = request.headers.get('content-type') ?? ''
		if (!contentType.includes('application/json')) {
			throw new ApplicationError('Content-Type must be application/json', 415, 'UNSUPPORTED_MEDIA_TYPE')
		}

		const { name, email, slug: rawSlug } = await request.json()
		if (!name || !email) {
			throw new ValidationError('name and email are required')
		}

		const slug = rawSlug ? slugify(rawSlug) : slugify(name)

		// No password is set here — the client sets their own via a one-time
		// link. passwordHash stays empty (login is impossible until they do).
		const [inserted] = await db
			.insert(clients)
			.values({
				slug,
				name,
				email: email.toLowerCase().trim(),
				passwordHash: '',
				isActive: 1,
				createdAt: new Date().toISOString(),
			})
			.returning({
				id: clients.id,
				slug: clients.slug,
				name: clients.name,
				email: clients.email,
				isActive: clients.isActive,
				createdAt: clients.createdAt,
			})

		const setupUrl = await issueSetupLink(
			inserted.id,
			new URL(request.url).origin,
		)

		// Email the client a one-time link to set their password.
		// Non-fatal: the client exists even if the email fails; the setupUrl is
		// returned to the trusted admin so they can share it manually (and so
		// the flow is testable locally without a working mailer).
		let emailSent = false
		try {
			await sendClientWelcomeEmail({
				name,
				email: inserted.email,
				setupUrl,
				expiresInDays: SETUP_TOKEN_TTL_DAYS,
			})
			emailSent = true
		} catch (emailError) {
			console.error('[admin-clients] welcome email failed:', emailError)
		}

		return createSuccessResponse({ client: inserted, emailSent, setupUrl })
	} catch (error) {
		console.error('[admin-clients] POST error:', error)
		return createErrorResponse(error)
	}
}

export const PUT: APIRoute = async ({ request, cookies }) => {
	try {
		await assertAdmin(cookies, request)

		const contentType = request.headers.get('content-type') ?? ''
		if (!contentType.includes('application/json')) {
			throw new ApplicationError('Content-Type must be application/json', 415, 'UNSUPPORTED_MEDIA_TYPE')
		}

		const { id, name, email, password, isActive, regenerateSetupToken } =
			await request.json()
		if (!id) throw new ValidationError('id is required')

		// Admin "resend invite": issue a fresh setup link and email it. Returns
		// the URL so the admin can also share it manually.
		if (regenerateSetupToken) {
			const [client] = await db
				.select({ id: clients.id, name: clients.name, email: clients.email })
				.from(clients)
				.where(eq(clients.id, id))
				.limit(1)
			if (!client) throw new ValidationError('Client not found')

			const setupUrl = await issueSetupLink(
				client.id,
				new URL(request.url).origin,
			)
			let emailSent = false
			try {
				await sendClientWelcomeEmail({
					name: client.name,
					email: client.email,
					setupUrl,
					expiresInDays: SETUP_TOKEN_TTL_DAYS,
				})
				emailSent = true
			} catch (emailError) {
				console.error('[admin-clients] resend invite email failed:', emailError)
			}
			return createSuccessResponse({ emailSent, setupUrl })
		}

		const updates: Record<string, unknown> = {}
		if (name !== undefined) updates.name = name
		if (email !== undefined) updates.email = email.toLowerCase().trim()
		if (typeof isActive === 'number') updates.isActive = isActive
		if (password) updates.passwordHash = await hashPassword(password)

		if (Object.keys(updates).length === 0) {
			throw new ValidationError('No fields to update')
		}

		const [updated] = await db
			.update(clients)
			.set(updates)
			.where(eq(clients.id, id))
			.returning({
				id: clients.id,
				slug: clients.slug,
				name: clients.name,
				email: clients.email,
				isActive: clients.isActive,
				createdAt: clients.createdAt,
			})

		return createSuccessResponse({ client: updated })
	} catch (error) {
		console.error('[admin-clients] PUT error:', error)
		return createErrorResponse(error)
	}
}

// Hard delete: removes the client's Blob files, sessions, and row. Irreversible.
export const DELETE: APIRoute = async ({ request, cookies, url }) => {
	try {
		await assertAdmin(cookies, request)

		const idParam = url.searchParams.get('id')
		if (!idParam) throw new ValidationError('id is required')
		const id = parseInt(idParam, 10)
		if (isNaN(id)) throw new ValidationError('Invalid id')

		const [client] = await db
			.select({ id: clients.id })
			.from(clients)
			.where(eq(clients.id, id))
			.limit(1)
		if (!client) throw new ValidationError('Client not found')

		// Order matters: files (rows + blobs) and sessions reference the client.
		await deleteAllClientFiles(id)
		await db.delete(clientSessions).where(eq(clientSessions.clientId, id))
		await db.delete(clients).where(eq(clients.id, id))

		return createSuccessResponse({ deleted: id })
	} catch (error) {
		console.error('[admin-clients] DELETE error:', error)
		return createErrorResponse(error)
	}
}
