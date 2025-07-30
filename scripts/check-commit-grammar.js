#!/usr/bin/env node
import { checkCommitGrammar } from './grammar-checker.ts'
import fs from 'fs'

/**
 * Check commit message grammar - to be used with husky
 */
async function checkCommitMessage() {
	const commitMsgFile = process.argv[2]

	if (!commitMsgFile) {
		console.error('❌ No commit message file provided')
		process.exit(1)
	}

	try {
		const commitMessage = fs.readFileSync(commitMsgFile, 'utf8').trim()

		if (!commitMessage) {
			console.error('❌ Empty commit message')
			process.exit(1)
		}

		console.log('🔍 Checking commit message grammar...')
		const result = await checkCommitGrammar(commitMessage)

		if (result.valid) {
			console.log('✅ Commit message looks good!')
			process.exit(0)
		} else {
			console.log('❌ Grammar issues found in commit message:')
			result.errors.forEach(error => console.log(`   • ${error}`))
			console.log('\n💡 Please fix these issues and commit again.')
			process.exit(1)
		}
	} catch (error) {
		console.error('❌ Error checking commit message:', error.message)
		process.exit(1)
	}
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	checkCommitMessage().catch(console.error)
}
