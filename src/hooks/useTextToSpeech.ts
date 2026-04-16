/**
 * React hook that manages a `EnhancedAudioPlayer` (text-to-speech) lifecycle.
 *
 * Creates and destroys the player, filters the source text, subscribes to
 * state changes, and exposes play/pause/stop/seek handlers.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

import type { AudioPlayerState } from '../lib/audioPlayer'
import { createAudioPlayer, isAudioPlayerSupported } from '../lib/audioPlayer'
import { filterMDXContent } from '../lib/contentFilter'

export interface TextToSpeechHandlers {
	play: () => void
	pause: () => void
	stop: () => void
	seek: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export interface UseTextToSpeechReturn {
	playerState: AudioPlayerState
	handlers: TextToSpeechHandlers
	supported: {
		speechSynthesis: boolean
		webAudio: boolean
		fullSupport: boolean
	}
}

const INITIAL_PLAYER_STATE: AudioPlayerState = {
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

export function useTextToSpeech(
	text: string | undefined,
	autoLoad: boolean,
	enableVisualization: boolean,
): UseTextToSpeechReturn {
	const supported = isAudioPlayerSupported()

	const [playerState, setPlayerState] =
		useState<AudioPlayerState>(INITIAL_PLAYER_STATE)

	// Hold a stable reference to the player so callbacks don't go stale
	const playerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null)
	const seekTimeoutRef = useRef<number | undefined>(undefined)
	const [isSeeking, setIsSeeking] = useState(false)

	// Create / destroy player when text or autoLoad changes
	useEffect(() => {
		if (!supported.speechSynthesis || !text) return

		const player = createAudioPlayer({ rate: 1.0, volume: 0.8, lang: 'en-US' })
		playerRef.current = player
		const unsubscribe = player.onStateChange(setPlayerState)

		if (autoLoad && text.trim()) {
			const filteredText = filterMDXContent(text)
			if (filteredText.trim()) {
				Promise.resolve(player.loadText(filteredText)).catch(err => {
					console.error('[useTextToSpeech] Failed to load text:', err)
				})
			}
		}

		return () => {
			unsubscribe()
			player.destroy()
			playerRef.current = null
			if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current)
		}
	}, [text, autoLoad, supported.speechSynthesis])

	// Sync visualization toggle
	useEffect(() => {
		playerRef.current?.setVisualizationEnabled(enableVisualization)
	}, [enableVisualization])

	const play = useCallback(() => {
		playerRef.current?.play()
	}, [])

	const pause = useCallback(() => {
		playerRef.current?.pause()
	}, [])

	const stop = useCallback(() => {
		if (!playerRef.current) return
		playerRef.current.stop()
		setTimeout(() => {
			setPlayerState(prev => ({ ...prev, error: null }))
		}, 100)
	}, [])

	const seek = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const position = parseFloat(event.target.value)
			setIsSeeking(true)
			if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current)
			playerRef.current?.seek(position)
			seekTimeoutRef.current = setTimeout(() => {
				setIsSeeking(false)
			}, 150) as unknown as number
		},
		// isSeeking is only written here; no need to declare it as dep
		[],
	)

	// Suppress "isSeeking" unused-var — it is consumed by the seek handler via closure
	void isSeeking

	return {
		playerState,
		handlers: { play, pause, stop, seek },
		supported,
	}
}
