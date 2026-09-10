import { del } from '@vercel/blob'

// Vercel Blob credential resolution.
//
// The store is private, so every operation needs valid credentials. On Vercel
// the per-request `VERCEL_OIDC_TOKEN` is injected into `process.env` at
// runtime — but Astro resolves `import.meta.env` at *build* time, so reading
// the OIDC token from `import.meta.env` yields a stale/empty value and the API
// rejects it with "Access denied". Prefer `process.env` (runtime) and fall
// back to `import.meta.env` for local dev (.env.local).
function fromEnv(
	processValue: string | undefined,
	buildValue: string | undefined,
): string | undefined {
	return processValue ?? buildValue
}

export function blobAuth(): {
	token?: string
	oidcToken?: string
	storeId?: string
} {
	return {
		token: fromEnv(
			process.env.BLOB_READ_WRITE_TOKEN,
			import.meta.env.BLOB_READ_WRITE_TOKEN,
		),
		oidcToken: fromEnv(
			process.env.VERCEL_OIDC_TOKEN,
			import.meta.env.VERCEL_OIDC_TOKEN,
		),
		storeId: fromEnv(process.env.BLOB_STORE_ID, import.meta.env.BLOB_STORE_ID),
	}
}

// Link images are shown publicly (link cards, RSS), so they live in a
// separate *public* Blob store — Vercel doesn't allow mixing public and
// private access within a single store. Client files stay in the private
// store above.
export function blobAuthLinksImages(): {
	token?: string
	oidcToken?: string
	storeId?: string
} {
	return {
		token: fromEnv(
			process.env.BLOB_LINKS_IMAGES_READ_WRITE_TOKEN,
			import.meta.env.BLOB_LINKS_IMAGES_READ_WRITE_TOKEN,
		),
		oidcToken: fromEnv(
			process.env.VERCEL_OIDC_TOKEN,
			import.meta.env.VERCEL_OIDC_TOKEN,
		),
		storeId: fromEnv(
			process.env.BLOB_LINKS_IMAGES_STORE_ID,
			import.meta.env.BLOB_LINKS_IMAGES_STORE_ID,
		),
	}
}

// Best-effort delete for a link image blob: a storage failure must not block
// the DB update/delete that triggered it, so we log and continue.
export async function deleteLinkImageBlob(blobUrl: string): Promise<void> {
	try {
		await del(blobUrl, blobAuthLinksImages())
	} catch (error) {
		console.error('[blob] link image delete failed:', blobUrl, error)
	}
}
