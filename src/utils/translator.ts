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
			canTranslate(options: TranslatorOptions): Promise<'readily' | 'after-download' | 'unavailable'>
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

export class BlogTranslator {
	private supportedLanguages = ['es', 'pt', 'en', 'fr', 'de', 'it']
	private translator: ChromeAITranslator | null = null

	async isAPIAvailable(): Promise<boolean> {
		return !!(window.LanguageDetector && window.Translator) || !!window.translation
	}

	async isSupported(): Promise<boolean> {
		return this.isAPIAvailable()
	}

	isValidLanguageCode(code: string): boolean {
		return this.supportedLanguages.includes(code.toLowerCase())
	}

	destroy(): void {
		this.translator = null
	}

	async detectLanguage(text: string): Promise<string> {
		if (!window.LanguageDetector && !window.translation) {
			throw new Error('Language Detection API not available')
		}

		try {
			const detector = window.LanguageDetector 
				? await window.LanguageDetector.create()
				: await window.translation!.createDetector()
			
			const results = await detector.detect(text.substring(0, 1000)) // Use first 1000 chars for detection
			return results[0]?.detectedLanguage || 'en'
		} catch (error) {
			console.warn('Language detection failed, defaulting to English:', error)
			return 'en'
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
			} else {
				// The translation.canTranslate method name varies
				const translation = window.translation as any
				const checkFn = translation.canTranslate || translation.availability
				return await checkFn.call(translation, {
					sourceLanguage,
					targetLanguage,
				})
			}
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
	): Promise<TranslationResult> {
		try {
			// Check API availability
			if (!(await this.isAPIAvailable())) {
				return {
					success: false,
					error:
						'Chrome AI Translation API is not available. Please use a Chromium-based browser.',
					targetLanguage,
				}
			}

			// Detect source language if not provided
			const detectedLanguage =
				sourceLanguage || (await this.detectLanguage(content))

			// Check if translation is available
			const availability = await this.checkTranslationAvailability(
				detectedLanguage,
				targetLanguage,
			)

			if (availability === 'unavailable') {
				return {
					success: false,
					error: `Translation from ${this.getLanguageName(detectedLanguage)} to ${this.getLanguageName(targetLanguage)} is not supported.`,
					sourceLanguage: detectedLanguage,
					targetLanguage,
				}
			}

			// Handle downloading state
			if (availability === 'after-download') {
				return {
					success: false,
					error: `Translation models need to be downloaded first. Please try again in a moment after the models finish downloading.`,
					sourceLanguage: detectedLanguage,
					targetLanguage,
				}
			}

			// Create translator
			const translator = window.Translator
				? await window.Translator.create({
						sourceLanguage: detectedLanguage,
						targetLanguage,
				  })
				: await window.translation!.createTranslator({
						sourceLanguage: detectedLanguage,
						targetLanguage,
				  })

			// Parse and translate content
			const translatedContent = await this.translateMDXContent(
				translator,
				content,
			)

			return {
				success: true,
				translatedContent,
				sourceLanguage: detectedLanguage,
				targetLanguage,
				wordCount: translatedContent.trim().split(/\s+/).length,
			}
		} catch (error) {
			console.error('Translation failed:', error)

			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: 'An unknown error occurred during translation.',
				targetLanguage,
				wordCount: 0,
			}
		}
	}

	private async translateMDXContent(
		translator: ChromeAITranslator,
		content: string,
	): Promise<string> {
		// Split content into paragraphs for better translation
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
		try {
			// Only translate if there's actual text content after removing placeholders
			const textToTranslate = cleanedText.replace(/[A-Z_]+\d+/g, '').trim()
			if (textToTranslate.length < 3) {
				translatedText = protectedText // Don't translate if mostly placeholders
			} else {
				translatedText = await translator.translate(protectedText)
			}
		} catch (error) {
			console.warn('Translation failed for segment, keeping original:', error)
			translatedText = protectedText
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
