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

interface ClientAccessEmailParams {
	email: string
	url: string
	expiresInDays: number
}

// Shared sender for the two transactional portal emails (welcome + reset).
// Both carry a one-time set-password link; only the copy differs. No password
// is ever sent — the link holds a high-entropy token whose hash is stored.
// ponytail: inline HTML instead of a React Email template — one link doesn't
// need a component. Caller bakes the client name into heading/intro.
async function sendClientAccessEmail(
	{ email, url, expiresInDays }: ClientAccessEmailParams,
	{ heading, intro, subject }: { heading: string; intro: string; subject: string },
) {
	if (!import.meta.env.RESEND_API_KEY) {
		throw new Error('RESEND_API_KEY is missing')
	}

	const resend = new Resend(import.meta.env.RESEND_API_KEY)
	const fromEmail = import.meta.env.FROM_EMAIL || siteConfig.author.email

	const html = `
	<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
		<h2 style="margin-bottom: 8px;">${escapeHtml(heading)}</h2>
		<p>${escapeHtml(intro)}</p>
		<p style="margin: 24px 0;">
			<a href="${url}" style="display: inline-block; background: #2563eb; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 14px;">Set your password</a>
		</p>
		<p style="font-size: 13px; color: #555;">This link is for ${escapeHtml(email)} and expires in ${expiresInDays} days. If the button doesn't work, copy this URL into your browser:<br><a href="${url}">${url}</a></p>
		<p style="font-size: 13px; color: #555;">If you weren't expecting this, you can safely ignore this email.</p>
	</div>`

	return resend.emails.send({ from: fromEmail, to: email, subject, html })
}

// New client onboarding — first-time password setup.
export async function sendClientWelcomeEmail({
	name,
	email,
	setupUrl,
	expiresInDays,
}: {
	name: string
	email: string
	setupUrl: string
	expiresInDays: number
}) {
	return sendClientAccessEmail(
		{ email, url: setupUrl, expiresInDays },
		{
			heading: `Welcome to your client portal, ${name}`,
			intro: `${siteConfig.author.name} has created a portal account for you. Click below to set your password and access your files and documents.`,
			subject: `Set up your ${siteConfig.author.name} client portal access`,
		},
	)
}

// Client-initiated password reset.
export async function sendClientPasswordResetEmail({
	name,
	email,
	resetUrl,
	expiresInDays,
}: {
	name: string
	email: string
	resetUrl: string
	expiresInDays: number
}) {
	return sendClientAccessEmail(
		{ email, url: resetUrl, expiresInDays },
		{
			heading: `Reset your client portal password`,
			intro: `Hi ${name}, we received a request to reset your portal password. Click below to choose a new one.`,
			subject: `Reset your ${siteConfig.author.name} client portal password`,
		},
	)
}
