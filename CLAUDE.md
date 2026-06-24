# Project Context

## Project Overview

**Nicolás Deyros Portfolio** — modern, high-performance portfolio built with **Astro 7.x**. Hybrid rendering (SSR + Static), comprehensive testing, SEO optimization, and enterprise-level admin panel. Uses **Astro Islands** architecture for optimal client-side hydration. Performance target: Lighthouse 90+.

## Tech Stack

- **Framework:** Astro 7.x (with Astro Actions)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4.3.x (via Vite plugin)
- **UI:** React 19 (islands)
- **Database:** Drizzle ORM + Turso (LibSQL) — 6 tables: `FormSubmissions`, `Links`, `AdminSessions`, `Clients`, `ClientSessions`, `ClientNodes`
- **File Storage:** Vercel Blob — private client files with signed download URLs
- **Content:** MDX with Content Collections + Zod validation
- **Testing:** Vitest, Puppeteer/Playwright
- **Email:** React Email + Resend
- **Analytics:** Google Analytics via Partytown (web worker, production only)
- **Deployment:** Vercel (SSR adapter) with CDN edge caching
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
- Client portal auth: Protects `/client/*` (except `/client/login`) — validates `client_session` + `client_token` cookies
- Client page isolation: Protects `/clients/[slug]/*` — verifies the session's client slug matches the URL slug
- Security headers: HSTS, CSP, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy

### Integrations

`mdx`, `partytown`, `sitemap` (excludes /admin), `astro-icon`, `@astrojs/db`, `react`

## Key Directories

- `src/actions/` — Type-safe server actions (form processing, data mutations)
- `src/pages/` — File-based routing (SSR & Static endpoints)
- `src/components/` — Reusable UI components (Islands, Atomic Design)
- `src/content/` — Type-safe MDX blog collection
- `src/layouts/` — Single layout wrapper (with ClientRouter)
- `src/lib/` — Business logic: `email.ts`, `session.ts`, `clientSession.ts`, `clientAuth.ts`, `blogPostUtils.ts`, `audioPlayer.ts`, `browserDetection.ts`
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
npm run build            # Build for production
npm run preview          # Preview production build
npm run db:push          # Push Drizzle schema to a NEW Turso DB (never run against production)
npm run db:generate      # Generate SQL migration files (review before applying)
npm run db:migrate       # Apply migration files to the connected Turso DB (review SQL first)
npm run db:studio        # Open Astro DB Studio (legacy — use Drizzle Studio instead)
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

### Dependency Management

```bash
npm run deps:check           # Check for outdated packages
npm run deps:upgrade         # Upgrade Astro + all packages
npm run deps:scan            # Full Socket.dev supply chain scan (creates report)
npm run deps:audit           # Quick Socket.dev audit of current dependencies
```

> **Socket.dev is a global tool, not a project dependency.**
> It must be installed globally and the npm wrapper must be active on any machine working on this project:
>
> ```bash
> npm install -g socket    # one-time global install
> socket wrapper on        # intercepts every npm install system-wide
> ```
>
> Verify the wrapper is active: `socket wrapper status`
> The `~/.npmrc` setting `ignore-scripts=true` blocks lifecycle scripts globally — keep it.

```bash
npm run session:init                     # Sync environment before starting work
npm run git:start <branch-name> "<desc>" # Create feature branch + Draft PR
npm run docs:sync                        # Sync documentation and changelog
npm run git:ship                         # Full check + ship (PR ready + auto-merge)
```

### Codebase Intelligence (Fallow)

Static analysis for unused code, duplication, and complexity. Free layer, no install needed (npx). Config: `.fallowrc.json`.

```bash
npm run fallow            # Run all analyses (dead code + duplication + health)
npm run fallow:dead       # Unused files, exports, deps, types, circular deps
npm run fallow:dupes      # Duplicated code blocks across the codebase
npm run fallow:health     # Complexity hotspots and refactor targets
npm run fallow:audit      # Changed-files-only audit (scoped to origin/master diff)
npm run fallow:fix        # Preview automatic dead-code removal (dry-run)
```

> All rules are set to `warn` (never blocks CI). Flip to `"error"` in `.fallowrc.json` once the backlog is clean.
> CI runs automatically on every PR via `.github/workflows/fallow.yml` — posts a summary comment and inline annotations.

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

> Run `npm run fallow:dead` to surface unused exports/files across the DRY violations below.
> Run `npm run fallow:health` to prioritise SRP god-files by complexity score.

- **DRY Violations (Critical) — RESOLVED**
- ~~**Duplicate email logic**~~ — Fixed
- ~~**Triplicate auth**~~ — Fixed
- ~~**Duplicate Zod schemas**~~ — Fixed
- ~~**`@astrojs/db` removed in Astro 7**~~ — Migrated to Drizzle ORM + Turso (PR #67)

### SRP Violations

- ~~**`src/lib/audioPlayer.ts`** (892 lines)~~ — Largely addressed: now ~403 lines, with parsing/visualization/progress/chunking extracted into `contentFilter.ts`, `audioVisualization.ts`, `progressTracker.ts`, `textChunker.ts`.
- ~~**`src/pages/admin/links.astro`** (1325 lines)~~ — Fixed: now ~149 lines; CRUD UI extracted into the `AdminLinksManager.tsx` React island.

### Boy Scout (Cleanup)

- Debug `console.log` statements in `api/links.json.ts` and `admin/links.astro`
- Unnecessary comments restating code in `session.ts` and `auth.json.ts`
- Magic numbers: session duration, byte lengths, Chrome AI version threshold
- `prerender = true` in `TopPosts.astro` component (no effect)
- `z.string().transform()` for dates instead of `z.coerce.date()` in content schema

### Error Handling Patterns

- ~~**No custom error hierarchy**~~ — Addressed: `src/lib/errors.ts` provides an `ApplicationError` hierarchy (`UnauthorizedError`, `ValidationError`) with `code`/`statusCode`, plus `toApplicationError` and standardized JSON response helpers, used by the API endpoints (ISSUE-14).
- ~~**Stack traces destroyed**~~ — Moot: `actions/links.ts` was removed; `errors.ts` preserves the original via the ECMAScript 2022 `cause` option (ISSUE-15).
- **Errors swallowed** — `actions/index.ts` catches and returns `{success: false}` hiding error type from callers.
- **Middleware unprotected** — `middleware.ts` has zero try-catch. DB failure crashes with unhandled exception.
- **Inconsistent API error formats** — 3 different error response shapes across endpoints.
- **No auth rate limiting** — `auth.json.ts` login endpoint allows unlimited brute-force attempts.

### API Design Violations

- **Verb-based URL** — `POST /api/sendEmail.json` uses verb instead of resource noun.
- **RPC-in-REST** — `auth.json.ts` routes 3 operations (login/logout/validate) via single POST with `action` body field.
- **Wrong HTTP status codes** — Endpoints return `200 OK` for errors with `{success: false}` body instead of proper 4xx/5xx codes.
- ~~**Dual API surface**~~ — Resolved: the unused link Astro actions were removed (PR #65); links are served only via REST, email only via the `sendEmail` Action.
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
