import { blobAuth } from '@lib/blob'
import { db } from '@lib/db'
import {
	ApplicationError,
	createErrorResponse,
	createSuccessResponse,
	UnauthorizedError,
	ValidationError,
} from '@lib/errors'
import { validateSession } from '@lib/session'
import { put } from '@vercel/blob'
import type { APIRoute, AstroCookies } from 'astro'
import { eq } from 'drizzle-orm'

import { links as linksTable } from '@/db/schema'

// Centralized authentication check using the new session utility
async function verifyAuth(cookies: AstroCookies): Promise<boolean> {
	const sessionInfo = await validateSession(cookies)
	return sessionInfo !== null
}

async function uploadLinkImage(file: File): Promise<string> {
	const blobKey = `links/${Date.now()}-${file.name}`
	const blob = await put(blobKey, file, {
		access: 'public',
		...blobAuth(),
		addRandomSuffix: true,
	})
	return blob.url
}

export const GET: APIRoute = async ({ cookies }) => {
	try {
		if (!(await verifyAuth(cookies))) {
			throw new UnauthorizedError('Unauthorized access denied')
		}

		const links = await db.select().from(linksTable)
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

		let title: string, url: string, tags: string, date: string
		let description: string | null = null
		let image: string | null = null

		if (contentType.includes('multipart/form-data')) {
			const form = await request.formData()
			title = form.get('title') as string
			url = form.get('url') as string
			tags = (form.get('tags') as string) ?? ''
			date = form.get('date') as string
			description = (form.get('description') as string) || null
			const file = form.get('image') as File | null
			if (file && file.size > 0) {
				image = await uploadLinkImage(file)
			}
		} else if (contentType.includes('application/json')) {
			const body = await request.json()
			;({ title, url, tags, date, description = null, image = null } = body)
		} else {
			throw new ApplicationError(
				'Content-Type must be application/json or multipart/form-data',
				415,
				'UNSUPPORTED_MEDIA_TYPE',
			)
		}

		if (!title || !url || !date) {
			throw new ValidationError('Title, URL, and date are required')
		}

		const [result] = await db
			.insert(linksTable)
			.values({
				title,
				url,
				tags: tags || '',
				date,
				description,
				image,
			})
			.returning({ id: linksTable.id })

		return createSuccessResponse({ id: result.id }, 201)
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

		let id: string | number,
			title: string,
			url: string,
			tags: string,
			date: string
		let description: string | null = null
		let image: string | null | undefined = undefined

		if (contentType.includes('multipart/form-data')) {
			const form = await request.formData()
			id = form.get('id') as string
			title = form.get('title') as string
			url = form.get('url') as string
			tags = (form.get('tags') as string) ?? ''
			date = form.get('date') as string
			description = (form.get('description') as string) || null
			const removeImage = form.get('removeImage') === 'true'
			const file = form.get('image') as File | null
			if (file && file.size > 0) {
				image = await uploadLinkImage(file)
			} else if (removeImage) {
				image = null
			}
		} else if (contentType.includes('application/json')) {
			const body = await request.json()
			;({ id, title, url, tags, date, description = null, image } = body)
		} else {
			throw new ApplicationError(
				'Content-Type must be application/json or multipart/form-data',
				415,
				'UNSUPPORTED_MEDIA_TYPE',
			)
		}

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

		const updateValues: Partial<typeof linksTable.$inferInsert> = {
			title,
			url,
			tags: tags || '',
			date,
			description,
		}
		// Only touch `image` when the caller actually supplied one (new upload,
		// explicit null from removeImage, or an explicit value in the JSON body).
		if (image !== undefined) {
			updateValues.image = image
		}

		await db.update(linksTable).set(updateValues).where(eq(linksTable.id, linkId))

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

		if (!idParam) {
			console.error('Missing ID parameter in DELETE request')
			throw new ValidationError('ID is required')
		}

		const linkId = parseInt(idParam)
		if (isNaN(linkId)) {
			console.error('Invalid ID format:', idParam)
			throw new ValidationError('Invalid ID format')
		}

		await db.delete(linksTable).where(eq(linksTable.id, linkId))

		return createSuccessResponse({
			message: 'Link deleted successfully',
			deletedId: linkId,
		})
	} catch (error) {
		console.error('Error deleting link:', error)
		return createErrorResponse(error)
	}
}
