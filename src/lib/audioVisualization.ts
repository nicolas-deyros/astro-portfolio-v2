/**
 * Audio visualisation helper for speech-synthesis playback.
 *
 * Wraps the Web Audio API `AnalyserNode` and provides a mock frequency-data
 * fallback for browsers where the Speech Synthesis API does not route audio
 * through the Web Audio graph (most desktop browsers).
 *
 * @module audioVisualization
 */

/** Callback invoked on each animation frame while the player is playing. */
export type VisualizationFrameCallback = () => void

export class AudioVisualizer {
	private analyserNode: AnalyserNode | null
	private mockFrequencyData: Uint8Array | null = null
	private visualizationStartTime = 0
	private animationFrame: number | null = null
	private enabled = false

	constructor(analyserNode: AnalyserNode | null) {
		this.analyserNode = analyserNode
	}

	/**
	 * Enable or disable visualisation.
	 * When enabling while already playing, call `start()` to kick off the loop.
	 */
	setEnabled(enabled: boolean): void {
		this.enabled = enabled
		if (!enabled) {
			this.stop()
		}
	}

	get isEnabled(): boolean {
		return this.enabled
	}

	/**
	 * Start the animation loop.
	 * `isPlaying` is polled each frame to decide whether to continue looping.
	 */
	start(isPlaying: () => boolean): void {
		if (!this.enabled) return

		const animate = (): void => {
			if (isPlaying()) {
				this.animationFrame = requestAnimationFrame(animate)
			}
		}

		this.animationFrame = requestAnimationFrame(animate)
	}

	/** Stop and cancel any pending animation frame. */
	stop(): void {
		if (this.animationFrame !== null) {
			cancelAnimationFrame(this.animationFrame)
			this.animationFrame = null
		}
		this.mockFrequencyData = null
	}

	/**
	 * Returns frequency data for visualisation bars.
	 *
	 * Prefers real data from the `AnalyserNode`; falls back to a synthetic
	 * speech-like waveform when the Speech API does not expose audio data.
	 *
	 * @param isPlaying - Whether the player is currently speaking
	 */
	getFrequencyData(isPlaying: boolean): Uint8Array | null {
		// Real Web Audio data
		if (this.analyserNode) {
			const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount)
			this.analyserNode.getByteFrequencyData(dataArray)
			if (dataArray.some(v => v > 0)) return dataArray
		}

		// Synthetic fallback during speech synthesis
		if (!isPlaying) return null

		const now = Date.now()

		if (!this.mockFrequencyData) {
			this.mockFrequencyData = new Uint8Array(32)
			this.visualizationStartTime = now
		}

		// Throttle to ~30 fps
		if (now - this.visualizationStartTime < 33) {
			return this.mockFrequencyData
		}

		const elapsed = (now - this.visualizationStartTime) / 1000
		const speechFrequency = 1.5 + Math.sin(elapsed * 3) * 0.5
		const baseSin = Math.sin(elapsed * speechFrequency * 6.28)

		for (let i = 0; i < this.mockFrequencyData.length; i++) {
			const frequency = (i / this.mockFrequencyData.length) * 8000
			let amplitude: number

			if (frequency < 300) {
				amplitude = 100 + baseSin * 60
			} else if (frequency < 2000) {
				amplitude = 60 + baseSin * 40
			} else if (frequency < 5000) {
				amplitude = 20 + baseSin * 15
			} else {
				amplitude = 5 + baseSin * 5
			}

			amplitude += (Math.random() - 0.5) * 5
			this.mockFrequencyData[i] = Math.max(0, Math.min(255, amplitude))
		}

		this.visualizationStartTime = now
		return this.mockFrequencyData
	}

	/**
	 * Returns raw time-domain samples from the `AnalyserNode`, or `null` when
	 * the node is unavailable.
	 */
	getTimeDomainData(): Uint8Array | null {
		if (!this.analyserNode) return null

		const dataArray = new Uint8Array(this.analyserNode.fftSize)
		this.analyserNode.getByteTimeDomainData(dataArray)
		return dataArray
	}
}
