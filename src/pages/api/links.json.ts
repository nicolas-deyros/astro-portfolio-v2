import { validateSession } from '@lib/session'
import type { APIRoute, AstroCookies } from 'astro'
import { db, eq, Links } from 'astro:db'

// Centralized authentication check using the new session utility
async function verifyAuth(cookies: AstroCookies): Promise<boolean> {
	const sessionInfo = await validateSession(cookies)
	return sessionInfo !== null
}

export const GET: APIRoute = async ({ cookies }) => {
	// 🔒 CRITICAL: Protect GET endpoint - no public access to admin data
	if (!(await verifyAuth(cookies))) {
		return new Response(
			JSON.stringify({
				success: false,
				message: 'Unauthorized access denied',
			}),
			{
				status: 401,
				headers: { 'Content-Type': 'application/json' },
			},
		)
	}
	try {
		const links = await db.select().from(Links)
		return new Response(JSON.stringify(links), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
			},
		})
	} catch (error) {
		console.error('Error fetching links:', error)
		return new Response(JSON.stringify({ error: 'Failed to fetch links' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json',
			},
		})
	}
}

export const POST: APIRoute = async ({ request, cookies }) => {
	// 🔒 Server-side authentication check
	const isAuthenticated = await verifyAuth(cookies)
	if (!isAuthenticated) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: {
				'Content-Type': 'application/json',
			},
		})
	}

	try {
		const { title, url, tags, date } = await request.json()

		if (!title || !url || !date) {
			return new Response(
				JSON.stringify({ error: 'Title, URL, and date are required' }),
				{
					status: 400,
					headers: {
						'Content-Type': 'application/json',
					},
				},
			)
		}

		const result = await db.insert(Links).values({
			title,
			url,
			tags: tags || '',
			date,
		})

		return new Response(
			JSON.stringify({ success: true, id: Number(result.lastInsertRowid) }),
			{
				status: 201,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		)
	} catch (error) {
		console.error('Error creating link:', error)
		return new Response(JSON.stringify({ error: 'Failed to create link' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json',
			},
		})
	}
}

export const PUT: APIRoute = async ({ request, cookies }) => {
	// 🔒 Server-side authentication check
	const isAuthenticated = await verifyAuth(cookies)
	if (!isAuthenticated) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: {
				'Content-Type': 'application/json',
			},
		})
	}

	try {
		const body = await request.json()
		const { id, title, url, tags, date } = body

		console.log('PUT request received:', { id, title, url, tags, date })

		if (!id || !title || !url || !date) {
			console.error('Missing required fields:', {
				id: !!id,
				title: !!title,
				url: !!url,
				date: !!date,
			})
			return new Response(
				JSON.stringify({ error: 'ID, title, URL, and date are required' }),
				{
					status: 400,
					headers: {
						'Content-Type': 'application/json',
					},
				},
			)
		}

		// Convert id to number if it's a string
		const linkId = typeof id === 'string' ? parseInt(id) : id

		const result = await db
			.update(Links)
			.set({
				title,
				url,
				tags: tags || '',
				date,
			})
			.where(eq(Links.id, linkId))

		console.log('Update result:', result)

		return new Response(
			JSON.stringify({ success: true, message: 'Link updated successfully' }),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		)
	} catch (error) {
		console.error('Error updating link:', error)
		return new Response(
			JSON.stringify({
				error: 'Failed to update link',
				details: error instanceof Error ? error.message : 'Unknown error',
			}),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		)
	}
}

export const DELETE: APIRoute = async ({ request, cookies }) => {
	// 🔒 Server-side authentication check
	const isAuthenticated = await verifyAuth(cookies)
	if (!isAuthenticated) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: {
				'Content-Type': 'application/json',
			},
		})
	}

	try {
		const url = new URL(request.url)
		const idParam = url.searchParams.get('id')

		console.log('DELETE request received for ID:', idParam)

		if (!idParam) {
			console.error('Missing ID parameter in DELETE request')
			return new Response(JSON.stringify({ error: 'ID is required' }), {
				status: 400,
				headers: {
					'Content-Type': 'application/json',
				},
			})
		}

		const linkId = parseInt(idParam)
		if (isNaN(linkId)) {
			console.error('Invalid ID format:', idParam)
			return new Response(JSON.stringify({ error: 'Invalid ID format' }), {
				status: 400,
				headers: {
					'Content-Type': 'application/json',
				},
			})
		}

		const result = await db.delete(Links).where(eq(Links.id, linkId))

		console.log('Delete result:', result)

		return new Response(
			JSON.stringify({
				success: true,
				message: 'Link deleted successfully',
				deletedId: linkId,
			}),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		)
	} catch (error) {
		console.error('Error deleting link:', error)
		return new Response(
			JSON.stringify({
				error: 'Failed to delete link',
				details: error instanceof Error ? error.message : 'Unknown error',
			}),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		)
	}
}
