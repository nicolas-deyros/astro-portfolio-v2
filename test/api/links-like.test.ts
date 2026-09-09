import { db } from '@lib/db'
import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { links as linksTable } from '@/db/schema'
import { POST } from '@/pages/api/links/like.json'

function jsonRequest(body: unknown): Request {
	return new Request('http://localhost/api/links/like.json', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	})
}

describe('Links like endpoint', () => {
	let testLinkId: number

	beforeAll(async () => {
		const [inserted] = await db
			.insert(linksTable)
			.values({
				title: 'links-like.test.ts fixture',
				url: 'https://example.com/links-like-test-fixture',
				tags: 'test',
				date: new Date().toISOString().split('T')[0],
			})
			.returning({ id: linksTable.id })
		testLinkId = inserted.id
	})

	afterAll(async () => {
		if (testLinkId) {
			await db.delete(linksTable).where(eq(linksTable.id, testLinkId))
		}
	})

	it('increments the like count for a valid id, no auth required', async () => {
		// @ts-expect-error - only `request` is used by this handler
		const res = await POST({ request: jsonRequest({ id: testLinkId }) })

		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.success).toBe(true)
		expect(body.likes).toBe(1)
	})

	it('returns a validation error for a missing id', async () => {
		// @ts-expect-error - only `request` is used by this handler
		const res = await POST({ request: jsonRequest({}) })

		expect(res.status).toBe(422)
		const body = await res.json()
		expect(body.success).toBe(false)
	})

	it('returns a validation error for a non-existent id', async () => {
		// @ts-expect-error - only `request` is used by this handler
		const res = await POST({ request: jsonRequest({ id: 999999999 }) })

		expect(res.status).toBe(422)
		const body = await res.json()
		expect(body.success).toBe(false)
	})
})
