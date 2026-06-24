// @ts-check
import mdx from '@astrojs/mdx'
import partytown from '@astrojs/partytown'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import vercel from '@astrojs/vercel'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'
import icon from 'astro-icon'

// https://astro.build/config
export default defineConfig({
	site: 'https://www.nicolasdeyros.dev/',

	output: 'server',
	adapter: vercel(),

	routeRules: {
		'/': { maxAge: 60, swr: 300 },
		'/links/[...page]': { maxAge: 60, swr: 300 },
	},

	compressHTML: true,

	vite: {
		plugins: [tailwindcss()],
		build: {
			rollupOptions: {
				// Preserve entry module exports so <astro-island> component-url
				// files export their default (the React component).
				// Without this, Rollup's code-splitting moves component code to
				// a shared chunk but the facade file exports nothing, causing
				// all client:load islands to silently fail hydration.
				preserveEntrySignatures: 'allow-extension',
			},
		},
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
