import { blobAuth } from '@lib/blob'
import { requireClientSession } from '@lib/clientSession'
import { db } from '@lib/db'
import {
	createErrorResponse,
	createSuccessResponse,
	UnauthorizedError,
	ValidationError,
} from '@lib/errors'
import { head, issueSignedToken, presignUrl } from '@vercel/blob'
import type { APIRoute } from 'astro'
import { and, eq } from 'drizzle-orm'

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

		// The store is private, so the blob URL isn't directly accessible.
		// Issue a short-lived (1h) presigned GET URL scoped to this one file.
		const auth = blobAuth()

		const { pathname } = await head(node.blobKey, auth)

		const signedToken = await issueSignedToken({
			...auth,
			pathname,
			operations: ['get'],
			validUntil: Date.now() + 60 * 60 * 1000,
		})
		const { presignedUrl } = await presignUrl(signedToken, {
			operation: 'get',
			pathname,
			access: 'private',
		})

		return createSuccessResponse({ url: presignedUrl, name: node.name })
	} catch (error) {
		console.error('[client-files] error:', error)
		return createErrorResponse(error)
	}
}
