/**
 * Translation utility using Chrome AI Translation API
 * Handles MDX content translation while preserving markdown structure
 */

// Type definitions for Chrome AI APIs
interface LanguageDetectionResult {
	detectedLanguage: string
	confidence: number
}

interface TranslatorOptions {
	sourceLanguage: string
	targetLanguage: string
}

interface ChromeAITranslator {
	translate(text: string): Promise<string>
}

interface ChromeAILanguageDetector {
	detect(text: string): Promise<LanguageDetectionResult[]>
}

declare global {
	interface Window {
		LanguageDetector?: {
			create(): Promise<ChromeAILanguageDetector>
		}
		Translator?: {
			availability(
				options: TranslatorOptions,
			): Promise<'readily' | 'after-download' | 'unavailable'>
			create(options: TranslatorOptions): Promise<ChromeAITranslator>
		}
		translation?: {
			canTranslate(
				options: TranslatorOptions,
			): Promise<'readily' | 'after-download' | 'unavailable'>
			createTranslator(options: TranslatorOptions): Promise<ChromeAITranslator>
			canDetect(): Promise<'readily' | 'after-download' | 'unavailable'>
			createDetector(): Promise<ChromeAILanguageDetector>
		}
	}
}

export interface TranslationResult {
	success: boolean
	translatedContent?: string
	error?: string
	sourceLanguage?: string
	targetLanguage: string
	wordCount: number
}

export interface DetectionResult {
	language: string
	confidence: number
}

export class BlogTranslator {
	private supportedLanguages = ['es', 'pt', 'en', 'fr', 'de', 'it']
	private translator: ChromeAITranslator | null = null

	async isAPIAvailable(): Promise<boolean> {
		return (
			!!(window.LanguageDetector && window.Translator) || !!window.translation
		)
	}

	async isSupported(): Promise<boolean> {
		return this.isAPIAvailable()
	}

	async canTranslate(
		sourceLanguage: string,
		targetLanguage: string,
	): Promise<boolean> {
		const availability = await this.checkTranslationAvailability(
			sourceLanguage,
			targetLanguage,
		)
		return availability === 'readily' || availability === 'after-download'
	}

	isValidLanguageCode(code: string): boolean {
		return this.supportedLanguages.includes(code.toLowerCase())
	}

	destroy(): void {
		this.translator = null
	}

	async detectLanguage(text: string): Promise<DetectionResult> {
		if (!window.LanguageDetector && !window.translation) {
			throw new Error('Language Detection API not available')
		}

		try {
			let results: LanguageDetectionResult[] = []
			if (window.LanguageDetector) {
				const detector = await window.LanguageDetector.create()
				results = await detector.detect(text.substring(0, 1000))
			} else if (window.translation) {
				const detector = await window.translation.createDetector()
				results = await detector.detect(text.substring(0, 1000))
			}

			return {
				language: results[0]?.detectedLanguage || 'en',
				confidence: results[0]?.confidence || 1.0,
			}
		} catch (error) {
			console.warn('Language detection failed, defaulting to English:', error)
			return { language: 'en', confidence: 0.0 }
		}
	}

	async checkTranslationAvailability(
		sourceLanguage: string,
		targetLanguage: string,
	): Promise<string> {
		if (!window.Translator && !window.translation) {
			throw new Error('Translation API not available')
		}

		try {
			if (window.Translator) {
				return await window.Translator.availability({
					sourceLanguage,
					targetLanguage,
				})
			} else if (window.translation) {
				// Safely check for different method names in the experimental API
				const translation = window.translation
				if ('canTranslate' in translation) {
					return await translation.canTranslate({
						sourceLanguage,
						targetLanguage,
					})
				} else if (
					'availability' in (translation as unknown as Record<string, any>)
				) {
					return await (translation as unknown as any).availability({
						sourceLanguage,
						targetLanguage,
					})
				}
			}
			return 'unavailable'
		} catch (error) {
			console.error('Failed to check translation availability:', error)
			return 'unavailable'
		}
	}

	async waitForModelDownload(
		sourceLanguage: string,
		targetLanguage: string,
		maxWaitTime: number = 30000,
	): Promise<string> {
		const startTime = Date.now()

		while (Date.now() - startTime < maxWaitTime) {
			const availability = await this.checkTranslationAvailability(
				sourceLanguage,
				targetLanguage,
			)

			if (availability === 'readily') {
				return 'readily'
			}

			if (availability === 'unavailable') {
				return 'unavailable'
			}

			// Wait 1 second before checking again
			await new Promise(resolve => setTimeout(resolve, 1000))
		}

		return 'timeout'
	}

	async translateBlogPost(
		content: string,

		targetLanguage: string,

		sourceLanguage?: string,

		onProgress?: (status: string) => void,
	): Promise<TranslationResult> {
		try {
			onProgress?.('Checking translation capability...')

			// Check API availability

			if (!(await this.isAPIAvailable())) {
				throw new Error('Translation API is not available')
			}

			onProgress?.('Detecting source language...')

			// Detect source language if not provided

			const detection = sourceLanguage
				? { language: sourceLanguage, confidence: 1.0 }
				: await this.detectLanguage(content)

			const detectedLanguage = detection.language

			onProgress?.('Checking translation capability...')

			// Use the existing check instead of calling availability again

			// but we need to ensure we have the string value for later logic

			const availability = await this.checkTranslationAvailability(
				detectedLanguage,

				targetLanguage,
			)

			if (availability !== 'readily' && availability !== 'after-download') {
				throw new Error(
					`Translation from ${detectedLanguage} to ${targetLanguage} is not supported`,
				)
			}

			// Handle downloading state

			if (availability === 'after-download') {
				onProgress?.('Downloading translation models...')

				// waitForModelDownload already calls checkTranslationAvailability in a loop

				const downloadResult = await this.waitForModelDownload(
					detectedLanguage,
					targetLanguage,
				)

				if (downloadResult !== 'readily') {
					throw new Error(
						'Translation models need to be downloaded first. Please try again in a moment.',
					)
				}
			}

			onProgress?.('Preparing content for translation...')

			// Create translator

			let translator: ChromeAITranslator

			if (window.Translator) {
				translator = await window.Translator.create({
					sourceLanguage: detectedLanguage,

					targetLanguage,
				})
			} else if (window.translation) {
				translator = await window.translation.createTranslator({
					sourceLanguage: detectedLanguage,

					targetLanguage,
				})
			} else {
				throw new Error('Translation API not available')
			}

			onProgress?.('Translating content...')

			// Parse and translate content

			const translatedContent = await this.translateMDXContent(
				translator,

				content,
			)

			onProgress?.('Translation complete!')

			return {
				success: true,

				translatedContent,

				sourceLanguage: detectedLanguage,

				targetLanguage,

				wordCount: translatedContent.trim()
					? translatedContent.trim().split(/\s+/).length
					: 0,
			}
		} catch (error) {
			console.error('Translation failed:', error)

			throw error // Re-throw to be caught by the caller
		}
	}

	private async translateMDXContent(
		translator: ChromeAITranslator,

		content: string,
	): Promise<string> {
		// Split content into paragraphs for better translation

		// Use a simpler approach for single-paragraph/single-line content

		if (!content.includes('\n\n')) {
			return await this.translatePreservingMarkdown(translator, content)
		}

		const paragraphs = content.split('\n\n')

		const translatedParagraphs: string[] = []

		for (const paragraph of paragraphs) {
			if (this.shouldSkipTranslation(paragraph)) {
				// Keep code blocks, frontmatter, and special markdown as-is

				translatedParagraphs.push(paragraph)
			} else {
				// Translate content while preserving inline markdown

				const translatedParagraph = await this.translatePreservingMarkdown(
					translator,

					paragraph,
				)

				translatedParagraphs.push(translatedParagraph)
			}
		}

		return translatedParagraphs.join('\n\n')
	}

	private shouldSkipTranslation(paragraph: string): boolean {
		// Skip code blocks
		if (paragraph.startsWith('```') || paragraph.includes('```')) {
			return true
		}

		// Skip frontmatter (YAML blocks)
		if (paragraph.startsWith('---') && paragraph.endsWith('---')) {
			return true
		}

		// Skip HTML/JSX components (improved detection)
		const trimmed = paragraph.trim()
		if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
			return true
		}

		// Skip paragraphs that are mostly JSX/HTML (contain class attributes, etc.)
		if (
			trimmed.includes('className=') ||
			trimmed.includes('class=') ||
			trimmed.includes('<div') ||
			trimmed.includes('</div>') ||
			trimmed.includes('<span') ||
			trimmed.includes('</span>') ||
			trimmed.includes('import ') ||
			trimmed.includes('export ')
		) {
			return true
		}

		// Skip if paragraph is mostly special characters, markdown syntax, or very short
		if (
			paragraph.trim().length < 3 ||
			/^[\s\-#*>`[\](){}]+$/.test(paragraph.trim()) ||
			/^#{1,6}\s*$/.test(paragraph.trim()) // Empty headings
		) {
			return true
		}

		// Skip lines that are mostly HTML attributes or CSS classes
		if (
			/^[\s]*[a-zA-Z-]+[\s]*[:=]/.test(trimmed) ||
			/class.*=/.test(trimmed) ||
			/^\s*[{}[\]]+\s*$/.test(trimmed)
		) {
			return true
		}

		return false
	}

	private async translatePreservingMarkdown(
		translator: ChromeAITranslator,
		text: string,
	): Promise<string> {
		// Preserve inline code, links, JSX/HTML elements, and other markdown elements
		const preservePatterns = [
			// Code and technical elements
			{ pattern: /`([^`]+)`/g, placeholder: 'INLINE_CODE_' },
			{ pattern: /```[\s\S]*?```/g, placeholder: 'CODE_BLOCK_' },

			// HTML/JSX elements and attributes
			{ pattern: /<[^>]+>/g, placeholder: 'HTML_ELEMENT_' },
			{ pattern: /\{[^}]+\}/g, placeholder: 'JSX_EXPRESSION_' },
			{ pattern: /className="[^"]*"/g, placeholder: 'CLASS_NAME_' },
			{ pattern: /class="[^"]*"/g, placeholder: 'CLASS_ATTR_' },
			{
				pattern: /import\s+.*?from\s+['"][^'"]*['"]/g,
				placeholder: 'IMPORT_STMT_',
			},
			{ pattern: /export\s+.*?[;\n]/g, placeholder: 'EXPORT_STMT_' },

			// Markdown elements
			{ pattern: /\[([^\]]+)\]\(([^)]+)\)/g, placeholder: 'MARKDOWN_LINK_' },
			{ pattern: /!\[([^\]]*)\]\(([^)]+)\)/g, placeholder: 'MARKDOWN_IMAGE_' },
			{ pattern: /\*\*([^*]+)\*\*/g, placeholder: 'BOLD_TEXT_' },
			{ pattern: /\*([^*]+)\*/g, placeholder: 'ITALIC_TEXT_' },
			{ pattern: /^#{1,6}\s+/gm, placeholder: 'HEADING_' },

			// URLs and email addresses
			{ pattern: /https?:\/\/[^\s]+/g, placeholder: 'URL_' },
			{
				pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
				placeholder: 'EMAIL_',
			},
		]

		let protectedText = text
		const replacements = new Map<string, string>()
		let placeholderIndex = 0

		// Replace protected content with placeholders
		preservePatterns.forEach(({ pattern, placeholder }) => {
			protectedText = protectedText.replace(pattern, match => {
				const placeholderKey = `${placeholder}${placeholderIndex++}`
				replacements.set(placeholderKey, match)
				return placeholderKey
			})
		})

		// Additional cleanup: remove any remaining HTML/CSS class patterns
		const cleanedText = protectedText
			.replace(/[\w-]+:/g, 'PROPERTY_NAME:') // CSS property names
			.replace(/\b[a-z-]+\s*=\s*["'][^"']*["']/g, 'ATTRIBUTE_VALUE') // HTML attributes

		// Translate the text with placeholders
		let translatedText: string
		// Only translate if there's actual text content after removing placeholders
		const textToTranslate = cleanedText.replace(/[A-Z_]+\d+/g, '').trim()
		if (textToTranslate.length < 3) {
			translatedText = protectedText // Don't translate if mostly placeholders
		} else {
			translatedText = await translator.translate(protectedText)
		}

		// Restore protected content
		replacements.forEach((original, placeholder) => {
			translatedText = translatedText.replace(
				new RegExp(placeholder, 'g'),
				original,
			)
		})

		return translatedText
	}

	getLanguageName(languageCode: string): string {
		const displayNames = new Intl.DisplayNames(['en'], { type: 'language' })
		try {
			return displayNames.of(languageCode) || languageCode.toUpperCase()
		} catch {
			return languageCode.toUpperCase()
		}
	}

	getSupportedLanguages(): Array<{ code: string; name: string; flag: string }> {
		return [
			{ code: 'en', name: 'English', flag: '🇺🇸' },
			{ code: 'es', name: 'Español', flag: '🇪🇸' },
			{ code: 'pt', name: 'Português', flag: '🇵🇹' },
			{ code: 'fr', name: 'Français', flag: '🇫🇷' },
			{ code: 'de', name: 'Deutsch', flag: '🇩🇪' },
			{ code: 'it', name: 'Italiano', flag: '🇮🇹' },
		]
	}
}

// Export singleton instance
export const blogTranslator = new BlogTranslator()
