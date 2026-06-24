import { db } from '@lib/db'
import { requireAuthentication } from '@lib/session'
import {
	ApplicationError,
	createErrorResponse,
	createSuccessResponse,
	UnauthorizedError,
	ValidationError,
} from '@lib/errors'
import type { APIRoute } from 'astro'
import { and, eq } from 'drizzle-orm'
import { del, put } from '@vercel/blob'

import { clientNodes } from '@/db/schema'

export const prerender = false

async function assertAdmin(cookies: Parameters<APIRoute>[0]['cookies'], request: Request) {
	const ok = await requireAuthentication(cookies, request)
	if (!ok) throw new UnauthorizedError('Admin authentication required')
}

export const POST: APIRoute = async ({ request, cookies }) => {
	try {
		await assertAdmin(cookies, request)

		const contentType = request.headers.get('content-type') ?? ''

		// Multipart: file upload
		if (contentType.includes('multipart/form-data')) {
			const form = await request.formData()
			const file = form.get('file') as File | null
			const clientIdStr = form.get('clientId') as string | null
			const parentIdStr = form.get('parentId') as string | null
			const name = (form.get('name') as string | null) ?? file?.name ?? 'file'

			if (!file || !clientIdStr) {
				throw new ValidationError('file and clientId are required')
			}

			const clientId = parseInt(clientIdStr, 10)
			const parentId = parentIdStr ? parseInt(parentIdStr, 10) : null

			if (isNaN(clientId)) throw new ValidationError('Invalid clientId')

			const blobKey = `clients/${clientId}/${Date.now()}-${file.name}`
			const blob = await put(blobKey, file, {
				access: 'public',
				token: import.meta.env.BLOB_READ_WRITE_TOKEN,
				oidcToken: import.meta.env.VERCEL_OIDC_TOKEN,
				storeId: import.meta.env.BLOB_STORE_ID,
				addRandomSuffix: false,
			})
				.insert(clientNodes)
				.values({
					clientId,
					parentId,
					name,
					type: 'file',
					blobKey: blob.url,
					mimeType: file.type || null,
					size: file.size,
					pageSlug: null,
					createdAt: new Date().toISOString(),
				})
				.returning()

			return createSuccessResponse({ node: inserted })
		}

		// JSON: create folder or page reference
		if (!contentType.includes('application/json')) {
			throw new ApplicationError('Unsupported Content-Type', 415, 'UNSUPPORTED_MEDIA_TYPE')
		}

		const body = await request.json()
		const { type, name, clientId, parentId, pageSlug } = body

		if (!type || !name || !clientId) {
			throw new ValidationError('type, name, and clientId are required')
		}

		if (type !== 'folder' && type !== 'page') {
			throw new ValidationError('type must be folder or page')
		}

		if (type === 'page' && !pageSlug) {
			throw new ValidationError('pageSlug is required for page nodes')
		}

		const [inserted] = await db
			.insert(clientNodes)
			.values({
				clientId: parseInt(clientId, 10),
				parentId: parentId ? parseInt(parentId, 10) : null,
				name,
				type,
				blobKey: null,
				mimeType: null,
				size: null,
				pageSlug: type === 'page' ? pageSlug : null,
				createdAt: new Date().toISOString(),
			})
			.returning()

		return createSuccessResponse({ node: inserted })
	} catch (error) {
		console.error('[admin-client-files] POST error:', error)
		return createErrorResponse(error)
	}
}

export const DELETE: APIRoute = async ({ request, cookies, url }) => {
	try {
		await assertAdmin(cookies, request)

		const nodeIdParam = url.searchParams.get('nodeId')
		if (!nodeIdParam) throw new ValidationError('nodeId is required')

		const nodeId = parseInt(nodeIdParam, 10)
		if (isNaN(nodeId)) throw new ValidationError('Invalid nodeId')

		await deleteNodeRecursive(nodeId)

		return createSuccessResponse({ deleted: nodeId })
	} catch (error) {
		console.error('[admin-client-files] DELETE error:', error)
		return createErrorResponse(error)
	}
}

async function deleteNodeRecursive(nodeId: number): Promise<void> {
	const [node] = await db
		.select()
		.from(clientNodes)
		.where(eq(clientNodes.id, nodeId))
		.limit(1)

	if (!node) return

	if (node.type === 'folder') {
		const children = await db
			.select({ id: clientNodes.id })
			.from(clientNodes)
			.where(eq(clientNodes.parentId, nodeId))

		for (const child of children) {
			await deleteNodeRecursive(child.id)
		}
	}

	if (node.type === 'file' && node.blobKey) {
		await del(node.blobKey, {
			token: import.meta.env.BLOB_READ_WRITE_TOKEN,
			oidcToken: import.meta.env.VERCEL_OIDC_TOKEN,
			storeId: import.meta.env.BLOB_STORE_ID,
		})
	}

	await db.delete(clientNodes).where(eq(clientNodes.id, nodeId))
}
