import type { APIRoute } from 'astro'
import { db, FormSubmissions } from 'astro:db'
import { Resend } from 'resend'

import { siteConfig } from '@/config/site.config'

// Add this line to enable server-side rendering for this route
export const prerender = false

const resend = new Resend(import.meta.env.RESEND_API_KEY)

export const POST: APIRoute = async ({ request }) => {
	try {
		// Check if request has content
		const contentType = request.headers.get('content-type')
		if (!contentType || !contentType.includes('application/json')) {
			return new Response(
				JSON.stringify({
					success: false,
					message: 'Content-Type must be application/json',
				}),
				{
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				},
			)
		}

		// Parse JSON with error handling
		let body
		try {
			body = await request.json()
		} catch (jsonError) {
			console.error('JSON parsing error:', jsonError)
			return new Response(
				JSON.stringify({
					success: false,
					message: 'Invalid JSON in request body',
				}),
				{
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				},
			)
		}

		const { email, message, name } = body

		// Get email addresses from environment variables
		const fromEmail = import.meta.env.FROM_EMAIL || siteConfig.author.email
		const adminEmail = import.meta.env.ADMIN_EMAIL || siteConfig.author.email

		// Validate required fields
		if (!email || !name) {
			return new Response(
				JSON.stringify({
					success: false,
					message: 'Missing required fields: email, name',
				}),
				{
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				},
			)
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!emailRegex.test(email)) {
			return new Response(
				JSON.stringify({
					success: false,
					message: 'Invalid email address format',
				}),
				{
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				},
			)
		}

		// Check API key
		if (!import.meta.env.RESEND_API_KEY) {
			console.error('RESEND_API_KEY is not configured')
			return new Response(
				JSON.stringify({
					success: false,
					message: 'Email service is not configured',
				}),
				{
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				},
			)
		}

		// Helper to escape HTML characters
		const escapeHtml = (unsafe: string): string => {
			return unsafe
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#039;')
		}

		const safeName = escapeHtml(name)
		const safeMessage = message ? escapeHtml(message) : ''

		// Generate Email Content (Server-Side)
		const emailSubject = `${siteConfig.email.subjectPrefix} ${safeName}`
		const emailHtml = `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <title>${emailSubject}</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { color: #2563eb; margin-bottom: 20px; }
                        .details { background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0; }
                        .footer { margin-top: 30px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1 class="header">Hello ${safeName}!</h1>
                        <p>Thank you for reaching out through my portfolio contact form.</p>
                        <p>I've received your message and will get back to you as soon as possible.</p>
                        
                        <div class="details">
                            <h3>Your submission details:</h3>
                            <p><strong>Name:</strong> ${safeName}</p>
                            <p><strong>Email:</strong> ${email}</p>
                            <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
                        </div>
                        
                        <div class="footer">
                            <p>Best regards,<br><strong>${siteConfig.author.name}</strong></p>
                            <p><em>${siteConfig.author.roles[0]}</em></p>
                        </div>
                    </div>
                </body>
            </html>
        `
		const emailText = `
Hello ${name}!

Thank you for reaching out through my portfolio contact form.
I've received your message and will get back to you as soon as possible.

Your submission details:
Name: ${name}
Email: ${email}
Submitted: ${new Date().toLocaleString()}

Best regards,
${siteConfig.author.name}
${siteConfig.author.roles[0]}
        `.trim()

		// Send email to user (confirmation)
		const userEmailData = {
			from: fromEmail,
			to: email,
			subject: emailSubject,
			html: emailHtml,
			text: emailText,
		}

		const emailResult = await resend.emails.send(userEmailData)

		// Also send notification to admin
		const adminNotificationHtml = `
			<h2>New Contact Form Submission</h2>
			<p><strong>From:</strong> ${safeName}</p>
			<p><strong>Email:</strong> ${email}</p>
			<p><strong>Message:</strong></p>
			<div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
				${safeMessage ? safeMessage.replace(/\n/g, '<br>') : 'No message provided'}
			</div>
			<p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
		`

		const adminEmailData = {
			from: fromEmail,
			to: adminEmail,
			subject: `New Contact Form: ${safeName}`,
			html: adminNotificationHtml,
			text: `New contact form submission from ${name} (${email}): ${message || 'No message'}`,
			replyTo: email,
		}

		// Send admin notification (don't fail if this fails)
		if (adminEmail && adminEmail !== email) {
			try {
				await resend.emails.send(adminEmailData)
			} catch (adminEmailError) {
				console.error('Failed to send admin notification:', adminEmailError)
			}
		}

		if (emailResult.error) {
			console.error('Resend error:', emailResult.error)
			return new Response(
				JSON.stringify({
					success: false,
					message: 'Failed to send email',
				}),
				{
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				},
			)
		}

		// Save to database
		try {
			const dbValues: {
				fullName: string
				email: string
				resendMessageId: string
				message?: string
			} = {
				fullName: name,
				email: email,
				resendMessageId: emailResult.data?.id || '',
			}
			if (message) {
				dbValues.message = message
			}
			await db.insert(FormSubmissions).values(dbValues)
		} catch (dbError) {
			console.error('Database error:', dbError)
			// Email sent but DB save failed - still return success
			return new Response(
				JSON.stringify({
					success: true,
					message: 'Email sent successfully (database save failed)',
					emailId: emailResult.data?.id,
				}),
				{
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				},
			)
		}

		// Success response
		return new Response(
			JSON.stringify({
				success: true,
				message: 'Email sent and saved successfully',
				emailId: emailResult.data?.id,
			}),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			},
		)
	} catch (error) {
		console.error('Unexpected error in sendEmail API:', error)

		return new Response(
			JSON.stringify({
				success: false,
				message: 'Internal server error',
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			},
		)
	}
}
