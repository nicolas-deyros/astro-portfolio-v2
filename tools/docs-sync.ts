import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

function runCommand(command: string): string {
	return execSync(command, { encoding: 'utf-8', stdio: 'pipe' }).trim()
}

function log(message: string) {
	console.log(`[Docs Sync] ${message}`)
}

async function main() {
	try {
		// 1. Analyze Changes
		log('Analyzing changes...')
		const changedFiles = runCommand('git diff --name-only origin/master...HEAD')
			.split('\n')
			.filter(Boolean)

		if (changedFiles.length === 0) {
			log('No changes detected relative to origin/master.')
			return
		}

		// 2. Map Changes to Docs
		const docsMap: Record<string, string> = {
			'src/components': 'docs/DEVELOPMENT.md',
			'src/utils': 'docs/DEVELOPMENT.md',
			'src/content': 'docs/FEATURES.md',
			'db/': 'docs/ARCHITECTURE.md',
		}

		const needsUpdate = new Set<string>()
		changedFiles.forEach(file => {
			for (const [key, doc] of Object.entries(docsMap)) {
				if (file.startsWith(key)) {
					needsUpdate.add(doc)
				}
			}
		})

		if (needsUpdate.size > 0) {
			console.log('\n⚠️  The following documentation files might need updates:')
			needsUpdate.forEach(doc => console.log(`   - ${doc}`))
			console.log('')
		}

		// 3. Auto-update Changelog
		log('Updating CHANGELOG.md...')
		const changelogPath = path.join(process.cwd(), 'CHANGELOG.md')
		const changelog = fs.existsSync(changelogPath)
			? fs.readFileSync(changelogPath, 'utf-8')
			: '# Changelog\n\n'

		const commits = runCommand(
			'git log origin/master...HEAD --pretty=format:"- %s (%h)"',
		)

		if (commits) {
			const today = new Date().toISOString().split('T')[0]
			const newEntry = `\n## [Unreleased] - ${today}\n\n${commits}\n`

			// Insert after header or append
			if (changelog.includes('## [Unreleased]')) {
				// Replace existing unreleased block? Or append?
				// Simple approach: Prepend to top (after title) if not already there
				// For now, let's just log what would be added to avoid messing up the file format autonomously
				console.log('Proposed Changelog Entry:')
				console.log(newEntry)
				console.log(
					'(Skipping auto-write to CHANGELOG.md to prevent formatting issues. Please copy-paste if correct.)',
				)
			} else {
				// Naive insertion
				// changelog = changelog.replace('# Changelog', '# Changelog' + newEntry);
				// fs.writeFileSync(changelogPath, changelog);
				console.log('Proposed Changelog Entry:')
				console.log(newEntry)
			}
		}

		log('Docs sync check complete.')
	} catch (error) {
		console.error('Docs sync failed:', error)
		// Don't fail the build, just warn
	}
}

main()
