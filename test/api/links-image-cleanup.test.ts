import { db } from '@lib/db'
import { eq } from 'drizzle-orm'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { links as linksTable } from '@/db/schema'

vi.mock('@lib/session', () => ({
	validateSession: vi.fn().mockResolvedValue({ sessionId: 'test', token: 'test' }),
}))

const deleteLinkImageBlob = vi.fn().mockResolvedValue(undefined)
vi.mock('@lib/blob', () => ({
	blobAuthLinksImages: vi.fn().mockReturnValue({}),
	deleteLinkImageBlob,
}))

const { DELETE, PUT } = await import('@/pages/api/links.json')

function jsonRequest(method: string, url: string, body?: unknown): Request {
	return new Request(url, {
		method,
		headers: body ? { 'Content-Type': 'application/json' } : undefined,
		body: body ? JSON.stringify(body) : undefined,
	})
}

describe('links.json.ts image cleanup', () => {
	let testLinkId: number

	beforeEach(async () => {
		deleteLinkImageBlob.mockClear()
		const [inserted] = await db
			.insert(linksTable)
			.values({
				title: 'links-image-cleanup.test.ts fixture',
				url: 'https://example.com/links-image-cleanup-fixture',
				tags: 'test',
				date: new Date().toISOString().split('T')[0],
				image: 'https://blob.example.com/old-image.png',
			})
			.returning({ id: linksTable.id })
		testLinkId = inserted.id
	})

	afterAll(async () => {
		if (testLinkId) {
			await db.delete(linksTable).where(eq(linksTable.id, testLinkId))
		}
	})

	it('deletes the old blob when the image is replaced via PUT', async () => {
		const res = await PUT({
			request: jsonRequest('PUT', 'http://localhost/api/links.json', {
				id: testLinkId,
				title: 'updated',
				url: 'https://example.com/updated',
				tags: 'test',
				date: new Date().toISOString().split('T')[0],
				image: 'https://blob.example.com/new-image.png',
			}),
			cookies: {},
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any)

		expect(res.status).toBe(200)
		expect(deleteLinkImageBlob).toHaveBeenCalledWith('https://blob.example.com/old-image.png')
	})

	it('deletes the old blob when the image is removed via PUT (image: null)', async () => {
		const res = await PUT({
			request: jsonRequest('PUT', 'http://localhost/api/links.json', {
				id: testLinkId,
				title: 'updated',
				url: 'https://example.com/updated',
				tags: 'test',
				date: new Date().toISOString().split('T')[0],
				image: null,
			}),
			cookies: {},
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any)

		expect(res.status).toBe(200)
		expect(deleteLinkImageBlob).toHaveBeenCalledWith('https://blob.example.com/old-image.png')
	})

	it('does not call deleteBlob when the image field is untouched', async () => {
		const res = await PUT({
			request: jsonRequest('PUT', 'http://localhost/api/links.json', {
				id: testLinkId,
				title: 'updated again',
				url: 'https://example.com/updated',
				tags: 'test',
				date: new Date().toISOString().split('T')[0],
			}),
			cookies: {},
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any)

		expect(res.status).toBe(200)
		expect(deleteLinkImageBlob).not.toHaveBeenCalled()
	})

	it('deletes the associated blob when the link is deleted', async () => {
		const res = await DELETE({
			request: jsonRequest(
				'DELETE',
				`http://localhost/api/links.json?id=${testLinkId}`,
			),
			cookies: {},
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any)

		expect(res.status).toBe(200)
		expect(deleteLinkImageBlob).toHaveBeenCalledWith('https://blob.example.com/old-image.png')
	})
})
