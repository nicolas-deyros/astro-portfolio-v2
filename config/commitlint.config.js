export default {
	extends: ['@commitlint/config-conventional'],
	rules: {
		// Enhanced type enum with more specific types
		'type-enum': [
			2,
			'always',
			[
				'feat', // New feature
				'fix', // Bug fix
				'docs', // Documentation
				'style', // Formatting, missing semicolons, etc
				'refactor', // Code change that neither fixes a bug nor adds a feature
				'test', // Adding missing tests or correcting existing tests
				'chore', // Changes to the build process or auxiliary tools
				'perf', // Performance improvements
				'ci', // Changes to CI configuration files and scripts
				'build', // Changes that affect the build system or external dependencies
				'revert', // Reverts a previous commit
			],
		],
		// Subject length
		'subject-max-length': [2, 'always', 72],
		'subject-min-length': [2, 'always', 10],
		// Body and footer
		'body-max-line-length': [2, 'always', 100],
		'footer-max-line-length': [2, 'always', 100],
		// Basic grammar rules
		'subject-case': [2, 'always', 'lower-case'],
		'subject-full-stop': [2, 'never', '.'],
	},
}
