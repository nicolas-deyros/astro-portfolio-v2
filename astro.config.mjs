// @ts-check
import mdx from '@astrojs/mdx'
import partytown from '@astrojs/partytown'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import vercel from '@astrojs/vercel'
import { cacheVercel } from '@astrojs/vercel/cache'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'
import icon from 'astro-icon'

// https://astro.build/config
export default defineConfig({
	site: 'https://www.nicolasdeyros.dev/',

	output: 'server', // Use hybrid mode for mixed static/server rendering
	adapter: vercel(),

	// Vercel CDN edge caching for SSR routes (experimental in Astro 7)
	cache: {
		provider: cacheVercel(),
	},

	routeRules: {
		// Home and links pages: short TTL with stale-while-revalidate
		'/': { maxAge: 60, swr: 300 },
		'/links/[...page]': { maxAge: 60, swr: 300 },
		// Blog pages are prerendered (static) — Vercel CDN handles them natively
	},

	// Preserve v6 whitespace behavior; audit inline elements later
	compressHTML: true,

	vite: {
		plugins: [tailwindcss()],
	},

	integrations: [
		mdx(),
		partytown({
			config: {
				forward: ['dataLayer.push'],
			},
		}),
		sitemap({
			filter: page => page !== 'https://www.nicolasdeyros.dev/admin',
		}),
		icon(),
		react(),
	],
})
