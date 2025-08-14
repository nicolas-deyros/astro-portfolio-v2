// @ts-check
import db from '@astrojs/db'
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

	output: 'server', // Use hybrid mode for mixed static/server rendering
	adapter: vercel(),

	vite: {
		plugins: [tailwindcss()],
	},

	integrations: [
		mdx(),
		partytown({
			config: {
				forward: ['dataLayer.push'],
				debug: false,
			},
		}),
		sitemap({
			filter: page => page !== 'https://www.nicolasdeyros.dev/admin',
		}),
		icon(),
		db(),
		react(),
	],
})
