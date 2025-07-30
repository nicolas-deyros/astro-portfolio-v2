# Grammar and Text Checking Setup

This project includes comprehensive grammar and text checking for both content files and commit messages.

## Features

### 📝 Content Grammar Checking

- **Textlint integration** for MDX and Markdown files
- **Spell checking** for common misspellings
- **Writing style** improvements (passive voice, weasel words, etc.)
- **Terminology consistency** for technical terms
- **Capitalization rules** for headings and technical terms

### 💬 Commit Message Grammar Checking

- **Conventional commits** format validation
- **Grammar rules** checking (passive voice, misspellings)
- **Proper capitalization** and punctuation
- **Length limits** for better readability

## Setup and Usage

### Available Commands

```bash
# Check grammar in content files
npm run lint:text

# Fix grammar issues automatically where possible
npm run lint:text:fix
npm run fix:text

# Test commit message grammar checker
npm run check:commit

# Test grammar checker unit tests
npm run test:grammar

# Run all checks (code + grammar + tests)
npm run check:all
```

### Git Hooks Integration

The grammar checking is integrated with your existing Git workflow:

**Pre-commit Hook** (`.husky/pre-commit`):

- Runs Prettier formatting
- Runs ESLint code checking
- **Runs textlint grammar checking**
- Runs tests

**Commit Message Hook** (`.husky/commit-msg`):

- Runs commitlint conventional format checking
- **Optional**: Use `.husky/commit-msg-enhanced` for additional grammar checking

### Configuration Files

#### `.textlintrc.json`

Configures grammar checking rules for content files:

- Common misspellings detection
- Writing style improvements
- Technical terminology consistency
- Capitalization rules for technical terms

#### `commitlint.config.js`

Enhanced commitlint configuration with:

- Extended commit types (feat, fix, docs, etc.)
- Subject length limits (10-72 characters)
- Body/footer line length limits
- Proper casing and punctuation rules

## Grammar Rules

### Content Files (MDX/Markdown)

- ✅ **Spell checking**: Detects common misspellings
- ✅ **Writing style**: Identifies passive voice, weasel words, clichés
- ✅ **Terminology**: Enforces consistent technical term usage
- ✅ **Capitalization**: Proper heading and technical term capitalization
- ✅ **Inclusive language**: Suggests more inclusive alternatives

### Commit Messages

- ✅ **Format**: Must follow conventional commits (type: description)
- ✅ **Casing**: Must start with lowercase letter
- ✅ **Punctuation**: Must not end with period
- ✅ **Length**: Subject 10-72 chars, body/footer max 100 chars per line
- ✅ **Misspellings**: Detects common spelling errors
- ✅ **Voice**: Warns about passive voice usage

## Examples

### ✅ Good Commit Messages

```
feat: add user authentication system
fix: resolve memory leak in data processing
docs: update installation instructions
refactor: improve error handling logic
```

### ❌ Bad Commit Messages

```
Feat: Add new feature          // Wrong: starts with uppercase
fix: resolve the issue.        // Wrong: ends with period
added new feature              // Wrong: not conventional format
feat: fix teh bug in seperate function  // Wrong: misspellings
```

### Content File Issues Detected

- **Misspellings**: "seperate" → "separate"
- **Passive voice**: "The bug was fixed" → "Fixed the bug"
- **Weasel words**: "very good" → "good"
- **Terminology**: "javascript" → "JavaScript"
- **Capitalization**: "README" → "readme"

## Customization

### Adding New Grammar Rules

Edit `.textlintrc.json` to add or modify rules:

```json
{
	"rules": {
		"your-custom-rule": {
			"severity": "error"
		}
	}
}
```

### Ignoring Files

Add patterns to `.textlintignore`:

```
# Ignore specific files
generated-docs/
third-party/
```

### Custom Commit Rules

Modify `commitlint.config.js` to add custom validation rules.

## Troubleshooting

### Common Issues

1. **Textlint taking too long**:
   - Check `.textlintignore` to exclude unnecessary files
   - Consider running on specific file patterns

2. **False positives in terminology**:
   - Update the `allowWords` array in `.textlintrc.json`
   - Add specific terms to the `terms` object

3. **Commit hook failing**:
   - Test manually with `npm run check:commit`
   - Check that Node.js and npm are properly installed

### Performance Optimization

For large repositories:

- Use specific file patterns in npm scripts
- Consider running textlint only on changed files
- Use `.textlintignore` to exclude generated content

## Integration with CI/CD

Add to your CI pipeline:

```yaml
- name: Check Grammar
  run: |
    npm run lint:text
    npm run test:grammar
```

This ensures grammar quality is maintained across all contributions.
