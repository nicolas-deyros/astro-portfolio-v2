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
	setupUrl: string
	expiresInDays: number
}

// Emails a new client a one-time link to set their own password. No password
// is ever sent — the link carries a high-entropy token whose hash is stored.
// ponytail: inline HTML instead of a React Email template — one transactional
// email doesn't need a component.
export async function sendClientWelcomeEmail({
	name,
	email,
	setupUrl,
	expiresInDays,
}: SendClientWelcomeEmailParams) {
	if (!import.meta.env.RESEND_API_KEY) {
		throw new Error('RESEND_API_KEY is missing')
	}

	const resend = new Resend(import.meta.env.RESEND_API_KEY)
	const fromEmail = import.meta.env.FROM_EMAIL || siteConfig.author.email

	const html = `
	<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
		<h2 style="margin-bottom: 8px;">Welcome to your client portal, ${escapeHtml(name)}</h2>
		<p>${escapeHtml(siteConfig.author.name)} has created a portal account for you. Click below to set your password and access your files and documents.</p>
		<p style="margin: 24px 0;">
			<a href="${setupUrl}" style="display: inline-block; background: #2563eb; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 14px;">Set your password</a>
		</p>
		<p style="font-size: 13px; color: #555;">This link is for ${escapeHtml(email)} and expires in ${expiresInDays} days. If the button doesn't work, copy this URL into your browser:<br><a href="${setupUrl}">${setupUrl}</a></p>
		<p style="font-size: 13px; color: #555;">If you weren't expecting this, you can safely ignore this email.</p>
	</div>`

	return resend.emails.send({
		from: fromEmail,
		to: email,
		subject: `Set up your ${siteConfig.author.name} client portal access`,
		html,
	})
}
