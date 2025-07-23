import { defineDb, defineTable, column } from 'astro:db'

const FormSubmissions = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		fullName: column.text(),
		email: column.text(),
		message: column.text({ optional: true }),
	},
})

// https://astro.build/db/config
export default defineDb({
	tables: { FormSubmissions },
})
