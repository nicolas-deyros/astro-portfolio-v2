#!/usr/bin/env node
import { checkCommitGrammar, runTextlintOnCommit } from './grammar-checker.js'

/**
 * Test the grammar checker with sample commit messages
 */
async function testGrammarChecker() {
	console.log('🔍 Testing Grammar Checker\n')

	const testMessages = [
		'feat: add new user authentication system',
		'fix: resolve issue with data validation.',
		'Feat: Add new feature',
		'added new feature',
		'feat: fix teh bug in seperate function',
		'feat: bug was fixed in authentication module',
		'docs: update README with installation instructions',
		'refactor: improve code structure and maintainability',
	]

	for (const [index, message] of testMessages.entries()) {
		console.log(`\n📝 Test ${index + 1}: "${message}"`)
		console.log('─'.repeat(50))

		const result = await checkCommitGrammar(message)

		if (result.valid) {
			console.log('✅ Valid commit message')
		} else {
			console.log('❌ Issues found:')
			result.errors.forEach(error => console.log(`   • ${error}`))
		}
	}

	console.log('\n🧪 Testing with textlint integration...\n')

	const textlintTest = 'feat: add feature with potentail issues and bad grammer'
	console.log(`📝 Testing: "${textlintTest}"`)
	console.log('─'.repeat(50))

	try {
		const textlintResult = await runTextlintOnCommit(textlintTest)
		if (textlintResult.valid) {
			console.log('✅ No textlint issues found')
		} else {
			console.log('❌ Textlint issues found:')
			textlintResult.errors.forEach(error => console.log(`   • ${error}`))
		}
	} catch {
		console.log('⚠️  Textlint test failed, falling back to basic checks')
	}
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	testGrammarChecker().catch(console.error)
}

export { testGrammarChecker }
