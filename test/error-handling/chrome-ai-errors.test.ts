import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BlogSummarizer } from '../../src/utils/summarizer'
import { BlogTranslator } from '../../src/utils/translator'

// Mock Chrome AI APIs for error testing
const mockSummarizer = {
	summarize: vi.fn(),
	destroy: vi.fn(),
}

const mockTranslator = {
	translate: vi.fn(),
	destroy: vi.fn(),
}

const mockDetector = {
	detect: vi.fn(),
	destroy: vi.fn(),
}

const mockAvailability = vi.fn()
const mockCreate = vi.fn()
const mockCanTranslate = vi.fn()
const mockCreateTranslator = vi.fn()
const mockCanDetect = vi.fn()
const mockCreateDetector = vi.fn()

// Global mock setup
beforeEach(() => {
	vi.clearAllMocks()

	Object.defineProperty(window, 'Summarizer', {
		value: {
			availability: mockAvailability,
			create: mockCreate,
		},
		writable: true,
		configurable: true,
	})

	Object.defineProperty(window, 'translation', {
		value: {
			canTranslate: mockCanTranslate,
			createTranslator: mockCreateTranslator,
			canDetect: mockCanDetect,
			createDetector: mockCreateDetector,
		},
		writable: true,
		configurable: true,
	})

	// Default successful responses
	mockAvailability.mockResolvedValue('available')
	mockCreate.mockResolvedValue(mockSummarizer)
	mockCanTranslate.mockResolvedValue('readily')
	mockCreateTranslator.mockResolvedValue(mockTranslator)
	mockCanDetect.mockResolvedValue('readily')
	mockCreateDetector.mockResolvedValue(mockDetector)

	mockSummarizer.summarize.mockResolvedValue('Test summary')
	mockTranslator.translate.mockResolvedValue('Translated text')
	mockDetector.detect.mockResolvedValue([
		{ detectedLanguage: 'en', confidence: 0.95 },
	])
})

afterEach(() => {
	delete window.Summarizer
	delete window.translation
})

describe('Chrome AI Error Handling Tests', () => {
	const testContent = `# Test Blog Post

This is test content for error handling scenarios.

## Content

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
	`

	describe('Summarization Error Handling', () => {
		it('should handle API not available error', async () => {
			delete window.Summarizer

			const summarizer = new BlogSummarizer()

			await expect(
				summarizer.summarizeBlogPost(testContent, {
					type: 'teaser',
					length: 'medium',
				}),
			).rejects.toThrow('Summarizer API is not supported in this browser')

			summarizer.destroy()
		})

		it('should handle API availability check failure', async () => {
			mockAvailability.mockResolvedValue('no')

			const summarizer = new BlogSummarizer()

			await expect(
				summarizer.summarizeBlogPost(testContent, {
					type: 'teaser',
					length: 'medium',
				}),
			).rejects.toThrow('Summarizer API is not supported in this browser')

			summarizer.destroy()
		})

		it('should handle model download timeout', async () => {
			mockAvailability.mockResolvedValue('downloadable')

			// Mock waitForModelDownload to always return false (timeout)
			const summarizer = new BlogSummarizer()
			vi.spyOn(summarizer, 'waitForModelDownload').mockResolvedValue(false)

			await expect(
				summarizer.summarizeBlogPost(testContent, {
					type: 'teaser',
					length: 'medium',
				}),
			).rejects.toThrow('Model download timed out')

			summarizer.destroy()
		})

		it('should handle summarizer creation failure', async () => {
			mockCreate.mockRejectedValue(new Error('Failed to create summarizer'))

			const summarizer = new BlogSummarizer()

			await expect(
				summarizer.summarizeBlogPost(testContent, {
					type: 'teaser',
					length: 'medium',
				}),
			).rejects.toThrow('Failed to initialize summarizer')

			summarizer.destroy()
		})

		it('should handle summarization operation failure', async () => {
			mockSummarizer.summarize.mockRejectedValue(
				new Error('Summarization failed'),
			)

			const summarizer = new BlogSummarizer()

			await expect(
				summarizer.summarizeBlogPost(testContent, {
					type: 'teaser',
					length: 'medium',
				}),
			).rejects.toThrow('Summarization failed')

			summarizer.destroy()
		})

		it('should handle network connectivity issues during summarization', async () => {
			mockSummarizer.summarize.mockRejectedValue(new Error('Network error'))

			const summarizer = new BlogSummarizer()

			await expect(
				summarizer.summarizeBlogPost(testContent, {
					type: 'teaser',
					length: 'medium',
				}),
			).rejects.toThrow('Network error')

			summarizer.destroy()
		})

		it('should clean up resources after summarization errors', async () => {
			mockSummarizer.summarize.mockRejectedValue(new Error('Test error'))

			const summarizer = new BlogSummarizer()

			try {
				await summarizer.summarizeBlogPost(testContent, {
					type: 'teaser',
					length: 'medium',
				})
			} catch {
				// Expected to throw
			}

			// Cleanup should still happen
			summarizer.destroy()
			expect(mockSummarizer.destroy).toHaveBeenCalled()
		})

		it('should handle invalid content input', async () => {
			const summarizer = new BlogSummarizer()

			await expect(
				summarizer.summarizeBlogPost('', { type: 'teaser', length: 'medium' }),
			).rejects.toThrow()

			summarizer.destroy()
		})
	})

	describe('Translation Error Handling', () => {
		it('should handle API not available error', async () => {
			delete window.translation

			const translator = new BlogTranslator()

			await expect(
				translator.translateBlogPost(testContent, 'en', 'es'),
			).rejects.toThrow('Translation API is not available')

			translator.destroy()
		})

		it('should handle unsupported language pairs', async () => {
			mockCanTranslate.mockResolvedValue('no')

			const translator = new BlogTranslator()

			await expect(
				translator.translateBlogPost(testContent, 'en', 'xx'),
			).rejects.toThrow('Translation from en to xx is not supported')

			translator.destroy()
		})

		it('should handle translator creation failure', async () => {
			mockCreateTranslator.mockRejectedValue(
				new Error('Failed to create translator'),
			)

			const translator = new BlogTranslator()

			await expect(
				translator.translateBlogPost(testContent, 'en', 'es'),
			).rejects.toThrow('Failed to create translator')

			translator.destroy()
		})

		it('should handle translation operation failure', async () => {
			mockTranslator.translate.mockRejectedValue(
				new Error('Translation failed'),
			)

			const translator = new BlogTranslator()

			await expect(
				translator.translateBlogPost(testContent, 'en', 'es'),
			).rejects.toThrow('Translation failed')

			translator.destroy()
		})

		it('should handle language detection errors', async () => {
			mockCanDetect.mockResolvedValue('no')

			const translator = new BlogTranslator()

			await expect(translator.detectLanguage(testContent)).rejects.toThrow(
				'Language detection is not supported',
			)

			translator.destroy()
		})

		it('should handle language detection failure', async () => {
			mockDetector.detect.mockRejectedValue(new Error('Detection failed'))

			const translator = new BlogTranslator()

			await expect(translator.detectLanguage(testContent)).rejects.toThrow(
				'Detection failed',
			)

			translator.destroy()
		})

		it('should clean up resources after translation errors', async () => {
			mockTranslator.translate.mockRejectedValue(new Error('Test error'))

			const translator = new BlogTranslator()

			try {
				await translator.translateBlogPost(testContent, 'en', 'es')
			} catch {
				// Expected to throw
			}

			// Cleanup should still happen
			translator.destroy()
			expect(mockTranslator.destroy).toHaveBeenCalled()
		})

		it('should handle invalid language codes gracefully', async () => {
			const translator = new BlogTranslator()

			expect(translator.isValidLanguageCode('')).toBe(false)
			expect(translator.isValidLanguageCode('invalid')).toBe(false)
			expect(translator.getLanguageName('invalid')).toBe('Unknown')

			translator.destroy()
		})

		it('should handle empty content input', async () => {
			const translator = new BlogTranslator()

			const result = await translator.translateBlogPost('', 'en', 'es')

			expect(result.translatedContent).toBeTruthy()
			expect(result.wordCount).toBe(0)

			translator.destroy()
		})
	})

	describe('Combined Workflow Error Handling', () => {
		it('should handle errors in summarize-then-translate workflow', async () => {
			mockSummarizer.summarize.mockRejectedValue(
				new Error('Summarization failed'),
			)

			const summarizer = new BlogSummarizer()
			const translator = new BlogTranslator()

			// Summarization should fail
			await expect(
				summarizer.summarizeBlogPost(testContent, {
					type: 'teaser',
					length: 'medium',
				}),
			).rejects.toThrow('Summarization failed')

			// Translation should still work independently
			const translationResult = await translator.translateBlogPost(
				testContent,
				'en',
				'es',
			)
			expect(translationResult.translatedContent).toBeTruthy()

			summarizer.destroy()
			translator.destroy()
		})

		it('should handle errors in translate-then-summarize workflow', async () => {
			mockTranslator.translate.mockRejectedValue(
				new Error('Translation failed'),
			)

			const translator = new BlogTranslator()
			const summarizer = new BlogSummarizer()

			// Translation should fail
			await expect(
				translator.translateBlogPost(testContent, 'en', 'es'),
			).rejects.toThrow('Translation failed')

			// Summarization should still work independently
			const summaryResult = await summarizer.summarizeBlogPost(testContent, {
				type: 'teaser',
				length: 'medium',
			})
			expect(summaryResult.summary).toBeTruthy()

			translator.destroy()
			summarizer.destroy()
		})

		it('should handle partial failures in concurrent operations', async () => {
			// Make only one operation fail
			mockSummarizer.summarize.mockRejectedValueOnce(
				new Error('Summarization failed'),
			)

			const summarizer1 = new BlogSummarizer()
			const summarizer2 = new BlogSummarizer()

			const promises = [
				summarizer1.summarizeBlogPost(testContent, {
					type: 'teaser',
					length: 'medium',
				}),
				summarizer2.summarizeBlogPost(testContent, {
					type: 'key-points',
					length: 'short',
				}),
			]

			const results = await Promise.allSettled(promises)

			expect(results[0].status).toBe('rejected')
			expect(results[1].status).toBe('fulfilled')

			summarizer1.destroy()
			summarizer2.destroy()
		})

		it('should handle race conditions in concurrent API calls', async () => {
			// Simulate race condition by having different timing
			mockSummarizer.summarize.mockImplementation(async () => {
				await new Promise(resolve => setTimeout(resolve, Math.random() * 100))
				return 'Summary result'
			})

			const summarizers = Array.from({ length: 5 }, () => new BlogSummarizer())

			const promises = summarizers.map(summarizer =>
				summarizer.summarizeBlogPost(testContent, {
					type: 'teaser',
					length: 'medium',
				}),
			)

			const results = await Promise.allSettled(promises)

			// All should succeed despite race conditions
			results.forEach(result => {
				expect(result.status).toBe('fulfilled')
			})

			summarizers.forEach(summarizer => summarizer.destroy())
		})
	})

	describe('Recovery and Retry Mechanisms', () => {
		it('should handle temporary API failures gracefully', async () => {
			// Fail first call, succeed on second
			mockSummarizer.summarize
				.mockRejectedValueOnce(new Error('Temporary failure'))
				.mockResolvedValue('Success after retry')

			const summarizer = new BlogSummarizer()

			// First call should fail
			await expect(
				summarizer.summarizeBlogPost(testContent, {
					type: 'teaser',
					length: 'medium',
				}),
			).rejects.toThrow('Temporary failure')

			// Second call should succeed
			const result = await summarizer.summarizeBlogPost(testContent, {
				type: 'teaser',
				length: 'medium',
			})
			expect(result.summary).toBe('Success after retry')

			summarizer.destroy()
		})

		it('should handle model download retry scenarios', async () => {
			// First check: downloadable, then available
			mockAvailability
				.mockResolvedValueOnce('downloadable')
				.mockResolvedValueOnce('downloadable')
				.mockResolvedValue('available')

			const summarizer = new BlogSummarizer()

			const result = await summarizer.summarizeBlogPost(testContent, {
				type: 'teaser',
				length: 'medium',
			})

			expect(result.summary).toBeTruthy()
			expect(mockAvailability).toHaveBeenCalledTimes(3) // Initial + 2 retries

			summarizer.destroy()
		})

		it('should provide meaningful error messages', async () => {
			const testCases = [
				{
					mockSetup: (): void => {
						delete window.Summarizer
					},
					expectedError: 'Summarizer API is not supported in this browser',
				},
				{
					mockSetup: (): void => {
						mockAvailability.mockResolvedValue('no')
					},
					expectedError: 'Summarizer API is not supported in this browser',
				},
				{
					mockSetup: (): void => {
						mockCreate.mockRejectedValue(new Error('Creation failed'))
					},
					expectedError: 'Failed to initialize summarizer',
				},
			]

			for (const testCase of testCases) {
				vi.clearAllMocks()

				// Reset mocks to defaults first
				mockAvailability.mockResolvedValue('available')
				mockCreate.mockResolvedValue(mockSummarizer)

				// Apply specific test setup
				testCase.mockSetup()

				const summarizer = new BlogSummarizer()

				await expect(
					summarizer.summarizeBlogPost(testContent, {
						type: 'teaser',
						length: 'medium',
					}),
				).rejects.toThrow(testCase.expectedError)

				summarizer.destroy()
			}
		})

		it('should handle resource cleanup in error scenarios', async () => {
			const summarizers = Array.from({ length: 3 }, () => new BlogSummarizer())

			// Make some operations fail
			mockSummarizer.summarize
				.mockRejectedValueOnce(new Error('Error 1'))
				.mockResolvedValueOnce('Success')
				.mockRejectedValueOnce(new Error('Error 2'))

			const promises = summarizers.map(summarizer =>
				summarizer
					.summarizeBlogPost(testContent, { type: 'teaser', length: 'medium' })
					.catch(() => 'failed'),
			)

			await Promise.all(promises)

			// All summarizers should be cleanable
			summarizers.forEach(summarizer => {
				expect(() => summarizer.destroy()).not.toThrow()
			})

			// Destroy should have been called for successful operations
			expect(mockSummarizer.destroy).toHaveBeenCalledTimes(3)
		})
	})
})
