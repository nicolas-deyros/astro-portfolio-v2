import type { APIRoute } from 'astro'
import { AdminSessions, and, db, eq, gt, Links } from 'astro:db'

// Verify authentication by checking session cookie
async function verifyAuth(request: Request): Promise<boolean> {
	const cookies = request.headers.get('cookie')
	if (!cookies) return false

	const tokenCookie = cookies
		.split(';')
		.find(c => c.trim().startsWith('admin_token='))
	if (!tokenCookie) return false

	const sessionToken = tokenCookie.split('=')[1]
	if (!sessionToken) return false

	try {
		const session = await db
			.select()
			.from(AdminSessions)
			.where(
				// Check if session exists, is not expired, and within 2 hours
				and(
					eq(AdminSessions.token, sessionToken),
					gt(AdminSessions.expiresAt, new Date()),
				),
			)
			.get()

		if (!session) return false

		// Update last activity
		await db
			.update(AdminSessions)
			.set({ lastActivity: new Date() })
			.where(eq(AdminSessions.token, sessionToken))

		return true
	} catch (error) {
		console.error('Auth verification error:', error)
		return false
	}
}

export const GET: APIRoute = async () => {
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

export const POST: APIRoute = async ({ request }) => {
	// Verify authentication
	const isAuthenticated = await verifyAuth(request)
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

export const PUT: APIRoute = async ({ request }) => {
	// Verify authentication
	const isAuthenticated = await verifyAuth(request)
	if (!isAuthenticated) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: {
				'Content-Type': 'application/json',
			},
		})
	}

	try {
		const { id, title, url, tags, date } = await request.json()

		if (!id || !title || !url || !date) {
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

		await db
			.update(Links)
			.set({
				title,
				url,
				tags: tags || '',
				date,
			})
			.where(eq(Links.id, id))

		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
			},
		})
	} catch (error) {
		console.error('Error updating link:', error)
		return new Response(JSON.stringify({ error: 'Failed to update link' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json',
			},
		})
	}
}

export const DELETE: APIRoute = async ({ request }) => {
	// Verify authentication
	const isAuthenticated = await verifyAuth(request)
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
		const id = url.searchParams.get('id')

		if (!id) {
			return new Response(JSON.stringify({ error: 'ID is required' }), {
				status: 400,
				headers: {
					'Content-Type': 'application/json',
				},
			})
		}

		await db.delete(Links).where(eq(Links.id, parseInt(id)))

		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
			},
		})
	} catch (error) {
		console.error('Error deleting link:', error)
		return new Response(JSON.stringify({ error: 'Failed to delete link' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json',
			},
		})
	}
}
