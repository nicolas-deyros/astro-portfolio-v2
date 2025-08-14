import rss from '@astrojs/rss'
import type { APIRoute } from 'astro'
import { db, Links } from 'astro:db'

export const GET: APIRoute = async context => {
	try {
		// Fetch all links from the database
		const links = await db.select().from(Links)

		// Filter out future-dated links and get only live content
		const today = new Date()
		const todayDateString = today.toISOString().split('T')[0] // Get YYYY-MM-DD format

		const liveLinks = links.filter(link => {
			return link.date <= todayDateString
		})

		// Sort by date (newest first)
		const sortedLinks = liveLinks.sort(
			(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
		)

		// Convert links to RSS items
		const rssItems = sortedLinks.map(link => {
			// Parse tags
			const tagArray = link.tags
				? link.tags.split(',').map((tag: string) => tag.trim())
				: []

			// Create description with tags and original URL
			const description = `
				<p>Link: <a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.url}</a></p>
				${tagArray.length > 0 ? `<p>Tags: ${tagArray.join(', ')}</p>` : ''}
			`.trim()

			return {
				title: link.title,
				pubDate: new Date(link.date),
				description: description,
				link: link.url, // The actual link URL
				guid: `${context.site}links/${link.id}`, // Unique identifier
				categories: tagArray, // RSS categories from tags
			}
		})

		return rss({
			title: 'Nicolas Deyros - Curated Links',
			description: 'A curated collection of interesting links and resources',
			site: context.site ?? 'https://nicolasdeyros.dev',
			items: rssItems,
			customData: `
				<language>en-us</language>
				<managingEditor>nicolas@nicolasdeyros.dev (Nicolas Deyros)</managingEditor>
				<webMaster>nicolas@nicolasdeyros.dev (Nicolas Deyros)</webMaster>
				<category>Technology</category>
				<category>Development</category>
				<category>Design</category>
			`.trim(),
		})
	} catch (error) {
		console.error('Error generating links RSS feed:', error)
		return new Response('Error generating RSS feed', { status: 500 })
	}
}
