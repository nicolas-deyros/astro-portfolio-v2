import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

// Vite 8 / Rolldown refuses non-UTF-8 sources, and a lenient re-encode leaves
// U+FFFD behind (see GuiaApis.jsx, corrupted in #71). Catch both early.
const SRC = path.resolve(__dirname, '../../src')
const TEXT_EXT = /\.(astro|[jt]sx?|mdx?|css|json)$/
const decoder = new TextDecoder('utf-8', { fatal: true })

const files = readdirSync(SRC, { recursive: true, encoding: 'utf8' })
	.filter(f => TEXT_EXT.test(f))
	.map(f => path.join(SRC, f))

describe('source file encoding', () => {
	it('finds source files to check', () => {
		expect(files.length).toBeGreaterThan(0)
	})

	it.each(files.map(f => [path.relative(SRC, f), f]))(
		'%s is valid UTF-8 without replacement characters',
		(_, file) => {
			const text = decoder.decode(readFileSync(file))
			expect(text.includes('�')).toBe(false)
		},
	)
})
