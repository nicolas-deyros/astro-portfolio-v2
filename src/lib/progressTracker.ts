/**
 * Progress tracking for speech-synthesis playback.
 *
 * Estimates playback progress using a word-count heuristic (~150 wpm) and
 * drives updates via `requestAnimationFrame` for smooth progress-bar rendering.
 *
 * @module progressTracker
 */

/** Called on each frame with the updated overall progress (0–1) and elapsed seconds. */
export type ProgressUpdateCallback = (
	progress: number,
	currentTime: number,
) => void

export class ProgressTracker {
	private animationFrame: number | null = null
	private chunkStartTime = 0

	constructor(private readonly onUpdate: ProgressUpdateCallback) {}

	/**
	 * Start (or restart) progress tracking for the current chunk.
	 *
	 * @param chunks           - All text chunks
	 * @param currentIndex     - Index of the chunk now being spoken
	 * @param totalDuration    - Estimated total playback duration in seconds
	 * @param isActive         - Returns true when the player is playing and not paused
	 */
	start(
		chunks: string[],
		currentIndex: number,
		totalDuration: number,
		isActive: () => boolean,
	): void {
		this.stop()
		this.chunkStartTime = Date.now()

		const tick = (): void => {
			if (!isActive()) return
			this.updateContinuous(chunks, currentIndex, totalDuration)
			this.animationFrame = requestAnimationFrame(tick)
		}

		this.animationFrame = requestAnimationFrame(tick)
	}

	/** Cancel the animation frame loop. */
	stop(): void {
		if (this.animationFrame !== null) {
			cancelAnimationFrame(this.animationFrame)
			this.animationFrame = null
		}
	}

	/**
	 * Emit a discrete progress update (called when a chunk ends).
	 *
	 * @param currentIndex  - Index of the chunk that just finished
	 * @param totalChunks   - Total number of chunks
	 * @param totalDuration - Estimated total playback duration in seconds
	 */
	emitChunkEnd(
		currentIndex: number,
		totalChunks: number,
		totalDuration: number,
	): void {
		const progress = totalChunks > 0 ? currentIndex / totalChunks : 0
		this.onUpdate(progress, progress * totalDuration)
	}

	// ---------------------------------------------------------------------------
	// Private
	// ---------------------------------------------------------------------------

	private updateContinuous(
		chunks: string[],
		currentIndex: number,
		totalDuration: number,
	): void {
		if (chunks.length === 0) return

		const chunkText = chunks[currentIndex] ?? ''
		const chunkWordCount = chunkText.split(/\s+/).length
		const estimatedChunkDurationMs = (chunkWordCount / 150) * 60 * 1000

		const elapsed = Date.now() - this.chunkStartTime
		const chunkProgress = Math.min(1, elapsed / estimatedChunkDurationMs)

		const completedProgress = currentIndex / chunks.length
		const totalProgress = Math.min(
			1,
			completedProgress + chunkProgress / chunks.length,
		)

		this.onUpdate(totalProgress, totalProgress * totalDuration)
	}
}
