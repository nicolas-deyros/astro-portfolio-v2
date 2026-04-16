import React from 'react'

import { useAudioElement } from '../../hooks/useAudioElement'
import { useTextToSpeech } from '../../hooks/useTextToSpeech'

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

const formatTime = (seconds: number): string => {
	const mins = Math.floor(seconds / 60)
	const secs = Math.floor(seconds % 60)
	return `${mins}:${secs.toString().padStart(2, '0')}`
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
	const actualMode =
		mode === 'auto' ? (audioSrc ? 'audio-file' : 'text-to-speech') : mode

	const isTTS = actualMode === 'text-to-speech'

	const {
		playerState,
		handlers: ttsHandlers,
		supported,
	} = useTextToSpeech(text, autoLoad, enableVisualization)

	const {
		audioRef,
		audioFileState,
		handlers: audioHandlers,
	} = useAudioElement(actualMode === 'audio-file')

	const currentState = isTTS ? playerState : audioFileState
	const currentError = isTTS ? playerState.error : audioFileState.error

	const onPlay = isTTS ? ttsHandlers.play : audioHandlers.play
	const onPause = isTTS ? ttsHandlers.pause : audioHandlers.pause
	const onStop = isTTS ? ttsHandlers.stop : audioHandlers.stop
	const onSeek = isTTS ? ttsHandlers.seek : audioHandlers.seek

	if (isTTS && !supported.speechSynthesis) {
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

	if (!isTTS && !('Audio' in window)) {
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
			aria-label={`Hybrid Audio Player - ${isTTS ? 'Text-to-Speech' : 'Audio File'} Mode`}>
			{/* Hidden HTML5 audio element for audio-file mode */}
			{!isTTS && audioSrc && (
				<audio
					ref={audioRef}
					preload={preload}
					crossOrigin={crossOrigin}
					loop={loop}
					className="hidden"
					src={audioSrc}>
					<track kind="captions" srcLang="en" label="English captions" />
				</audio>
			)}

			{/* Screen-reader live region */}
			<div className="sr-only" aria-live="polite">
				Hybrid audio player in {actualMode} mode. Use spacebar to play/pause,
				arrow keys to seek and adjust volume.
			</div>

			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-2">
					<h3 className="font-medium text-slate-900 dark:text-white">
						{isTTS ? '🎧' : '🔊'} Hybrid Audio Player
					</h3>
					<span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
						{isTTS ? 'Text-to-Speech' : 'Audio File'}
					</span>
					{isTTS && !supported.webAudio && (
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
					onClick={onPlay}
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
					onClick={onPause}
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
					onClick={onStop}
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

				{/* Time display */}
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
						max={isTTS ? '1' : '100'}
						step={isTTS ? '0.01' : '0.1'}
						value={isTTS ? currentState.progress : currentState.progress * 100}
						onChange={onSeek}
						className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-slate-200 dark:bg-slate-700"
						title="Seek position"
						aria-label="Seek audio position"
					/>
					<span className="text-sm text-slate-600 dark:text-slate-400">
						{Math.round(currentState.progress * 100)}%
					</span>
				</div>

				{/* Volume control (audio-file mode only) */}
				{!isTTS && (
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
							onChange={audioHandlers.volumeChange}
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

			{/* Mode badge */}
			<div className="text-xs text-slate-500 dark:text-slate-400">
				{isTTS ? (
					<p>
						🎧 Text-to-Speech mode: Converting text to speech using Web Speech
						API
					</p>
				) : (
					<p>🔊 Audio File mode: Playing audio file using HTML5 Audio API</p>
				)}
			</div>
		</div>
	)
}

export default HybridAudioPlayer
