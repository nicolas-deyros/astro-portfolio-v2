/**
 * Splits long text into speech-synthesis-safe chunks.
 *
 * Web Speech API utterances have a browser-imposed size limit (commonly
 * 32 767 characters). This utility splits text at sentence or word boundaries
 * so each chunk stays within the limit and sounds natural when spoken.
 *
 * @module textChunker
 */

/**
 * Splits `text` into chunks no longer than `maxLength` characters.
 * Prefers sentence boundaries (`.`, `?`, `!`); falls back to word boundaries.
 *
 * @param text - Plain text to split
 * @param maxLength - Maximum characters per chunk (default: 32 767)
 * @returns Non-empty string chunks
 */
export function splitTextIntoChunks(text: string, maxLength = 32767): string[] {
	if (text.length <= maxLength) {
		return [text]
	}

	const chunks: string[] = []
	let currentIndex = 0

	while (currentIndex < text.length) {
		let endIndex = currentIndex + maxLength

		if (endIndex >= text.length) {
			chunks.push(text.slice(currentIndex))
			break
		}

		// Prefer sentence boundary
		const lastSentence = text.lastIndexOf('.', endIndex)
		const lastQuestion = text.lastIndexOf('?', endIndex)
		const lastExclamation = text.lastIndexOf('!', endIndex)
		const lastBoundary = Math.max(lastSentence, lastQuestion, lastExclamation)

		if (lastBoundary > currentIndex) {
			endIndex = lastBoundary + 1
		} else {
			// Fallback to word boundary
			const lastSpace = text.lastIndexOf(' ', endIndex)
			if (lastSpace > currentIndex) {
				endIndex = lastSpace
			}
		}

		chunks.push(text.slice(currentIndex, endIndex).trim())
		currentIndex = endIndex
	}

	return chunks.filter(chunk => chunk.length > 0)
}
