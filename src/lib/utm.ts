export function withUtm(rawUrl: string, primaryTag?: string): string {
	try {
		const url = new URL(rawUrl)
		if (url.hostname.includes('ndeyros.dev')) return rawUrl
		url.searchParams.set('utm_source', 'ndeyros.dev')
		url.searchParams.set('utm_medium', 'referral')
		url.searchParams.set('utm_campaign', 'links_directory')
		if (primaryTag) {
			url.searchParams.set(
				'utm_content',
				primaryTag.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
			)
		}
		return url.toString()
	} catch {
		return rawUrl
	}
}
