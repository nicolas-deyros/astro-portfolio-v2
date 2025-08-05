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
				player.loadText(text)
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
		audioPlayer?.stop()
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

				{playerState.error && (
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
			</div>
		</div>
	)
}

export default AudioPlayerUI
