import type { APIRoute } from 'astro'
import { db, Links, eq } from 'astro:db'

// GET: Fetch all links
export const GET: APIRoute = async () => {
	const links = await db.select().from(Links)
	return new Response(JSON.stringify(links), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	})
}

// POST: Create a new link
export const POST: APIRoute = async ({ request }) => {
	const authHeader = request.headers.get('Authorization')
	if (authHeader !== `Bearer ${import.meta.env.API_SECRET_KEY}`) {
		return new Response(JSON.stringify({ message: 'Unauthorized' }), {
			status: 401,
		})
	}

	const { title, url, tags, date } = await request.json()

	if (!title || !url || !tags || !date) {
		return new Response(
			JSON.stringify({ message: 'Missing required fields' }),
			{ status: 400 },
		)
	}

	await db.insert(Links).values({ title, url, tags, date })
	return new Response(
		JSON.stringify({ message: 'Link created successfully' }),
		{ status: 201 },
	)
}

// PUT: Update an existing link
export const PUT: APIRoute = async ({ request }) => {
	const authHeader = request.headers.get('Authorization')
	if (authHeader !== `Bearer ${import.meta.env.API_SECRET_KEY}`) {
		return new Response(JSON.stringify({ message: 'Unauthorized' }), {
			status: 401,
		})
	}

	const { id, title, url, tags, date } = await request.json()

	if (!id) {
		return new Response(JSON.stringify({ message: 'Missing link ID' }), {
			status: 400,
		})
	}

	await db.update(Links).set({ title, url, tags, date }).where(eq(Links.id, id))
	return new Response(
		JSON.stringify({ message: 'Link updated successfully' }),
		{ status: 200 },
	)
}

// DELETE: Delete a link
export const DELETE: APIRoute = async ({ request }) => {
	const authHeader = request.headers.get('Authorization')
	if (authHeader !== `Bearer ${import.meta.env.API_SECRET_KEY}`) {
		return new Response(JSON.stringify({ message: 'Unauthorized' }), {
			status: 401,
		})
	}

	const { id } = await request.json()

	if (!id) {
		return new Response(JSON.stringify({ message: 'Missing link ID' }), {
			status: 400,
		})
	}

	await db.delete(Links).where(eq(Links.id, id))
	return new Response(
		JSON.stringify({ message: 'Link deleted successfully' }),
		{ status: 200 },
	)
}
