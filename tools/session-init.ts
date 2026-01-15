import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const REPORT_PATH = path.join(process.cwd(), '.gemini', 'session-report.md')

function runCommand(command: string): string {
	try {
		return execSync(command, { encoding: 'utf-8', stdio: 'pipe' })
	} catch (error: unknown) {
		// npm outdated returns exit code 1 if updates are found, which is not an error for us
		if (
			typeof error === 'object' &&
			error !== null &&
			'status' in error &&
			command.includes('npm outdated') &&
			(error as { status: number }).status === 1
		) {
			return (error as unknown as { stdout: string }).stdout
		}
		throw error
	}
}

function log(message: string): void {
	console.log(`[Session Init] ${message}`)
}

async function main(): Promise<void> {
	const reportLines: string[] = []
	const addReport = (line: string): number => reportLines.push(line)

	addReport('# Session Initialization Report')
	addReport(`**Date:** ${new Date().toLocaleString()}`)
	addReport('')

	try {
		// 1. Sync with Master
		log('Syncing with remote master...')
		try {
			runCommand('git pull origin master')
			addReport('- [x] Git: Synced with `origin/master`')
		} catch {
			console.error('Git pull failed. Are you on a clean branch?')
			addReport('- [ ] Git: Sync failed (check local changes)')
		}

		// 2. Check Dependencies
		log('Checking for dependency updates...')
		const outdatedJson = runCommand('npm outdated --json')
		const outdated = JSON.parse(outdatedJson || '{}')
		const updateCount = Object.keys(outdated).length

		if (updateCount > 0) {
			addReport(`- [~] Dependencies: Found ${updateCount} updates`)
			addReport('  - Auto-updating via `npm run deps:upgrade`...')
			log(`Found ${updateCount} outdated dependencies. Updating...`)

			try {
				// Run the upgrade script defined in package.json
				execSync('npm run deps:upgrade', {
					encoding: 'utf-8',
					stdio: 'inherit',
				})
				addReport('- [x] Dependencies: Successfully updated')
			} catch (error) {
				console.error('Dependency update failed', error)
				addReport('- [!] Dependencies: Update failed')
			}
		} else {
			addReport('- [x] Dependencies: All up to date')
			log('Dependencies are up to date.')
		}

		// 3. Save Report
		// Ensure .gemini dir exists
		const dir = path.dirname(REPORT_PATH)
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true })
		}
		fs.writeFileSync(REPORT_PATH, reportLines.join('\n'))
		log(`Report saved to ${REPORT_PATH}`)
	} catch (error) {
		console.error('Session initialization failed:', error)
		process.exit(1)
	}
}

main()
