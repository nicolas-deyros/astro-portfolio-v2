// @ts-check
import { defineConfig } from 'astro/config'

import tailwindcss from '@tailwindcss/vite'
import mdx from '@astrojs/mdx'
import partytown from '@astrojs/partytown'
import sitemap from '@astrojs/sitemap'

import icon from 'astro-icon'

import db from '@astrojs/db'

import react from '@astrojs/react'

import vercel from '@astrojs/vercel'

// https://astro.build/config
export default defineConfig({
	site: 'https://nicolas-deyros.github.io/astro-portfolio-v2',

	output: 'server', // Use hybrid mode for mixed static/server rendering
	adapter: vercel(),

	vite: {
		plugins: [tailwindcss()],
	},

	integrations: [mdx(), partytown(), sitemap(), icon(), db(), react()],
})
