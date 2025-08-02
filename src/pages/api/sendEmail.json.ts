import type { APIRoute } from 'astro'
import { db, FormSubmissions } from 'astro:db'
import { Resend } from 'resend'

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

		const { recipientEmail, senderName, html, subject, text, message, name } =
			body

		// Get email addresses from environment variables
		const fromEmail = import.meta.env.FROM_EMAIL || 'contact@ndeyros.dev'
		const adminEmail = import.meta.env.ADMIN_EMAIL || 'contact@ndeyros.dev'

		console.log('Email config:', { fromEmail, adminEmail, recipientEmail }) // Debug log

		// Validate required fields
		if (!recipientEmail || !html || !subject || !text) {
			return new Response(
				JSON.stringify({
					success: false,
					message:
						'Missing required fields: recipientEmail, html, subject, text',
				}),
				{
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				},
			)
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!emailRegex.test(recipientEmail)) {
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

		// Send email to user (confirmation)
		const userEmailData: {
			from: string
			to: string
			subject: string
			html: string
			text: string
			replyTo?: string
		} = {
			from: fromEmail,
			to: recipientEmail,
			subject,
			html,
			text,
		}

		const emailResult = await resend.emails.send(userEmailData)

		// Also send notification to admin
		const adminNotificationHtml = `
			<h2>New Contact Form Submission</h2>
			<p><strong>From:</strong> ${name || senderName}</p>
			<p><strong>Email:</strong> ${recipientEmail}</p>
			<p><strong>Message:</strong></p>
			<div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
				${message ? message.replace(/\n/g, '<br>') : 'No message provided'}
			</div>
			<p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
		`

		const adminEmailData = {
			from: fromEmail,
			to: adminEmail,
			subject: `New Contact Form: ${name || senderName}`,
			html: adminNotificationHtml,
			text: `New contact form submission from ${name || senderName} (${recipientEmail}): ${message || 'No message'}`,
			replyTo: recipientEmail,
		}

		// Send admin notification (don't fail if this fails)
		if (adminEmail && adminEmail !== recipientEmail) {
			try {
				console.log('Sending admin notification to:', adminEmail) // Debug log
				const adminEmailResult = await resend.emails.send(adminEmailData)
				console.log('Admin email result:', adminEmailResult) // Debug log
			} catch (adminEmailError) {
				console.error('Failed to send admin notification:', adminEmailError)
			}
		} else {
			console.log(
				'Skipping admin notification - same as recipient or not configured',
			)
		}

		if (emailResult.error) {
			console.error('Resend error:', emailResult.error)

			// Check for specific Resend error types
			let errorMessage = 'Failed to send email: ' + emailResult.error.message

			// Handle common Resend restrictions
			if (emailResult.error.message.includes('not allowed to send')) {
				errorMessage =
					'Email delivery is restricted. The recipient email may not be verified for testing, or domain verification is required.'
			} else if (emailResult.error.message.includes('domain')) {
				errorMessage =
					'Domain verification required. Please verify your sending domain in Resend dashboard.'
			} else if (
				emailResult.error.message.includes('quota') ||
				emailResult.error.message.includes('limit')
			) {
				errorMessage =
					'Email sending limit reached. Please check your Resend account limits.'
			}

			return new Response(
				JSON.stringify({
					success: false,
					message: errorMessage,
					resendError: emailResult.error, // Include original error for debugging
				}),
				{
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				},
			)
		}

		// Save to database
		try {
			await db.insert(FormSubmissions).values({
				fullName: name || senderName || 'Unknown',
				email: recipientEmail,
				message: message || null,
			})
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
