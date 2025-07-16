import { z, defineCollection } from 'astro:content'

const blog = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string().max(60, 'For SEO provide a title of 60 caracter or less'),
		description: z
			.string()
			.max(160, 'For SEO provide a description of 160 caracter or less'),
		draft: z.boolean().default(false),
		category: z.string(),
		date: z.string().transform(str => new Date(str)),
		image: z.object({
			src: z.string(),
			alt: z.string(),
		}),
		author: z.string().default('Nicolás Deyros'),
	}),
})
const link = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(),
		url: z.string(),
		date: z.string().transform(str => new Date(str)),
	}),
})
export const collections = {
	blog,
	link,
}
