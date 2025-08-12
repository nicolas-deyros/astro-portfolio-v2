import { defineAction } from 'astro:actions'
import { db, FormSubmissions } from 'astro:db'
import { z } from 'astro:schema'

// Import link actions
import { server as linkActions } from './links'

export const server = {
	addSubmission: defineAction({
		accepts: 'form',
		input: z.object({
			fullName: z.string(),
			email: z.string().email(),
			message: z.string().optional(),
		}),
		handler: async ({ fullName, email, message }) => {
			await db.insert(FormSubmissions).values({ fullName, email, message })
			return {
				success: true,
				message: 'Form submitted successfully!',
			}
		},
	}),

	// Link management actions
	...linkActions,
}
