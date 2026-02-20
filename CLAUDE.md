# Project Context

## Project Overview

**Nicolás Deyros Portfolio** — modern, high-performance portfolio built with **Astro 5.x**. Hybrid rendering (SSR + Static), comprehensive testing, SEO optimization, and enterprise-level admin panel. Uses **Astro Islands** architecture for optimal client-side hydration. Performance target: Lighthouse 90+.

## Tech Stack

- **Framework:** Astro 5.x (with Astro Actions)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4.x (via Vite plugin)
- **UI:** React 19 (islands)
- **Database:** Astro DB (SQLite) — 3 tables: `FormSubmissions`, `Links`, `AdminSessions`
- **Content:** MDX with Content Collections + Zod validation
- **Testing:** Vitest, Puppeteer/Playwright
- **Email:** React Email + Resend
- **Analytics:** Google Analytics via Partytown (web worker, production only)
- **Deployment:** Vercel (SSR adapter)
- **AI Skills:** `.agent/skills/` — 18 skills including Astro, Playwright, Browser-Use, Interface-Design, Brainstorming, SEO-Audit, Clean-Code

## Architecture — Astro Specifics

### Islands & Hydration Strategy

Only interactive components get client directives. Static content ships zero JS.

- `client:idle` — Contact form (not critical path)
- `client:load` — Skill badges (immediate interaction needed)
- `client:visible` — Audio player (lazy hydration)
- `client:only="react"` — Client-only rendering when SSR not needed
- No directive — Everything else (static HTML)

### Hybrid Rendering (`output: 'server'`)

| Route                                          | Prerender        | Why             |
| ---------------------------------------------- | ---------------- | --------------- |
| Blog (`[slug]`, `[...page]`, tags, categories) | `true`           | Static content  |
| `robot.txt.ts`                                 | `true`           | Static          |
| API (`auth.json.ts`, `sendEmail.json.ts`)      | `false`          | Dynamic         |
| Admin pages                                    | Default (server) | Auth required   |
| Home, Contact                                  | Default (server) | Dynamic content |

### Content Collections

Single `blog` collection in `src/content/config.ts` with Zod schema:

- `title` (max 60 chars for SEO), `description` (max 160 chars)
- `draft`, `category`, `tags`, `date`, `image`, `author`

### Astro Actions

- `sendEmail` — Contact form → Resend email → DB insert
- Link management CRUD actions (spread from `./links.ts`)
- All use `defineAction` with Zod input validation

### View Transitions

`ClientRouter` from `astro:transitions` in Layout. Theme persistence via `astro:after-swap` event.

### Middleware

Centralized in `src/middleware.ts`:

- Admin auth: Protects `/admin/*` (except `/admin/login`)
- Security headers: HSTS, CSP, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy

### Integrations

`mdx`, `partytown`, `sitemap` (excludes /admin), `astro-icon`, `@astrojs/db`, `react`

## Key Directories

- `src/actions/` — Type-safe server actions (form processing, data mutations)
- `src/pages/` — File-based routing (SSR & Static endpoints)
- `src/components/` — Reusable UI components (Islands, Atomic Design)
- `src/content/` — Type-safe MDX blog collection
- `src/layouts/` — Single layout wrapper (with ClientRouter)
- `src/lib/` — Business logic: `email.ts`, `session.ts`, `blogPostUtils.ts`, `audioPlayer.ts`, `browserDetection.ts`
- `src/utils/` — Shared utilities
- `db/` — Astro DB schema (3 tables) and seed data
- `test/` — Comprehensive test suites
- `docs/` — Technical documentation
- `config/` — ESLint, Prettier, Vitest, CSpell, textlint configs
- `.agent/` — Workflow definitions and skill symlinks
- `tools/` — Custom CLI scripts (git-start, session-init, docs-sync, git-flow)
- `conductor/` — Workflow orchestration

## Commands

### Development

```bash
npm run dev              # Start dev server (localhost:4321, opens browser)
npm run dev:clean        # Start dev server without opening browser
npm run build            # Build for production (--remote for Astro DB)
npm run preview          # Preview production build
npm run db:seed          # Seed the remote database
npm run db:studio        # Open Astro DB Studio
```

### Testing

```bash
npm test                 # Run all tests (Vitest)
npm run test:run         # Run all tests once (no watch)
npm run test:watch       # Tests in watch mode
npm run test:coverage    # Tests with coverage report
npm run test:critical    # Critical tests only (grammar, mdx, seo)
npm run test:integration # Integration + E2E tests
npm run test:performance # Performance tests (Lighthouse)
npm run test:admin       # Admin interface tests
```

### Code Quality

```bash
npm run lint             # ESLint (auto-fix)
npm run lint:all         # ESLint + textlint + cspell
npm run format           # Prettier formatting
npm run spell            # Spell check (CSpell)
npm run type-check       # Astro type checking
npm run check            # Quick check (lint:all + critical tests)
npm run check:full       # Full check (lint:all + all tests)
```

### Git Automation

```bash
npm run session:init                     # Sync environment before starting work
npm run git:start <branch-name> "<desc>" # Create feature branch + Draft PR
npm run docs:sync                        # Sync documentation and changelog
npm run git:ship                         # Full check + ship (PR ready + auto-merge)
```

## Development Conventions

- **Type Safety:** Strict TypeScript everywhere. All new code must be typed.
- **Styling:** Tailwind CSS utility classes. Scoped `<style>` blocks in Astro files or CSS Modules for component-specific styles.
- **Testing:** New features MUST include tests (unit, integration, and/or end-to-end as appropriate).
- **Commits:** Conventional commits enforced by commitlint. Pre-commit hooks (lint-staged) auto-lint and format. Pre-push hooks run critical tests.
- **Documentation:** Maintain `docs/` for significant architectural changes.
- **Astro Components:** Use typed `Props` interface. Prefer static over hydrated. Choose the least-eager client directive that works.
- **Content:** All blog content in MDX. Schema validated by Zod. SEO limits enforced in schema.

## Workflow — STRICTLY ENFORCED

### 1. Session Init

Before any work:

```bash
npm run session:init
```

### 2. Branching

**Direct commits to `master` (or `main`) are FORBIDDEN.** Always use feature branches:

1. Create branch + Draft PR: `npm run git:start <branch-name> "<description>"`
2. Develop using TDD: Write tests → Implement → Refactor
3. Verify before pushing: `npm run check`

### 3. Delivery

1. Sync docs: `npm run docs:sync`
2. Full verification: `npm run check:full`
3. PR lifecycle: Mark Ready for Review (`gh pr ready`) → Enable Auto-Merge (`gh pr merge --auto --squash`)

## Engineering Preferences

Follow these strictly when making recommendations or writing code:

- **DRY** — Flag repetition aggressively
- **Well-tested** — More tests > fewer tests. Non-negotiable.
- **Engineered enough** — Not under-engineered (fragile, hacky). Not overengineered (premature abstraction, unnecessary complexity).
- **Edge cases** — Handle more, not fewer. Thoughtfulness > speed.
- **Explicit over clever** — Always.

## Review Protocol

For every code change, evaluate:

1. **Architecture** — System design, component boundaries, dependency graph, data flow, security
2. **Code Quality** — Organization, DRY violations, error handling, edge cases, tech debt
3. **Tests** — Coverage gaps, assertion quality, missing edge cases, untested failure modes
4. **Performance** — N+1 queries, memory, caching opportunities, slow code paths

For each issue found:

- Describe concretely with file/line references
- Present 2-3 options (including "do nothing" when reasonable)
- For each option: effort, risk, impact, maintenance burden
- Give opinionated recommendation mapped to my preferences above
- Ask for confirmation before proceeding

### Before Starting Any Change

Ask which mode:

1. **BIG CHANGE** — Interactive, one section at a time (Architecture → Code Quality → Tests → Performance), max 4 issues per section
2. **SMALL CHANGE** — One question per review section

Number issues, letter options, recommended option first.

## Technical Debt & Known Issues

See `docs/ISSUES.md` for full details and implementation plan.

### DRY Violations (Critical)

- **Duplicate email logic** — `src/lib/email.ts` (React Email) vs `src/pages/api/sendEmail.json.ts` (inline HTML). Legacy endpoint needs cleanup.
- **Triplicate auth** — 3 different strategies: Bearer tokens (`actions/links.ts`), cookies (`api/links.json.ts`), cookies+fingerprint (`lib/session.ts`). Unify on `session.ts`.
- **Duplicate Zod schemas** — `createLink`/`updateLink` in `actions/links.ts` share identical schemas and tag-cleaning logic.

### SRP Violations

- **`src/lib/audioPlayer.ts`** (892 lines, 39 methods) — God class handling: audio context, speech synthesis, HTML/Markdown parsing, visualization, progress tracking, state management.
- **`src/pages/admin/links.astro`** (1325 lines) — Server logic + 3 modals + CRUD UI + all JS in one file.

### Boy Scout (Cleanup)

- Debug `console.log` statements in `api/links.json.ts` and `admin/links.astro`
- Unnecessary comments restating code in `session.ts` and `auth.json.ts`
- Magic numbers: session duration, byte lengths, Chrome AI version threshold
- `prerender = true` in `TopPosts.astro` component (no effect)
- `z.string().transform()` for dates instead of `z.coerce.date()` in content schema

### Error Handling Patterns

- **No custom error hierarchy** — All errors are generic `Error`. No way to distinguish auth/validation/not-found/service errors at catch sites.
- **Stack traces destroyed** — `actions/links.ts` wraps errors losing original cause. Use ECMAScript 2022 Error `cause`.
- **Errors swallowed** — `actions/index.ts` catches and returns `{success: false}` hiding error type from callers.
- **Middleware unprotected** — `middleware.ts` has zero try-catch. DB failure crashes with unhandled exception.
- **Inconsistent API error formats** — 3 different error response shapes across endpoints.
- **No auth rate limiting** — `auth.json.ts` login endpoint allows unlimited brute-force attempts.

### API Design Violations

- **Verb-based URL** — `POST /api/sendEmail.json` uses verb instead of resource noun.
- **RPC-in-REST** — `auth.json.ts` routes 3 operations (login/logout/validate) via single POST with `action` body field.
- **Wrong HTTP status codes** — Endpoints return `200 OK` for errors with `{success: false}` body instead of proper 4xx/5xx codes.
- **Dual API surface** — Same resources (email, links) served via both REST endpoints and Astro Actions with different validation and auth.
- **Missing Content-Type validation** — `auth.json.ts` and `links.json.ts` don't validate JSON content type.

### SEO Issues

- **No canonical tags** — Zero `<link rel="canonical">` across the site. Duplicate content risk from www/non-www, trailing slashes.
- **No structured data** — Zero JSON-LD markup. Missing Person, BlogPosting, BreadcrumbList, site schemas.
- **OG image is favicon.svg** — Social shares show tiny icon. Need proper 1200×630 PNG OG image, ideally per-page.
- **404 page** — Heading hierarchy violation (h1→h3 skips h2), missing meta description.

## MCP Servers

This project uses MCP servers defined in `.mcp.json`:

- **astro-mcp** — Astro framework operations (`npx -y @astrojs/mcp-server`)
- **GitHub** — GitHub integration for repos, issues, and PRs (`npx -y @modelcontextprotocol/server-github`)
