import rss from '@astrojs/rss'
import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import MarkdownIt from 'markdown-it'
import sanitizeHtml from 'sanitize-html'

const parser = new MarkdownIt({
	html: true,
	linkify: true,
	typographer: true,
})

export const GET: APIRoute = async context => {
	try {
		// Get all published blog posts, sorted by date (newest first)
		const posts = await getCollection('blog', ({ data }) => {
			return data.draft !== true
		})

		const sortedPosts = posts.sort(
			(a, b) =>
				new Date(b.data.date).getTime() - new Date(a.data.date).getTime(),
		)

		return rss({
			title: 'Nicolás Deyros Blog',
			description:
				'Programmer, Designer, and Creator - Insights on web development, AI, and technology',
			site: context.site || 'https://nicolas-deyros.dev',
			items: sortedPosts.map(post => {
				// Enhanced content processing
				const rawHtml = parser.render(post.body)
				const cleanContent = sanitizeHtml(rawHtml, {
					allowedTags: [
						...sanitizeHtml.defaults.allowedTags,
						'img',
						'figure',
						'figcaption',
						'picture',
						'source',
					],
					allowedAttributes: {
						...sanitizeHtml.defaults.allowedAttributes,
						img: ['src', 'alt', 'width', 'height', 'loading', 'decoding'],
						a: ['href', 'rel', 'target'],
					},
					allowedSchemes: ['http', 'https', 'mailto'],
				})

				return {
					title: post.data.title,
					link: `/blog/${post.slug}`,
					description: post.data.description,
					pubDate: new Date(post.data.date),
					content: cleanContent,
					categories: post.data.category ? [post.data.category] : undefined,
					author: 'nicolas@deyros.dev (Nicolás Deyros)',
					guid: `/blog/${post.slug}`,
				}
			}),
			customData: [
				'<language>en-us</language>',
				'<managingEditor>nicolas@deyros.dev (Nicolás Deyros)</managingEditor>',
				'<webMaster>nicolas@deyros.dev (Nicolás Deyros)</webMaster>',
				'<generator>Astro RSS Generator</generator>',
				'<ttl>60</ttl>',
			].join('\n'),
		})
	} catch (error) {
		console.error('RSS generation error:', error)
		return new Response('RSS feed generation failed', { status: 500 })
	}
}
