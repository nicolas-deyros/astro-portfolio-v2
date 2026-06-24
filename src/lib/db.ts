import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'

import * as schema from '@/db/schema'

// For Vercel serverless use an https:// URL (not libsql://) to force HTTP transport.
// Example: TURSO_DATABASE_URL=https://<db>-<org>.turso.io
const client = createClient({
	url: import.meta.env.TURSO_DATABASE_URL ?? 'file:local.db',
	authToken: import.meta.env.TURSO_AUTH_TOKEN,
})

export const db = drizzle(client, { schema })

// Auto-create tables for local development when TURSO_DATABASE_URL is not set.
// Uses CREATE TABLE IF NOT EXISTS so it is safe to run on every startup.
// In production (Vercel), TURSO_DATABASE_URL is always set so this block is skipped.
if (!import.meta.env.TURSO_DATABASE_URL) {
	await client.execute(
		`CREATE TABLE IF NOT EXISTS FormSubmissions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			fullName TEXT NOT NULL,
			email TEXT NOT NULL,
			message TEXT,
			resendMessageId TEXT NOT NULL
		)`,
	)
	await client.execute(
		`CREATE TABLE IF NOT EXISTS Links (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL,
			url TEXT NOT NULL,
			tags TEXT NOT NULL,
			date TEXT NOT NULL
		)`,
	)
	await client.execute(
		`CREATE TABLE IF NOT EXISTS AdminSessions (
			id TEXT PRIMARY KEY,
			token TEXT NOT NULL UNIQUE,
			deviceFingerprint TEXT NOT NULL,
			userAgent TEXT NOT NULL,
			ip TEXT NOT NULL,
			createdAt TEXT NOT NULL,
			expiresAt TEXT NOT NULL,
			lastActivity TEXT NOT NULL
		)`,
	)
	await client.execute(
		`CREATE TABLE IF NOT EXISTS Clients (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			slug TEXT NOT NULL UNIQUE,
			name TEXT NOT NULL,
			email TEXT NOT NULL UNIQUE,
			passwordHash TEXT NOT NULL,
			isActive INTEGER NOT NULL DEFAULT 1,
			createdAt TEXT NOT NULL
		)`,
	)
	await client.execute(
		`CREATE TABLE IF NOT EXISTS ClientSessions (
			id TEXT PRIMARY KEY,
			clientId INTEGER NOT NULL REFERENCES Clients(id),
			token TEXT NOT NULL UNIQUE,
			deviceFingerprint TEXT NOT NULL,
			userAgent TEXT NOT NULL,
			ip TEXT NOT NULL,
			createdAt TEXT NOT NULL,
			expiresAt TEXT NOT NULL,
			lastActivity TEXT NOT NULL
		)`,
	)
	await client.execute(
		`CREATE TABLE IF NOT EXISTS ClientNodes (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			clientId INTEGER NOT NULL REFERENCES Clients(id),
			parentId INTEGER,
			name TEXT NOT NULL,
			type TEXT NOT NULL,
			blobKey TEXT,
			mimeType TEXT,
			size INTEGER,
			pageSlug TEXT,
			createdAt TEXT NOT NULL
		)`,
	)
	// Seed a few links if the table is empty (dev/test convenience)
	const existing = await client.execute('SELECT COUNT(*) as count FROM Links')
	if ((existing.rows[0]?.count as number) === 0) {
		await client.execute(
			`INSERT INTO Links (title, url, tags, date) VALUES
			('Astro 7 Released', 'https://astro.build/blog/astro-7/', 'Astro, Web', '2026-06-22'),
			('Tailwind CSS 4.3', 'https://tailwindcss.com', 'CSS, Web', '2026-05-08'),
			('Drizzle ORM Docs', 'https://orm.drizzle.team', 'Database, ORM', '2026-01-01')`,
		)
	}
}

