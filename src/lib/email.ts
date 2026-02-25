import { render } from '@react-email/components'
import { Resend } from 'resend'

import { ContactEmail } from '@/components/Emails/ContactEmail'
import { siteConfig } from '@/config/site.config'

const resend = new Resend(import.meta.env.RESEND_API_KEY)

interface SendContactEmailParams {
	name: string
	email: string
	message?: string
}

export async function sendContactEmails({
	name,
	email,
	message,
}: SendContactEmailParams) {
	if (!import.meta.env.RESEND_API_KEY) {
		throw new Error('RESEND_API_KEY is missing')
	}

	const fromEmail = import.meta.env.FROM_EMAIL || siteConfig.author.email
	const adminEmail = import.meta.env.ADMIN_EMAIL || siteConfig.author.email

	// Render React template to HTML
	const emailHtml = await render(ContactEmail({ name, message }))

	// 1. Send confirmation to user
	const userEmailPromise = resend.emails.send({
		from: fromEmail,
		to: email,
		subject: `${siteConfig.email.subjectPrefix} ${name}`,
		html: emailHtml,
	})

	// 2. Send notification to admin
	const adminEmailPromise =
		adminEmail && adminEmail !== email
			? resend.emails.send({
					from: fromEmail,
					to: adminEmail,
					replyTo: email,
					subject: `New Portfolio Message from ${name}`,
					text: `Name: ${name}\nEmail: ${email}\nMessage: ${message || 'No message'}`,
				})
			: Promise.resolve(null)

	const [userResult] = await Promise.all([userEmailPromise, adminEmailPromise])
	return userResult
}
