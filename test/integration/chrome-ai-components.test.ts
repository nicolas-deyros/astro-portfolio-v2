import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BlogSummarizer } from '../../src/utils/summarizer'
import { BlogTranslator } from '../../src/utils/translator'

// Mock Chrome AI APIs
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

// Extend Window interface
declare global {
	interface Window {
		Summarizer?: {
			availability: () => Promise<'available' | 'downloadable' | 'no'>
			create: (options: {
				type: string
				format: string
				length: string
			}) => Promise<{
				summarize: (text: string) => Promise<string>
				destroy: () => void
			}>
		}
		translation?: {
			canTranslate: (options: {
				sourceLanguage: string
				targetLanguage: string
			}) => Promise<string>
			createTranslator: (options: {
				sourceLanguage: string
				targetLanguage: string
			}) => Promise<{
				translate: (text: string) => Promise<string>
				destroy: () => void
			}>
			canDetect: () => Promise<string>
			createDetector: () => Promise<{
				detect: (
					text: string,
				) => Promise<Array<{ detectedLanguage: string; confidence: number }>>
				destroy: () => void
			}>
		}
	}
}

beforeEach(() => {
	vi.clearAllMocks()

	// Mock Chrome AI APIs
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

	// Default mock responses
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

describe('Chrome AI Integration Tests', () => {
	const testBlogContent = `# Test Blog Post

This is a comprehensive test blog post with multiple sections that will be used to test both the summarization and translation capabilities of the Chrome AI APIs.

## Introduction

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## Main Content

Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

### Subsection

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

## Conclusion

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`

	describe('End-to-End Summarization Workflow', () => {
		it('should complete full summarization workflow', async () => {
			const expectedSummary =
				'• Main points about the test blog post\n• Key insights and conclusions\n• Important takeaways'
			mockSummarizer.summarize.mockResolvedValue(expectedSummary)

			const summarizer = new BlogSummarizer()

			// Test availability check
			const isSupported = await summarizer.isSupported()
			expect(isSupported).toBe(true)

			// Test summarization
			const result = await summarizer.summarizeBlogPost(testBlogContent, {
				type: 'key-points',
				length: 'medium',
			})

			expect(result.summary).toBe(expectedSummary)
			expect(result.type).toBe('key-points')
			expect(result.length).toBe('medium')
			expect(result.wordCount).toBeGreaterThan(0)

			summarizer.destroy()
		})

		it('should handle different summary types and lengths', async () => {
			const testCases = [
				{ type: 'key-points' as const, length: 'short' as const },
				{ type: 'teaser' as const, length: 'medium' as const },
				{ type: 'headline' as const, length: 'long' as const },
			]

			const summarizer = new BlogSummarizer()

			for (const testCase of testCases) {
				const expectedResult = `${testCase.type} summary in ${testCase.length} format`
				mockSummarizer.summarize.mockResolvedValue(expectedResult)

				const result = await summarizer.summarizeBlogPost(
					testBlogContent,
					testCase,
				)

				expect(result.summary).toBe(expectedResult)
				expect(result.type).toBe(testCase.type)
				expect(result.length).toBe(testCase.length)
			}

			summarizer.destroy()
		})

		it('should handle progress callbacks during summarization', async () => {
			const progressCallback = vi.fn()
			const summarizer = new BlogSummarizer()

			await summarizer.summarizeBlogPost(
				testBlogContent,
				{ type: 'teaser', length: 'medium' },
				progressCallback,
			)

			expect(progressCallback).toHaveBeenCalledWith(
				'Checking model availability...',
			)
			expect(progressCallback).toHaveBeenCalledWith(
				'Initializing summarizer...',
			)
			expect(progressCallback).toHaveBeenCalledWith('Processing content...')
			expect(progressCallback).toHaveBeenCalledWith('Generating summary...')

			summarizer.destroy()
		})
	})

	describe('End-to-End Translation Workflow', () => {
		it('should complete full translation workflow', async () => {
			const expectedTranslation = 'Contenido traducido del blog de prueba'
			mockTranslator.translate.mockResolvedValue(expectedTranslation)

			const translator = new BlogTranslator()

			// Test availability check
			const isSupported = await translator.isSupported()
			expect(isSupported).toBe(true)

			// Test translation capability
			const canTranslate = await translator.canTranslate('en', 'es')
			expect(canTranslate).toBe(true)

			// Test translation
			const result = await translator.translateBlogPost(
				testBlogContent,
				'en',
				'es',
			)

			expect(result.translatedContent).toBe(expectedTranslation)
			expect(result.sourceLanguage).toBe('en')
			expect(result.targetLanguage).toBe('es')
			expect(result.wordCount).toBeGreaterThan(0)

			translator.destroy()
		})

		it('should handle language detection', async () => {
			const translator = new BlogTranslator()

			const detectionResult = await translator.detectLanguage('Hello world')

			expect(detectionResult.language).toBe('en')
			expect(detectionResult.confidence).toBe(0.95)

			translator.destroy()
		})

		it('should handle translation with progress callbacks', async () => {
			const progressCallback = vi.fn()
			const translator = new BlogTranslator()

			await translator.translateBlogPost(
				testBlogContent,
				'en',
				'es',
				progressCallback,
			)

			expect(progressCallback).toHaveBeenCalledWith(
				'Preparing content for translation...',
			)
			expect(progressCallback).toHaveBeenCalledWith(
				'Checking translation capability...',
			)
			expect(progressCallback).toHaveBeenCalledWith('Creating translator...')
			expect(progressCallback).toHaveBeenCalledWith('Translating content...')

			translator.destroy()
		})
	})

	describe('Combined Summarization and Translation Workflow', () => {
		it('should summarize and then translate content', async () => {
			const originalSummary =
				'This is a summary of the blog post with key points.'
			const translatedSummary = 'Este es un resumen del blog con puntos clave.'

			mockSummarizer.summarize.mockResolvedValue(originalSummary)
			mockTranslator.translate.mockResolvedValue(translatedSummary)

			const summarizer = new BlogSummarizer()
			const translator = new BlogTranslator()

			// Step 1: Summarize the original content
			const summaryResult = await summarizer.summarizeBlogPost(
				testBlogContent,
				{ type: 'key-points', length: 'medium' },
			)

			expect(summaryResult.summary).toBe(originalSummary)

			// Step 2: Translate the summary
			const translationResult = await translator.translateBlogPost(
				summaryResult.summary,
				'en',
				'es',
			)

			expect(translationResult.translatedContent).toBe(translatedSummary)
			expect(translationResult.sourceLanguage).toBe('en')
			expect(translationResult.targetLanguage).toBe('es')

			summarizer.destroy()
			translator.destroy()
		})

		it('should translate and then summarize content', async () => {
			const translatedContent =
				'Contenido traducido del blog completo en español'
			const summaryOfTranslation = 'Resumen del contenido traducido'

			mockTranslator.translate.mockResolvedValue(translatedContent)
			mockSummarizer.summarize.mockResolvedValue(summaryOfTranslation)

			const translator = new BlogTranslator()
			const summarizer = new BlogSummarizer()

			// Step 1: Translate the original content
			const translationResult = await translator.translateBlogPost(
				testBlogContent,
				'en',
				'es',
			)

			expect(translationResult.translatedContent).toBe(translatedContent)

			// Step 2: Summarize the translated content
			const summaryResult = await summarizer.summarizeBlogPost(
				translationResult.translatedContent,
				{ type: 'teaser', length: 'short' },
			)

			expect(summaryResult.summary).toBe(summaryOfTranslation)
			expect(summaryResult.type).toBe('teaser')
			expect(summaryResult.length).toBe('short')

			translator.destroy()
			summarizer.destroy()
		})

		it('should handle combined workflow with progress tracking', async () => {
			const summaryProgressCallback = vi.fn()
			const translationProgressCallback = vi.fn()

			const summarizer = new BlogSummarizer()
			const translator = new BlogTranslator()

			// Combined workflow with progress tracking
			const summaryResult = await summarizer.summarizeBlogPost(
				testBlogContent,
				{ type: 'key-points', length: 'medium' },
				summaryProgressCallback,
			)

			const translationResult = await translator.translateBlogPost(
				summaryResult.summary,
				'en',
				'es',
				translationProgressCallback,
			)

			// Verify progress callbacks were called
			expect(summaryProgressCallback).toHaveBeenCalled()
			expect(translationProgressCallback).toHaveBeenCalled()

			// Verify results
			expect(summaryResult.summary).toBeTruthy()
			expect(translationResult.translatedContent).toBeTruthy()

			summarizer.destroy()
			translator.destroy()
		})
	})

	describe('Error Handling in Combined Workflows', () => {
		it('should handle summarization errors gracefully', async () => {
			mockSummarizer.summarize.mockRejectedValue(
				new Error('Summarization failed'),
			)

			const summarizer = new BlogSummarizer()

			await expect(
				summarizer.summarizeBlogPost(testBlogContent, {
					type: 'teaser',
					length: 'medium',
				}),
			).rejects.toThrow('Summarization failed')

			summarizer.destroy()
		})

		it('should handle translation errors gracefully', async () => {
			mockTranslator.translate.mockRejectedValue(
				new Error('Translation failed'),
			)

			const translator = new BlogTranslator()

			await expect(
				translator.translateBlogPost(testBlogContent, 'en', 'es'),
			).rejects.toThrow('Translation failed')

			translator.destroy()
		})

		it('should clean up resources on error', async () => {
			mockSummarizer.summarize.mockRejectedValue(new Error('Test error'))

			const summarizer = new BlogSummarizer()

			try {
				await summarizer.summarizeBlogPost(testBlogContent, {
					type: 'teaser',
					length: 'medium',
				})
			} catch {
				// Expected to throw
			}

			// Verify cleanup still happens
			summarizer.destroy()
			expect(mockSummarizer.destroy).toHaveBeenCalled()
		})
	})

	describe('Real-world Content Processing', () => {
		it('should handle complex markdown content', async () => {
			const complexMarkdown = `
# Complex Blog Post

This post contains **bold text**, *italic text*, and \`inline code\`.

## Code Examples

\`\`\`javascript
function example() {
    console.log('This should be cleaned');
}
\`\`\`

## Links and Images

Check out [this link](https://example.com) and this image:

![Alt text](image.jpg)

## Lists

- Item 1
- Item 2
  - Nested item
  - Another nested item

1. Numbered item
2. Another numbered item

> This is a blockquote with important information.

## Tables

| Column 1 | Column 2 |
|----------|----------|
| Data 1   | Data 2   |
			`

			const summarizer = new BlogSummarizer()
			const translator = new BlogTranslator()

			// Test summarization with complex content
			const summaryResult = await summarizer.summarizeBlogPost(
				complexMarkdown,
				{ type: 'key-points', length: 'medium' },
			)

			expect(summaryResult.summary).toBeTruthy()
			expect(summaryResult.wordCount).toBeGreaterThan(0)

			// Test translation with complex content
			const translationResult = await translator.translateBlogPost(
				complexMarkdown,
				'en',
				'es',
			)

			expect(translationResult.translatedContent).toBeTruthy()
			expect(translationResult.wordCount).toBeGreaterThan(0)

			summarizer.destroy()
			translator.destroy()
		})
	})
})
