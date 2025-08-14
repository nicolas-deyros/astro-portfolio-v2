import { describe, expect, it } from 'vitest'

import { BlogTranslator } from '../../src/utils/translator'

describe('BlogTranslator', () => {
	it('should create instance', () => {
		const translator = new BlogTranslator()
		expect(translator).toBeDefined()
	})
})
