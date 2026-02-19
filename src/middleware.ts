import { requireAuthentication } from '@lib/session'
import { defineMiddleware } from 'astro:middleware'

export const onRequest = defineMiddleware(async (context, next) => {
	const { url, cookies, request, redirect } = context
	const pathname = new URL(url).pathname

	// 🔒 ADMIN AUTHENTICATION CHECK
	// Protect all /admin/* routes except /admin/login
	if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
		try {
			const isAuthenticated = await requireAuthentication(cookies, request)
			if (!isAuthenticated) {
				return redirect('/admin/login', 302)
			}
		} catch (error) {
			console.error('[middleware] Auth check failed:', error)
			return redirect('/admin/login', 302)
		}
	}

	const response = await next()

	// Security Headers
	response.headers.set('X-Content-Type-Options', 'nosniff')
	response.headers.set('X-Frame-Options', 'DENY')
	response.headers.set('X-XSS-Protection', '1; mode=block')
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
	response.headers.set(
		'Strict-Transport-Security',
		'max-age=31536000; includeSubDomains; preload',
	)
	response.headers.set(
		'Content-Security-Policy',
		"default-src 'self'; script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'none'; upgrade-insecure-requests;",
	)
	response.headers.set(
		'Permissions-Policy',
		'camera=(), microphone=(), geolocation=(), interest-cohort=()',
	)

	return response
})
