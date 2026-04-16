/**
 * Content filtering utilities for audio playback.
 *
 * Centralises all text extraction and cleaning logic previously duplicated
 * across `HybridAudioPlayer.tsx` and `audioPlayer.ts`.
 *
 * @module contentFilter
 */

// ---------------------------------------------------------------------------
// MDX / blog content filter
// ---------------------------------------------------------------------------

/**
 * Transforms raw MDX blog content into plain, speakable text.
 *
 * Handles frontmatter, import statements, Astro/React component tags,
 * images, videos, HTML, code blocks, and markdown syntax.
 *
 * @param rawContent - Raw MDX string (may include frontmatter, imports, JSX)
 * @returns Clean plain text suitable for text-to-speech
 */
export function filterMDXContent(rawContent: string): string {
	let content = rawContent

	// Extract title from first H1 before stripping markdown
	const titleMatch = content.match(/^#\s+(.+)$/m)
	const title = titleMatch?.[1]?.trim() ?? ''

	// Step 1: Remove YAML frontmatter (only at start of file)
	if (content.startsWith('---')) {
		const endIndex = content.indexOf('\n---\n', 4)
		if (endIndex !== -1) {
			content = content.substring(endIndex + 5)
		}
	}

	// Step 2: Remove ES module import statements
	content = content.replace(/^import\s+[\s\S]*?from\s+['"][^'"]*['"].*$/gm, '')
	content = content.replace(/^import\s+[\s\S]*?['"][^'"]*['"].*$/gm, '')

	// Step 3: Remove self-closing and paired Astro/React component tags
	content = content.replace(/<[A-Z][a-zA-Z0-9_]*[^>]*\/>/g, '')
	content = content.replace(
		/<[A-Z][a-zA-Z0-9_]*[^>]*>[\s\S]*?<\/[A-Z][a-zA-Z0-9_]*>/g,
		'',
	)

	// Step 4: Remove image syntax and video embeds
	content = content.replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
	content = content.replace(
		/\[!\[.*?\]\(.*?\)\]\(.*?(youtube|youtu\.be|vimeo|dailymotion).*?\)/gi,
		'',
	)

	// Step 5: Remove media/script HTML elements entirely
	content = content.replace(
		/<(script|style|svg|video|audio|iframe|embed)[^>]*>[\s\S]*?<\/\1>/gis,
		'',
	)
	content = content.replace(
		/<(script|style|svg|video|audio|iframe|embed)[^>]*\/?>/gi,
		'',
	)

	// Step 6: Strip remaining HTML tags (keep text content)
	content = content.replace(/<[^>]*>/g, '')

	// Step 7: Remove code blocks; keep inline code content
	content = content.replace(/```[\s\S]*?```/g, '')
	content = content.replace(/`([^`]+)`/g, '$1')

	// Step 8: Minimal markdown symbol cleanup
	content = content.replace(/^#{1,6}\s+/gm, '') // Headers
	content = content.replace(/(\*{1,2}|_{1,2})(.*?)\1/g, '$2') // Bold/italic
	content = content.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
	content = content.replace(/^[-*_]{3,}$/gm, '') // Horizontal rules
	content = content.replace(/^>\s*/gm, '') // Blockquotes
	content = content.replace(/^[\s]*[-*+]\s+/gm, '') // Unordered lists
	content = content.replace(/^[\s]*\d+\.\s+/gm, '') // Ordered lists

	// Step 9: Final whitespace and symbol cleanup
	content = content
		.replace(/\s+/g, ' ')
		.replace(/^\s*[-_+*#>|=~`^]\s*$/gm, '')
		.replace(/https?:\/\/[^\s]+/gi, '')
		.trim()

	// Prepend title if not already present
	if (title && !content.toLowerCase().startsWith(title.toLowerCase())) {
		content = `${title}. ${content}`
	}

	return content
}

// ---------------------------------------------------------------------------
// Generic HTML / Markdown / plain-text extractors (used by EnhancedAudioPlayer)
// ---------------------------------------------------------------------------

/**
 * Detects content type and delegates to the appropriate extractor.
 *
 * @param text - Raw text that may be HTML, Markdown, or plain text
 * @returns Clean plain text suitable for text-to-speech
 */
export function extractReadableContent(text: string): string {
	if (text.includes('<') && text.includes('>')) {
		return extractFromHTML(text)
	}
	if (text.includes('![') || text.includes('](') || text.includes('##')) {
		return extractFromMarkdown(text)
	}
	return cleanText(text)
}

/**
 * Extracts readable text from an HTML string using DOM parsing.
 * Removes media embeds, images, scripts, code blocks, and interactive elements.
 *
 * @param html - Raw HTML string
 * @returns Clean plain text
 */
export function extractFromHTML(html: string): string {
	const tempDiv = document.createElement('div')
	tempDiv.innerHTML = html

	// Remove media embed elements
	const mediaSelectors = [
		'video',
		'audio',
		'iframe[src*="youtube"]',
		'iframe[src*="youtu.be"]',
		'iframe[src*="vimeo"]',
		'iframe[src*="dailymotion"]',
		'iframe[src*="twitch"]',
		'embed',
		'object',
		'.video-container',
		'.video-wrapper',
		'.youtube-container',
		'.vimeo-container',
		'.media-embed',
		'.aspect-video',
		'[data-video]',
		'[data-embed]',
	]
	mediaSelectors.forEach(selector => {
		tempDiv.querySelectorAll(selector).forEach(el => el.remove())
	})

	// Replace images with alt/title text when descriptive; otherwise remove
	tempDiv.querySelectorAll('img').forEach(img => {
		const altText = img.getAttribute('alt')
		const title = img.getAttribute('title')
		if (
			altText &&
			altText.length > 5 &&
			!altText.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
		) {
			img.parentNode?.replaceChild(document.createTextNode(`${altText}. `), img)
		} else if (title && title.length > 5) {
			img.parentNode?.replaceChild(document.createTextNode(`${title}. `), img)
		} else {
			img.remove()
		}
	})

	// Remove figures that wrap images
	tempDiv.querySelectorAll('figure').forEach(figure => {
		if (figure.querySelector('img')) figure.remove()
	})

	// Remove non-content elements
	tempDiv
		.querySelectorAll('script, style, noscript, svg')
		.forEach(el => el.remove())

	// Replace code blocks with a brief description
	tempDiv.querySelectorAll('pre, .highlight, .code-block').forEach(block => {
		const lines = Math.ceil((block.textContent ?? '').split('\n').length)
		const description =
			(block.textContent?.length ?? 0) > 50
				? `Code block with ${lines} lines. `
				: ''
		if (description) {
			block.parentNode?.replaceChild(
				document.createTextNode(description),
				block,
			)
		} else {
			block.remove()
		}
	})

	// Strip inline code wrappers but keep content
	tempDiv.querySelectorAll('code:not(pre code)').forEach(code => {
		code.parentNode?.replaceChild(
			document.createTextNode(code.textContent ?? ''),
			code,
		)
	})

	// Remove interactive elements
	tempDiv
		.querySelectorAll('button, .btn, input, select, textarea, form')
		.forEach(el => el.remove())

	// Replace links with their text content
	tempDiv.querySelectorAll('a').forEach(link => {
		link.parentNode?.replaceChild(
			document.createTextNode(link.textContent ?? ''),
			link,
		)
	})

	return cleanText(tempDiv.textContent ?? tempDiv.innerText ?? '')
}

/**
 * Extracts readable text from a Markdown string using regex transforms.
 *
 * @param markdown - Raw Markdown string
 * @returns Clean plain text
 */
export function extractFromMarkdown(markdown: string): string {
	let cleaned = markdown

	// Replace images with alt text when descriptive
	cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]+\)/g, (_, altText) => {
		if (
			altText &&
			altText.length > 5 &&
			!altText.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
		) {
			return `${altText}. `
		}
		return ''
	})

	// Remove video embeds
	cleaned = cleaned.replace(
		/\[!\[.*?\]\(.*?\)\]\(.*?(youtube|youtu\.be|vimeo|dailymotion).*?\)/gi,
		'',
	)

	// Remove HTML video/audio/embed tags
	cleaned = cleaned.replace(
		/<(video|audio|iframe|embed|object)[^>]*>.*?<\/\1>/gis,
		'',
	)
	cleaned = cleaned.replace(
		/<(video|audio|iframe|embed|object)[^>]*\/?>.*?/gi,
		'',
	)

	// Replace links with their text
	cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

	// Replace code blocks with a brief description
	cleaned = cleaned.replace(/```[\s\S]*?```/g, match => {
		const lines = match.split('\n').length - 2
		return lines > 3 ? `Code block with ${lines} lines. ` : ''
	})

	// Strip inline code but keep content
	cleaned = cleaned.replace(/`([^`]+)`/g, '$1')

	// Remove markdown formatting symbols
	cleaned = cleaned.replace(/^#{1,6}\s+/gm, '')
	cleaned = cleaned.replace(/(\*{1,2}|_{1,2})(.*?)\1/g, '$2')
	cleaned = cleaned.replace(/^[-*_]{3,}$/gm, '')
	cleaned = cleaned.replace(/^>\s*/gm, '')
	cleaned = cleaned.replace(/^[\s]*[-*+]\s+/gm, '')
	cleaned = cleaned.replace(/^[\s]*\d+\.\s+/gm, '')

	return cleanText(cleaned)
}

/**
 * Normalises plain text for speech synthesis: collapses whitespace, strips
 * URLs, email addresses, image dimensions, and excessive punctuation.
 *
 * @param text - Raw plain text
 * @returns Normalised plain text
 */
export function cleanText(text: string): string {
	return text
		.replace(/\s+/g, ' ')
		.replace(/\n\s*\n/g, '\n')
		.replace(/[^\w\s.,!?;:()-]/g, '')
		.replace(/https?:\/\/[^\s]+/gi, '')
		.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
		.replace(/[.,!?;:]{2,}/g, '.')
		.replace(/\b\d{2,4}x\d{2,4}\b/g, '')
		.replace(/\b\d{3,}\b/g, '')
		.trim()
}
