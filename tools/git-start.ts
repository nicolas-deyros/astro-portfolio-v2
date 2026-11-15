import path from 'node:path'

import { execSync } from 'child_process'

function runCommand(command: string, cwd?: string): string {
	return execSync(command, { encoding: 'utf-8', stdio: 'pipe', cwd }).trim()
}

function log(message: string): void {
	console.log(`[Git Start] ${message}`)
}

async function main(): Promise<void> {
	const args = process.argv.slice(2)
	if (args.length < 1) {
		console.error('Usage: npm run git:start <branch-name> [description]')
		process.exit(1)
	}

	const branchName = args[0]
	const description = args[1] || `Work in progress: ${branchName}`
	// Each branch gets its own worktree so concurrent sessions never share a HEAD.
	const worktreePath = path.resolve(
		'.claude/worktrees',
		branchName.replace(/\//g, '-'),
	)

	try {
		// 1. Create Branch in its own worktree
		log(`Creating worktree for branch '${branchName}' at ${worktreePath}...`)
		try {
			runCommand(`git worktree add -b ${branchName} "${worktreePath}"`)
		} catch {
			log(
				`Branch '${branchName}' might already exist. Adding worktree for it...`,
			)
			runCommand(`git worktree add "${worktreePath}" ${branchName}`)
		}

		// 2. Push Empty Commit (to allow PR creation)
		log('Pushing empty commit to initialize remote branch...')
		runCommand(
			'git commit --allow-empty -m "chore: start work on feature"',
			worktreePath,
		)
		runCommand(`git push -u origin ${branchName}`, worktreePath)

		// 3. Create Draft PR
		log('Creating Draft Pull Request...')
		try {
			// Check if PR already exists
			const existingPr = runCommand(
				`gh pr list --head ${branchName} --json url --limit 1`,
				worktreePath,
			)
			if (existingPr !== '[]') {
				log('PR already exists.')
			} else {
				const prUrl = runCommand(
					`gh pr create --draft --title "${branchName}: ${description}" --body "Automated Draft PR for tracking progress."`,
					worktreePath,
				)
				log(`Draft PR created: ${prUrl}`)
			}
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error)
			console.error('Failed to create PR:', message)
			// Don't exit, we can still work locally
		}

		log(`Ready to work! cd "${worktreePath}"`)
	} catch (error) {
		console.error('Git start failed:', error)
		process.exit(1)
	}
}

main()
