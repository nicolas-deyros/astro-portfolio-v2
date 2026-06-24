import { render } from '@react-email/components'
import type React from 'react'
import { Resend } from 'resend'

import { ContactEmail } from '@/components/Emails/ContactEmail'
import { siteConfig } from '@/config/site.config'

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

	const resend = new Resend(import.meta.env.RESEND_API_KEY)

	const fromEmail = import.meta.env.FROM_EMAIL || siteConfig.author.email
	const adminEmail = import.meta.env.ADMIN_EMAIL || siteConfig.author.email

	// Render React template to HTML
	const emailHtml = await render(
		ContactEmail({ name, message }) as React.ReactElement,
	)

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

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
}

interface SendClientWelcomeEmailParams {
	name: string
	email: string
	password: string
	loginUrl: string
}

// Sends a new client their portal URL and credentials.
// ponytail: inline HTML instead of a React Email template — one transactional
// email doesn't need a component. Switch to a set-password link if emailing
// plaintext passwords becomes a concern.
export async function sendClientWelcomeEmail({
	name,
	email,
	password,
	loginUrl,
}: SendClientWelcomeEmailParams) {
	if (!import.meta.env.RESEND_API_KEY) {
		throw new Error('RESEND_API_KEY is missing')
	}

	const resend = new Resend(import.meta.env.RESEND_API_KEY)
	const fromEmail = import.meta.env.FROM_EMAIL || siteConfig.author.email

	const html = `
	<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
		<h2 style="margin-bottom: 8px;">Welcome to your client portal, ${escapeHtml(name)}</h2>
		<p>${escapeHtml(siteConfig.author.name)} has created a portal account for you. Use the credentials below to sign in and access your files and documents.</p>
		<table style="margin: 16px 0; font-size: 14px; border-collapse: collapse;">
			<tr><td style="padding: 4px 16px 4px 0; color: #555;">Portal</td><td><a href="${loginUrl}">${loginUrl}</a></td></tr>
			<tr><td style="padding: 4px 16px 4px 0; color: #555;">Email</td><td>${escapeHtml(email)}</td></tr>
			<tr><td style="padding: 4px 16px 4px 0; color: #555;">Password</td><td><code>${escapeHtml(password)}</code></td></tr>
		</table>
		<p style="font-size: 13px; color: #555;">Please sign in and keep this email private. If you weren't expecting this, you can safely ignore it.</p>
	</div>`

	return resend.emails.send({
		from: fromEmail,
		to: email,
		subject: `Your ${siteConfig.author.name} client portal access`,
		html,
	})
}
