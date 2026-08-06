/** Heuristic guard so raw exception/stack text never reaches non-technical client-portal users. */
const TECHNICAL_PATTERN = /^[A-Z][a-zA-Z]*Error\b|\bat \S+:\d+:\d+|\bstack\b/i
const MAX_SAFE_LENGTH = 120

export function toClientMessage(
	message: string | null | undefined,
	fallback: string,
): string {
	if (!message) return fallback
	if (message.length > MAX_SAFE_LENGTH) return fallback
	if (TECHNICAL_PATTERN.test(message)) return fallback
	return message
}
