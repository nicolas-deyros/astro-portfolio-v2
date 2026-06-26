import { db } from '@lib/db'
import { del } from '@vercel/blob'
import { and, eq } from 'drizzle-orm'

import { clientNodes } from '@/db/schema'

function blobOptions() {
	return {
		token: import.meta.env.BLOB_READ_WRITE_TOKEN,
		oidcToken: import.meta.env.VERCEL_OIDC_TOKEN,
		storeId: import.meta.env.BLOB_STORE_ID,
	}
}

// Best-effort blob deletion: a storage failure must not orphan DB rows, so we
// log and continue rather than throw.
async function deleteBlob(blobKey: string): Promise<void> {
	try {
		await del(blobKey, blobOptions())
	} catch (error) {
		console.error('[clientFiles] blob delete failed:', blobKey, error)
	}
}

/**
 * Delete a single node and, for folders, everything beneath it — removing the
 * backing Vercel Blob files along the way. Used for partial subtree deletes.
 */
export async function deleteNodeRecursive(nodeId: number): Promise<void> {
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
		await deleteBlob(node.blobKey)
	}

	await db.delete(clientNodes).where(eq(clientNodes.id, nodeId))
}

/**
 * Delete every node belonging to a client and all their Blob files. Used when
 * hard-deleting a client. Blobs are removed best-effort, then all rows in one
 * query (no recursion needed when wiping the whole tree).
 */
export async function deleteAllClientFiles(clientId: number): Promise<void> {
	const fileNodes = await db
		.select({ blobKey: clientNodes.blobKey })
		.from(clientNodes)
		.where(and(eq(clientNodes.clientId, clientId), eq(clientNodes.type, 'file')))

	for (const { blobKey } of fileNodes) {
		if (blobKey) await deleteBlob(blobKey)
	}

	await db.delete(clientNodes).where(eq(clientNodes.clientId, clientId))
}
