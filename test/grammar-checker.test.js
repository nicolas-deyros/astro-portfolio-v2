import { test, expect, describe } from 'vitest'
import {
	checkCommitGrammar,
	runTextlintOnCommit,
} from '../scripts/grammar-checker.js'

describe('Grammar Checker', () => {
	describe('Commit Message Grammar', () => {
		test('should pass valid conventional commit', async () => {
			const result = await checkCommitGrammar(
				'feat: add new user authentication system',
			)
			expect(result.valid).toBe(true)
			expect(result.errors).toHaveLength(0)
		})

		test('should fail commit with period at end', async () => {
			const result = await checkCommitGrammar('feat: add new feature.')
			expect(result.valid).toBe(false)
			expect(result.errors).toContain(
				'Commit message should not end with a period',
			)
		})

		test('should fail commit starting with uppercase', async () => {
			const result = await checkCommitGrammar('Feat: add new feature')
			expect(result.valid).toBe(false)
			expect(result.errors.some(err => err.includes('lowercase letter'))).toBe(
				true,
			)
		})

		test('should fail non-conventional commit format', async () => {
			const result = await checkCommitGrammar('added new feature')
			expect(result.valid).toBe(false)
			expect(
				result.errors.some(err => err.includes('conventional commits format')),
			).toBe(true)
		})

		test('should detect common misspellings', async () => {
			const result = await checkCommitGrammar(
				'feat: fix teh bug in seperate function',
			)
			expect(result.valid).toBe(false)
			expect(result.errors.some(err => err.includes('teh'))).toBe(true)
			expect(result.errors.some(err => err.includes('seperate'))).toBe(true)
		})

		test('should warn about passive voice', async () => {
			const result = await checkCommitGrammar(
				'feat: bug was fixed in authentication',
			)
			expect(result.valid).toBe(false)
			expect(result.errors.some(err => err.includes('active voice'))).toBe(true)
		})
	})

	describe('Textlint Integration', () => {
		test('should handle textlint errors gracefully', async () => {
			const result = await runTextlintOnCommit(
				'feat: add feature with some grammatical issues',
			)
			expect(result).toHaveProperty('valid')
			expect(result).toHaveProperty('errors')
			expect(Array.isArray(result.errors)).toBe(true)
		}, 10000) // 10 second timeout for textlint
	})
})
