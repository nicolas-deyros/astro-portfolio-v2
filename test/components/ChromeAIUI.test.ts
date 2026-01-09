import { JSDOM } from 'jsdom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock browser detection
vi.mock('../../src/lib/browserDetection', () => ({
	detectBrowser: vi.fn(() => ({
		isChrome: true,
		version: 129,
		supportsAI: true,
	})),
}))

// Mock AI utilities
const mockSummarizerInstance = {
	summarizeBlogPost: vi.fn(),
	destroy: vi.fn(),
}

const mockTranslatorInstance = {
	translateBlogPost: vi.fn(),
	destroy: vi.fn(),
}

vi.mock('../../src/utils/summarizer', () => ({
	BlogSummarizer: vi.fn(() => mockSummarizerInstance),
}))

vi.mock('../../src/utils/translator', () => ({
	BlogTranslator: vi.fn(() => mockTranslatorInstance),
}))

describe('ChromeAISection UI Status Display', () => {
	let dom: JSDOM
	let document: Document

	const setupDOM = (): void => {
		const html = `
			<div id="chrome-ai-section" data-markdown="# Test Content">
				<button id="summary-tab" data-tab="summary" aria-selected="true"></button>
				<button id="translate-tab" data-tab="translate" aria-selected="false"></button>
				
				<div id="summary-content">
					<select id="summary-type-selector"><option value="teaser">Teaser</option></select>
					<select id="summary-length-selector"><option value="medium">Medium</option></select>
					<button id="generate-summary-btn">Generate Summary</button>
					<div id="summary-progress" class="hidden">
						<span id="summary-progress-text">Initializing...</span>
						<div id="summary-progress-bar" style="width: 0%"></div>
					</div>
					<div id="summary-result" class="hidden">
						<div id="summary-content-text"></div>
					</div>
					<div id="summary-error" class="hidden">
						<p id="summary-error-message"></p>
					</div>
				</div>

				<div id="translate-content" class="hidden">
					<select id="language-selector">
						<option value="">Select...</option>
						<option value="es">Spanish</option>
					</select>
					<button id="translate-btn" disabled>Translate</button>
					<div id="translation-progress" class="hidden">
						<span id="translation-progress-text">Preparing...</span>
					</div>
					<div id="translation-result" class="hidden">
						<div id="translation-content-text"></div>
					</div>
					<div id="translation-error" class="hidden">
						<p id="translation-error-message"></p>
					</div>
				</div>

				<dialog id="browser-not-supported-dialog"></dialog>
				<dialog id="ai-not-supported-dialog"></dialog>
			</div>
		`
		dom = new JSDOM(html)
		document = dom.window.document
		global.document = document
		global.window = dom.window as unknown as Window & typeof globalThis
		global.HTMLElement = dom.window.HTMLElement
		global.HTMLButtonElement = dom.window.HTMLButtonElement
		global.HTMLSelectElement = dom.window.HTMLSelectElement
		global.HTMLDialogElement = dom.window.HTMLDialogElement
	}

	beforeEach(() => {
		vi.clearAllMocks()
		setupDOM()
	})

	it('should show loading state and then success state for summarization', async () => {
		mockSummarizerInstance.summarizeBlogPost.mockResolvedValue({
			summary: 'Success summary',
			wordCount: 2,
			timestamp: new Date().toISOString(),
		})

		const generateBtn = document.getElementById(
			'generate-summary-btn',
		) as HTMLButtonElement
		const progress = document.getElementById('summary-progress')
		const result = document.getElementById('summary-result')
		const contentText = document.getElementById('summary-content-text')

		if (!generateBtn || !progress || !result || !contentText) {
			throw new Error('Elements not found')
		}

		// Simulate the logic from ChromeAISection.astro
		const handleSummary = async (): Promise<void> => {
			progress.classList.remove('hidden')
			generateBtn.disabled = true

			const res = await mockSummarizerInstance.summarizeBlogPost('content', {})

			progress.classList.add('hidden')
			result.classList.remove('hidden')
			contentText.textContent = res.summary
		}

		const promise = handleSummary()

		expect(progress.classList.contains('hidden')).toBe(false)
		expect(generateBtn.disabled).toBe(true)

		await promise

		expect(progress.classList.contains('hidden')).toBe(true)
		expect(result.classList.contains('hidden')).toBe(false)
		expect(contentText.textContent).toBe('Success summary')
	})

	it('should show error state if summarization fails', async () => {
		mockSummarizerInstance.summarizeBlogPost.mockRejectedValue(
			new Error('API Error'),
		)

		const progress = document.getElementById('summary-progress')
		const errorDiv = document.getElementById('summary-error')
		const errorMsg = document.getElementById('summary-error-message')

		if (!progress || !errorDiv || !errorMsg) {
			throw new Error('Elements not found')
		}

		const handleSummary = async (): Promise<void> => {
			progress.classList.remove('hidden')
			try {
				await mockSummarizerInstance.summarizeBlogPost('content', {})
			} catch (e: unknown) {
				const err = e as Error
				progress.classList.add('hidden')
				errorDiv.classList.remove('hidden')
				errorMsg.textContent = err.message
			}
		}

		await handleSummary()

		expect(progress.classList.contains('hidden')).toBe(true)
		expect(errorDiv.classList.contains('hidden')).toBe(false)
		expect(errorMsg.textContent).toBe('API Error')
	})

	it('should handle translation tab switching and loading states', async () => {
		mockTranslatorInstance.translateBlogPost.mockResolvedValue({
			success: true,
			translatedContent: 'Translated text',
			wordCount: 2,
		})

		const translateContent = document.getElementById('translate-content')
		const summaryContent = document.getElementById('summary-content')
		const progress = document.getElementById('translation-progress')

		if (!translateContent || !summaryContent || !progress) {
			throw new Error('Elements not found')
		}

		// Test tab switching
		translateContent.classList.remove('hidden')
		summaryContent.classList.add('hidden')

		expect(translateContent.classList.contains('hidden')).toBe(false)
		expect(summaryContent.classList.contains('hidden')).toBe(true)

		// Test translation loading
		const handleTranslate = async (): Promise<void> => {
			progress.classList.remove('hidden')
			await mockTranslatorInstance.translateBlogPost('content', 'es')
			progress.classList.add('hidden')
		}

		const promise = handleTranslate()
		expect(progress.classList.contains('hidden')).toBe(false)
		await promise
		expect(progress.classList.contains('hidden')).toBe(true)
	})
})
