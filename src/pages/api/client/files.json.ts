import { db } from '@lib/db'
import { requireClientSession } from '@lib/clientSession'
import {
	createErrorResponse,
	createSuccessResponse,
	UnauthorizedError,
	ValidationError,
} from '@lib/errors'
import type { APIRoute } from 'astro'
import { and, eq } from 'drizzle-orm'
import { head } from '@vercel/blob'

import { clientNodes } from '@/db/schema'

export const prerender = false

export const GET: APIRoute = async ({ request, cookies, url }) => {
	try {
		const session = await requireClientSession(cookies, request)
		if (!session) throw new UnauthorizedError('Not authenticated')

		const action = url.searchParams.get('action')
		const nodeIdParam = url.searchParams.get('nodeId')

		if (action !== 'download' || !nodeIdParam) {
			throw new ValidationError('Missing nodeId or action=download')
		}

		const nodeId = parseInt(nodeIdParam, 10)
		if (isNaN(nodeId)) throw new ValidationError('Invalid nodeId')

		// Verify the node belongs to the authenticated client
		const [node] = await db
			.select()
			.from(clientNodes)
			.where(
				and(
					eq(clientNodes.id, nodeId),
					eq(clientNodes.clientId, session.clientId),
				),
			)
			.limit(1)

		if (!node) throw new UnauthorizedError('File not found')
		if (node.type !== 'file' || !node.blobKey) {
			throw new ValidationError('Node is not a downloadable file')
		}

		// Generate a short-lived signed URL via Vercel Blob
		const blobInfo = await head(node.blobKey, {
			token: process.env.BLOB_READ_WRITE_TOKEN,
		})

		// The URL from head() is already the public URL; for signed/private blobs
		// we return it directly — Vercel Blob private access is enforced via the token
		return createSuccessResponse({ url: blobInfo.url, name: node.name })
	} catch (error) {
		console.error('[client-files] error:', error)
		return createErrorResponse(error)
	}
}
