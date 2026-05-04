import js from '@eslint/js'
import eslintPluginAstro from 'eslint-plugin-astro'
import boundaries from 'eslint-plugin-boundaries'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/**
 * Architectural layers ordered from outermost (can import anything below)
 * to innermost (cannot import layers above).
 *
 * Allowed dependency flow:
 *   pages → layouts → components → hooks → actions → lib → schemas → config/data
 *   middleware → lib (singleton cross-cutting concern)
 *   assets & styles & content: imported by any layer, import nothing internal
 */
const BOUNDARIES_ELEMENTS = [
	// Entry points — can import all layers below
	{ type: 'pages', pattern: 'src/pages/**' },
	{ type: 'middleware', pattern: 'src/middleware.ts' },
	// Presentation
	{ type: 'layouts', pattern: 'src/layouts/**' },
	{ type: 'components', pattern: 'src/components/**' },
	// React state / logic hooks
	{ type: 'hooks', pattern: 'src/hooks/**' },
	// Server-side mutations
	{ type: 'actions', pattern: 'src/actions/**' },
	// Pure business logic — no UI dependencies allowed
	{ type: 'lib', pattern: 'src/lib/**' },
	// Validation & shared types
	{ type: 'schemas', pattern: 'src/schemas/**' },
	// Read-only configuration & static data
	{ type: 'config', pattern: 'src/config/**' },
	{ type: 'data', pattern: 'src/data/**' },
	// Static assets — no internal imports allowed
	{ type: 'assets', pattern: 'src/assets/**' },
	{ type: 'styles', pattern: 'src/styles/**' },
	{ type: 'content', pattern: 'src/content/**' },
]

const BOUNDARIES_DEPENDENCY_RULES = [
	// Allow internal imports within the same element
	{
		allow: { dependency: { relationship: { to: 'internal' } } },
	},
	// pages: can use everything except other pages (no cross-page imports)
	{
		from: { type: 'pages' },
		allow: {
			to: {
				type: [
					'layouts',
					'components',
					'hooks',
					'actions',
					'lib',
					'schemas',
					'config',
					'data',
					'assets',
					'styles',
				],
			},
		},
	},
	// middleware: only lib (session, errors) and config
	{
		from: { type: 'middleware' },
		allow: { to: { type: ['lib', 'config'] } },
	},
	// layouts: components, config, styles, assets
	{
		from: { type: 'layouts' },
		allow: { to: { type: ['components', 'config', 'styles', 'assets'] } },
	},
	// components: hooks, schemas, config, data, assets — NOT lib, actions, pages
	{
		from: { type: 'components' },
		allow: { to: { type: ['hooks', 'schemas', 'config', 'data', 'assets'] } },
	},
	// hooks: schemas, config — NOT components (avoids circular coupling)
	{
		from: { type: 'hooks' },
		allow: { to: { type: ['schemas', 'config'] } },
	},
	// actions: lib, components (for email rendering), schemas, config
	{
		from: { type: 'actions' },
		allow: { to: { type: ['lib', 'components', 'schemas', 'config'] } },
	},
	// lib: schemas, config — NO components, hooks, actions, pages
	{
		from: { type: 'lib' },
		allow: { to: { type: ['schemas', 'config'] } },
	},
	// data: can reference config constants
	{
		from: { type: 'data' },
		allow: { to: { type: ['config'] } },
	},
	// schemas, config, assets, styles, content: no internal imports allowed
	// (default: disallow handles this — no explicit rule needed)
]

export default [
	{
		plugins: { 'simple-import-sort': simpleImportSort },
		rules: {
			'simple-import-sort/imports': 'error',
			'simple-import-sort/exports': 'error',
		},
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	...tseslint.configs.strict,
	...eslintPluginAstro.configs.recommended,

	{
		files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
		languageOptions: {
			globals: globals.browser,
		},
		rules: {
			// TypeScript-specific optimizations
			'@typescript-eslint/no-unused-vars': 'error',
			'@typescript-eslint/explicit-function-return-type': 'warn',
			'@typescript-eslint/no-explicit-any': 'warn',
			'prefer-const': 'error',
		},
	},
	{
		files: ['**/*.astro'],
		languageOptions: {
			globals: globals.browser,
		},
	},

	{
		files: ['**/*.config.{js,ts}', '**/scripts/**/*.{js,ts}'],
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
	},
	{
		files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
		...jsxA11y.flatConfigs.recommended,
	},
	// ─── Architectural Boundaries ────────────────────────────────────────────
	{
		plugins: { boundaries },
		settings: {
			'boundaries/elements': BOUNDARIES_ELEMENTS,
		},
		rules: {
			// recommended starts in warn-only mode — flip to 2 once all violations fixed
			...boundaries.configs.recommended.rules,
			'boundaries/dependencies': [
				1,
				{
					default: 'disallow',
					rules: BOUNDARIES_DEPENDENCY_RULES,
				},
			],
		},
	},
	{
		ignores: [
			'.astro/',
			'dist/',
			'node_modules/',
			'.gitignore',
			'.vercel/',
			'**/*.mjs',
			'**/~partytown/**',
		],
	},
]
