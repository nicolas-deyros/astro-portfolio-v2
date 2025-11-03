# Copilot Instructions for Astro Portfolio

## Project Architecture

This is a high-performance **Astro-based portfolio** with comprehensive testing infrastructure, focusing on SEO optimization, accessibility, and Core Web Vitals performance. Built as a static site generator with TypeScript and Tailwind CSS.

### Key Architectural Patterns

- **Astro Islands Architecture**: Components are server-rendered with selective client hydration (React components use `client:*` directives only when needed)
- **Content Collections**: Blog posts are managed via Astro Content Collections with strict Zod schemas in `src/content/config.ts` (60-char titles, 160-char descriptions)
- **Testing-First Development**: All features have corresponding test suites (SEO, performance, links, accessibility)
- **Dark/Light Theme System**: Implemented via Tailwind's `dark:` classes with JavaScript theme persistence (`public/js/theme-toggle.js` with `is:inline` directive)

## Essential Development Workflows

### Theme Toggle Implementation

Always use `is:inline` directive for public assets in Astro:

```html
<script src="/js/theme-toggle.js" is:inline></script>
```

### Performance Testing

Run comprehensive performance tests with automatic server management:

```bash
npm run test:performance  # Puppeteer-based Core Web Vitals testing
```

### Content Creation

Blog posts must follow strict schema validation:

```typescript
// Required frontmatter fields
title: string (max 60 chars)
description: string (max 160 chars)
date: string (ISO format)
category: string
draft: boolean (default: false)
```

### Testing Strategy

- **SEO Tests** (`test/seo.test.ts`): Meta tags, heading hierarchy, content quality
- **Performance Tests** (`test/performance.test.ts`): Core Web Vitals with 91.3/100 target score
- **Link Validation** (`test/links.test.ts`): Internal/external link integrity
- **Content Tests** (`test/mdx.test.ts`): MDX frontmatter validation

## Critical File Patterns

### Layout Structure

- Main layout: `src/layouts/index.astro` with dark mode classes
- Head component: `src/components/Head.astro` with SEO optimization via astro-seo
- Theme initialization: Prevent FOUC with early theme detection scripts

### Content Management

- Blog posts: `src/content/blog/*.mdx` with Zod validation
- Navigation: `src/data/navData.ts` for site structure
- Static assets: `public/` for non-processed files, `src/assets/` for optimized images

### Database Integration

Astro DB configured for form submissions:

```typescript
// db/config.ts pattern
const FormSubmissions = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		// ... other fields
	},
})
```

## Project-Specific Conventions

### Component Organization

- **Atomic structure**: Components grouped by function (`Header/`, `Form/`, `Link/`)
- **TypeScript interfaces**: Always define Props interfaces for Astro components
- **Tailwind patterns**: Consistent use of `dark:` variants throughout

### Performance Optimization

- **Image handling**: Use Astro Assets API for optimization
- **Script loading**: Partytown for third-party scripts (Google Analytics)
- **CSS**: Global styles in `src/styles/global.css`, component styles inline

### SEO & Accessibility

- **WCAG compliance**: All interactive elements have proper ARIA labels
- **Meta optimization**: Automatic sitemap generation, structured data
- **Performance monitoring**: Automated Core Web Vitals testing in CI/CD

## Integration Points

### External Dependencies

- **Vercel deployment**: Configured with web analytics
- **Google Analytics**: Loaded via Partytown for performance
- **Astro integrations**: MDX, Sitemap, Icon, DB, React (selective hydration)

### API Endpoints

- Contact form: `src/pages/api/sendEmail.json.ts` with database persistence
- Static data: JSON files in `src/content/` for structured content

### Build & Deploy

- **Build command**: `npm run build` (uses `--remote` flag for Astro DB)
- **Development**: Hot reload on port 4321
- **Testing**: Vitest with Puppeteer for browser automation

## Common Gotchas

1. **Script loading**: Always use `is:inline` for public JavaScript files
2. **Theme persistence**: Initialize theme before page render to prevent flash
3. **Performance testing**: Tests spawn their own dev server - don't run concurrent servers
4. **Content validation**: Strict Zod schemas - failing validation breaks builds
5. **Dark mode**: Use Tailwind's `dark:` classes, not CSS custom properties

### Before Committing

⚠️ **IMPORTANT: Husky Git Hooks Are Active**

The following hooks will run automatically when you commit/push:

**Pre-commit hook** (runs on `git commit`):

- Automatically runs `lint-staged` on staged files
- Lints: `npm run lint` on `*.{js,ts,jsx,tsx,astro}` files
- Formats: `npm run format` on staged files
- ❌ Commit will be blocked if linting or formatting fails

**Commit-msg hook** (runs on `git commit`):

- Validates commit message format using commitlint
- Enforces Conventional Commits format
- ❌ Commit will be blocked if message format is invalid

**Pre-push hook** (runs on `git push`):

- Runs comprehensive test suite
- Runs performance tests
- ❌ Push will be blocked if tests fail

**Manual checks (optional, hooks handle most automatically):**

```powershell
# 1. Type check (not in hooks, run manually)
npm run type-check

# 2. Lint (runs automatically on pre-commit)
npm run lint

# 3. Run all tests (runs automatically on pre-push)
npm run test

# 4. Format code (runs automatically on pre-commit)
npm run format

# 5. Build to verify production works
npm run build
```

**Required Commit Message Format:**

```bash
# Format: <type>(<optional-scope>): <subject>
#
# Valid types (ENFORCED):
# feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert
#
# Examples:
git commit -m "feat(editor): add spring template selector"
git commit -m "fix(pdf): resolve image rendering issue"
git commit -m "docs: update readme installation steps"
git commit -m "refactor(store): simplify catalog state management"

# Rules (ENFORCED by commitlint):
# ✓ Subject: 10-72 characters
# ✓ Lowercase only (no capitals)
# ✓ No period at end
# ✓ Body/footer: max 100 chars per line
# ✓ Use imperative mood: "add" not "added" or "adds"
```
