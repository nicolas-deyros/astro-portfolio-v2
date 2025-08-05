import { column,defineDb, defineTable } from 'astro:db'

const FormSubmissions = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		fullName: column.text(),
		email: column.text(),
		message: column.text({ optional: true }),
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

// https://astro.build/db/config
export default defineDb({
	tables: { FormSubmissions, Links },
})
