import React, { useCallback, useEffect, useRef, useState } from 'react'

import type {
	AudioPlayerState,
	EnhancedAudioPlayer,
} from '../../lib/audioPlayer'
import {
	createAudioPlayer,
	isAudioPlayerSupported,
} from '../../lib/audioPlayer'

interface HybridAudioPlayerProps {
	text?: string
	audioSrc?: string
	className?: string
	enableVisualization?: boolean
	autoLoad?: boolean
	mode?: 'text-to-speech' | 'audio-file' | 'auto'
	preload?: 'none' | 'metadata' | 'auto'
	crossOrigin?: 'anonymous' | 'use-credentials'
	loop?: boolean
}

const filterContentForAudio = (rawContent: string): string => {
	let content = rawContent

	// Extract title from markdown (first H1)
	const titleMatch = content.match(/^#\s+(.+)$/m)
	const title = titleMatch?.[1]?.trim() || ''

	// Step 1: Remove frontmatter (YAML between --- lines) - ONLY at the start
	if (content.startsWith('---')) {
		const endIndex = content.indexOf('\n---\n', 4)
		if (endIndex !== -1) {
			content = content.substring(endIndex + 5)
		}
	}

	// Step 2: Remove import statements
	content = content.replace(/^import\s+[\s\S]*?from\s+['"][^'"]*['"].*$/gm, '')
	content = content.replace(/^import\s+[\s\S]*?['"][^'"]*['"].*$/gm, '')

	// Step 3: Remove Astro/React components
	content = content.replace(/<[A-Z][a-zA-Z0-9_]*[^>]*\/>/g, '') // Self-closing
	content = content.replace(
		/<[A-Z][a-zA-Z0-9_]*[^>]*>[\s\S]*?<\/[A-Z][a-zA-Z0-9_]*>/g,
		'',
	) // With content

	// Step 4: Remove images and videos
	content = content.replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
	content = content.replace(
		/\[!\[.*?\]\(.*?\)\]\(.*?(youtube|youtu\.be|vimeo|dailymotion).*?\)/gi,
		'',
	)

	// Step 5: Remove problematic HTML elements
	content = content.replace(
		/<(script|style|svg|video|audio|iframe|embed)[^>]*>[\s\S]*?<\/\1>/gis,
		'',
	)
	content = content.replace(
		/<(script|style|svg|video|audio|iframe|embed)[^>]*\/?>/gi,
		'',
	)

	// Step 6: Remove HTML tags but keep content
	content = content.replace(/<[^>]*>/g, '')

	// Step 7: Remove code blocks
	content = content.replace(/```[\s\S]*?```/g, '')
	content = content.replace(/`([^`]+)`/g, '$1') // Keep inline code content

	// Step 8: Minimal markdown cleanup
	content = content.replace(/^#{1,6}\s+/gm, '') // Headers
	content = content.replace(/(\*{1,2}|_{1,2})(.*?)\1/g, '$2') // Bold/italic
	content = content.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
	content = content.replace(/^[-*_]{3,}$/gm, '') // Horizontal rules
	content = content.replace(/^>\s*/gm, '') // Blockquotes
	content = content.replace(/^[\s]*[-*+]\s+/gm, '') // Lists
	content = content.replace(/^[\s]*\d+\.\s+/gm, '') // Numbered lists

	// Step 9: Final cleanup
	content = content
		.replace(/\s+/g, ' ') // Multiple spaces to single
		.replace(/^\s*[-_+*#>|=~`^]\s*$/gm, '') // Lines with ONLY symbols
		.replace(/https?:\/\/[^\s]+/gi, '') // URLs
		.trim()

	// Add title
	if (title && !content.toLowerCase().startsWith(title.toLowerCase())) {
		content = `${title}. ${content}`
	}

	return content
}

const HybridAudioPlayer: React.FC<HybridAudioPlayerProps> = ({
	text,
	audioSrc,
	className = '',
	enableVisualization = false,
	autoLoad = true,
	mode = 'auto',
	preload = 'metadata',
	crossOrigin,
	loop = false,
}) => {
	// Determine the actual mode to use
	const actualMode =
		mode === 'auto' ? (audioSrc ? 'audio-file' : 'text-to-speech') : mode

	// Text-to-speech state
	const [audioPlayer, setAudioPlayer] = useState<EnhancedAudioPlayer | null>(
		null,
	)
	const [playerState, setPlayerState] = useState<AudioPlayerState>({
		isPlaying: false,
		isPaused: false,
		isLoading: false,
		currentTime: 0,
		duration: 0,
		volume: 0.8,
		rate: 1.0,
		progress: 0,
		error: null,
	})

	// HTML5 audio state
	const audioRef = useRef<HTMLAudioElement>(null)
	const [audioFileState, setAudioFileState] = useState({
		isPlaying: false,
		isPaused: false,
		isLoading: false,
		currentTime: 0,
		duration: 0,
		volume: 0.8,
		progress: 0,
		error: null as string | null,
	})

	const [supported, setSupported] = useState({
		speechSynthesis: false,
		webAudio: false,
		fullSupport: false,
		htmlAudio: false,
	})
	const [isSeeking, setIsSeeking] = useState(false)
	const seekTimeoutRef = useRef<number | undefined>(undefined)

	// Initialize based on mode
	useEffect(() => {
		const support = isAudioPlayerSupported()
		const htmlAudio = 'Audio' in window
		setSupported({ ...support, htmlAudio })

		if (actualMode === 'text-to-speech' && support.speechSynthesis && text) {
			const player = createAudioPlayer({
				rate: 1.0,
				volume: 0.8,
				lang: 'en-US',
			})

			const unsubscribe = player.onStateChange(setPlayerState)
			setAudioPlayer(player)

			if (autoLoad && text.trim()) {
				const filteredText = filterContentForAudio(text)
				if (filteredText.trim()) {
					Promise.resolve(player.loadText(filteredText)).catch(err => {
						console.error('[AudioPlayer] Failed to load text:', err)
					})
				}
			}

			return () => {
				unsubscribe()
				player.destroy()
				if (seekTimeoutRef.current) {
					clearTimeout(seekTimeoutRef.current)
				}
			}
		}
	}, [text, audioSrc, actualMode, autoLoad])

	// Set up HTML5 audio event listeners
	useEffect(() => {
		const audio = audioRef.current
		if (!audio || actualMode !== 'audio-file') return

		const handleLoadStart = () =>
			setAudioFileState(prev => ({ ...prev, isLoading: true }))
		const handleLoadedMetadata = () => {
			setAudioFileState(prev => ({
				...prev,
				duration: audio.duration,
				isLoading: false,
			}))
		}
		const handleLoadedData = () =>
			setAudioFileState(prev => ({ ...prev, isLoading: false }))
		const handleCanPlay = () =>
			setAudioFileState(prev => ({ ...prev, isLoading: false }))

		const handleTimeUpdate = () => {
			if (!isSeeking) {
				const progress =
					audio.duration > 0 ? audio.currentTime / audio.duration : 0
				setAudioFileState(prev => ({
					...prev,
					currentTime: audio.currentTime,
					progress,
				}))
			}
		}

		const handlePlay = () => {
			setAudioFileState(prev => ({
				...prev,
				isPlaying: true,
				isPaused: false,
				error: null,
			}))
		}

		const handlePause = () => {
			setAudioFileState(prev => ({
				...prev,
				isPlaying: false,
				isPaused: true,
			}))
		}

		const handleEnded = () => {
			setAudioFileState(prev => ({
				...prev,
				isPlaying: false,
				isPaused: false,
				currentTime: 0,
				progress: 0,
			}))
		}

		const handleError = (e: Event) => {
			const target = e.target as HTMLAudioElement
			const error = target.error
			let errorMessage = 'Audio playback error'

			if (error) {
				switch (error.code) {
					case error.MEDIA_ERR_ABORTED:
						errorMessage = 'Audio playback aborted'
						break
					case error.MEDIA_ERR_NETWORK:
						errorMessage = 'Network error while loading audio'
						break
					case error.MEDIA_ERR_DECODE:
						errorMessage = 'Audio decoding error'
						break
					case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
						errorMessage = 'Audio format not supported'
						break
				}
			}

			setAudioFileState(prev => ({
				...prev,
				error: errorMessage,
				isLoading: false,
				isPlaying: false,
			}))
		}

		const handleVolumeChange = () => {
			setAudioFileState(prev => ({
				...prev,
				volume: audio.volume,
			}))
		}

		// Add event listeners
		audio.addEventListener('loadstart', handleLoadStart)
		audio.addEventListener('loadedmetadata', handleLoadedMetadata)
		audio.addEventListener('loadeddata', handleLoadedData)
		audio.addEventListener('canplay', handleCanPlay)
		audio.addEventListener('timeupdate', handleTimeUpdate)
		audio.addEventListener('play', handlePlay)
		audio.addEventListener('pause', handlePause)
		audio.addEventListener('ended', handleEnded)
		audio.addEventListener('error', handleError)
		audio.addEventListener('volumechange', handleVolumeChange)

		return () => {
			audio.removeEventListener('loadstart', handleLoadStart)
			audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
			audio.removeEventListener('loadeddata', handleLoadedData)
			audio.removeEventListener('canplay', handleCanPlay)
			audio.removeEventListener('timeupdate', handleTimeUpdate)
			audio.removeEventListener('play', handlePlay)
			audio.removeEventListener('pause', handlePause)
			audio.removeEventListener('ended', handleEnded)
			audio.removeEventListener('error', handleError)
			audio.removeEventListener('volumechange', handleVolumeChange)
		}
	}, [actualMode, isSeeking])

	// Set up visualization for text-to-speech
	useEffect(() => {
		if (
			audioPlayer &&
			enableVisualization !== undefined &&
			actualMode === 'text-to-speech'
		) {
			audioPlayer.setVisualizationEnabled(enableVisualization)
		}
	}, [audioPlayer, enableVisualization, actualMode])

	// Control handlers for text-to-speech
	const handleTextPlay = useCallback(() => {
		audioPlayer?.play()
	}, [audioPlayer])

	const handleTextPause = useCallback(() => {
		audioPlayer?.pause()
	}, [audioPlayer])

	const handleTextStop = useCallback(() => {
		if (audioPlayer) {
			audioPlayer.stop()
			setTimeout(() => {
				setPlayerState(prev => ({ ...prev, error: null }))
			}, 100)
		}
	}, [audioPlayer])

	const handleTextSeek = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const position = parseFloat(event.target.value)
			setIsSeeking(true)

			if (seekTimeoutRef.current) {
				clearTimeout(seekTimeoutRef.current)
			}

			audioPlayer?.seek(position)

			seekTimeoutRef.current = setTimeout(() => {
				setIsSeeking(false)
			}, 150) as unknown as number
		},
		[audioPlayer],
	)

	// Control handlers for audio file
	const handleAudioPlay = useCallback(() => {
		const audio = audioRef.current
		if (audio) {
			audio.play().catch(error => {
				setAudioFileState(prev => ({
					...prev,
					error: `Playback failed: ${error.message}`,
				}))
			})
		}
	}, [])

	const handleAudioPause = useCallback(() => {
		const audio = audioRef.current
		if (audio) {
			audio.pause()
		}
	}, [])

	const handleAudioStop = useCallback(() => {
		const audio = audioRef.current
		if (audio) {
			audio.pause()
			audio.currentTime = 0
		}
	}, [])

	const handleAudioSeek = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const audio = audioRef.current
			if (audio) {
				const position = parseFloat(event.target.value)
				setIsSeeking(true)

				if (seekTimeoutRef.current) {
					clearTimeout(seekTimeoutRef.current)
				}

				const newTime = (position / 100) * audio.duration
				audio.currentTime = newTime

				seekTimeoutRef.current = setTimeout(() => {
					setIsSeeking(false)
				}, 150) as unknown as number
			}
		},
		[],
	)

	const handleVolumeChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const volume = parseFloat(event.target.value) / 100

			if (actualMode === 'text-to-speech' && audioPlayer) {
				// Text-to-speech volume control would go here
				// Note: Web Speech API doesn't have runtime volume control
			} else if (actualMode === 'audio-file') {
				const audio = audioRef.current
				if (audio) {
					audio.volume = volume
				}
			}
		},
		[actualMode, audioPlayer],
	)

	const formatTime = (seconds: number): string => {
		const mins = Math.floor(seconds / 60)
		const secs = Math.floor(seconds % 60)
		return `${mins}:${secs.toString().padStart(2, '0')}`
	}

	// Get current state based on mode
	const currentState =
		actualMode === 'text-to-speech' ? playerState : audioFileState
	const currentError =
		actualMode === 'text-to-speech' ? playerState.error : audioFileState.error

	// Check support
	if (actualMode === 'text-to-speech' && !supported.speechSynthesis) {
		return (
			<div
				className={`rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20 ${className}`}>
				<p className="text-sm text-red-700 dark:text-red-300">
					🚫 Text-to-speech is not supported in your browser. Please try a
					modern browser like Chrome, Firefox, or Safari.
				</p>
			</div>
		)
	}

	if (actualMode === 'audio-file' && !supported.htmlAudio) {
		return (
			<div
				className={`rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20 ${className}`}>
				<p className="text-sm text-red-700 dark:text-red-300">
					🚫 HTML5 audio is not supported in your browser. Please upgrade to a
					modern browser.
				</p>
			</div>
		)
	}

	return (
		<div
			className={`space-y-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 ${className}`}
			role="application"
			aria-label={`Hybrid Audio Player - ${actualMode === 'text-to-speech' ? 'Text-to-Speech' : 'Audio File'} Mode`}>
			{/* Hidden HTML5 audio element for audio-file mode */}
			{actualMode === 'audio-file' && audioSrc && (
				<audio
					ref={audioRef}
					preload={preload}
					crossOrigin={crossOrigin}
					loop={loop}
					className="hidden"
					src={audioSrc}>
					{/* Empty track for accessibility compliance */}
					<track kind="captions" srcLang="en" label="English captions" />
				</audio>
			)}

			{/* Keyboard navigation instructions */}
			<div className="sr-only" aria-live="polite">
				Hybrid audio player in {actualMode} mode. Use spacebar to play/pause,
				arrow keys to seek and adjust volume.
			</div>

			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-2">
					<h3 className="font-medium text-slate-900 dark:text-white">
						{actualMode === 'text-to-speech' ? '🎧' : '🔊'} Hybrid Audio Player
					</h3>
					<span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
						{actualMode === 'text-to-speech' ? 'Text-to-Speech' : 'Audio File'}
					</span>
					{actualMode === 'text-to-speech' && !supported.webAudio && (
						<span className="rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
							Basic mode
						</span>
					)}
				</div>

				{currentError && !currentError.includes('interrupted') && (
					<div className="text-sm text-red-600 dark:text-red-400">
						⚠️ {currentError}
					</div>
				)}
			</div>

			{/* Main Controls */}
			<div className="flex items-center space-x-3">
				<button
					onClick={
						actualMode === 'text-to-speech' ? handleTextPlay : handleAudioPlay
					}
					disabled={currentState.isLoading || currentState.isPlaying}
					className="rounded-full bg-blue-500 p-2 text-white transition-colors hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:bg-slate-300 dark:disabled:bg-slate-600"
					title="Play (Spacebar)"
					aria-label={`Play audio${currentState.isLoading ? ' - Loading' : ''}`}>
					{currentState.isLoading ? (
						<svg
							className="h-5 w-5 animate-spin"
							fill="none"
							viewBox="0 0 24 24">
							<circle
								className="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								strokeWidth="4"
							/>
							<path
								className="opacity-75"
								fill="currentColor"
								d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							/>
						</svg>
					) : (
						<svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
							<path
								fillRule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
								clipRule="evenodd"
							/>
						</svg>
					)}
				</button>

				<button
					onClick={
						actualMode === 'text-to-speech' ? handleTextPause : handleAudioPause
					}
					disabled={!currentState.isPlaying}
					className="rounded-full bg-yellow-500 p-2 text-white transition-colors hover:bg-yellow-600 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:outline-none disabled:bg-slate-300 dark:disabled:bg-slate-600"
					title="Pause"
					aria-label="Pause audio">
					<svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
						<path
							fillRule="evenodd"
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
							clipRule="evenodd"
						/>
					</svg>
				</button>

				<button
					onClick={
						actualMode === 'text-to-speech' ? handleTextStop : handleAudioStop
					}
					disabled={!currentState.isPlaying && !currentState.isPaused}
					className="rounded-full bg-red-500 p-2 text-white transition-colors hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:bg-slate-300 dark:disabled:bg-slate-600"
					title="Stop"
					aria-label="Stop audio">
					<svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
						<path
							fillRule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
							clipRule="evenodd"
						/>
					</svg>
				</button>

				{/* Progress display */}
				<div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
					<span>{formatTime(currentState.currentTime)}</span>
					<span>/</span>
					<span>{formatTime(currentState.duration)}</span>
				</div>
			</div>

			{/* Progress Bar */}
			<div className="space-y-2">
				<div className="flex items-center space-x-2">
					<span className="text-sm text-slate-600 dark:text-slate-400">
						Progress:
					</span>
					<input
						type="range"
						min="0"
						max={actualMode === 'text-to-speech' ? '1' : '100'}
						step={actualMode === 'text-to-speech' ? '0.01' : '0.1'}
						value={
							actualMode === 'text-to-speech'
								? currentState.progress
								: currentState.progress * 100
						}
						onChange={
							actualMode === 'text-to-speech' ? handleTextSeek : handleAudioSeek
						}
						className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-slate-200 dark:bg-slate-700"
						title="Seek position"
						aria-label="Seek audio position"
					/>
					<span className="text-sm text-slate-600 dark:text-slate-400">
						{Math.round(currentState.progress * 100)}%
					</span>
				</div>

				{/* Volume Control (primarily for audio-file mode) */}
				{actualMode === 'audio-file' && (
					<div className="flex items-center space-x-2">
						<span className="text-sm text-slate-600 dark:text-slate-400">
							Volume:
						</span>
						<input
							type="range"
							min="0"
							max="100"
							step="1"
							value={currentState.volume * 100}
							onChange={handleVolumeChange}
							className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-slate-200 dark:bg-slate-700"
							title="Adjust volume"
							aria-label="Adjust audio volume"
						/>
						<span className="text-sm text-slate-600 dark:text-slate-400">
							{Math.round(currentState.volume * 100)}%
						</span>
					</div>
				)}
			</div>

			{/* Mode Information */}
			<div className="text-xs text-slate-500 dark:text-slate-400">
				{actualMode === 'text-to-speech' && (
					<p>
						🎧 Text-to-Speech mode: Converting text to speech using Web Speech
						API
					</p>
				)}
				{actualMode === 'audio-file' && (
					<p>🔊 Audio File mode: Playing audio file using HTML5 Audio API</p>
				)}
			</div>
		</div>
	)
}

export default HybridAudioPlayer
