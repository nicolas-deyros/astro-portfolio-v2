import { ActionError, defineAction } from 'astro:actions'
import {
	AdminSessions,
	count,
	db,
	eq,
	like,
	Links as LinksTable,
	or,
	sql,
} from 'astro:db'
import { z } from 'astro:schema'

const linkBaseSchema = z.object({
	title: z
		.string()
		.min(1, 'Title is required')
		.max(200, 'Title must be less than 200 characters')
		.refine(val => val.trim().length > 0, 'Title cannot be empty'),
	url: z
		.string()
		.url('Must be a valid URL')
		.max(2000, 'URL must be less than 2000 characters'),
	tags: z
		.string()
		.max(500, 'Tags must be less than 500 characters')
		.default(''),
	date: z
		.string()
		.refine(val => !isNaN(Date.parse(val)), 'Must be a valid date')
		.transform(val => new Date(val).toISOString().split('T')[0]),
})

function normalizeTags(tags: string): string {
	return tags
		.split(',')
		.map(tag => tag.trim())
		.filter(tag => tag.length > 0)
		.join(', ')
}

async function verifyAuth(request: Request): Promise<boolean> {
	const authHeader = request.headers.get('authorization')
	if (!authHeader?.startsWith('Bearer ')) {
		throw new ActionError({
			code: 'UNAUTHORIZED',
			message: 'Missing or invalid token',
		})
	}

	const token = authHeader.slice(7)
	if (!token) {
		throw new ActionError({ code: 'UNAUTHORIZED', message: 'Invalid token' })
	}

	const session = await db
		.select()
		.from(AdminSessions)
		.where(eq(AdminSessions.token, token))
		.get()

	if (!session) {
		throw new ActionError({ code: 'UNAUTHORIZED', message: 'Invalid session' })
	}

	if (new Date() > new Date(session.expiresAt)) {
		await db.delete(AdminSessions).where(eq(AdminSessions.id, session.id))
		throw new ActionError({ code: 'UNAUTHORIZED', message: 'Session expired' })
	}

	await db
		.update(AdminSessions)
		.set({ lastActivity: new Date() })
		.where(eq(AdminSessions.id, session.id))

	return true
}

export const server = {
	// Get links with pagination, search, and filtering
	getLinks: defineAction({
		accept: 'json',
		input: z.object({
			page: z.number().min(1).default(1),
			pageSize: z.number().min(1).max(100).default(20),
			sort: z.enum(['title', 'url', 'tags', 'date']).default('date'),
			dir: z.enum(['asc', 'desc']).default('desc'),
			search: z.string().optional(),
			tag: z.string().optional(),
		}),
		handler: async (input, { request }) => {
			await verifyAuth(request)

			const { page, pageSize, sort, dir, search, tag } = input
			const offset = (page - 1) * pageSize

			try {
				// Build base query
				let query = db.select().from(LinksTable)
				let countQuery = db.select({ count: count() }).from(LinksTable)

				// Add search conditions
				if (search) {
					const searchCondition = or(
						like(LinksTable.title, `%${search}%`),
						like(LinksTable.url, `%${search}%`),
						like(LinksTable.tags, `%${search}%`),
					)
					query = query.where(searchCondition)
					countQuery = countQuery.where(searchCondition)
				}

				// Add tag filter
				if (tag) {
					const tagCondition = like(LinksTable.tags, `%${tag}%`)
					query = query.where(tagCondition)
					countQuery = countQuery.where(tagCondition)
				}

				// Add sorting
				const orderColumn = LinksTable[sort]
				query =
					dir === 'asc'
						? query.orderBy(orderColumn)
						: query.orderBy(sql`${orderColumn} DESC`)

				// Add pagination
				query = query.limit(pageSize).offset(offset)

				// Execute queries
				const [links, totalResult] = await Promise.all([query, countQuery])

				const total = totalResult[0]?.count || 0
				const totalPages = Math.ceil(total / pageSize)

				return {
					success: true,
					data: {
						links: links.map(link => ({
							id: link.id,
							title: link.title,
							url: link.url,
							tags: link.tags,
							date: link.date,
						})),
						pagination: {
							page,
							pageSize,
							total,
							totalPages,
							hasNext: page < totalPages,
							hasPrev: page > 1,
						},
						filters: {
							sort,
							dir,
							search,
							tag,
						},
					},
				}
			} catch (error) {
				throw error instanceof Error
					? error
					: new Error('Failed to fetch links', { cause: error })
			}
		},
	}),

	// Create new link with comprehensive validation
	createLink: defineAction({
		accept: 'form',
		input: linkBaseSchema,
		handler: async (input, { request }) => {
			await verifyAuth(request)

			try {
				// Additional server-side validation
				const { title, url, tags, date } = input

				// Check for duplicate URLs
				const existing = await db
					.select()
					.from(LinksTable)
					.where(eq(LinksTable.url, url))
				if (existing.length > 0) {
					throw new ActionError({
						code: 'CONFLICT',
						message: 'A link with this URL already exists',
					})
				}

				// Validate date is not too far in the future (optional business rule)
				const linkDate = new Date(date)
				const maxFutureDate = new Date()
				maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 1)

				if (linkDate > maxFutureDate) {
					throw new ActionError({
						code: 'BAD_REQUEST',
						message: 'Date cannot be more than 1 year in the future',
					})
				}

				const cleanTags = normalizeTags(tags)

				await db.insert(LinksTable).values({
					title: title.trim(),
					url: url.trim(),
					tags: cleanTags,
					date: date,
				})

				return {
					success: true,
					message: 'Link created successfully',
					data: { title, url, tags: cleanTags, date },
				}
			} catch (error) {
				if (error instanceof ActionError) throw error
				throw new ActionError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to create link',
					stack: error instanceof Error ? error.stack : undefined,
				})
			}
		},
	}),

	// Update existing link with validation
	updateLink: defineAction({
		accept: 'form',
		input: linkBaseSchema.extend({
			id: z.number().min(1, 'Valid ID is required'),
		}),
		handler: async (input, { request }) => {
			await verifyAuth(request)

			try {
				const { id, title, url, tags, date } = input

				// Check if link exists
				const existing = await db
					.select()
					.from(LinksTable)
					.where(eq(LinksTable.id, id))
				if (existing.length === 0) {
					throw new ActionError({
						code: 'NOT_FOUND',
						message: 'Link not found',
					})
				}

				// Check for duplicate URLs (excluding current link)
				const duplicateUrl = await db
					.select()
					.from(LinksTable)
					.where(sql`${LinksTable.url} = ${url} AND ${LinksTable.id} != ${id}`)

				if (duplicateUrl.length > 0) {
					throw new ActionError({
						code: 'CONFLICT',
						message: 'A link with this URL already exists',
					})
				}

				const cleanTags = normalizeTags(tags)

				await db
					.update(LinksTable)
					.set({
						title: title.trim(),
						url: url.trim(),
						tags: cleanTags,
						date: date,
					})
					.where(eq(LinksTable.id, id))

				return {
					success: true,
					message: 'Link updated successfully',
					data: { id, title, url, tags: cleanTags, date },
				}
			} catch (error) {
				if (error instanceof ActionError) throw error
				throw new ActionError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to update link',
					stack: error instanceof Error ? error.stack : undefined,
				})
			}
		},
	}),

	// Delete link
	deleteLink: defineAction({
		accept: 'form',
		input: z.object({
			id: z.number().min(1, 'Valid ID is required'),
		}),
		handler: async (input, { request }) => {
			await verifyAuth(request)

			try {
				const { id } = input

				// Check if link exists
				const existing = await db
					.select()
					.from(LinksTable)
					.where(eq(LinksTable.id, id))
				if (existing.length === 0) {
					throw new ActionError({
						code: 'NOT_FOUND',
						message: 'Link not found',
					})
				}

				await db.delete(LinksTable).where(eq(LinksTable.id, id))

				return {
					success: true,
					message: 'Link deleted successfully',
					data: { id },
				}
			} catch (error) {
				if (error instanceof ActionError) throw error
				throw new ActionError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to delete link',
					stack: error instanceof Error ? error.stack : undefined,
				})
			}
		},
	}),

	// Bulk delete links
	bulkDeleteLinks: defineAction({
		accept: 'form',
		input: z.object({
			ids: z.array(z.number().min(1)).min(1, 'At least one ID is required'),
		}),
		handler: async (input, { request }) => {
			await verifyAuth(request)

			try {
				const { ids } = input

				// Validate all links exist
				const existing = await db
					.select({ id: LinksTable.id })
					.from(LinksTable)
					.where(sql`${LinksTable.id} IN (${ids.join(',')})`)

				if (existing.length !== ids.length) {
					throw new ActionError({
						code: 'NOT_FOUND',
						message: 'One or more links not found',
					})
				}

				// Delete all links
				await db
					.delete(LinksTable)
					.where(sql`${LinksTable.id} IN (${ids.join(',')})`)

				return {
					success: true,
					message: `${ids.length} links deleted successfully`,
					data: { deletedIds: ids },
				}
			} catch (error) {
				throw error instanceof Error
					? error
					: new Error('Failed to delete links', { cause: error })
			}
		},
	}),

	// Get unique tags for filtering
	getTags: defineAction({
		accept: 'json',
		input: z.object({}),
		handler: async (input, { request }) => {
			await verifyAuth(request)

			try {
				const links = await db
					.select({ tags: LinksTable.tags })
					.from(LinksTable)

				const allTags = new Set<string>()
				links.forEach(link => {
					if (link.tags) {
						link.tags.split(',').forEach(tag => {
							const cleanTag = tag.trim()
							if (cleanTag) allTags.add(cleanTag)
						})
					}
				})

				return {
					success: true,
					data: Array.from(allTags).sort(),
				}
			} catch (error) {
				throw error instanceof Error
					? error
					: new Error('Failed to fetch tags', { cause: error })
			}
		},
	}),
}
