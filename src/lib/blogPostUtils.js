let voices = []
let selectedVoice = null
let utterance = null
let isPlaying = false
let isPaused = false

function updateProgressBar() {
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

	progressBar.style.width = percent + '%'
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

function loadVoices() {
	voices = window.speechSynthesis.getVoices()
	const englishVoices = voices.filter(voice => voice.lang.startsWith('en'))
	selectedVoice =
		englishVoices.find(voice => voice.name.includes('Zira')) ||
		englishVoices.find(voice => voice.name.includes('Samantha')) ||
		englishVoices.find(voice => voice.default) ||
		englishVoices[0]
}

function updateUI() {
	const iconSpan = document.getElementById('read-aloud-icon')
	const labelSpan = document.getElementById('read-aloud-label')
	const stopBtn = document.getElementById('stop-aloud-btn')

	if (isPlaying) {
		if (iconSpan) iconSpan.textContent = isPaused ? '▶️' : '⏸️'
		if (labelSpan) labelSpan.textContent = isPaused ? 'Resume' : 'Pause'
		if (stopBtn) stopBtn.style.display = ''
	} else {
		if (iconSpan) iconSpan.textContent = '▶️'
		if (labelSpan) labelSpan.textContent = 'Read Aloud'
		if (stopBtn) stopBtn.style.display = 'none'
	}
}

function initializeReadAloud() {
	const readBtn = document.getElementById('read-aloud-btn')
	const stopBtn = document.getElementById('stop-aloud-btn')
	const content = document.getElementById('blog-content')

	if (!readBtn || !stopBtn || !content) return

	if (voices.length === 0) {
		window.speechSynthesis.onvoiceschanged = loadVoices
	} else {
		loadVoices()
	}

	readBtn.onclick = () => {
		if (!isPlaying) {
			window.speechSynthesis.cancel()
			const text = content.innerText
			utterance = new window.SpeechSynthesisUtterance(text)

			if (selectedVoice) {
				utterance.voice = selectedVoice
			}
			utterance.lang = 'en-US'
			utterance.rate = 0.9
			utterance.pitch = 1
			utterance.volume = 0.8

			utterance.onend = () => {
				isPlaying = false
				isPaused = false
				updateUI()
			}
			utterance.onerror = () => {
				isPlaying = false
				isPaused = false
				updateUI()
			}
			utterance.onpause = () => {
				isPaused = true
				updateUI()
			}
			utterance.onresume = () => {
				isPaused = false
				updateUI()
			}

			window.speechSynthesis.speak(utterance)
			isPlaying = true
			isPaused = false
			updateUI()
		} else if (
			window.speechSynthesis.speaking &&
			!window.speechSynthesis.paused
		) {
			window.speechSynthesis.pause()
			isPaused = true
			updateUI()
		} else if (window.speechSynthesis.paused) {
			window.speechSynthesis.resume()
			isPaused = false
			updateUI()
		}
	}

	stopBtn.onclick = () => {
		window.speechSynthesis.cancel()
		isPlaying = false
		isPaused = false
		updateUI()
	}
}

function cleanup() {
	window.removeEventListener('scroll', updateProgressBar)
	window.removeEventListener('resize', updateProgressBar)
	window.speechSynthesis.cancel() // Stop speech when leaving the page
	isPlaying = false
	isPaused = false
	utterance = null
}

export function initBlogPostFeatures() {
	updateProgressBar() // Initial call
	window.addEventListener('scroll', updateProgressBar)
	window.addEventListener('resize', updateProgressBar)
	initializeReadAloud()
}

export function cleanupBlogPostFeatures() {
	cleanup()
}
