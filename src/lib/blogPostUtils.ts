import { createAudioPlayer, type EnhancedAudioPlayer } from './audioPlayer'

interface BlogPostState {
	audioPlayer: EnhancedAudioPlayer | null
	isInitialized: boolean
}

const state: BlogPostState = {
	audioPlayer: null,
	isInitialized: false,
}

function updateProgressBar(): void {
	const blogContent = document.getElementById('blog-content')
	const progressBar = document.getElementById('progress-bar')
	const progressPercent = document.getElementById('progress-percent')

	if (!blogContent || !progressBar || !progressPercent) return

	const rect = blogContent.getBoundingClientRect()
	const scrollTop = window.scrollY || window.pageYOffset
	const contentTop = rect.top + scrollTop
	const contentHeight = blogContent.offsetHeight
	const windowHeight = window.innerHeight
	const maxScroll = contentTop + contentHeight - windowHeight

	let percent = 0
	if (maxScroll > contentTop) {
		// Avoid division by zero if content is smaller than window
		percent = Math.min(
			100,
			Math.max(0, ((scrollTop - contentTop) / (maxScroll - contentTop)) * 100),
		)
	} else if (contentHeight > 0) {
		// If content is visible but not scrollable, show 100%
		percent = 100
	}

	progressBar.style.width = `${percent}%`
	progressPercent.textContent = `${Math.round(percent)}%`

	// Update position based on screen size
	if (window.innerWidth < 768) {
		// Assuming 768px is your mobile breakpoint
		progressPercent.classList.remove('right-4')
		progressPercent.classList.add('left-4')
	} else {
		progressPercent.classList.remove('left-4')
		progressPercent.classList.add('right-4')
	}
}

function updateUI(): void {
	const iconSpan = document.getElementById('read-aloud-icon')
	const labelSpan = document.getElementById('read-aloud-label')
	const stopBtn = document.getElementById('stop-aloud-btn')

	if (!state.audioPlayer) return

	const playerState = state.audioPlayer.getState()

	if (playerState.isPlaying) {
		if (iconSpan) iconSpan.textContent = playerState.isPaused ? '▶️' : '⏸️'
		if (labelSpan)
			labelSpan.textContent = playerState.isPaused ? 'Resume' : 'Pause'
		if (stopBtn) stopBtn.style.display = ''
	} else {
		if (iconSpan) iconSpan.textContent = '▶️'
		if (labelSpan) labelSpan.textContent = 'Read Aloud'
		if (stopBtn) stopBtn.style.display = 'none'
	}
}

function initializeReadAloud(): void {
	const readBtn = document.getElementById('read-aloud-btn')
	const stopBtn = document.getElementById('stop-aloud-btn')
	const content = document.getElementById('blog-content')

	if (!readBtn || !stopBtn || !content) return

	// Initialize enhanced audio player
	if (!state.audioPlayer) {
		state.audioPlayer = createAudioPlayer({
			rate: 0.9,
			pitch: 1.0,
			volume: 0.8,
			lang: 'en-US',
		})

		// Set up state change listener for UI updates
		state.audioPlayer.onStateChange(() => {
			updateUI()
		})
	}

	readBtn.onclick = async (): Promise<void> => {
		if (!state.audioPlayer) return

		const playerState = state.audioPlayer.getState()

		if (!playerState.isPlaying) {
			// Load and start playing content
			const text = content.innerHTML // Use innerHTML to get rich content for better filtering
			try {
				await state.audioPlayer.loadText(text)
				await state.audioPlayer.play()
			} catch (error) {
				console.error('Error starting audio playback:', error)
			}
		} else if (playerState.isPlaying && !playerState.isPaused) {
			// Pause playback
			state.audioPlayer.pause()
		} else if (playerState.isPaused) {
			// Resume playback
			await state.audioPlayer.play()
		}
	}

	stopBtn.onclick = (): void => {
		if (state.audioPlayer) {
			state.audioPlayer.stop()
		}
	}
}

function cleanup(): void {
	window.removeEventListener('scroll', updateProgressBar)
	window.removeEventListener('resize', updateProgressBar)

	// Clean up enhanced audio player
	if (state.audioPlayer) {
		state.audioPlayer.destroy()
		state.audioPlayer = null
	}

	state.isInitialized = false
}

export function initBlogPostFeatures(): void {
	if (state.isInitialized) return

	updateProgressBar() // Initial call
	window.addEventListener('scroll', updateProgressBar)
	window.addEventListener('resize', updateProgressBar)
	initializeReadAloud()

	state.isInitialized = true
}

export function cleanupBlogPostFeatures(): void {
	cleanup()
}
