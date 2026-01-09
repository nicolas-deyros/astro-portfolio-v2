import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BlogTranslator } from '../../src/utils/translator'

describe('BlogTranslator', () => {
	let translator: BlogTranslator

	beforeEach(() => {
		translator = new BlogTranslator()
		// Reset global window mock before each test
		vi.stubGlobal('window', {
			LanguageDetector: undefined,
			Translator: undefined,
			translation: undefined,
		})
	})

	afterEach(() => {
		vi.unstubAllGlobals()
		translator.destroy()
	})

	it('should return false if Translation API is not available', async () => {
		const supported = await translator.isSupported()
		expect(supported).toBe(false)
	})

	it('should detect language correctly using LanguageDetector', async () => {
		const mockDetector = {
			detect: vi
				.fn()
				.mockResolvedValue([{ detectedLanguage: 'fr', confidence: 0.9 }]),
			destroy: vi.fn(),
		}
		vi.stubGlobal('window', {
			LanguageDetector: {
				create: vi.fn().mockResolvedValue(mockDetector),
			},
		})

		const result = await translator.detectLanguage('Bonjour tout le monde')
		expect(result.language).toBe('fr')
		expect(result.confidence).toBe(0.9)
	})

	it('should return English if detection fails', async () => {
		vi.stubGlobal('window', {
			LanguageDetector: {
				create: vi.fn().mockRejectedValue(new Error('Detection Error')),
			},
		})

		const result = await translator.detectLanguage('Bonjour')
		expect(result.language).toBe('en') // Default fallback
		expect(result.confidence).toBe(0)
	})

	it('should throw error in detectLanguage if API is not available', async () => {
		await expect(translator.detectLanguage('test')).rejects.toThrow(
			'Language Detection API not available',
		)
	})

	it('should return "unavailable" if translation pair is not supported', async () => {
		vi.stubGlobal('window', {
			Translator: {
				availability: vi.fn().mockResolvedValue('unavailable'),
			},
		})

		const availability = await translator.checkTranslationAvailability(
			'en',
			'xx',
		)
		expect(availability).toBe('unavailable')
	})

	it('should return "timeout" if model download times out', async () => {
		vi.stubGlobal('window', {
			Translator: {
				availability: vi.fn().mockResolvedValue('after-download'),
			},
		})

		vi.useFakeTimers()

		const promise = translator.waitForModelDownload('en', 'es', 1000)

		await vi.advanceTimersByTimeAsync(1500)

		const result = await promise
		expect(result).toBe('timeout')

		vi.useRealTimers()
	})

	it('should handle translation using window.translation naming convention', async () => {
		const mockTranslatorInstance = {
			translate: vi.fn().mockResolvedValue('Texto traducido'),
			destroy: vi.fn(),
		}
		vi.stubGlobal('window', {
			translation: {
				canTranslate: vi.fn().mockResolvedValue('readily'),
				createTranslator: vi.fn().mockResolvedValue(mockTranslatorInstance),
				canDetect: vi.fn().mockResolvedValue('readily'),
				createDetector: vi.fn().mockResolvedValue({
					detect: vi.fn().mockResolvedValue([{ detectedLanguage: 'en' }]),
				}),
			},
		})

		const result = await translator.translateBlogPost(
			'Translated text',
			'es',
			'en',
		)

		expect(result.success).toBe(true)
		expect(result.translatedContent).toBe('Texto traducido')
		expect(result.wordCount).toBe(2)
	})

	it('should throw error if translator creation fails', async () => {
		vi.stubGlobal('window', {
			LanguageDetector: {},
			Translator: {
				availability: vi.fn().mockResolvedValue('readily'),
				create: vi.fn().mockRejectedValue(new Error('Creation Failed')),
			},
		})

		await expect(
			translator.translateBlogPost('test', 'es', 'en'),
		).rejects.toThrow('Creation Failed')
	})
})
