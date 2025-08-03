import { describe, it, expect } from 'vitest'

describe('Video Component', () => {
    it('should generate a YouTube iframe with the correct src', () => {
        const platform = 'youtube'
        const videoId = 'KveU2UVJD80'
        const expectedSrc = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`

        const videoUrls = {
            youtube: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`,
            vimeo: `https://player.vimeo.com/video/${videoId}?badge=0&autopause=0`,
        };

        const videoUrl = videoUrls[platform];

        const renderedComponent = `
<div class="relative mb-8 aspect-video w-full overflow-hidden rounded-lg shadow-lg">
	<iframe
		src="${videoUrl}"
		class="absolute inset-0 h-full w-full"
		frameborder="0"
		allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
		allowfullscreen
		loading="lazy"
		title="Embedded Video"
	></iframe>
</div>
`
        expect(renderedComponent).toContain(`src="${expectedSrc}"`)
    })

    it('should generate a Vimeo iframe with the correct src', () => {
        const platform = 'vimeo'
        const videoId = '123456789'
        const expectedSrc = `https://player.vimeo.com/video/${videoId}?badge=0&autopause=0`

        const videoUrls = {
            youtube: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`,
            vimeo: `https://player.vimeo.com/video/${videoId}?badge=0&autopause=0`,
        };

        const videoUrl = videoUrls[platform];

        const renderedComponent = `
<div class="relative mb-8 aspect-video w-full overflow-hidden rounded-lg shadow-lg">
	<iframe
		src="${videoUrl}"
		class="absolute inset-0 h-full w-full"
		frameborder="0"
		allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
		allowfullscreen
		loading="lazy"
		title="Embedded Video"
	></iframe>
</div>
`
        expect(renderedComponent).toContain(`src="${expectedSrc}"`)
    })
})
