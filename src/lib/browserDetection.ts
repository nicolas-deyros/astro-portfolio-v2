/**
 * Browser detection utility for Chrome AI features
 * Chrome AI APIs require Chrome 129+ with experimental features enabled
 */

export interface BrowserInfo {
	name: string
	version: number
	isChrome: boolean
	supportsAI: boolean
}

/**
 * Detects browser and version information
 * @returns BrowserInfo object with browser details
 */
export function detectBrowser(): BrowserInfo {
	if (typeof window === 'undefined') {
		// Server-side rendering
		return {
			name: 'unknown',
			version: 0,
			isChrome: false,
			supportsAI: false,
		}
	}

	const userAgent = window.navigator.userAgent

	// Check for Edge first (since Edge user agent also contains "Chrome")
	const edgeMatch = userAgent.match(/Edg\/(\d+)\./)
	if (edgeMatch) {
		const version = parseInt(edgeMatch[1], 10)
		return {
			name: 'Edge',
			version,
			isChrome: false,
			supportsAI: version >= 129, // Edge might support it in future
		}
	}

	// Chrome detection with version parsing
	const chromeMatch = userAgent.match(/Chrome\/(\d+)\./)

	if (chromeMatch) {
		const version = parseInt(chromeMatch[1], 10)
		const isChrome = true
		const supportsAI = version >= 129

		return {
			name: 'Chrome',
			version,
			isChrome,
			supportsAI,
		}
	}

	// Fallback for other browsers
	return {
		name: 'other',
		version: 0,
		isChrome: false,
		supportsAI: false,
	}
}

/**
 * Checks if the current browser supports Chrome AI features
 * @returns boolean indicating AI support
 */
export function supportsAI(): boolean {
	if (typeof window === 'undefined') {
		return false
	}

	const browserInfo = detectBrowser()

	// Check browser version requirement
	if (!browserInfo.supportsAI) {
		return false
	}

	// Additional runtime check for AI APIs availability
	try {
		const hasAIObject = 'ai' in window
		interface AIWindow {
			translator?: unknown
			summarizer?: unknown
			// Add more properties if needed
		}
		const aiObject = (window as { ai?: AIWindow }).ai
		const hasTranslator = aiObject && 'translator' in aiObject
		const hasSummarizer = aiObject && 'summarizer' in aiObject

		return (
			hasAIObject &&
			typeof aiObject === 'object' &&
			(hasTranslator || hasSummarizer)
		)
	} catch {
		return false
	}
}

/**
 * Gets user-friendly message about AI support status
 * @returns string with support information
 */
export function getAISupportMessage(): string {
	const browserInfo = detectBrowser()

	if (!browserInfo.isChrome && browserInfo.name !== 'Edge') {
		return `AI features require Chrome 129+. You're using ${browserInfo.name}.`
	}

	if (browserInfo.version < 129) {
		return `AI features require Chrome 129+. You're using ${browserInfo.name} ${browserInfo.version}.`
	}

	if (!supportsAI()) {
		return 'AI features require Chrome with experimental features enabled.'
	}

	return 'AI features are available!'
}
