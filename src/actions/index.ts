import { defineAction } from 'astro:actions'
import { db, FormSubmissions } from 'astro:db'
import { z } from 'astro:schema'

import { sendContactEmails } from '@/lib/email'

import { server as linkActions } from './links'

export const server = {
	sendEmail: defineAction({
		accept: 'json',
		input: z.object({
			name: z.string().min(2, 'Name is too short').max(100, 'Name is too long'),
			email: z.string().email('Invalid email address'),
			message: z
				.string()
				.min(10, 'Message is too short')
				.max(2000, 'Message is too long')
				.optional(),
		}),
		handler: async ({ name, email, message }) => {
			try {
				const { data, error } = await sendContactEmails({
					name,
					email,
					message,
				})

				if (error) {
					throw error
				}

				await db.insert(FormSubmissions).values({
					fullName: name,
					email,
					message: message || '',
					resendMessageId: data?.id || '',
				})

				return {
					success: true,
					message: 'Message sent successfully!',
				}
			} catch (error) {
				console.error('Action error:', error)
				throw error instanceof Error ? error : new Error('Failed to send message', { cause: error })
			}
		},
	}),

	...linkActions,
}
