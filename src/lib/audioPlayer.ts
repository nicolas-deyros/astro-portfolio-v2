/**
 * Enhanced Audio Player combining Web Audio API with Web Speech API
 * Provides advanced audio controls, visualization, and better user experience
 */

export interface AudioPlayerConfig {
	rate?: number
	pitch?: number
	volume?: number
	lang?: string
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
	private audioBuffer: AudioBuffer | null = null
	private sourceNode: AudioBufferSourceNode | null = null

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
	private visualizationEnabled = false
	private animationFrame: number | null = null
	private mockFrequencyData: Uint8Array | null = null
	private visualizationStartTime = 0
	private progressUpdateInterval: number | null = null
	private chunkStartTime = 0
	private isIntentionalPause = false

	constructor(config?: Partial<AudioPlayerConfig>) {
		this.speechSynthesis = window.speechSynthesis
		this.config = { ...this.config, ...config }
		this.initializeAudioContext()
	}

	/**
	 * Initialize Web Audio API context
	 */
	private async initializeAudioContext(): Promise<void> {
		try {
			// Create audio context with optimal settings
			const AudioContextClass =
				window.AudioContext ||
				(window as unknown as { webkitAudioContext: typeof AudioContext })
					.webkitAudioContext
			this.audioContext = new AudioContextClass({
				latencyHint: 'interactive',
				sampleRate: 44100,
			})

			// Create gain node for volume control
			this.gainNode = this.audioContext.createGain()
			this.gainNode.gain.value = this.config.volume || 0.8

			// Create analyser for visualization
			this.analyserNode = this.audioContext.createAnalyser()
			this.analyserNode.fftSize = 1024
			this.analyserNode.smoothingTimeConstant = 0.8

			// Connect nodes: source -> gain -> analyser -> destination
			this.gainNode.connect(this.analyserNode)
			this.analyserNode.connect(this.audioContext.destination)

			console.log('Audio context initialized successfully')
		} catch (error) {
			console.warn(
				'Web Audio API not supported, falling back to basic controls:',
				error,
			)
			this.updateState({ error: 'Advanced audio features not supported' })
		}
	}

	/**
	 * Load and prepare text for speech synthesis
	 */
	async loadText(text: string): Promise<void> {
		try {
			this.updateState({ isLoading: true, error: null })

			// Clean and prepare text with enhanced content filtering
			const cleanText = this.extractReadableContent(text)
			if (!cleanText.trim()) {
				throw new Error('No readable content found')
			}

			// Split text into manageable chunks
			this.textChunks = this.splitTextIntoChunks(cleanText)
			this.currentChunkIndex = 0

			// Estimate duration (rough calculation: ~150 words per minute)
			const wordCount = cleanText.split(/\s+/).length
			const estimatedDuration = (wordCount / 150) * 60 // seconds

			this.updateState({
				isLoading: false,
				duration: estimatedDuration,
				currentTime: 0,
				progress: 0,
			})

			console.log(
				`Text loaded: ${this.textChunks.length} chunks, ~${Math.round(estimatedDuration)}s duration`,
			)
		} catch (error) {
			console.error('Error loading text:', error)
			this.updateState({
				isLoading: false,
				error: error instanceof Error ? error.message : 'Failed to load text',
			})
		}
	}

	/**
	 * Start or resume playback
	 */
	async play(): Promise<void> {
		try {
			if (this.state.isPaused && this.speechSynthesis.paused) {
				// Resume paused speech
				this.isIntentionalPause = false // Reset flag when resuming
				this.speechSynthesis.resume()
				this.updateState({ isPaused: false, isPlaying: true })
				this.startVisualization()
				return
			}

			if (this.state.isPlaying) {
				return // Already playing
			}

			// Ensure audio context is running
			if (this.audioContext?.state === 'suspended') {
				await this.audioContext.resume()
			}

			// Start playing from current chunk
			await this.playCurrentChunk()
			this.updateState({
				isPlaying: true,
				isPaused: false,
				error: null, // Clear any previous errors when starting
			})
			this.startVisualization()
		} catch (error) {
			console.error('Error starting playback:', error)
			this.updateState({
				error: error instanceof Error ? error.message : 'Playback failed',
			})
		}
	}

	/**
	 * Pause playback
	 */
	pause(): void {
		if (this.speechSynthesis.speaking && !this.speechSynthesis.paused) {
			this.isIntentionalPause = true
			this.speechSynthesis.pause()
			this.updateState({ isPaused: true, isPlaying: false })
			this.stopVisualization()
		}
	}

	/**
	 * Stop playback completely
	 */
	stop(): void {
		this.isIntentionalPause = true // Prevent error reporting on stop
		this.speechSynthesis.cancel()
		this.currentChunkIndex = 0
		this.currentUtterance = null
		this.stopVisualization()
		this.stopProgressTracking()
		this.updateState({
			isPlaying: false,
			isPaused: false,
			currentTime: 0,
			progress: 0,
			error: null, // Clear any previous errors
		})

		// Reset mock visualization data
		this.mockFrequencyData = null
		// Keep isIntentionalPause true for a bit longer to catch async events
		setTimeout(() => {
			this.isIntentionalPause = false
		}, 100)
	}

	/**
	 * Seek to a specific position (0.0 to 1.0)
	 */
	seek(position: number): void {
		const clampedPosition = Math.max(0, Math.min(1, position))

		// If not playing, just update the visual position
		if (!this.state.isPlaying && !this.state.isPaused) {
			this.updateState({
				progress: clampedPosition,
				currentTime: clampedPosition * this.state.duration,
			})
			return
		}

		// Calculate target chunk based on position
		const targetChunk = Math.floor(clampedPosition * this.textChunks.length)

		// If we're seeking to a significantly different position, restart from there
		if (Math.abs(targetChunk - this.currentChunkIndex) > 1) {
			const wasPlaying = this.state.isPlaying
			this.stop()
			this.currentChunkIndex = Math.max(
				0,
				Math.min(targetChunk, this.textChunks.length - 1),
			)

			// Immediately update the visual feedback
			this.updateState({
				progress: clampedPosition,
				currentTime: clampedPosition * this.state.duration,
			})

			// If was playing, restart playback after a brief delay
			if (wasPlaying && this.currentChunkIndex < this.textChunks.length) {
				setTimeout(() => {
					this.play()
				}, 50) // Reduced delay for better responsiveness
			}
		} else {
			// For small changes, just update the visual position
			this.updateState({
				progress: clampedPosition,
				currentTime: clampedPosition * this.state.duration,
			})
		}
	}

	/**
	 * Get audio frequency data for visualization
	 */
	getFrequencyData(): Uint8Array | null {
		// If Web Audio API is available and we have an analyser, try to get real data
		if (this.analyserNode) {
			const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount)
			this.analyserNode.getByteFrequencyData(dataArray)

			// Check if we're getting actual audio data
			const hasRealData = dataArray.some(value => value > 0)
			if (hasRealData) {
				return dataArray
			}
		}

		// Fallback: Generate mock frequency data during speech synthesis
		if (this.state.isPlaying) {
			if (!this.mockFrequencyData) {
				// Create mock frequency data array (optimized size for performance)
				this.mockFrequencyData = new Uint8Array(32) // Reduced from 64 for better performance
				this.visualizationStartTime = Date.now()
			}

			// Performance optimization: throttle updates to 30fps
			const now = Date.now()
			if (now - this.visualizationStartTime < 33) {
				// ~30fps
				return this.mockFrequencyData
			}

			// Generate realistic speech-like frequency pattern
			const elapsed = (now - this.visualizationStartTime) / 1000
			const speechFrequency = 1.5 + Math.sin(elapsed * 3) * 0.5 // Varies between 1-2 Hz

			// Cache sine calculations for performance
			const baseSin = Math.sin(elapsed * speechFrequency * 6.28)

			for (let i = 0; i < this.mockFrequencyData.length; i++) {
				// Create speech-like frequency distribution
				// Human speech is typically 85-255 Hz (fundamental) with harmonics up to 8kHz
				const frequency = (i / this.mockFrequencyData.length) * 8000 // Map to 8kHz range

				let amplitude = 0
				if (frequency < 300) {
					// Fundamental frequency range - stronger
					amplitude = 100 + baseSin * 60
				} else if (frequency < 2000) {
					// Formant frequencies - moderate
					amplitude = 60 + baseSin * 40
				} else if (frequency < 5000) {
					// Higher harmonics - weaker
					amplitude = 20 + baseSin * 15
				} else {
					// Very high frequencies - minimal
					amplitude = 5 + baseSin * 5
				}

				// Add some randomness for natural variation (reduced for performance)
				amplitude += (Math.random() - 0.5) * 5

				// Clamp to valid range
				this.mockFrequencyData[i] = Math.max(0, Math.min(255, amplitude))
			}

			this.visualizationStartTime = now
			return this.mockFrequencyData
		}

		return null
	}

	/**
	 * Get audio time domain data for waveform visualization
	 */
	getTimeDomainData(): Uint8Array | null {
		if (!this.analyserNode) return null

		const dataArray = new Uint8Array(this.analyserNode.fftSize)
		this.analyserNode.getByteTimeDomainData(dataArray)
		return dataArray
	}

	/**
	 * Enable or disable audio visualization
	 */
	setVisualizationEnabled(enabled: boolean): void {
		this.visualizationEnabled = enabled
		if (enabled && this.state.isPlaying) {
			this.startVisualization()
		} else {
			this.stopVisualization()
		}
	}

	/**
	 * Add state change listener
	 */
	onStateChange(listener: (state: AudioPlayerState) => void): () => void {
		this.stateListeners.push(listener)

		// Return unsubscribe function
		return () => {
			const index = this.stateListeners.indexOf(listener)
			if (index > -1) {
				this.stateListeners.splice(index, 1)
			}
		}
	}

	/**
	 * Get current player state
	 */
	getState(): AudioPlayerState {
		return { ...this.state }
	}

	/**
	 * Clean up resources
	 */
	destroy(): void {
		this.stop()
		this.stopVisualization()

		if (this.audioContext?.state !== 'closed') {
			this.audioContext?.close()
		}

		this.stateListeners = []
		this.textChunks = []
		this.currentUtterance = null
	}

	// Private helper methods

	/**
	 * Extract readable content from text, filtering out videos, images, and other non-readable elements
	 */
	private extractReadableContent(text: string): string {
		// If the text appears to be HTML or contains HTML elements, parse it properly
		if (text.includes('<') && text.includes('>')) {
			return this.extractFromHTML(text)
		}

		// If it's markdown, clean it up
		if (text.includes('![') || text.includes('](') || text.includes('##')) {
			return this.extractFromMarkdown(text)
		}

		// Plain text - just clean it up
		return this.cleanText(text)
	}

	/**
	 * Extract readable content from HTML
	 */
	private extractFromHTML(html: string): string {
		// Create a temporary DOM element to parse HTML
		const tempDiv = document.createElement('div')
		tempDiv.innerHTML = html

		// Remove video elements and containers
		const videoSelectors = [
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

		videoSelectors.forEach(selector => {
			const elements = tempDiv.querySelectorAll(selector)
			elements.forEach(el => el.remove())
		})

		// Remove image elements (but keep alt text if meaningful)
		const images = tempDiv.querySelectorAll('img')
		images.forEach(img => {
			const altText = img.getAttribute('alt')
			const title = img.getAttribute('title')

			// Only keep alt text if it's descriptive and not just filename
			if (
				altText &&
				altText.length > 5 &&
				!altText.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
			) {
				const textNode = document.createTextNode(`${altText}. `)
				img.parentNode?.replaceChild(textNode, img)
			} else if (title && title.length > 5) {
				const textNode = document.createTextNode(`${title}. `)
				img.parentNode?.replaceChild(textNode, img)
			} else {
				img.remove()
			}
		})

		// Remove figure captions if they're just describing images
		const figures = tempDiv.querySelectorAll('figure')
		figures.forEach(figure => {
			const figcaption = figure.querySelector('figcaption')
			const img = figure.querySelector('img')

			if (img && figcaption) {
				// If figure contains an image, remove the whole thing
				figure.remove()
			}
		})

		// Remove script and style elements
		const nonContentElements = tempDiv.querySelectorAll(
			'script, style, noscript, svg',
		)
		nonContentElements.forEach(el => el.remove())

		// Remove code blocks (but keep inline code)
		const codeBlocks = tempDiv.querySelectorAll('pre, .highlight, .code-block')
		codeBlocks.forEach(block => {
			const codeText = block.textContent || ''
			// Replace with a simple description
			const description =
				codeText.length > 50
					? 'Code block with ' +
						Math.ceil(codeText.split('\n').length) +
						' lines. '
					: ''
			if (description) {
				const textNode = document.createTextNode(description)
				block.parentNode?.replaceChild(textNode, block)
			} else {
				block.remove()
			}
		})

		// Remove inline code but keep the content
		const inlineCode = tempDiv.querySelectorAll('code:not(pre code)')
		inlineCode.forEach(code => {
			const textNode = document.createTextNode(code.textContent || '')
			code.parentNode?.replaceChild(textNode, code)
		})

		// Remove buttons and interactive elements
		const interactiveElements = tempDiv.querySelectorAll(
			'button, .btn, input, select, textarea, form',
		)
		interactiveElements.forEach(el => el.remove())

		// Convert links to just their text content
		const links = tempDiv.querySelectorAll('a')
		links.forEach(link => {
			const textNode = document.createTextNode(link.textContent || '')
			link.parentNode?.replaceChild(textNode, link)
		})

		// Get the cleaned text content
		const textContent = tempDiv.textContent || tempDiv.innerText || ''

		return this.cleanText(textContent)
	}

	/**
	 * Extract readable content from Markdown
	 */
	private extractFromMarkdown(markdown: string): string {
		let cleaned = markdown

		// Remove image syntax ![alt](url) but keep alt text if meaningful
		cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]+\)/g, (match, altText) => {
			// Only keep alt text if it's descriptive
			if (
				altText &&
				altText.length > 5 &&
				!altText.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
			) {
				return altText + '. '
			}
			return ''
		})

		// Remove video embeds (YouTube, Vimeo, etc.)
		cleaned = cleaned.replace(
			/\[!\[.*?\]\(.*?\)\]\(.*?(youtube|youtu\.be|vimeo|dailymotion).*?\)/gi,
			'',
		)

		// Remove HTML video/audio tags
		cleaned = cleaned.replace(
			/<(video|audio|iframe|embed|object)[^>]*>.*?<\/\1>/gis,
			'',
		)
		cleaned = cleaned.replace(
			/<(video|audio|iframe|embed|object)[^>]*\/?>.*?/gi,
			'',
		)

		// Remove link syntax [text](url) but keep the text
		cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

		// Remove code blocks
		cleaned = cleaned.replace(/```[\s\S]*?```/g, match => {
			const lines = match.split('\n').length - 2
			return lines > 3 ? `Code block with ${lines} lines. ` : ''
		})

		// Remove inline code backticks but keep content
		cleaned = cleaned.replace(/`([^`]+)`/g, '$1')

		// Remove markdown headers symbols but keep the text
		cleaned = cleaned.replace(/^#{1,6}\s+/gm, '')

		// Remove markdown emphasis but keep text
		cleaned = cleaned.replace(/(\*{1,2}|_{1,2})(.*?)\1/g, '$2')

		// Remove horizontal rules
		cleaned = cleaned.replace(/^[-*_]{3,}$/gm, '')

		// Remove blockquote markers
		cleaned = cleaned.replace(/^>\s*/gm, '')

		// Remove list markers
		cleaned = cleaned.replace(/^[\s]*[-*+]\s+/gm, '')
		cleaned = cleaned.replace(/^[\s]*\d+\.\s+/gm, '')

		return this.cleanText(cleaned)
	}

	private cleanText(text: string): string {
		return (
			text
				// Normalize whitespace
				.replace(/\s+/g, ' ')
				// Remove multiple line breaks
				.replace(/\n\s*\n/g, '\n')
				// Remove special characters except basic punctuation
				.replace(/[^\w\s.,!?;:()-]/g, '')
				// Remove URLs that might have slipped through
				.replace(/https?:\/\/[^\s]+/gi, '')
				// Remove email addresses
				.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
				// Clean up extra punctuation
				.replace(/[.,!?;:]{2,}/g, '.')
				// Remove standalone numbers that might be image dimensions
				.replace(/\b\d{2,4}x\d{2,4}\b/g, '')
				.replace(/\b\d{3,}\b/g, '')
				.trim()
		)
	}

	private splitTextIntoChunks(text: string, maxLength = 32767): string[] {
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

			// Find the last sentence boundary before maxLength
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

	private async playCurrentChunk(): Promise<void> {
		if (this.currentChunkIndex >= this.textChunks.length) {
			this.stop()
			return
		}

		const chunk = this.textChunks[this.currentChunkIndex]
		this.currentUtterance = new SpeechSynthesisUtterance(chunk)

		// Configure utterance
		this.currentUtterance.rate = this.config.rate || 1.0
		this.currentUtterance.pitch = this.config.pitch || 1.0
		this.currentUtterance.volume = this.config.volume || 0.8
		this.currentUtterance.lang = this.config.lang || 'en-US'

		// Set voice if specified
		if (this.config.voiceURI) {
			const voices = this.speechSynthesis.getVoices()
			const selectedVoice = voices.find(
				voice => voice.voiceURI === this.config.voiceURI,
			)
			if (selectedVoice) {
				this.currentUtterance.voice = selectedVoice
			}
		}

		// Set up event handlers
		this.currentUtterance.onstart = () => {
			console.log(
				`Playing chunk ${this.currentChunkIndex + 1}/${this.textChunks.length}`,
			)
			this.chunkStartTime = Date.now()
			this.startProgressTracking()
		}

		this.currentUtterance.onend = () => {
			this.stopProgressTracking()
			this.currentChunkIndex++
			if (this.currentChunkIndex < this.textChunks.length) {
				// Continue with next chunk
				setTimeout(() => this.playCurrentChunk(), 100)
			} else {
				// Playback complete
				this.stop()
			}
			this.updateProgress()
		}

		this.currentUtterance.onerror = event => {
			// Don't show errors for intentional pauses/stops or voice changes
			if (
				this.isIntentionalPause &&
				(event.error === 'interrupted' || event.error === 'canceled')
			) {
				console.log('Speech intentionally paused/stopped/canceled')
				this.isIntentionalPause = false
				return
			}

			// Always ignore 'interrupted' errors - they occur during normal stop operations
			if (event.error === 'interrupted') {
				console.log('Speech interrupted (normal during stop/pause operations)')
				return
			}

			// Also ignore canceled errors during voice changes
			if (event.error === 'canceled') {
				console.log('Speech canceled (likely due to voice change)')
				return
			}

			// Only show errors for actual problems
			console.error('Speech synthesis error:', event.error)
			this.updateState({
				error: `Speech error: ${event.error}`,
				isPlaying: false,
			})
		}

		this.currentUtterance.onpause = () => {
			this.stopProgressTracking()
			this.updateState({
				isPaused: true,
				isPlaying: false,
				error: null, // Clear any errors when pausing successfully
			})
			this.isIntentionalPause = false // Reset flag after successful pause
		}

		this.currentUtterance.onresume = () => {
			this.chunkStartTime = Date.now() // Reset timer for resumed chunk
			this.startProgressTracking()
			this.updateState({
				isPaused: false,
				isPlaying: true,
				error: null, // Clear any errors when resuming
			})
		}

		// Start speaking
		this.speechSynthesis.speak(this.currentUtterance)
	}

	private updateProgress(): void {
		const progress =
			this.textChunks.length > 0
				? this.currentChunkIndex / this.textChunks.length
				: 0
		const currentTime = progress * this.state.duration

		this.updateState({ progress, currentTime })
	}

	private startProgressTracking(): void {
		// Clear any existing interval
		this.stopProgressTracking()

		// Performance optimization: Use requestAnimationFrame for smoother updates
		const updateProgress = () => {
			if (this.state.isPlaying && !this.state.isPaused) {
				this.updateContinuousProgress()
				this.progressUpdateInterval =
					window.requestAnimationFrame(updateProgress)
			}
		}

		this.progressUpdateInterval = window.requestAnimationFrame(updateProgress)
	}

	private stopProgressTracking(): void {
		if (this.progressUpdateInterval) {
			cancelAnimationFrame(this.progressUpdateInterval)
			this.progressUpdateInterval = null
		}
	}

	private updateContinuousProgress(): void {
		if (this.textChunks.length === 0) return

		// Calculate chunk progress based on estimated time
		const chunkText = this.textChunks[this.currentChunkIndex] || ''
		const chunkWordCount = chunkText.split(/\s+/).length
		const estimatedChunkDuration = (chunkWordCount / 150) * 60 * 1000 // ms

		const elapsedTime = Date.now() - this.chunkStartTime
		const chunkProgress = Math.min(1, elapsedTime / estimatedChunkDuration)

		// Overall progress: completed chunks + current chunk progress
		const completedChunksProgress =
			this.currentChunkIndex / this.textChunks.length
		const currentChunkContribution = chunkProgress / this.textChunks.length
		const totalProgress = Math.min(
			1,
			completedChunksProgress + currentChunkContribution,
		)

		const currentTime = totalProgress * this.state.duration

		this.updateState({
			progress: totalProgress,
			currentTime,
		})
	}

	private startVisualization(): void {
		if (!this.visualizationEnabled) return

		const animate = () => {
			if (this.state.isPlaying && !this.state.isPaused) {
				// Visualization animation loop
				this.animationFrame = requestAnimationFrame(animate)
			}
		}

		this.animationFrame = requestAnimationFrame(animate)
	}

	private stopVisualization(): void {
		if (this.animationFrame) {
			cancelAnimationFrame(this.animationFrame)
			this.animationFrame = null
		}
	}

	private updateState(newState: Partial<AudioPlayerState>): void {
		this.state = { ...this.state, ...newState }
		this.stateListeners.forEach(listener => listener(this.state))
	}
}

/**
 * Factory function to create audio player instance
 */
export function createAudioPlayer(
	config?: Partial<AudioPlayerConfig>,
): EnhancedAudioPlayer {
	return new EnhancedAudioPlayer(config)
}

/**
 * Check if browser supports required APIs
 */
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
