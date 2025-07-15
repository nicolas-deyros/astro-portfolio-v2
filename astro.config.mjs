// @ts-check
import { defineConfig } from 'astro/config'

import tailwindcss from '@tailwindcss/vite'
import mdx from '@astrojs/mdx'
import partytown from '@astrojs/partytown'
import sitemap from '@astrojs/sitemap'

import icon from 'astro-icon'

import vercel from '@astrojs/vercel'

// https://astro.build/config
export default defineConfig({
	site: 'https://nicolas-deyros.github.io',

	vite: {
		plugins: [tailwindcss()],
	},

	integrations: [mdx(), partytown(), sitemap(), icon()],
	adapter: vercel(),
})
