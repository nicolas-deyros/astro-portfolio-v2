import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

export interface GrammarResult {
	valid: boolean
	errors: string[]
}

interface GrammarRule {
	test: RegExp
	message: string
	shouldNotMatch?: boolean
}

interface CommonMisspellings {
	[key: string]: string
}

interface TextlintMessage {
	message: string
	ruleId: string
}

interface TextlintResult {
	messages?: TextlintMessage[]
}

/**
 * Grammar checker using textlint for commit messages
 */
export async function checkCommitGrammar(
	message: string,
): Promise<GrammarResult> {
	const errors: string[] = []

	// Basic grammar checks
	const grammarRules: GrammarRule[] = [
		{
			test: /^[a-z]/,
			message:
				'Commit message should start with a lowercase letter (conventional commits style)',
		},
		{
			test: /\.$$/,
			message: 'Commit message should not end with a period',
			shouldNotMatch: true,
		},
		{
			test: /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?: .+/,
			message:
				'Commit message should follow conventional commits format: type(scope): description',
		},
	]

	// Common misspellings
	const commonMisspellings: CommonMisspellings = {
		teh: 'the',
		seperate: 'separate',
		occured: 'occurred',
		recieve: 'receive',
		definately: 'definitely',
		accomodate: 'accommodate',
		existant: 'existent',
		maintainance: 'maintenance',
		dependancy: 'dependency',
		seperation: 'separation',
		sucessful: 'successful',
		transfered: 'transferred',
		begining: 'beginning',
		priviledge: 'privilege',
		independant: 'independent',
	}

	// Check basic grammar rules
	for (const rule of grammarRules) {
		const matches = rule.test.test(message)
		if (rule.shouldNotMatch ? matches : !matches) {
			errors.push(rule.message)
		}
	}

	// Check for common misspellings
	const words = message.toLowerCase().split(/\s+/)
	for (const word of words) {
		const cleanWord = word.replace(/[^\w]/g, '')
		if (commonMisspellings[cleanWord]) {
			errors.push(
				`Possible misspelling: "${cleanWord}" should be "${commonMisspellings[cleanWord]}"`,
			)
		}
	}

	// Check for passive voice indicators
	const passiveIndicators = ['was', 'were', 'been', 'being', 'is', 'are', 'am']
	const hasPassive = passiveIndicators.some(
		indicator =>
			message.toLowerCase().includes(` ${indicator} `) &&
			(message.includes('ed ') || message.includes('en ')),
	)

	if (hasPassive) {
		errors.push('Consider using active voice instead of passive voice')
	}

	return {
		valid: errors.length === 0,
		errors,
	}
}

/**
 * Textlint-based grammar checking for commit messages
 */
export async function runTextlintOnCommit(
	message: string,
): Promise<GrammarResult> {
	try {
		// Create temporary file for textlint
		const tempFile = path.join(process.cwd(), '.temp-commit-msg.md')
		fs.writeFileSync(tempFile, message)

		// Run textlint on the temporary file
		const result = execSync(`npx textlint --format json "${tempFile}"`, {
			encoding: 'utf8',
			stdio: 'pipe',
		})

		// Clean up
		fs.unlinkSync(tempFile)

		const lintResults: TextlintResult[] = JSON.parse(result)
		const errors = lintResults[0]?.messages || []

		return {
			valid: errors.length === 0,
			errors: errors.map(
				(err: TextlintMessage) => `${err.message} (${err.ruleId})`,
			),
		}
	} catch {
		// If textlint fails, fall back to basic checks
		return await checkCommitGrammar(message)
	}
}
