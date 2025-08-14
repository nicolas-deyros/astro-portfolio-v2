import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
	detectBrowser,
	getAISupportMessage,
	supportsAI,
} from '../../src/lib/browserDetection'

// Mock window object
interface MockWindow {
	navigator: {
		userAgent: string
	}
	ai?: {
		translator?: object
		summarizer?: object
	}
}

let mockWindow: MockWindow

beforeEach(() => {
	vi.clearAllMocks()

	// Create fresh mock window for each test
	mockWindow = {
		navigator: {
			userAgent: '',
		},
		ai: undefined,
	}

	// Reset window mock
	Object.defineProperty(globalThis, 'window', {
		value: mockWindow,
		writable: true,
		configurable: true,
	})
})

describe('Browser Detection', () => {
	describe('detectBrowser', () => {
		it('should detect Chrome 139 correctly', () => {
			mockWindow.navigator.userAgent =
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'

			const result = detectBrowser()

			expect(result).toEqual({
				name: 'Chrome',
				version: 139,
				isChrome: true,
				supportsAI: true,
			})
		})

		it('should detect Chrome 129 as supporting AI', () => {
			mockWindow.navigator.userAgent =
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'

			const result = detectBrowser()

			expect(result).toEqual({
				name: 'Chrome',
				version: 129,
				isChrome: true,
				supportsAI: true,
			})
		})

		it('should detect Chrome 128 as not supporting AI', () => {
			mockWindow.navigator.userAgent =
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'

			const result = detectBrowser()

			expect(result).toEqual({
				name: 'Chrome',
				version: 128,
				isChrome: true,
				supportsAI: false,
			})
		})

		it('should detect Edge correctly', () => {
			mockWindow.navigator.userAgent =
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0'

			const result = detectBrowser()

			expect(result).toEqual({
				name: 'Edge',
				version: 129,
				isChrome: false,
				supportsAI: true,
			})
		})

		it('should detect Firefox as not supporting AI', () => {
			mockWindow.navigator.userAgent =
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0'

			const result = detectBrowser()

			expect(result).toEqual({
				name: 'other',
				version: 0,
				isChrome: false,
				supportsAI: false,
			})
		})

		it('should handle server-side rendering', () => {
			// @ts-expect-error: Simulate SSR by deleting window, which is not normally allowed
			delete globalThis.window

			const result = detectBrowser()

			expect(result).toEqual({
				name: 'unknown',
				version: 0,
				isChrome: false,
				supportsAI: false,
			})
		})
	})

	describe('supportsAI', () => {
		it('should return false on server-side', () => {
			// @ts-expect-error: Simulate SSR by deleting window, which is not normally allowed
			delete globalThis.window

			const result = supportsAI()

			expect(result).toBe(false)
		})

		it('should return false for browsers with version < 129', () => {
			mockWindow.navigator.userAgent =
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'

			const result = supportsAI()

			expect(result).toBe(false)
		})

		it('should return false for Chrome 129+ without AI object', () => {
			mockWindow.navigator.userAgent =
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'

			const result = supportsAI()

			expect(result).toBe(false)
		})

		it('should return true for Chrome 129+ with AI translator', () => {
			mockWindow.navigator.userAgent =
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'

			mockWindow.ai = {
				translator: {},
			}

			const result = supportsAI()

			expect(result).toBe(true)
		})

		it('should return true for Chrome 129+ with AI summarizer', () => {
			mockWindow.navigator.userAgent =
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'

			mockWindow.ai = {
				summarizer: {},
			}

			const result = supportsAI()

			expect(result).toBe(true)
		})

		it('should handle errors gracefully', () => {
			mockWindow.navigator.userAgent =
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'

			// Define a getter that throws an error
			Object.defineProperty(mockWindow, 'ai', {
				get() {
					throw new Error('Access denied')
				},
				configurable: true,
			})

			const result = supportsAI()

			expect(result).toBe(false)
		})
	})

	describe('getAISupportMessage', () => {
		it('should return message for non-Chrome browsers', () => {
			mockWindow.navigator.userAgent =
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0'

			const result = getAISupportMessage()

			expect(result).toBe(
				"AI features require Chrome 129+. You're using other.",
			)
		})

		it('should return message for old Chrome versions', () => {
			mockWindow.navigator.userAgent =
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'

			const result = getAISupportMessage()

			expect(result).toBe(
				"AI features require Chrome 129+. You're using Chrome 128.",
			)
		})

		it('should return experimental features message for Chrome 129+ without AI', () => {
			mockWindow.navigator.userAgent =
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'

			const result = getAISupportMessage()

			expect(result).toBe(
				'AI features require Chrome with experimental features enabled.',
			)
		})

		it('should return success message for Chrome 129+ with AI', () => {
			mockWindow.navigator.userAgent =
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'

			mockWindow.ai = {
				translator: {},
			}

			const result = getAISupportMessage()

			expect(result).toBe('AI features are available!')
		})
	})
})
