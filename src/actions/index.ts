import { defineAction } from 'astro:actions'
import { db, FormSubmissions } from 'astro:db'
import { z } from 'astro:schema'
import { Resend } from 'resend'

import { siteConfig } from '@/config/site.config'

// Import link actions
import { server as linkActions } from './links'

const resend = new Resend(import.meta.env.RESEND_API_KEY)

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
			// 1. Validate environment
			if (!import.meta.env.RESEND_API_KEY) {
				console.error('RESEND_API_KEY is missing')
				return {
					success: false,
					message: 'Email service configuration error.',
				}
			}

			const fromEmail = import.meta.env.FROM_EMAIL || siteConfig.author.email
			const adminEmail = import.meta.env.ADMIN_EMAIL || siteConfig.author.email

			try {
				// 2. Send email to user (Confirmation)
				const emailResult = await resend.emails.send({
					from: fromEmail,
					to: email,
					subject: `${siteConfig.email.subjectPrefix} ${name}`,
					html: `
						<div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
							<h2 style="color: #2563eb;">Hello ${name}!</h2>
							<p>Thank you for reaching out through my portfolio.</p>
							<p>I've received your message and will get back to you as soon as possible.</p>
							
							<div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
								<p><strong>Your Message:</strong></p>
								<p style="font-style: italic;">${message || 'No message provided'}</p>
							</div>
							
							<p>Best regards,<br><strong>${siteConfig.author.name}</strong></p>
						</div>
					`,
				})

				// 3. Send notification to admin
				if (adminEmail && adminEmail !== email) {
					await resend.emails.send({
						from: fromEmail,
						to: adminEmail,
						replyTo: email,
						subject: `New Portfolio Message from ${name}`,
						text: `Name: ${name}\nEmail: ${email}\nMessage: ${message || 'No message'}`,
					})
				}

				// 4. Save to database
				await db.insert(FormSubmissions).values({
					fullName: name,
					email,
					message: message || '',
					resendMessageId: emailResult.data?.id || '',
				})

				return {
					success: true,
					message: 'Message sent successfully!',
				}
			} catch (error) {
				console.error('Action error:', error)
				return {
					success: false,
					message: 'Failed to send message. Please try again later.',
				}
			}
		},
	}),

	// Link management actions
	...linkActions,
}
