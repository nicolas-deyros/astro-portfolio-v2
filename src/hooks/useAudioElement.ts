/**
 * React hook that manages an HTML5 `<audio>` element lifecycle.
 *
 * Registers/removes all necessary event listeners, tracks loading, playback,
 * seeking, and error state, and exposes play/pause/stop/seek/volume handlers.
 */
import { useCallback, useRef, useState } from 'react'
import { useEffect } from 'react'

export interface AudioFileState {
	isPlaying: boolean
	isPaused: boolean
	isLoading: boolean
	currentTime: number
	duration: number
	volume: number
	progress: number
	error: string | null
}

export interface AudioElementHandlers {
	play: () => void
	pause: () => void
	stop: () => void
	seek: (event: React.ChangeEvent<HTMLInputElement>) => void
	volumeChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export interface UseAudioElementReturn {
	audioRef: React.RefObject<HTMLAudioElement | null>
	audioFileState: AudioFileState
	handlers: AudioElementHandlers
}

const INITIAL_AUDIO_STATE: AudioFileState = {
	isPlaying: false,
	isPaused: false,
	isLoading: false,
	currentTime: 0,
	duration: 0,
	volume: 0.8,
	progress: 0,
	error: null,
}

export function useAudioElement(enabled: boolean): UseAudioElementReturn {
	const audioRef = useRef<HTMLAudioElement>(null)
	const seekTimeoutRef = useRef<number | undefined>(undefined)
	const [isSeeking, setIsSeeking] = useState(false)
	const [audioFileState, setAudioFileState] =
		useState<AudioFileState>(INITIAL_AUDIO_STATE)

	useEffect(() => {
		const audio = audioRef.current
		if (!audio || !enabled) return

		const onLoadStart = () =>
			setAudioFileState(prev => ({ ...prev, isLoading: true }))

		const onLoadedMetadata = () =>
			setAudioFileState(prev => ({
				...prev,
				duration: audio.duration,
				isLoading: false,
			}))

		const onLoadedData = () =>
			setAudioFileState(prev => ({ ...prev, isLoading: false }))

		const onCanPlay = () =>
			setAudioFileState(prev => ({ ...prev, isLoading: false }))

		const onTimeUpdate = () => {
			if (isSeeking) return
			const progress =
				audio.duration > 0 ? audio.currentTime / audio.duration : 0
			setAudioFileState(prev => ({
				...prev,
				currentTime: audio.currentTime,
				progress,
			}))
		}

		const onPlay = () =>
			setAudioFileState(prev => ({
				...prev,
				isPlaying: true,
				isPaused: false,
				error: null,
			}))

		const onPause = () =>
			setAudioFileState(prev => ({
				...prev,
				isPlaying: false,
				isPaused: true,
			}))

		const onEnded = () =>
			setAudioFileState(prev => ({
				...prev,
				isPlaying: false,
				isPaused: false,
				currentTime: 0,
				progress: 0,
			}))

		const onError = (e: Event) => {
			const target = e.target as HTMLAudioElement
			const err = target.error
			let message = 'Audio playback error'
			if (err) {
				if (err.code === err.MEDIA_ERR_ABORTED)
					message = 'Audio playback aborted'
				else if (err.code === err.MEDIA_ERR_NETWORK)
					message = 'Network error while loading audio'
				else if (err.code === err.MEDIA_ERR_DECODE)
					message = 'Audio decoding error'
				else if (err.code === err.MEDIA_ERR_SRC_NOT_SUPPORTED)
					message = 'Audio format not supported'
			}
			setAudioFileState(prev => ({
				...prev,
				error: message,
				isLoading: false,
				isPlaying: false,
			}))
		}

		const onVolumeChange = () =>
			setAudioFileState(prev => ({ ...prev, volume: audio.volume }))

		audio.addEventListener('loadstart', onLoadStart)
		audio.addEventListener('loadedmetadata', onLoadedMetadata)
		audio.addEventListener('loadeddata', onLoadedData)
		audio.addEventListener('canplay', onCanPlay)
		audio.addEventListener('timeupdate', onTimeUpdate)
		audio.addEventListener('play', onPlay)
		audio.addEventListener('pause', onPause)
		audio.addEventListener('ended', onEnded)
		audio.addEventListener('error', onError)
		audio.addEventListener('volumechange', onVolumeChange)

		return () => {
			audio.removeEventListener('loadstart', onLoadStart)
			audio.removeEventListener('loadedmetadata', onLoadedMetadata)
			audio.removeEventListener('loadeddata', onLoadedData)
			audio.removeEventListener('canplay', onCanPlay)
			audio.removeEventListener('timeupdate', onTimeUpdate)
			audio.removeEventListener('play', onPlay)
			audio.removeEventListener('pause', onPause)
			audio.removeEventListener('ended', onEnded)
			audio.removeEventListener('error', onError)
			audio.removeEventListener('volumechange', onVolumeChange)
		}
	}, [enabled, isSeeking])

	const play = useCallback(() => {
		const audio = audioRef.current
		if (!audio) return
		audio.play().catch(err => {
			setAudioFileState(prev => ({
				...prev,
				error: `Playback failed: ${err.message}`,
			}))
		})
	}, [])

	const pause = useCallback(() => {
		audioRef.current?.pause()
	}, [])

	const stop = useCallback(() => {
		const audio = audioRef.current
		if (!audio) return
		audio.pause()
		audio.currentTime = 0
	}, [])

	const seek = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		const audio = audioRef.current
		if (!audio) return
		const position = parseFloat(event.target.value)
		setIsSeeking(true)
		if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current)
		audio.currentTime = (position / 100) * audio.duration
		seekTimeoutRef.current = setTimeout(() => {
			setIsSeeking(false)
		}, 150) as unknown as number
	}, [])

	const volumeChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const audio = audioRef.current
			if (audio) {
				audio.volume = parseFloat(event.target.value) / 100
			}
		},
		[],
	)

	return {
		audioRef,
		audioFileState,
		handlers: { play, pause, stop, seek, volumeChange },
	}
}
