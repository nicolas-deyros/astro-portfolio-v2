import { execSync } from 'child_process'

function runCommand(command: string): string {
	return execSync(command, { encoding: 'utf-8', stdio: 'pipe' }).trim()
}

function log(message: string) {
	console.log(`[Git Start] ${message}`)
}

async function main() {
	const args = process.argv.slice(2)
	if (args.length < 1) {
		console.error('Usage: npm run git:start <branch-name> [description]')
		process.exit(1)
	}

	const branchName = args[0]
	const description = args[1] || `Work in progress: ${branchName}`

	try {
		// 1. Create Branch
		log(`Creating branch '${branchName}'...`)
		try {
			runCommand(`git checkout -b ${branchName}`)
		} catch {
			log(`Branch '${branchName}' might already exist. Checking out...`)
			runCommand(`git checkout ${branchName}`)
		}

		// 2. Push Empty Commit (to allow PR creation)
		log('Pushing empty commit to initialize remote branch...')
		runCommand('git commit --allow-empty -m "chore: start work on feature"')
		runCommand(`git push -u origin ${branchName}`)

		// 3. Create Draft PR
		log('Creating Draft Pull Request...')
		try {
			// Check if PR already exists
			const existingPr = runCommand(
				`gh pr list --head ${branchName} --json url --limit 1`,
			)
			if (existingPr !== '[]') {
				log('PR already exists.')
			} else {
				const prUrl = runCommand(
					`gh pr create --draft --title "${branchName}: ${description}" --body "Automated Draft PR for tracking progress."`,
				)
				log(`Draft PR created: ${prUrl}`)
			}
		} catch (error: any) {
			console.error('Failed to create PR:', error.message)
			// Don't exit, we can still work locally
		}

		log('Ready to work!')
	} catch (error) {
		console.error('Git start failed:', error)
		process.exit(1)
	}
}

main()
