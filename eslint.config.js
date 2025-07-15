import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import eslintPluginAstro from 'eslint-plugin-astro'
import jsxA11y from 'eslint-plugin-jsx-a11y'

export default [
	js.configs.recommended,
	...tseslint.configs.recommended,
	...eslintPluginAstro.configs.recommended,

	{
		files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
		languageOptions: {
			globals: globals.browser,
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
		ignores: ['.astro/', 'dist/', 'node_modules/', '.gitignore'],
	},
]
