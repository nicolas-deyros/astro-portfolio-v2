/**
 * Enhanced Audio Player combining Web Audio API with Web Speech API.
 * Provides advanced audio controls, visualization, and better user experience.
 *
 * This module is the orchestrator; heavy lifting is delegated to:
 *   - `contentFilter.ts`    — text extraction / cleaning
 *   - `textChunker.ts`      — splitting text into utterance-sized chunks
 *   - `audioVisualization.ts` — frequency/waveform data for visualisation
 *   - `progressTracker.ts`  — progress-bar updates via rAF
 */

import { AudioVisualizer } from './audioVisualization'
import { extractReadableContent } from './contentFilter'
import { ProgressTracker } from './progressTracker'
import { splitTextIntoChunks } from './textChunker'

export interface AudioPlayerConfig {
	rate?: number
	pitch?: number
	volume?: number
	lang?: string
	voiceURI?: string
}

export interface AudioPlayerState {
	isPlaying: boolean
	isPaused: boolean
	isLoading: boolean
	currentTime: number
	duration: number
	volume: number
	rate: number
	progress: number
	error: string | null
}

export class EnhancedAudioPlayer {
	private audioContext: AudioContext | null = null
	private speechSynthesis: SpeechSynthesis
	private gainNode: GainNode | null = null
	private analyserNode: AnalyserNode | null = null

	private currentUtterance: SpeechSynthesisUtterance | null = null
	private textChunks: string[] = []
	private currentChunkIndex = 0

	private state: AudioPlayerState = {
		isPlaying: false,
		isPaused: false,
		isLoading: false,
		currentTime: 0,
		duration: 0,
		volume: 0.8,
		rate: 1.0,
		progress: 0,
		error: null,
	}

	private config: AudioPlayerConfig = {
		rate: 1.0,
		pitch: 1.0,
		volume: 0.8,
		lang: 'en-US',
	}

	private stateListeners: Array<(state: AudioPlayerState) => void> = []
	private visualizer: AudioVisualizer
	private progressTracker: ProgressTracker
	private isIntentionalPause = false

	constructor(config?: Partial<AudioPlayerConfig>) {
		this.speechSynthesis = window.speechSynthesis
		this.config = { ...this.config, ...config }

		// Initialized with null; real node wired in after audio context is ready
		this.visualizer = new AudioVisualizer(null)
		this.progressTracker = new ProgressTracker((progress, currentTime) =>
			this.updateState({ progress, currentTime }),
		)

		this.initializeAudioContext()
	}

	// ---------------------------------------------------------------------------
	// Initialization
	// ---------------------------------------------------------------------------

	private async initializeAudioContext(): Promise<void> {
		try {
			const AudioContextClass =
				window.AudioContext ||
				(window as unknown as { webkitAudioContext: typeof AudioContext })
					.webkitAudioContext

			this.audioContext = new AudioContextClass({
				latencyHint: 'interactive',
				sampleRate: 44100,
			})

			this.gainNode = this.audioContext.createGain()
			this.gainNode.gain.value = this.config.volume ?? 0.8

			this.analyserNode = this.audioContext.createAnalyser()
			this.analyserNode.fftSize = 1024
			this.analyserNode.smoothingTimeConstant = 0.8

			this.gainNode.connect(this.analyserNode)
			this.analyserNode.connect(this.audioContext.destination)

			// Re-create visualizer now that we have a real analyser node
			this.visualizer = new AudioVisualizer(this.analyserNode)
		} catch (error) {
			console.warn(
				'Web Audio API not supported, falling back to basic controls:',
				error,
			)
			this.updateState({ error: 'Advanced audio features not supported' })
		}
	}

	// ---------------------------------------------------------------------------
	// Public API
	// ---------------------------------------------------------------------------

	async loadText(text: string): Promise<void> {
		try {
			this.updateState({ isLoading: true, error: null })

			const cleanedText = extractReadableContent(text)
			if (!cleanedText.trim()) {
				throw new Error('No readable content found')
			}

			this.textChunks = splitTextIntoChunks(cleanedText)
			this.currentChunkIndex = 0

			const wordCount = cleanedText.split(/\s+/).length
			const estimatedDuration = (wordCount / 150) * 60

			this.updateState({
				isLoading: false,
				duration: estimatedDuration,
				currentTime: 0,
				progress: 0,
			})
		} catch (error) {
			console.error('Error loading text:', error)
			this.updateState({
				isLoading: false,
				error: error instanceof Error ? error.message : 'Failed to load text',
			})
		}
	}

	async play(): Promise<void> {
		try {
			if (this.state.isPaused && this.speechSynthesis.paused) {
				this.isIntentionalPause = false
				this.speechSynthesis.resume()
				this.updateState({ isPaused: false, isPlaying: true })
				this.visualizer.start(
					() => this.state.isPlaying && !this.state.isPaused,
				)
				return
			}

			if (this.state.isPlaying) return

			if (this.audioContext?.state === 'suspended') {
				await this.audioContext.resume()
			}

			await this.playCurrentChunk()
			this.updateState({ isPlaying: true, isPaused: false, error: null })
			this.visualizer.start(() => this.state.isPlaying && !this.state.isPaused)
		} catch (error) {
			console.error('Error starting playback:', error)
			this.updateState({
				error: error instanceof Error ? error.message : 'Playback failed',
			})
		}
	}

	pause(): void {
		if (this.speechSynthesis.speaking && !this.speechSynthesis.paused) {
			this.isIntentionalPause = true
			this.speechSynthesis.pause()
			this.updateState({ isPaused: true, isPlaying: false })
			this.visualizer.stop()
		}
	}

	stop(): void {
		this.isIntentionalPause = true
		this.speechSynthesis.cancel()
		this.currentChunkIndex = 0
		this.currentUtterance = null
		this.visualizer.stop()
		this.progressTracker.stop()
		this.updateState({
			isPlaying: false,
			isPaused: false,
			currentTime: 0,
			progress: 0,
			error: null,
		})
		setTimeout(() => {
			this.isIntentionalPause = false
		}, 100)
	}

	seek(position: number): void {
		const clampedPosition = Math.max(0, Math.min(1, position))

		if (!this.state.isPlaying && !this.state.isPaused) {
			this.updateState({
				progress: clampedPosition,
				currentTime: clampedPosition * this.state.duration,
			})
			return
		}

		const targetChunk = Math.floor(clampedPosition * this.textChunks.length)

		if (Math.abs(targetChunk - this.currentChunkIndex) > 1) {
			const wasPlaying = this.state.isPlaying
			this.stop()
			this.currentChunkIndex = Math.max(
				0,
				Math.min(targetChunk, this.textChunks.length - 1),
			)
			this.updateState({
				progress: clampedPosition,
				currentTime: clampedPosition * this.state.duration,
			})
			if (wasPlaying && this.currentChunkIndex < this.textChunks.length) {
				setTimeout(() => this.play(), 50)
			}
		} else {
			this.updateState({
				progress: clampedPosition,
				currentTime: clampedPosition * this.state.duration,
			})
		}
	}

	getFrequencyData(): Uint8Array | null {
		return this.visualizer.getFrequencyData(this.state.isPlaying)
	}

	getTimeDomainData(): Uint8Array | null {
		return this.visualizer.getTimeDomainData()
	}

	setVisualizationEnabled(enabled: boolean): void {
		this.visualizer.setEnabled(enabled)
		if (enabled && this.state.isPlaying) {
			this.visualizer.start(() => this.state.isPlaying && !this.state.isPaused)
		}
	}

	onStateChange(listener: (state: AudioPlayerState) => void): () => void {
		this.stateListeners.push(listener)
		return () => {
			const index = this.stateListeners.indexOf(listener)
			if (index > -1) this.stateListeners.splice(index, 1)
		}
	}

	getState(): AudioPlayerState {
		return { ...this.state }
	}

	destroy(): void {
		this.stop()
		this.visualizer.stop()
		if (this.audioContext?.state !== 'closed') {
			this.audioContext?.close()
		}
		this.stateListeners = []
		this.textChunks = []
		this.currentUtterance = null
	}

	// ---------------------------------------------------------------------------
	// Private — speech synthesis chunk playback
	// ---------------------------------------------------------------------------

	private async playCurrentChunk(): Promise<void> {
		if (this.currentChunkIndex >= this.textChunks.length) {
			this.stop()
			return
		}

		const chunk = this.textChunks[this.currentChunkIndex]
		this.currentUtterance = new SpeechSynthesisUtterance(chunk)

		this.currentUtterance.rate = this.config.rate ?? 1.0
		this.currentUtterance.pitch = this.config.pitch ?? 1.0
		this.currentUtterance.volume = this.config.volume ?? 0.8
		this.currentUtterance.lang = this.config.lang ?? 'en-US'

		if (this.config.voiceURI) {
			const voices = this.speechSynthesis.getVoices()
			const voice = voices.find(v => v.voiceURI === this.config.voiceURI)
			if (voice) this.currentUtterance.voice = voice
		}

		this.currentUtterance.onstart = (): void => {
			this.progressTracker.start(
				this.textChunks,
				this.currentChunkIndex,
				this.state.duration,
				() => this.state.isPlaying && !this.state.isPaused,
			)
		}

		this.currentUtterance.onend = (): void => {
			this.progressTracker.stop()
			this.currentChunkIndex++
			this.progressTracker.emitChunkEnd(
				this.currentChunkIndex,
				this.textChunks.length,
				this.state.duration,
			)
			if (this.currentChunkIndex < this.textChunks.length) {
				setTimeout(() => this.playCurrentChunk(), 100)
			} else {
				this.stop()
			}
		}

		this.currentUtterance.onerror = (
			event: SpeechSynthesisErrorEvent,
		): void => {
			if (
				this.isIntentionalPause &&
				(event.error === 'interrupted' || event.error === 'canceled')
			) {
				this.isIntentionalPause = false
				return
			}
			if (event.error === 'interrupted' || event.error === 'canceled') return

			console.error('Speech synthesis error:', event.error)
			this.updateState({
				error: `Speech error: ${event.error}`,
				isPlaying: false,
			})
		}

		this.currentUtterance.onpause = (): void => {
			this.progressTracker.stop()
			this.updateState({ isPaused: true, isPlaying: false, error: null })
			this.isIntentionalPause = false
		}

		this.currentUtterance.onresume = (): void => {
			this.progressTracker.start(
				this.textChunks,
				this.currentChunkIndex,
				this.state.duration,
				() => this.state.isPlaying && !this.state.isPaused,
			)
			this.updateState({ isPaused: false, isPlaying: true, error: null })
		}

		this.speechSynthesis.speak(this.currentUtterance)
	}

	private updateState(newState: Partial<AudioPlayerState>): void {
		this.state = { ...this.state, ...newState }
		this.stateListeners.forEach(listener => listener(this.state))
	}
}

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

export function createAudioPlayer(
	config?: Partial<AudioPlayerConfig>,
): EnhancedAudioPlayer {
	return new EnhancedAudioPlayer(config)
}

export function isAudioPlayerSupported(): {
	speechSynthesis: boolean
	webAudio: boolean
	fullSupport: boolean
} {
	const speechSynthesis = 'speechSynthesis' in window
	const webAudio = 'AudioContext' in window || 'webkitAudioContext' in window

	return {
		speechSynthesis,
		webAudio,
		fullSupport: speechSynthesis && webAudio,
	}
}
