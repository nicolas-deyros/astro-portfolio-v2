import type { APIRoute } from 'astro'

export const prerender = true

const getRobotsTxt = (sitemapURL: URL): string => `\
User-agent: *
Allow: /

Sitemap: ${sitemapURL.href}
`

export const GET: APIRoute = ({ site }) => {
	const sitemapURL = new URL('sitemap-index.xml', site)
	return new Response(getRobotsTxt(sitemapURL))
}
