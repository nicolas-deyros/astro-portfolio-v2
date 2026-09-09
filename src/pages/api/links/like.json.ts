import { db } from '@lib/db'
import {
	ApplicationError,
	createErrorResponse,
	createSuccessResponse,
	ValidationError,
} from '@lib/errors'
import type { APIRoute } from 'astro'
import { eq, sql } from 'drizzle-orm'

import { links as linksTable } from '@/db/schema'

export const prerender = false

// Public, unauthenticated endpoint: anyone can like a link. Abuse resistance
// is client-side only (localStorage gate in LinkCard.astro) — a script could
// inflate a count, but there's no real incentive to on a portfolio site.
// ponytail: no per-visitor dedup table; add one (LinkLikes(ipHash, linkId))
// if counts ever need to be trustworthy (e.g. a leaderboard).
export const POST: APIRoute = async ({ request }) => {
	try {
		const contentType = request.headers.get('content-type') ?? ''
		if (!contentType.includes('application/json')) {
			throw new ApplicationError(
				'Content-Type must be application/json',
				415,
				'UNSUPPORTED_MEDIA_TYPE',
			)
		}

		const { id } = await request.json()
		const linkId = typeof id === 'string' ? parseInt(id) : id

		if (!linkId || isNaN(linkId)) {
			throw new ValidationError('A valid link id is required')
		}

		const [updated] = await db
			.update(linksTable)
			.set({ likes: sql`${linksTable.likes} + 1` })
			.where(eq(linksTable.id, linkId))
			.returning({ likes: linksTable.likes })

		if (!updated) {
			throw new ValidationError('Link not found')
		}

		return createSuccessResponse({ likes: updated.likes })
	} catch (error) {
		console.error('Error liking link:', error)
		return createErrorResponse(error)
	}
}
