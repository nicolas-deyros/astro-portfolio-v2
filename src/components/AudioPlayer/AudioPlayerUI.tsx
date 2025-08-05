import React, { useCallback, useEffect, useRef, useState } from 'react'

import type {
	AudioPlayerState,
	EnhancedAudioPlayer,
} from '../../lib/audioPlayer'
import {
	createAudioPlayer,
	isAudioPlayerSupported,
} from '../../lib/audioPlayer'

interface AudioPlayerUIProps {
	text: string
	className?: string
	enableVisualization?: boolean
	autoLoad?: boolean
}

// Enhanced content filtering function
const filterContentForAudio = (rawContent: string): string => {
	// console.log('🎧 Starting with content length:', rawContent.length)

	// Handle markdown content (most blog posts will be markdown)
	let content = rawContent

	// Extract title from markdown (first H1)
	const titleMatch = content.match(/^#\s+(.+)$/m)
	const title = titleMatch?.[1]?.trim() || ''
	// console.log('🎧 Found title:', title)

	// Step 1: Remove frontmatter (YAML between --- lines) - ONLY at the start
	if (content.startsWith('---')) {
		const endIndex = content.indexOf('\n---\n', 4)
		if (endIndex !== -1) {
			content = content.substring(endIndex + 5)
		}
	}
	// console.log('🎧 After removing frontmatter:', content.length)

	// Step 2: Remove import statements
	content = content.replace(/^import\s+[\s\S]*?from\s+['"][^'"]*['"].*$/gm, '')
	content = content.replace(/^import\s+[\s\S]*?['"][^'"]*['"].*$/gm, '')
	// console.log('🎧 After removing imports:', content.length)

	// Step 3: Remove Astro/React components (this might be removing too much!)
	// const beforeComponents = content.length
	content = content.replace(/<[A-Z][a-zA-Z0-9_]*[^>]*\/>/g, '') // Self-closing
	content = content.replace(
		/<[A-Z][a-zA-Z0-9_]*[^>]*>[\s\S]*?<\/[A-Z][a-zA-Z0-9_]*>/g,
		'',
	) // With content
	// console.log(
	// 	'🎧 After removing components:',
	// 	content.length,
	// 	'Removed:',
	// 	beforeComponents - content.length,
	// )

	// Step 4: Remove images and videos
	content = content.replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
	content = content.replace(
		/\[!\[.*?\]\(.*?\)\]\(.*?(youtube|youtu\.be|vimeo|dailymotion).*?\)/gi,
		'',
	)
	// console.log('🎧 After removing images/videos:', content.length)

	// Step 5: Remove only truly problematic HTML elements
	// const beforeHTML = content.length
	content = content.replace(
		/<(script|style|svg|video|audio|iframe|embed)[^>]*>[\s\S]*?<\/\1>/gis,
		'',
	)
	content = content.replace(
		/<(script|style|svg|video|audio|iframe|embed)[^>]*\/?>/gi,
		'',
	)
	// console.log(
	// 	'🎧 After removing problematic HTML:',
	// 	content.length,
	// 	'Removed:',
	// 	beforeHTML - content.length,
	// )

	// Step 6: MINIMAL HTML cleanup - just remove tags, keep ALL content
	// const beforeTagRemoval = content.length
	content = content.replace(/<[^>]*>/g, '') // Remove ALL HTML tags but keep content
	// console.log(
	// 	'🎧 After removing HTML tags:',
	// 	content.length,
	// 	'Removed:',
	// 	beforeTagRemoval - content.length,
	// )

	// Step 7: Remove code blocks
	// const beforeCode = content.length
	content = content.replace(/```[\s\S]*?```/g, '')
	content = content.replace(/`([^`]+)`/g, '$1') // Keep inline code content
	// console.log(
	// 	'🎧 After removing code blocks:',
	// 	content.length,
	// 	'Removed:',
	// 	beforeCode - content.length,
	// )

	// Step 8: MINIMAL markdown cleanup
	content = content.replace(/^#{1,6}\s+/gm, '') // Headers
	content = content.replace(/(\*{1,2}|_{1,2})(.*?)\1/g, '$2') // Bold/italic
	content = content.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
	content = content.replace(/^[-*_]{3,}$/gm, '') // Horizontal rules
	content = content.replace(/^>\s*/gm, '') // Blockquotes
	content = content.replace(/^[\s]*[-*+]\s+/gm, '') // Lists
	content = content.replace(/^[\s]*\d+\.\s+/gm, '') // Numbered lists

	// Step 9: VERY minimal cleanup
	content = content
		.replace(/\s+/g, ' ') // Multiple spaces to single
		.replace(/^\s*[-_+*#>|=~`^]\s*$/gm, '') // Lines with ONLY symbols
		.replace(/https?:\/\/[^\s]+/gi, '') // URLs
		.trim()

	// console.log('🎧 After final cleanup:', content.length)

	// Add title
	if (title && !content.toLowerCase().startsWith(title.toLowerCase())) {
		content = `${title}. ${content}`
	}

	// console.log('🎧 Final result length:', content.length)
	// console.log(
	// 	'🎧 Final content preview (first 500 chars):',
	// 	content.substring(0, 500),
	// )

	return content
}

const AudioPlayerUI: React.FC<AudioPlayerUIProps> = ({
	text,
	className = '',
	enableVisualization = false,
	autoLoad = true,
}) => {
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
	const [supported, setSupported] = useState({
		speechSynthesis: false,
		webAudio: false,
		fullSupport: false,
	})
	const [isSeeking, setIsSeeking] = useState(false)
	const seekTimeoutRef = useRef<number>()

	// Initialize audio player
	useEffect(() => {
		const support = isAudioPlayerSupported()
		setSupported(support)

		if (support.speechSynthesis) {
			const player = createAudioPlayer({
				rate: 1.0,
				volume: 0.8,
				lang: 'en-US',
			})

			const unsubscribe = player.onStateChange(setPlayerState)
			setAudioPlayer(player)

			if (autoLoad && text.trim()) {
				// Filter content before loading
				const filteredText = filterContentForAudio(text)
				// console.log('🎧 === AUDIO PLAYER DEBUG ===')
				// console.log('🎧 Original text length:', text.length)
				// console.log('🎧 Filtered text length:', filteredText.length)
				// console.log(
				// 	'🎧 Reduction ratio:',
				// 	(((text.length - filteredText.length) / text.length) * 100).toFixed(
				// 		1,
				// 	) + '%',
				// )
				// console.log('🎧 Original text first 300 chars:', text.substring(0, 300))
				// console.log(
				// 	'🎧 Filtered text first 300 chars:',
				// 	filteredText.substring(0, 300),
				// )
				// console.log(
				// 	'🎧 Filtered text last 300 chars:',
				// 	filteredText.substring(Math.max(0, filteredText.length - 300)),
				// )
				// console.log('🎧 === END DEBUG ===')

				if (filteredText.trim()) {
					// Calculate expected duration (rough estimate: 150-200 words per minute)
					// const wordCount = filteredText.trim().split(/\s+/).length
					// const estimatedMinutes = Math.round(wordCount / 175)
					// console.log(
					// 	`🎧 Word count: ${wordCount}, Estimated duration: ${estimatedMinutes} minutes`,
					// )
					player.loadText(filteredText)
				} else {
					console.warn('🎧 No content to load after filtering')
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
	}, [text, autoLoad])

	// Set up visualization
	useEffect(() => {
		if (audioPlayer && enableVisualization !== undefined) {
			audioPlayer.setVisualizationEnabled(enableVisualization)
		}
	}, [audioPlayer, enableVisualization])

	const handlePlay = useCallback(() => {
		audioPlayer?.play()
	}, [audioPlayer])

	const handlePause = useCallback(() => {
		audioPlayer?.pause()
	}, [audioPlayer])

	const handleStop = useCallback(() => {
		// Clear any error messages when stopping
		if (audioPlayer) {
			audioPlayer.stop()
			// Small delay to prevent the "interrupted" error from showing
			setTimeout(() => {
				setPlayerState(prev => ({ ...prev, error: null }))
			}, 100)
		}
	}, [audioPlayer])

	const handleSeek = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const position = parseFloat(event.target.value)
			setIsSeeking(true)

			// Clear any pending seek operation
			if (seekTimeoutRef.current) {
				clearTimeout(seekTimeoutRef.current)
			}

			// Immediate visual feedback
			audioPlayer?.seek(position)

			// Debounce the actual seek operation for better performance
			seekTimeoutRef.current = setTimeout(() => {
				setIsSeeking(false)
			}, 150) as unknown as number
		},
		[audioPlayer],
	)

	const formatTime = (seconds: number): string => {
		const mins = Math.floor(seconds / 60)
		const secs = Math.floor(seconds % 60)
		return `${mins}:${secs.toString().padStart(2, '0')}`
	}

	if (!supported.speechSynthesis) {
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

	return (
		<div
			className={`space-y-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 ${className}`}
			role="application"
			aria-label="Enhanced Audio Player">
			{/* Keyboard navigation instructions */}
			<div className="sr-only" aria-live="polite">
				Audio player. Use spacebar to play/pause, arrow keys to seek and adjust
				volume.
			</div>
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-2">
					<h3 className="font-medium text-slate-900 dark:text-white">
						🎧 Enhanced Audio Player
					</h3>
					{!supported.webAudio && (
						<span className="rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
							Basic mode
						</span>
					)}
				</div>

				{playerState.error && !playerState.error.includes('interrupted') && (
					<div className="text-sm text-red-600 dark:text-red-400">
						⚠️ {playerState.error}
					</div>
				)}
			</div>

			{/* Main Controls */}
			<div className="flex items-center space-x-3">
				<button
					onClick={handlePlay}
					onKeyDown={e => {
						if (e.key === ' ' || e.key === 'Enter') {
							e.preventDefault()
							handlePlay()
						}
					}}
					disabled={playerState.isLoading || playerState.isPlaying}
					className="rounded-full bg-blue-500 p-2 text-white transition-colors hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:bg-slate-300 dark:disabled:bg-slate-600"
					title="Play (Spacebar)"
					aria-label={`Play audio${playerState.isLoading ? ' - Loading' : ''}`}>
					{playerState.isLoading ? (
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
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							/>
						</svg>
					) : (
						<svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M8 5v14l11-7z" />
						</svg>
					)}
				</button>

				<button
					onClick={handlePause}
					disabled={!playerState.isPlaying}
					className="rounded-full bg-yellow-500 p-2 text-white transition-colors hover:bg-yellow-600 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:outline-none disabled:bg-slate-300 dark:disabled:bg-slate-600"
					title="Pause (Spacebar)"
					aria-label="Pause audio">
					<svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
						<path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
					</svg>
				</button>

				<button
					onClick={handleStop}
					disabled={!playerState.isPlaying && !playerState.isPaused}
					className="rounded-full bg-red-500 p-2 text-white transition-colors hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:bg-slate-300 dark:disabled:bg-slate-600"
					title="Stop (Escape)"
					aria-label="Stop audio">
					<svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
						<path d="M6 6h12v12H6z" />
					</svg>
				</button>

				{/* Progress */}
				<div className="flex-1 space-y-1">
					<input
						type="range"
						min="0"
						max="1"
						step="0.01"
						value={playerState.progress}
						onChange={handleSeek}
						className={`h-2 w-full cursor-pointer appearance-none rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none ${
							isSeeking
								? 'bg-blue-200 dark:bg-blue-800'
								: 'bg-slate-200 dark:bg-slate-700'
						}`}
						aria-label="Audio progress"
						aria-valuemin={0}
						aria-valuemax={100}
						aria-valuenow={Math.round(playerState.progress * 100)}
						aria-valuetext={`${Math.round(playerState.progress * 100)}% played`}
					/>
					<div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
						<span>{formatTime(playerState.currentTime)}</span>
						<span>{formatTime(playerState.duration)}</span>
					</div>
				</div>
			</div>

			{/* Visualization - Hidden for now */}
			{/* {enableVisualization && supported.webAudio && (
				<AudioVisualization
					audioPlayer={audioPlayer}
					isPlaying={playerState.isPlaying}
					className="w-full"
				/>
			)} */}

			{/* Status */}
			<div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
				<div>
					Status:{' '}
					{playerState.isLoading
						? 'Loading...'
						: playerState.isPlaying
							? 'Playing'
							: playerState.isPaused
								? 'Paused'
								: 'Stopped'}
				</div>
				{supported.webAudio && (
					<div>✅ Web Audio API enabled for advanced features</div>
				)}
				<div className="text-green-600 dark:text-green-400">
					🎯 Smart content filtering: Excludes code, images, and videos
				</div>
				<div className="text-blue-600 dark:text-blue-400">
					📝 Content length: {text.length} chars →{' '}
					{filterContentForAudio(text).length} chars
				</div>
			</div>
		</div>
	)
}

export default AudioPlayerUI
