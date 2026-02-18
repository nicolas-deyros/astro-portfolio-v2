# Gemini Project Context

## 🚀 Project Overview

**Nicolás Deyros Portfolio** is a modern, high-performance portfolio site built with **Astro**. It features a hybrid rendering model (Server-Side Rendering + Static Generation), comprehensive testing strategies, SEO optimization, and an enterprise-level admin panel.

The project emphasizes performance (Lighthouse 90+), accessibility, and developer experience, utilizing **Astro Islands** architecture for optimal client-side hydration.

## 🛠️ Technology Stack

- **Framework:** [Astro 5.x](https://astro.build) (with [Astro Actions](https://docs.astro.build/en/guides/actions/))
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS 4.x](https://tailwindcss.com/)
- **UI Libraries:** [React 19](https://react.dev/)
- **Database:** [Astro DB](https://docs.astro.build/en/guides/astro-db/)
- **Content:** MDX (Markdown + JSX)
- **Testing:** Vitest, Puppeteer/Playwright
- **AI Integration:** Chrome AI APIs (Web AI) & [AI Agent Skills](https://skills.sh) (Astro, Playwright, Browser-Use, Interface-Design, Brainstorming, SEO-Audit, Clean-Code)
- **Deployment:** Vercel

## 🏗️ Architecture

### Core Patterns

- **Islands Architecture:** Interactive UI components (mostly React) are isolated "islands" within static HTML, hydrated only when needed (`client:load`, `client:visible`).
- **Hybrid Rendering:** Configured with `output: 'server'` (via Vercel adapter) allowing a mix of static pages and dynamic server-rendered routes (e.g., Admin panel).
- **Atomic Design:** Components are organized by complexity (e.g., `src/components/Form/Input.tsx` vs `src/components/Header/Header.astro`).
- **Content-Driven:** Uses Astro Content Collections (`src/content/`) with Zod schema validation for type-safe content management.

### Key Directories

- `src/actions/`: Type-safe server actions for form processing and data mutations.
- `src/pages/`: File-based routing (SSR & Static endpoints).
- `src/components/`: Reusable UI components (Islands).
- `src/content/`: Type-safe MDX collections.
- `src/layouts/`: Core page wrappers.
- `src/lib/` & `src/utils/`: Shared utilities.
- `db/`: Astro DB schema and seed data.
- `test/`: Comprehensive test suites.
- `docs/`: Technical documentation.
- `.gemini/`: Agent session state, settings, and local metadata artifacts.
- `.agent/`: Standard workflow definitions and active skill symlinks.
- `.agents/`: Physical repository for AI agent skills managed by the `skills` CLI.

## ⚡ Key Commands

### Development

- `npm run dev`: Start local development server ([http://localhost:4321](http://localhost:4321)).
- `npm run build`: Build for production.
- `npm run preview`: Preview the production build locally.
- `npm run db:seed`: Seed the local SQLite database.
- `npm run db:studio`: Open Astro DB Studio interface.

### Testing

- `npm test`: Run all tests (Vitest).
- `npm run test:watch`: Run tests in watch mode.
- `npm run test:unit`: Run unit tests.
- `npm run test:integration`: Run integration tests.
- `npm run test:performance`: Run performance tests.
- `npm run test:admin`: Run admin interface specific tests.
- `npm run ai:all`: Run all Chrome AI related tests.

### Code Quality

- `npm run lint`: Run ESLint.
- `npm run format`: Format code with Prettier.
- `npm run check`: Run critical checks (Lint + Critical Tests).
- `npm run check:full`: Run full suite (Lint + All Tests).
- `npm run spell`: Check spelling (CSpell).

## 📝 Development Conventions

- **Type Safety:** Strict TypeScript is enforced. All new code must be typed.
- **Styling:** Use Tailwind CSS utility classes. For component-specific styles, use scoped `<style>` blocks in Astro files or CSS Modules.
- **Testing:** New features must include tests.
  - **Unit:** For utility functions and logic.
  - **Integration:** For checking component interactions and API endpoints.
  - **End-to-end:** For critical user flows.
- **Commits:** Follow conventional commits (checked by `commitlint`).
- **Linting:** Pre-commit hooks (`lint-staged`) automatically lint and format changes. Pre-push hooks run critical tests.
- **Documentation:** Maintain documentation in `docs/` for significant architectural changes.

## 🔄 Core Workflow

### 1. Session Initialization

Before starting any work, ensure the environment is synced and healthy:

```bash
npm run session:init
```

### 2. Branching & Development

Direct commits to `master` (or `main`) are strictly forbidden. Always use feature branches:

1. **Start Task:** Create a branch and a Draft PR.

   ```bash
   npm run git:start <branch-name> "<description>"
   ```

2. **Develop:** Follow TDD (Write tests -> Implement -> Refactor).
3. **Verify:** Run quick checks before pushing.

   ```bash
   npm run check
   ```

### 3. Delivery Protocol

1. **Documentation:** Sync documentation and update the changelog.

   ```bash
   npm run docs:sync
   ```

2. **Final Verification:** Run the full test suite.

   ```bash
   npm run check:full
   ```

3. **PR lifecycle:**
   - Mark the PR as **Ready for Review** (`gh pr ready`).
   - Enable **Auto-Merge** (`gh pr merge --auto --squash`).

Review this plan thoroughly before making any code changes. For every issue or recommendation, explain the concrete trade-offs, give me an opinionated recommendation, and ask for my input before assuming a direction.

My engineering preferences (use these to guide your recommendations):

- DRY is important—flag repetition aggressively.
- Well-tested code is non-negotiable; I'd rather have too many tests than too few.
- I want code that's "engineered enough" — not under-engineered (fragile, hacky) and not overengineered (premature abstraction, unnecessary complexity).
- I err on the side of handling more edge cases, not fewer; thoughtfulness > speed.
- Bias toward explicit over clever.

## 1. Architecture review

Evaluate:

- Overall system design and component boundaries.
- Dependency graph and coupling concerns.
- Data flow patterns and potential bottlenecks.
- Scaling characteristics and single points of failure.
- Security architecture (auth, data access, API boundaries).

## 2. Code quality review

Evaluate:

- Code organization and module structure.
- DRY violations—be aggressive here.
- Error handling patterns and missing edge cases (call these out explicitly).
- Technical debt hotspots.
- Areas that are overengineered or under-engineered relative to my preferences.

## 3. Test review

Evaluate:

- Test coverage gaps (unit, integration, end-to-end).
- Test quality and assertion strength.
- Missing edge case coverage—be thorough.
- Untested failure modes and error paths.

## 4. Performance review

Evaluate:

- N+1 queries and database access patterns.
- Memory-usage concerns.

### Caching opportunities

- Slow or high-complexity code paths.

For each issue you find, for every specific issue (bug, smell, design concern, or risk):

- Describe the problem concretely, with file and line references.
- Present 2-3 options, including "do nothing" where that's reasonable.
- For each option, specify: implementation effort, risk, impact on other code, and maintenance burden.
- Give me your recommended option and why, mapped to my preferences above.
- Then explicitly ask whether I agree or want to choose a different direction before proceeding.

### Workflow and interaction

- Do not assume my priorities on timeline or scale.
- After each section, pause and ask for my feedback before moving on.

## BEFORE YOU START

Ask if I want one of two options:

1/ **BIG CHANGE**: Work through this interactively, one section at a time (Architecture -> Code Quality -> Tests -> Performance) with at most 4 top issues in each section.
2/ **SMALL CHANGE**: Work through interactively ONE question per review section.

FOR EACH STAGE OF REVIEW: output the explanation and pros and cons of each stage's questions AND your opinionated recommendation and why, and then use AskUserQuestion. Also NUMBER issues and then give LETTERS for options and when using AskUserQuestion make sure each option clearly labels the issue NUMBER and option LETTER so the user doesn't get confused. Make the recommended option always the 1st option.
