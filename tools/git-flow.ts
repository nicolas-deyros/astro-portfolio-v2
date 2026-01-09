import { execSync } from 'child_process'

const run = (command: string): string => {
	try {
		return execSync(command, { stdio: 'pipe', encoding: 'utf-8' }).trim()
	} catch (error: unknown) {
		console.error(`❌ Command failed: ${command}`)
		if (error instanceof Error) {
			console.error(error.message)
		}
		// Check for stderr on the error object safely
		if (typeof error === 'object' && error !== null && 'stderr' in error) {
			console.error((error as { stderr: string }).stderr)
		}
		process.exit(1)
	}
}

const getCurrentBranch = (): string => {
	return run('git branch --show-current')
}

const sync = (): void => {
	console.log('🔄 Syncing with remote master...')
	const currentBranch = getCurrentBranch()

	if (currentBranch === 'master' || currentBranch === 'main') {
		run('git pull origin ' + currentBranch)
	} else {
		// If on feature branch, fetch origin and maybe warn?
		// For now, just fetch to be safe
		run('git fetch origin')
		console.log(
			'⚠️  You are on a feature branch. Fetched origin, but did not pull to avoid conflicts.',
		)
	}
	console.log('✅ Sync complete.')
}

const ship = (): void => {
	const branch = getCurrentBranch()
	if (branch === 'master' || branch === 'main') {
		console.error(
			'❌ You cannot ship from the main branch. Use a feature branch.',
		)
		process.exit(1)
	}

	console.log(`🚀 Shipping branch: ${branch}`)

	// 1. Push current branch
	console.log('📦 Pushing changes...')
	run(`git push origin ${branch}`)

	// 2. Create PR
	console.log('📝 Creating Pull Request...')
	try {
		// Try to create PR. If it already exists, this might fail or just return the URL
		// We use --fill to auto-fill title/body from commit messages
		run('gh pr create --fill')
	} catch (e: unknown) {
		if (
			typeof e === 'object' &&
			e !== null &&
			'stderr' in e &&
			(e as { stderr: string }).stderr.includes('already exists')
		) {
			console.log('ℹ️  PR already exists, proceeding...')
		} else {
			throw e
		}
	}

	// 3. Enable Auto-Merge
	console.log('⏳ Enabling Auto-Merge...')
	// --merge: Use merge commit (or use --squash if preferred)
	// --auto: Merge when checks pass
	run('gh pr merge --auto --merge')

	console.log(
		'\n✅ Ship sequence initiated!\n   - Changes pushed\n   - PR created\n   - Auto-merge enabled\n\n👉 The PR will automatically merge once CI checks pass.\n   After merge:\n   1. Switch to master: git checkout master\n   2. Pull latest:      git pull origin master\n   3. Delete local:     git branch -d ${branch}\n    ',
	)
}

const init = (): void => {
	console.log('🏁 Initializing new task...')

	// 1. Check status
	const status = run('git status --porcelain')
	if (status) {
		console.error(
			'❌ Working directory is not clean. Please commit or stash changes.',
		)
		process.exit(1)
	}

	// 2. Checkout master
	console.log("switched to branch 'master'")
	run('git checkout master')

	// 3. Pull latest
	console.log('🔄 Pulling latest changes...')
	run('git pull origin master')

	// 4. Install dependencies
	console.log('📦 Checking dependencies...')
	run('npm install')

	console.log('✅ Ready to start! Create your feature branch with:')
	console.log('   git checkout -b type/your-task-name')
}

const main = (): void => {
	const args = process.argv.slice(2)
	const command = args[0]

	switch (command) {
		case 'sync':
			sync()
			break
		case 'ship':
			ship()
			break
		case 'init':
			init()
			break
		default:
			console.log('Usage: tsx tools/git-flow.ts [sync|ship|init]')
			process.exit(1)
	}
}

main()
