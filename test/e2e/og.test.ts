import { describe, expect, test } from 'vitest'

describe('OG image endpoint', () => {
	test('should return a 1200x630 PNG', async () => {
		const response = await fetch(
			'http://localhost:4321/api/og.png?title=Prueba&desc=Descripci%C3%B3n',
		)
		expect(response.status).toBe(200)
		expect(response.headers.get('content-type')).toBe('image/png')

		// Rendering is streamed: a satori failure still answers 200 with no image.
		const png = Buffer.from(await response.arrayBuffer())
		expect(png.subarray(1, 4).toString()).toBe('PNG')
		expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630])
	})
})
