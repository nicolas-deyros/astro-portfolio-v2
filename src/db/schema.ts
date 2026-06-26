import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const formSubmissions = sqliteTable('FormSubmissions', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	fullName: text('fullName').notNull(),
	email: text('email').notNull(),
	message: text('message'),
	resendMessageId: text('resendMessageId').notNull(),
})

export const links = sqliteTable('Links', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	title: text('title').notNull(),
	url: text('url').notNull(),
	tags: text('tags').notNull(),
	date: text('date').notNull(),
})

// Astro DB stored column.date() as ISO 8601 text strings in LibSQL.
// These columns must stay as text to match existing production data.
export const adminSessions = sqliteTable('AdminSessions', {
	id: text('id').primaryKey(),
	token: text('token').notNull().unique(),
	deviceFingerprint: text('deviceFingerprint').notNull(),
	userAgent: text('userAgent').notNull(),
	ip: text('ip').notNull(),
	createdAt: text('createdAt').notNull(),
	expiresAt: text('expiresAt').notNull(),
	lastActivity: text('lastActivity').notNull(),
})

// --- Client Portal ---

export const clients = sqliteTable('Clients', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	slug: text('slug').notNull().unique(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	// Empty until the client sets their own password via the setup link.
	passwordHash: text('passwordHash').notNull(),
	isActive: integer('isActive').notNull().default(1),
	createdAt: text('createdAt').notNull(),
	// One-time, single-use onboarding token (SHA-256 hash of the emailed token).
	// Cleared once the client sets a password. Null for clients onboarded before
	// this flow or who have already set a password.
	setupTokenHash: text('setupTokenHash'),
	setupTokenExpiresAt: text('setupTokenExpiresAt'),
})

export const clientSessions = sqliteTable('ClientSessions', {
	id: text('id').primaryKey(),
	clientId: integer('clientId')
		.notNull()
		.references(() => clients.id),
	token: text('token').notNull().unique(),
	deviceFingerprint: text('deviceFingerprint').notNull(),
	userAgent: text('userAgent').notNull(),
	ip: text('ip').notNull(),
	createdAt: text('createdAt').notNull(),
	expiresAt: text('expiresAt').notNull(),
	lastActivity: text('lastActivity').notNull(),
})

// type: 'folder' | 'file' | 'page'
// - file nodes: blobKey holds the Vercel Blob key; mimeType and size are set
// - page nodes: pageSlug holds the Astro route slug (e.g. 'guia-apis'); blobKey is null
// - folder nodes: blobKey, pageSlug, mimeType, size are all null
export const clientNodes = sqliteTable('ClientNodes', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	clientId: integer('clientId')
		.notNull()
		.references(() => clients.id),
	parentId: integer('parentId'),
	name: text('name').notNull(),
	type: text('type').notNull(),
	blobKey: text('blobKey'),
	mimeType: text('mimeType'),
	size: integer('size'),
	pageSlug: text('pageSlug'),
	createdAt: text('createdAt').notNull(),
})
