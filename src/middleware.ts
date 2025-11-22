import { requireAuthentication } from '@lib/session'
import { defineMiddleware } from 'astro:middleware'

export const onRequest = defineMiddleware(async (context, next) => {
	const { url, cookies, request, redirect } = context
	const pathname = new URL(url).pathname

	// 🔒 ADMIN AUTHENTICATION CHECK
	// Protect all /admin/* routes except /admin/login
	if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
		const isAuthenticated = await requireAuthentication(cookies, request)

		if (!isAuthenticated) {
			// Redirect to login - no admin content sent to client
			return redirect('/admin/login', 302)
		}
	}

	const response = await next()

	// Security Headers
	response.headers.set('X-Content-Type-Options', 'nosniff')
	response.headers.set('X-Frame-Options', 'DENY')
	response.headers.set('X-XSS-Protection', '1; mode=block')
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

	return response
})
