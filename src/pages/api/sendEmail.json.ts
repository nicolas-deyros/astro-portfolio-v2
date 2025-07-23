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

		const { to, name, from, html, subject, text } = body

		// Validate required fields
		if (!to || !from || !html || !subject || !text) {
			return new Response(
				JSON.stringify({
					success: false,
					message: 'Missing required fields: to, from, html, subject, text',
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

		// Send email
		const emailResult = await resend.emails.send({
			from,
			to,
			subject,
			html,
			text,
		})

		if (emailResult.error) {
			console.error('Resend error:', emailResult.error)
			return new Response(
				JSON.stringify({
					success: false,
					message: 'Failed to send email: ' + emailResult.error.message,
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
				fullName: name || 'Unknown',
				email: to,
				message: body.message || null,
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
