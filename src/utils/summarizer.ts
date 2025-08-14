// Based on Google Chrome Labs Summarization API
// https://github.com/GoogleChromeLabs/web-ai-demos/tree/main/summarization-api-playground

type SummarizerType = 'tl;dr' | 'key-points' | 'teaser' | 'headline'
type SummarizerFormat = 'markdown' | 'plain-text'
type SummarizerLength = 'short' | 'medium' | 'long'

interface CreateMonitor {
	addEventListener(
		event: 'downloadprogress',
		listener: (ev: ProgressEvent) => void,
	): void
}

interface Summarizer {
	summarize(input: string): Promise<string>
	measureInputUsage(input: string): Promise<number>
	inputQuota: number
	destroy(): void
}

declare global {
	interface Window {
		Summarizer: {
			availability(): Promise<'available' | 'downloadable' | 'no'>
			create(options: {
				type?: SummarizerType
				format?: SummarizerFormat
				length?: SummarizerLength
				monitor?: (m: CreateMonitor) => void
			}): Promise<Summarizer>
		}
	}
}

export type SummaryType = SummarizerType
export type SummaryLength = SummarizerLength

export interface SummaryOptions {
	type: SummaryType
	length: SummaryLength
	format?: SummarizerFormat
}

export interface SummaryResult {
	summary: string
	type: SummaryType
	length: SummaryLength
	wordCount: number
	timestamp: string
}

export class BlogSummarizer {
	private summarizer: Summarizer | null = null
	private isInitialized = false

	async isSupported(): Promise<boolean> {
		try {
			if (!window.Summarizer) {
				console.log('Summarizer API not available')
				return false
			}

			const availability = await window.Summarizer.availability()
			return availability === 'available' || availability === 'downloadable'
		} catch (error) {
			console.error('Error checking summarizer support:', error)
			return false
		}
	}

	async waitForModelDownload(maxWaitTime = 30000): Promise<boolean> {
		const startTime = Date.now()

		while (Date.now() - startTime < maxWaitTime) {
			try {
				if (!window.Summarizer) return false

				const availability = await window.Summarizer.availability()
				if (availability === 'available') {
					return true
				}

				// Wait 1 second before checking again
				await new Promise(resolve => setTimeout(resolve, 1000))
			} catch (error) {
				console.error('Error checking model availability:', error)
				await new Promise(resolve => setTimeout(resolve, 1000))
			}
		}

		return false
	}

	async initialize(options: SummaryOptions): Promise<boolean> {
		try {
			if (!(await this.isSupported())) {
				throw new Error('Summarizer API not supported')
			}

			// Clean up existing summarizer
			if (this.summarizer) {
				this.summarizer.destroy()
				this.summarizer = null
			}

			this.summarizer = await window.Summarizer.create({
				type: options.type,
				format: options.format || 'markdown',
				length: options.length,
			})

			this.isInitialized = true
			return true
		} catch (error) {
			console.error('Failed to initialize summarizer:', error)
			this.isInitialized = false
			return false
		}
	}

	async summarizeBlogPost(
		markdown: string,
		options: SummaryOptions,
		onProgress?: (status: string) => void,
	): Promise<SummaryResult> {
		if (!(await this.isSupported())) {
			throw new Error('Summarizer API is not supported in this browser')
		}

		onProgress?.('Checking model availability...')

		// Check if model needs to be downloaded
		const availability = await window.Summarizer.availability()
		if (availability === 'downloadable') {
			onProgress?.(
				'Model is downloading in the background. This may take a few moments...',
			)

			const modelReady = await this.waitForModelDownload()
			if (!modelReady) {
				throw new Error(
					'Model download timed out. Please try again in a few minutes.',
				)
			}
		}

		onProgress?.('Initializing summarizer...')

		if (!this.isInitialized || !this.summarizer) {
			const initialized = await this.initialize(options)
			if (!initialized) {
				throw new Error('Failed to initialize summarizer')
			}
		}

		onProgress?.('Processing content...')

		// Clean markdown for better summarization
		const cleanText = this.cleanMarkdownForSummarization(markdown)

		onProgress?.('Generating summary...')

		if (!this.summarizer) {
			throw new Error('Summarizer not properly initialized')
		}

		const summary = await this.summarizer.summarize(cleanText)
		const wordCount = summary.trim().split(/\s+/).length

		return {
			summary,
			type: options.type,
			length: options.length,
			wordCount,
			timestamp: new Date().toISOString(),
		}
	}

	private cleanMarkdownForSummarization(markdown: string): string {
		return (
			markdown
				// Remove code blocks
				.replace(/```[\s\S]*?```/g, '')
				// Remove inline code
				.replace(/`([^`]+)`/g, '$1')
				// Remove image markdown but keep alt text
				.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
				// Remove link markdown but keep text
				.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
				// Remove markdown headers symbols but keep content
				.replace(/^#{1,6}\s+/gm, '')
				// Remove markdown emphasis symbols but keep content
				.replace(/(\*{1,2}|_{1,2})(.*?)\1/g, '$2')
				// Remove blockquote symbols but keep content
				.replace(/^>\s*/gm, '')
				// Remove list markers but keep content
				.replace(/^[\s]*[-*+]\s+/gm, '')
				.replace(/^[\s]*\d+\.\s+/gm, '')
				// Clean extra whitespace
				.replace(/\n\s*\n/g, '\n\n')
				.replace(/\s+/g, ' ')
				.trim()
		)
	}

	destroy(): void {
		if (this.summarizer) {
			this.summarizer.destroy()
			this.summarizer = null
		}
		this.isInitialized = false
	}
}
