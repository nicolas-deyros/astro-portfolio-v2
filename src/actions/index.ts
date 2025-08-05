import { defineAction } from 'astro:actions'
import { db, FormSubmissions, Links } from 'astro:db'
import { z } from 'astro:schema'

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

	addLinks: defineAction({
		accepts: 'form',
		input: z.object({
			title: z.string(),
			url: z.string().url(),
			tags: z.string(),
			date: z.string(),
		}),
		handler: async ({ title, url, tags, date }) => {
			await db.insert(Links).values({ title, url, tags, date })
			return {
				success: true,
				message: 'Link added successfully!',
			}
		},
	}),
}
