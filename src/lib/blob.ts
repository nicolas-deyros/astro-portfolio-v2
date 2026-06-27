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
