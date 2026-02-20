import { validateSession } from '@lib/session'
import {
	ApplicationError,
	createErrorResponse,
	createSuccessResponse,
	UnauthorizedError,
	ValidationError,
} from '@lib/errors'
import type { APIRoute, AstroCookies } from 'astro'
import { db, eq, Links } from 'astro:db'

// Centralized authentication check using the new session utility
async function verifyAuth(cookies: AstroCookies): Promise<boolean> {
	const sessionInfo = await validateSession(cookies)
	return sessionInfo !== null
}

export const GET: APIRoute = async ({ cookies }) => {
	try {
		if (!(await verifyAuth(cookies))) {
			throw new UnauthorizedError('Unauthorized access denied')
		}

		const links = await db.select().from(Links)
		// Array can't be merged simply with { success: true }, so we wrap it
		return createSuccessResponse({ data: links })
	} catch (error) {
		console.error('Error fetching links:', error)
		return createErrorResponse(error)
	}
}

export const POST: APIRoute = async ({ request, cookies }) => {
	try {
		if (!(await verifyAuth(cookies))) {
			throw new UnauthorizedError('Unauthorized access denied')
		}

		const contentType = request.headers.get('content-type') ?? ''
		if (!contentType.includes('application/json')) {
			throw new ApplicationError('Content-Type must be application/json', 415, 'UNSUPPORTED_MEDIA_TYPE')
		}

		const { title, url, tags, date } = await request.json()

		if (!title || !url || !date) {
			throw new ValidationError('Title, URL, and date are required')
		}

		const result = await db.insert(Links).values({
			title,
			url,
			tags: tags || '',
			date,
		})

		return createSuccessResponse({ id: Number(result.lastInsertRowid) }, 201)
	} catch (error) {
		console.error('Error creating link:', error)
		return createErrorResponse(error)
	}
}

export const PUT: APIRoute = async ({ request, cookies }) => {
	try {
		if (!(await verifyAuth(cookies))) {
			throw new UnauthorizedError('Unauthorized access denied')
		}

		const contentType = request.headers.get('content-type') ?? ''
		if (!contentType.includes('application/json')) {
			throw new ApplicationError('Content-Type must be application/json', 415, 'UNSUPPORTED_MEDIA_TYPE')
		}

		const body = await request.json()
		const { id, title, url, tags, date } = body

		if (!id || !title || !url || !date) {
			console.error('Missing required fields:', {
				id: !!id,
				title: !!title,
				url: !!url,
				date: !!date,
			})
			throw new ValidationError('ID, title, URL, and date are required')
		}

		const linkId = typeof id === 'string' ? parseInt(id) : id

		await db
			.update(Links)
			.set({
				title,
				url,
				tags: tags || '',
				date,
			})
			.where(eq(Links.id, linkId))

		return createSuccessResponse({ message: 'Link updated successfully' })
	} catch (error) {
		console.error('Error updating link:', error)
		return createErrorResponse(error)
	}
}

export const DELETE: APIRoute = async ({ request, cookies }) => {
	try {
		if (!(await verifyAuth(cookies))) {
			throw new UnauthorizedError('Unauthorized access denied')
		}

		const url = new URL(request.url)
		const idParam = url.searchParams.get('id')

		console.log('DELETE request received for ID:', idParam)

		if (!idParam) {
			console.error('Missing ID parameter in DELETE request')
			throw new ValidationError('ID is required')
		}

		const linkId = parseInt(idParam)
		if (isNaN(linkId)) {
			console.error('Invalid ID format:', idParam)
			throw new ValidationError('Invalid ID format')
		}

		await db.delete(Links).where(eq(Links.id, linkId))

		console.log(`Link ID ${linkId} deleted successfully`)

		return createSuccessResponse({
			message: 'Link deleted successfully',
			deletedId: linkId,
		})
	} catch (error) {
		console.error('Error deleting link:', error)
		return createErrorResponse(error)
	}
}
