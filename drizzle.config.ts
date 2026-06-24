import { defineConfig } from 'drizzle-kit'

// SAFETY: Never run `drizzle-kit push` against production.
// Production Turso DB already has data from Astro DB — pushing will alter or drop columns.
// Use `drizzle-kit generate` to create SQL migration files, review them, then apply manually.
const databaseUrl = process.env.TURSO_DATABASE_URL
if (!databaseUrl) throw new Error('TURSO_DATABASE_URL env var is required for drizzle-kit commands')

export default defineConfig({
	schema: './src/db/schema.ts',
	out: './drizzle',
	dialect: 'turso',
	dbCredentials: {
		url: databaseUrl,
		authToken: process.env.TURSO_AUTH_TOKEN,
	},
})
