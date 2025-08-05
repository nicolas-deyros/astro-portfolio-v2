interface BlogPostState {
	voices: SpeechSynthesisVoice[]
	selectedVoice: SpeechSynthesisVoice | null
	utterance: SpeechSynthesisUtterance | null
	isPlaying: boolean
	isPaused: boolean
}

const state: BlogPostState = {
	voices: [],
	selectedVoice: null,
	utterance: null,
	isPlaying: false,
	isPaused: false,
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

function loadVoices(): void {
	state.voices = window.speechSynthesis.getVoices()
	const englishVoices = state.voices.filter((voice) => voice.lang.startsWith('en'))
	state.selectedVoice =
		englishVoices.find((voice) => voice.name.includes('Zira')) ||
		englishVoices.find((voice) => voice.name.includes('Samantha')) ||
		englishVoices.find((voice) => voice.default) ||
		englishVoices[0] ||
		null
}

function updateUI(): void {
	const iconSpan = document.getElementById('read-aloud-icon')
	const labelSpan = document.getElementById('read-aloud-label')
	const stopBtn = document.getElementById('stop-aloud-btn')

	if (state.isPlaying) {
		if (iconSpan) iconSpan.textContent = state.isPaused ? '▶️' : '⏸️'
		if (labelSpan) labelSpan.textContent = state.isPaused ? 'Resume' : 'Pause'
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

	if (state.voices.length === 0) {
		window.speechSynthesis.onvoiceschanged = loadVoices
	} else {
		loadVoices()
	}

	readBtn.onclick = (): void => {
		if (!state.isPlaying) {
			window.speechSynthesis.cancel()
			const text = content.innerText
			state.utterance = new window.SpeechSynthesisUtterance(text)

			if (state.selectedVoice) {
				state.utterance.voice = state.selectedVoice
			}
			state.utterance.lang = 'en-US'
			state.utterance.rate = 0.9
			state.utterance.pitch = 1
			state.utterance.volume = 0.8

			state.utterance.onend = (): void => {
				state.isPlaying = false
				state.isPaused = false
				updateUI()
			}
			state.utterance.onerror = (): void => {
				state.isPlaying = false
				state.isPaused = false
				updateUI()
			}
			state.utterance.onpause = (): void => {
				state.isPaused = true
				updateUI()
			}
			state.utterance.onresume = (): void => {
				state.isPaused = false
				updateUI()
			}

			window.speechSynthesis.speak(state.utterance)
			state.isPlaying = true
			state.isPaused = false
			updateUI()
		} else if (
			window.speechSynthesis.speaking &&
			!window.speechSynthesis.paused
		) {
			window.speechSynthesis.pause()
			state.isPaused = true
			updateUI()
		} else if (window.speechSynthesis.paused) {
			window.speechSynthesis.resume()
			state.isPaused = false
			updateUI()
		}
	}

	stopBtn.onclick = (): void => {
		window.speechSynthesis.cancel()
		state.isPlaying = false
		state.isPaused = false
		updateUI()
	}
}

function cleanup(): void {
	window.removeEventListener('scroll', updateProgressBar)
	window.removeEventListener('resize', updateProgressBar)
	window.speechSynthesis.cancel() // Stop speech when leaving the page
	state.isPlaying = false
	state.isPaused = false
	state.utterance = null
}

export function initBlogPostFeatures(): void {
	updateProgressBar() // Initial call
	window.addEventListener('scroll', updateProgressBar)
	window.addEventListener('resize', updateProgressBar)
	initializeReadAloud()
}

export function cleanupBlogPostFeatures(): void {
	cleanup()
}
