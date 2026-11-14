import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'

// Source-level guards for the WCAG 2.2 AA fixes from docs/UI_AUDIT.md.
const read = (path: string): string =>
	readFileSync(join(process.cwd(), 'src', path), 'utf-8')

describe('UI accessibility guards', () => {
	it('gives both theme toggles an accessible name', () => {
		const inputs = read('components/Header/HeaderMenu.astro').match(
			/<input[^>]*theme-toggle-checkbox[^>]*>/g,
		)
		expect(inputs).toHaveLength(2)
		inputs?.forEach(input => expect(input).toMatch(/aria-label="[^"]+"/))
	})

	it('wraps desktop nav items in a list', () => {
		const menu = read('components/Header/HeaderMenu.astro')
		const desktopNav = menu.slice(
			menu.indexOf('<!-- Desktop Navigation -->'),
			menu.indexOf('<!-- Mobile Navigation Overlay -->'),
		)
		expect(desktopNav.indexOf('<ul')).toBeGreaterThan(-1)
		expect(desktopNav.indexOf('<ul')).toBeLessThan(
			desktopNav.indexOf('<NavList'),
		)
	})

	it('hides the closed mobile menu from focus and view', () => {
		expect(read('components/Header/HeaderMenu.astro')).toMatch(
			/id="mobile-menu"\s+class="[^"]*\binvisible\b/,
		)
	})

	it('reveals nav labels on keyboard focus, not only hover', () => {
		expect(read('components/Link/NavLink.astro')).toContain(
			'group-focus-visible:opacity-100',
		)
	})

	it('labels pagination as a nav landmark with a dark-mode text color', () => {
		const pagination = read('components/Pagination.astro')
		expect(pagination).toMatch(/<nav[^>]*aria-label="Pagination"/)
		expect(pagination).toMatch(/dark:text-slate-\d00/)
	})

	it('themes the footer and form fields for dark mode', () => {
		expect(read('components/Footer.astro')).toMatch(/dark:bg-slate-\d00/)
		for (const field of ['Input.tsx', 'TextArea.tsx']) {
			expect(read(`components/Form/${field}`)).toMatch(/dark:bg-slate-\d00/)
		}
	})

	it('respects prefers-reduced-motion', () => {
		expect(read('styles/global.css')).toContain(
			'@media (prefers-reduced-motion: reduce)',
		)
		expect(read('pages/index.astro')).toContain('prefers-reduced-motion')
	})

	it('defines the entry animation once', () => {
		expect(read('styles/global.css')).toContain('@keyframes fadeInUp')
		for (const file of [
			'components/Home/TopPosts.astro',
			'components/Home/TopLinks.astro',
			'components/Links/LinkCard.astro',
			'pages/blog/categories/index.astro',
			'pages/blog/tags/index.astro',
		]) {
			expect(read(file), file).not.toContain('@keyframes fadeInUp')
		}
	})

	it('builds every overlay on the native dialog element', () => {
		expect(read('components/Admin/Dialog.tsx')).toMatch(
			/<dialog[\s\S]*showModal\(\)|showModal\(\)[\s\S]*<dialog/,
		)
		for (const file of [
			'components/Admin/ConfirmModal.tsx',
			'components/Admin/ErrorModal.tsx',
			'components/Admin/AdminClientsManager.tsx',
		]) {
			const source = read(file)
			expect(source, file).toContain('<Dialog')
			expect(source, file).not.toContain('fixed inset-0')
		}
		const crm = read('pages/admin/crm.astro')
		expect(crm).toContain('<dialog id="submission-modal"')
		expect(crm).toContain('showModal()')
		expect(crm).not.toContain('fixed inset-0')
	})

	it('names every icon-only close button', () => {
		// Each "✕" belongs to the nearest preceding <button opening tag.
		const buttons = read('components/Admin/AdminClientsManager.tsx')
			.split(/(?<=>\s*)✕(?=\s*<)/)
			.slice(0, -1)
			.map(before => before.slice(before.lastIndexOf('<button')))
		expect(buttons).toHaveLength(3)
		buttons.forEach(button => expect(button).toMatch(/aria-label="[^"]+"/))
	})

	it.each([
		'pages/index.astro',
		'pages/blog/[...page].astro',
		'pages/blog/categories/index.astro',
		'pages/blog/tags/index.astro',
		'pages/links/[...page].astro',
		'pages/contact.astro',
		'pages/404.astro',
	])('%s has exactly one h1', page => {
		expect(read(page).match(/<h1[\s>]/g)).toHaveLength(1)
	})

	it.each(['pages/blog/[...page].astro', 'pages/contact.astro'])(
		'%s passes a meta description',
		page => {
			expect(read(page)).toMatch(/<Layout[^>]*description=/s)
		},
	)
})
