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
