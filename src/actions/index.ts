import { defineAction } from 'astro:actions'
import { db, FormSubmissions } from 'astro:db'
import { z } from 'astro:schema'

export const server = {
	addSubmission: defineAction({
		accepts: 'form',
		input: z.object({
			id: column.number({ primaryKey: true }),
			fullName: column.text(),
			email: column.text(),
			message: column.text({ optional: true }),
		}),
		handler: async ({ id, fullName, email, message }) => {
			const submission = await db
				.insert(FormSubmissions)
				.values({ id, fullName, email, message })
			return submission
		},
	}),
}
