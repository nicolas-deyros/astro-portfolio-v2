import { validateSession } from '@lib/session'
import type { APIRoute, AstroCookies } from 'astro'
import { db, Links } from 'astro:db'

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
