import { hashPassword } from '@lib/clientAuth'
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

import { clients } from '@/db/schema'

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

		const { name, email, password, slug: rawSlug } = await request.json()
		if (!name || !email || !password) {
			throw new ValidationError('name, email, and password are required')
		}

		const slug = rawSlug ? slugify(rawSlug) : slugify(name)
		const passwordHash = await hashPassword(password)

		const [inserted] = await db
			.insert(clients)
			.values({
				slug,
				name,
				email: email.toLowerCase().trim(),
				passwordHash,
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

		// Email the client their portal URL + credentials.
		// Non-fatal: the client exists even if the email fails; surface the
		// outcome so the admin knows whether to share credentials manually.
		let emailSent = false
		try {
			const loginUrl = `${new URL(request.url).origin}/client/login`
			await sendClientWelcomeEmail({ name, email: inserted.email, password, loginUrl })
			emailSent = true
		} catch (emailError) {
			console.error('[admin-clients] welcome email failed:', emailError)
		}

		return createSuccessResponse({ client: inserted, emailSent })
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

		const { id, name, email, password, isActive } = await request.json()
		if (!id) throw new ValidationError('id is required')

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
