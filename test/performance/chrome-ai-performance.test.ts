import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BlogSummarizer } from '../../src/utils/summarizer'
import { BlogTranslator } from '../../src/utils/translator'

// Mock Chrome AI APIs for performance testing
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

// Global mock setup
beforeEach(() => {
	vi.clearAllMocks()

	Object.defineProperty(window, 'Summarizer', {
		value: {
			availability: vi.fn().mockResolvedValue('available'),
			create: vi.fn().mockResolvedValue(mockSummarizer),
		},
		writable: true,
		configurable: true,
	})

	Object.defineProperty(window, 'translation', {
		value: {
			canTranslate: vi.fn().mockResolvedValue('readily'),
			createTranslator: vi.fn().mockResolvedValue(mockTranslator),
			canDetect: vi.fn().mockResolvedValue('readily'),
			createDetector: vi.fn().mockResolvedValue(mockDetector),
		},
		writable: true,
		configurable: true,
	})

	// Add realistic delays to simulate real API performance
	mockSummarizer.summarize.mockImplementation(async (text: string) => {
		const delay = Math.min(text.length / 100, 1000) // Simulate processing time based on content length
		await new Promise(resolve => setTimeout(resolve, delay))
		return `Summary of content (${text.length} chars)`
	})

	mockTranslator.translate.mockImplementation(async (text: string) => {
		const delay = Math.min(text.length / 200, 800) // Slightly faster than summarization
		await new Promise(resolve => setTimeout(resolve, delay))
		return `Translated: ${text.substring(0, 50)}...`
	})

	mockDetector.detect.mockResolvedValue([
		{ detectedLanguage: 'en', confidence: 0.95 },
	])
})

afterEach(() => {
	delete window.Summarizer
	delete window.translation
})

describe('Chrome AI Performance Tests', () => {
	const generateContent = (
		size: 'small' | 'medium' | 'large' | 'xl',
	): string => {
		const baseContent = `# Performance Test Blog Post

This is a test blog post designed to evaluate the performance characteristics of the Chrome AI APIs for summarization and translation tasks.

## Introduction

The Chrome AI APIs provide powerful capabilities for content processing, but understanding their performance characteristics is crucial for building responsive user experiences.

## Content Section

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

## Technical Details

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.

## Conclusion

At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.
`

		const multipliers = {
			small: 1,
			medium: 3,
			large: 8,
			xl: 20,
		}

		return baseContent.repeat(multipliers[size])
	}

	describe('Summarization Performance', () => {
		it('should handle small content efficiently', async () => {
			const content = generateContent('small')
			const summarizer = new BlogSummarizer()

			const startTime = performance.now()
			const result = await summarizer.summarizeBlogPost(content, {
				type: 'teaser',
				length: 'medium',
			})
			const endTime = performance.now()

			const duration = endTime - startTime
			expect(duration).toBeLessThan(2000) // Should complete within 2 seconds
			expect(result.summary).toBeTruthy()
			expect(result.wordCount).toBeGreaterThan(0)

			summarizer.destroy()
		})

		it('should handle medium content within reasonable time', async () => {
			const content = generateContent('medium')
			const summarizer = new BlogSummarizer()

			const startTime = performance.now()
			const result = await summarizer.summarizeBlogPost(content, {
				type: 'key-points',
				length: 'medium',
			})
			const endTime = performance.now()

			const duration = endTime - startTime
			expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
			expect(result.summary).toBeTruthy()

			summarizer.destroy()
		})

		it('should handle large content with acceptable performance', async () => {
			const content = generateContent('large')
			const summarizer = new BlogSummarizer()

			const startTime = performance.now()
			const result = await summarizer.summarizeBlogPost(content, {
				type: 'headline',
				length: 'short',
			})
			const endTime = performance.now()

			const duration = endTime - startTime
			expect(duration).toBeLessThan(10000) // Should complete within 10 seconds
			expect(result.summary).toBeTruthy()

			summarizer.destroy()
		})

		it('should track memory usage during summarization', async () => {
			const content = generateContent('large')
			const summarizer = new BlogSummarizer()

			// Get initial memory if available
			const performanceMemory = (
				performance as unknown as { memory?: { usedJSHeapSize: number } }
			).memory
			const initialMemory = performanceMemory?.usedJSHeapSize || 0

			await summarizer.summarizeBlogPost(content, {
				type: 'teaser',
				length: 'medium',
			})

			// Check memory after processing
			const finalMemory = performanceMemory?.usedJSHeapSize || 0

			// Memory should not increase dramatically (test will skip if memory API not available)
			if (initialMemory > 0 && finalMemory > 0) {
				const memoryIncrease = finalMemory - initialMemory
				expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // Less than 50MB increase
			}

			summarizer.destroy()
		})

		it('should handle concurrent summarization requests', async () => {
			const content = generateContent('medium')
			const summarizers = Array.from({ length: 3 }, () => new BlogSummarizer())

			const startTime = performance.now()

			const promises = summarizers.map((summarizer, index) =>
				summarizer.summarizeBlogPost(content, {
					type: index % 2 === 0 ? 'teaser' : 'key-points',
					length: 'medium',
				}),
			)

			const results = await Promise.all(promises)
			const endTime = performance.now()

			const duration = endTime - startTime
			expect(duration).toBeLessThan(8000) // Should complete all within 8 seconds
			expect(results).toHaveLength(3)
			results.forEach(result => expect(result.summary).toBeTruthy())

			summarizers.forEach(summarizer => summarizer.destroy())
		})
	})

	describe('Translation Performance', () => {
		it('should handle small content translation efficiently', async () => {
			const content = generateContent('small')
			const translator = new BlogTranslator()

			const startTime = performance.now()
			const result = await translator.translateBlogPost(content, 'en', 'es')
			const endTime = performance.now()

			const duration = endTime - startTime
			expect(duration).toBeLessThan(2000) // Should complete within 2 seconds
			expect(result.translatedContent).toBeTruthy()
			expect(result.wordCount).toBeGreaterThan(0)

			translator.destroy()
		})

		it('should handle medium content translation within reasonable time', async () => {
			const content = generateContent('medium')
			const translator = new BlogTranslator()

			const startTime = performance.now()
			const result = await translator.translateBlogPost(content, 'en', 'fr')
			const endTime = performance.now()

			const duration = endTime - startTime
			expect(duration).toBeLessThan(6000) // Should complete within 6 seconds
			expect(result.translatedContent).toBeTruthy()

			translator.destroy()
		})

		it('should handle large content translation with acceptable performance', async () => {
			const content = generateContent('large')
			const translator = new BlogTranslator()

			const startTime = performance.now()
			const result = await translator.translateBlogPost(content, 'en', 'de')
			const endTime = performance.now()

			const duration = endTime - startTime
			expect(duration).toBeLessThan(12000) // Should complete within 12 seconds
			expect(result.translatedContent).toBeTruthy()

			translator.destroy()
		})

		it('should handle concurrent translation requests', async () => {
			const content = generateContent('medium')
			const translators = Array.from({ length: 3 }, () => new BlogTranslator())

			const languagePairs = [
				['en', 'es'],
				['en', 'fr'],
				['en', 'de'],
			] as const

			const startTime = performance.now()

			const promises = translators.map((translator, index) =>
				translator.translateBlogPost(
					content,
					languagePairs[index][0],
					languagePairs[index][1],
				),
			)

			const results = await Promise.all(promises)
			const endTime = performance.now()

			const duration = endTime - startTime
			expect(duration).toBeLessThan(10000) // Should complete all within 10 seconds
			expect(results).toHaveLength(3)
			results.forEach(result => expect(result.translatedContent).toBeTruthy())

			translators.forEach(translator => translator.destroy())
		})

		it('should handle language detection performance', async () => {
			const content = generateContent('medium')
			const translator = new BlogTranslator()

			const startTime = performance.now()
			const detectionResult = await translator.detectLanguage(content)
			const endTime = performance.now()

			const duration = endTime - startTime
			expect(duration).toBeLessThan(1000) // Language detection should be fast
			expect(detectionResult.language).toBeTruthy()
			expect(detectionResult.confidence).toBeGreaterThan(0)

			translator.destroy()
		})
	})

	describe('Combined Workflow Performance', () => {
		it('should handle summarize-then-translate workflow efficiently', async () => {
			const content = generateContent('large')
			const summarizer = new BlogSummarizer()
			const translator = new BlogTranslator()

			const startTime = performance.now()

			// Step 1: Summarize
			const summaryResult = await summarizer.summarizeBlogPost(content, {
				type: 'key-points',
				length: 'short',
			})

			// Step 2: Translate the summary
			const translationResult = await translator.translateBlogPost(
				summaryResult.summary,
				'en',
				'es',
			)

			const endTime = performance.now()

			const duration = endTime - startTime
			expect(duration).toBeLessThan(8000) // Combined workflow should complete within 8 seconds
			expect(summaryResult.summary).toBeTruthy()
			expect(translationResult.translatedContent).toBeTruthy()

			summarizer.destroy()
			translator.destroy()
		})

		it('should handle translate-then-summarize workflow efficiently', async () => {
			const content = generateContent('large')
			const translator = new BlogTranslator()
			const summarizer = new BlogSummarizer()

			const startTime = performance.now()

			// Step 1: Translate
			const translationResult = await translator.translateBlogPost(
				content,
				'en',
				'fr',
			)

			// Step 2: Summarize the translation
			const summaryResult = await summarizer.summarizeBlogPost(
				translationResult.translatedContent,
				{ type: 'teaser', length: 'medium' },
			)

			const endTime = performance.now()

			const duration = endTime - startTime
			expect(duration).toBeLessThan(15000) // Combined workflow should complete within 15 seconds
			expect(translationResult.translatedContent).toBeTruthy()
			expect(summaryResult.summary).toBeTruthy()

			translator.destroy()
			summarizer.destroy()
		})

		it('should handle multiple concurrent combined workflows', async () => {
			const content = generateContent('medium')
			const workflows = Array.from({ length: 2 }, () => ({
				summarizer: new BlogSummarizer(),
				translator: new BlogTranslator(),
			}))

			const startTime = performance.now()

			const promises = workflows.map(async ({ summarizer, translator }) => {
				const summaryResult = await summarizer.summarizeBlogPost(content, {
					type: 'teaser',
					length: 'short',
				})

				return translator.translateBlogPost(summaryResult.summary, 'en', 'es')
			})

			const results = await Promise.all(promises)
			const endTime = performance.now()

			const duration = endTime - startTime
			expect(duration).toBeLessThan(12000) // Should complete all workflows within 12 seconds
			expect(results).toHaveLength(2)
			results.forEach(result => expect(result.translatedContent).toBeTruthy())

			workflows.forEach(({ summarizer, translator }) => {
				summarizer.destroy()
				translator.destroy()
			})
		})
	})

	describe('Resource Management Performance', () => {
		it('should properly clean up resources after operations', async () => {
			const content = generateContent('medium')
			const summarizer = new BlogSummarizer()

			await summarizer.summarizeBlogPost(content, {
				type: 'teaser',
				length: 'medium',
			})

			// Cleanup should be called
			summarizer.destroy()
			expect(mockSummarizer.destroy).toHaveBeenCalled()
		})

		it('should handle rapid creation and destruction of instances', async () => {
			const content = generateContent('small')

			const startTime = performance.now()

			for (let i = 0; i < 5; i++) {
				const summarizer = new BlogSummarizer()
				await summarizer.summarizeBlogPost(content, {
					type: 'headline',
					length: 'short',
				})
				summarizer.destroy()
			}

			const endTime = performance.now()
			const duration = endTime - startTime

			expect(duration).toBeLessThan(5000) // Should handle rapid cycles efficiently
			expect(mockSummarizer.destroy).toHaveBeenCalledTimes(5)
		})

		it('should maintain performance with reused instances', async () => {
			const content = generateContent('medium')
			const summarizer = new BlogSummarizer()

			const durations: number[] = []

			// Run multiple operations with the same instance
			for (let i = 0; i < 3; i++) {
				const startTime = performance.now()
				await summarizer.summarizeBlogPost(content, {
					type: 'key-points',
					length: 'medium',
				})
				const endTime = performance.now()
				durations.push(endTime - startTime)
			}

			// Performance should remain consistent (no significant degradation)
			const avgDuration =
				durations.reduce((a, b) => a + b, 0) / durations.length
			expect(avgDuration).toBeLessThan(4000)

			// Check that performance doesn't degrade significantly across runs
			const maxDuration = Math.max(...durations)
			const minDuration = Math.min(...durations)
			expect(maxDuration / minDuration).toBeLessThan(3) // No more than 3x difference

			summarizer.destroy()
		})
	})
})
