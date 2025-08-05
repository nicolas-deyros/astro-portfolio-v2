import js from '@eslint/js'
import eslintPluginAstro from 'eslint-plugin-astro'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import tseslint from 'typescript-eslint'

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
