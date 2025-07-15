// @ts-check
import { defineConfig } from 'astro/config'

import tailwindcss from '@tailwindcss/vite'
import mdx from '@astrojs/mdx'
import partytown from '@astrojs/partytown'
import sitemap from '@astrojs/sitemap'

import icon from 'astro-icon'

// https://astro.build/config
export default defineConfig({
	site: 'https://nicolas-deyros.github.io',
	base: 'my-repo',
	vite: {
		plugins: [tailwindcss()],
	},

	integrations: [mdx(), partytown(), sitemap(), icon()],
})
