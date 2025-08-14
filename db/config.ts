import { column, defineDb, defineTable } from 'astro:db'

const FormSubmissions = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		fullName: column.text(),
		email: column.text(),
		message: column.text({ optional: true }),
		resendMessageId: column.text(),
	},
})

const Links = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		title: column.text(),
		url: column.text(),
		tags: column.text(),
		date: column.text(),
	},
})

const AdminSessions = defineTable({
	columns: {
		id: column.text({ primaryKey: true }), // session ID
		token: column.text({ unique: true }),
		deviceFingerprint: column.text(),
		userAgent: column.text(),
		ip: column.text(),
		createdAt: column.date(),
		expiresAt: column.date(),
		lastActivity: column.date(),
	},
})

// https://astro.build/db/config
export default defineDb({
	tables: { FormSubmissions, Links, AdminSessions },
})
