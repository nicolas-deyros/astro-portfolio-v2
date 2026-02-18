import { defineCollection, z } from 'astro:content'

const blog = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string().max(60, 'For SEO provide a title of 60 caracter or less'),
		description: z
			.string()
			.max(160, 'For SEO provide a description of 160 caracter or less'),
		draft: z.boolean().default(false),
		category: z.string(),
		tags: z.array(z.string()).optional(),
		date: z.coerce.date(),
		image: z
			.object({
				src: z.string().optional(),
				alt: z.string().optional(),
			})
			.optional(),
		author: z.string().default('Nicolás Deyros'),
	}),
})

export const collections = {
	blog,
}
