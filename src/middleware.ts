import { requireClientAccess, requireClientSession } from '@lib/clientSession'
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

	// 🔒 CLIENT PORTAL — FILE BROWSER
	// Protect /client/* except the public login and set-password pages
	const clientPublicPaths = [
		'/client/login',
		'/client/set-password',
		'/client/forgot-password',
	]
	if (
		pathname.startsWith('/client/') &&
		!clientPublicPaths.includes(pathname)
	) {
		try {
			const session = await requireClientSession(cookies, request)
			if (!session) {
				return redirect('/client/login', 302)
			}
		} catch (error) {
			console.error('[middleware] Client auth check failed:', error)
			return redirect('/client/login', 302)
		}
	}

	// 🔒 CLIENT PORTAL — CUSTOM PAGES
	// Protect /clients/[slug]/* — verify the session's slug matches the URL slug
	if (pathname.startsWith('/clients/')) {
		const slugMatch = pathname.match(/^\/clients\/([^/]+)/)
		if (slugMatch) {
			const urlSlug = slugMatch[1]
			try {
				const session = await requireClientAccess(cookies, request, urlSlug)
				if (!session) {
					// Logged in as a different client → redirect to their own space
					const currentSession = await requireClientSession(cookies, request)
					if (currentSession) {
						return redirect('/client/', 302)
					}
					return redirect('/client/login', 302)
				}
			} catch (error) {
				console.error('[middleware] Client access check failed:', error)
				return redirect('/client/login', 302)
			}
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
		"default-src 'self'; script-src 'self' 'unsafe-inline' data: https://va.vercel-scripts.com https://vercel.live; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:; frame-src https://vercel.live; frame-ancestors 'none'; upgrade-insecure-requests;",
	)
	response.headers.set(
		'Permissions-Policy',
		'camera=(), microphone=(), geolocation=(), interest-cohort=()',
	)

	return response
})
