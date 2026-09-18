# Security Hardening Plan

> Status: **Item 1 partially done** (login rate limiting shipped 2026-09-18, PR #93; forgot-password rate limiting still open — see Item 1b). Item 4's Content-Type sub-item already done independently. Items 2 and 3 not started. Created after a security audit of the client portal + admin system (June 2026).
> Each item is independent — do them on separate branches/PRs in the recommended order.
> This doc is self-contained: a fresh session should be able to execute any item without re-deriving context.

## Context

**App:** Astro 7 (SSR, `output: 'server'`) portfolio + admin + per-client file portal. Drizzle ORM + Turso (LibSQL). React 19 islands. Vercel deploy. Resend email. Vercel Blob (private store) for client files.

**What already works (do NOT regress these):**

- **Password storage** — PBKDF2, 100k iterations, per-password salt, constant-time compare (`src/lib/clientAuth.ts`). Solid.
- **Onboarding/reset tokens** — 32-byte random, stored only as SHA-256 hash, single-use, 7-day expiry (`src/lib/clientOnboarding.ts`, `src/lib/clientAuth.ts` `hashToken`/`generateSetupToken`).
- **Sessions** — DB-backed, device-fingerprinted, 2h expiry; `httpOnly` + `secure` (prod) + `sameSite: 'strict'` cookies (`src/lib/clientSession.ts`, `src/lib/session.ts`). Strict SameSite ≈ CSRF protection.
- **SQL injection** — none; Drizzle parameterizes all queries.
- **XSS** — Astro + React auto-escape. The one user-data HTML sink (CRM modal) escapes via `escapeHtml` (`src/pages/admin/crm.astro`). Email HTML escapes too (`src/lib/email.ts`).
- **Security headers** — HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, Referrer-Policy, Permissions-Policy, CSP — all set in `src/middleware.ts`.
- **Auth middleware** — `/admin/*`, `/client/*`, `/clients/[slug]/*` guarded in `src/middleware.ts`. Pause (`isActive=0`) and delete invalidate sessions immediately.

**Reusable infra:**

- Error helpers: `src/lib/errors.ts` → `ApplicationError`, `UnauthorizedError`, `ValidationError`, `createErrorResponse`, `createSuccessResponse`. Use these for consistent JSON responses — a 429 doesn't need a new error class, `new ApplicationError(message, 429, 'RATE_LIMITED')` is enough (this is what Item 1 actually did; the class was never added).
- DB client: `src/lib/db.ts` (`db`). Local dev auto-creates tables when `TURSO_DATABASE_URL` is unset (uses `file:local.db`); prod uses Turso via `TURSO_DATABASE_URL`.
- **Migration pattern (IMPORTANT — three places must stay in sync):** when adding a table/column,
  1. add it to `src/db/schema.ts`,
  2. add idempotent `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE` to the local-dev block in `src/lib/db.ts`,
  3. `npm run db:generate` (needs `TURSO_DATABASE_URL` set to anything, e.g. `file:local.db` — generation is offline, doesn't need a live connection) to produce a reviewed SQL file under `drizzle/`,
  4. apply that SQL to **prod** by hand — `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` are marked **sensitive** in Vercel, so `vercel env pull` returns them blank and they can't be retrieved via CLI or dashboard reveal. Get the DB URL from the Turso dashboard (non-secret) and mint a **fresh** auth token there if you need one (don't need the original), then either run `TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npm run db:migrate`, or — simpler and lower-risk, since prod's `__drizzle_migrations` tracking table has likely never been initialized (schema changes here have always been applied by hand) — paste just the new migration's `CREATE TABLE`/`ALTER TABLE` SQL directly into the Turso dashboard's SQL Shell. `db:migrate` would try to replay *all* migrations from `0000` and error on already-existing tables; the direct-paste path only touches the one new statement.
  (`tools/migrate-client-tables.mjs`, referenced by an earlier version of this doc, no longer exists — removed when the project moved off `@astrojs/db` to Drizzle+Turso.)
  Run prod migration **before** deploying code that uses the new schema (additive/nullable = backward-compatible).

**Workflow:** branches only (no direct commits to `master`); `npm run check` before push; PR → squash-merge → Vercel auto-deploys. Verify build with `npm run build`, lint with eslint config at `./config/eslint.config.js`, tests with `npm run test:run`.

---

## Item 1 — Rate limiting (HIGHEST PRIORITY) — PARTIALLY DONE

**Problem:** No rate limiting anywhere. Three abusable endpoints were identified:

- `src/pages/api/client/forgot-password.json.ts` — scripted requests with a known email → victim gets hundreds of reset emails; burns Resend quota; harms sender reputation. **Still open — see Item 1b below.**
- `src/pages/api/client/auth.json.ts` (`action: 'login'`) — unlimited password brute-force, no lockout. **Fixed**, PR #93 (2026-09-18).
- `src/pages/api/auth.json.ts` admin login — unlimited brute-force of the shared secret key. **Fixed**, PR #93 (2026-09-18).
- (`set-password.json.ts` tokens are 32-byte random — brute-force infeasible, correctly skipped.)

Was listed as a known gap in `docs/ISSUES.md` ("No auth rate limiting") — that entry is now marked `(FIXED)` for the login endpoints only.

**What shipped (reuse this, don't rebuild it):**

- Table `LoginAttempts` (`src/db/schema.ts`, migration `drizzle/0003_add_login_attempts.sql`):
  ```
  key TEXT PRIMARY KEY,        -- e.g. "admin:<ip>", "client:<ip>:<emailLower>"
  count INTEGER NOT NULL DEFAULT 0,
  windowStart TEXT NOT NULL    -- ISO timestamp
  ```
- `src/lib/rateLimit.ts` — fixed-window, 5 attempts / 15 minutes (`WINDOW_MS`, `MAX_ATTEMPTS` constants at the top of the file):
  ```ts
  checkRateLimit(key: string): Promise<boolean>   // true = still allowed
  recordFailedAttempt(key: string): Promise<void> // increments/starts the window
  clearRateLimit(key: string): Promise<void>      // call on success
  ```
  No generic `limit`/`windowMs` params like originally speced below — it's hardcoded to the login use case. **Item 1b needs different limits (3/15min), so either add optional params to this lib, or accept the mismatch and hardcode a second constant — see Item 1b.**
- Applied in `auth.json.ts` and `client/auth.json.ts`: `checkRateLimit` before the credential comparison → throw `ApplicationError(..., 429, 'RATE_LIMITED')` if blocked; `recordFailedAttempt` on a wrong credential; `clearRateLimit` on success. No new `TooManyRequestsError` class was added — the existing generic `ApplicationError` with an explicit 429/`RATE_LIMITED` code was reused instead (simpler, no new export needed).
- Tests: `test/unit/rate-limit.test.ts` (window logic against local.db) + an E2E lockout test in `test/auth.test.ts` (`Login Rate Limiting` describe block).

**Verification:** `npx vitest run test/unit/rate-limit.test.ts test/auth.test.ts --config config/vitest.config.ts`.

---

## Item 1b — Rate limit `forgot-password.json.ts` (HIGHEST PRIORITY, remaining)

**Problem:** `src/pages/api/client/forgot-password.json.ts` has zero throttling — confirmed by direct read, 2026-09-19. Anyone can script requests with a known/guessed client email and trigger unlimited password-reset emails. This was the *primary* concern in the original Item 1 write-up, and it's the one piece not yet done.

**Design — reuse `src/lib/rateLimit.ts`, don't duplicate it:**

- Suggested limits from the original plan: **3 attempts / 15 minutes**, keyed **per IP and per email** (two separate checks, or one combined key like `forgot:<ip>:<emailLower>` — combined key is simpler and matches the pattern already used for `client:<ip>:<email>` in the login fix; a determined attacker rotating IPs is a lesser concern than the accidental/scripted case this is mainly defending against).
- `rateLimit.ts` currently hardcodes `MAX_ATTEMPTS = 5` / `WINDOW_MS = 15 * 60 * 1000` for the login use case. Forgot-password wants a stricter `3`. Simplest fix: add optional `maxAttempts`/`windowMs` parameters to `checkRateLimit`/`recordFailedAttempt`/`clearRateLimit` (default to the existing login values so the two call sites in `auth.json.ts`/`client/auth.json.ts` don't need changes), then pass `{ maxAttempts: 3 }` from `forgot-password.json.ts`.
- Apply the check **before** the DB lookup, unconditionally — not just on the "client found" branch. Keep the existing **no-enumeration** behavior: do NOT return a different response shape that reveals whether the email exists. When rate-limited, return a generic 429 (`ApplicationError(..., 429, 'RATE_LIMITED')`) — a 429 doesn't leak account existence, it just says "you're going too fast," so this doesn't weaken the existing enumeration protection.
- On any request that passes the rate-limit check, whether or not a matching active client was found, do **not** call `recordFailedAttempt` conditionally on "client not found" — that would itself be an enumeration side-channel (attacker could infer existence from whether the counter increments differently). Record an attempt on every check that reaches this point, success or not; only `clearRateLimit` differs (there's no real "success" state to clear on for this endpoint — every valid request should probably just record, never clear, since repeated legitimate resets are also worth limiting).

**Apply in:** `src/pages/api/client/forgot-password.json.ts`, right after the Content-Type/body validation, before the `db.select` lookup.

**Verification:** extend `test/unit/rate-limit.test.ts` if `checkRateLimit` gains parameters (test the custom-limit path), and add an E2E test mirroring the `Login Rate Limiting` block in `test/auth.test.ts` — or a new small Puppeteer-free test if a lighter-weight harness exists for this endpoint. Manually hammer `/api/client/forgot-password.json` and confirm 429 after 3 attempts, confirm the generic success message is still returned for both real and fake emails when not rate-limited.

**Effort:** Small — the hard part (DB-backed rate limiting infra) is already built. This is wiring + one design decision (per-key limit override) + tests.

---

## Item 2 — Password policy (HIGH VALUE, LOW EFFORT)

**Problem:** Only rule is length ≥ 8.
- Server: `src/pages/api/client/set-password.json.ts` → `MIN_PASSWORD_LENGTH = 8` (line ~17), checked line ~36.
- Client: `src/pages/client/set-password.astro` → `minlength="8"` on both inputs + a JS "passwords match" check.
- Admin-set passwords: `src/pages/api/admin/clients.json.ts` PUT branch calls `hashPassword(password)` with **no validation at all** — admin can set a 1-char password.

**Guidance (NIST 800-63B):** length > composition rules. Do **not** force "1 uppercase + 1 symbol" (produces `Password1!`, annoys users). Effective controls:
1. **Min length 12.**
2. **Reject the obvious:** password must not contain / equal the client's email local-part or name.
3. **Breach check (optional but high-value):** Have I Been Pwned k-anonymity — SHA-1 the password, send first 5 hex chars to `https://api.pwnedpasswords.com/range/{prefix}`, check if the suffix appears. Never sends the full password. `connect-src` in the CSP is `'self' https:` so the outbound call is already allowed. **Handle HIBP downtime gracefully — never block password-setting if the API is unreachable** (log + allow).
4. Optional UX: `zxcvbn` strength meter on the page (adds a dep + client JS — only if wanted).

**Implementation:**
- New `src/lib/passwordPolicy.ts` → `validatePassword(password, { email, name }): string | null` (returns error message or null). Pure function → easy unit test.
- Call it in `set-password.json.ts` (replace the length check) and in `clients.json.ts` PUT (when `password` present).
- Mirror the min length + a brief hint on `set-password.astro` (client-side is UX only; server is the real gate).
- If adding HIBP: a separate `src/lib/hibp.ts` `isBreached(password): Promise<boolean>` with try/catch → false on error.

**Verification:** `test/unit/password-policy.test.ts` — assert short/weak/email-as-password rejected, strong accepted. Manually set a password through the portal.

**Effort:** Small (no schema, no migration). HIBP adds one network call + graceful-failure handling.

---

## Item 3 — Tighten CSP (remove `'unsafe-inline'`) (LOWER PRIORITY, HIGHER EFFORT)

**Problem:** `src/middleware.ts` CSP (line ~81) uses `script-src 'self' 'unsafe-inline' data: ...` and `style-src 'self' 'unsafe-inline' ...`. `'unsafe-inline'` means that *if* an XSS hole ever appeared, injected inline scripts would execute — it defeats much of CSP's purpose.

**Why it's there:** the site uses inline `<script>` (theme init in `src/layouts/index.astro`; GA via `set:html` in `src/components/Head.astro`; page scripts in login/crm/clients/HeaderMenu/BackToTop, etc.) and inline styles.

**Approach:** nonce- or hash-based CSP.
- Astro 7 has experimental CSP support (`experimental.csp` in `astro.config.mjs`) that can hash inline scripts/styles automatically — investigate this first; it may do most of the work.
- Otherwise: generate a per-request nonce in `middleware.ts`, add `nonce={...}` to every inline `<script>`/`<style>`, and switch CSP to `script-src 'self' 'nonce-...'`. View-transition (`ClientRouter`) + Partytown + Vercel scripts complicate this.

**⚠️ Caution:** CSP has bitten this project before — the React-island hydration outage earlier was CSP-related (`data:` URIs, `vercel.live`; see git log `fix(csp): ...` commits and `preserveEntrySignatures` saga). Test islands hydrate and view transitions work on a **preview deploy** before merging. Don't do this one casually.

**Verification:** preview deploy; confirm no CSP violations in console; admin React islands hydrate; theme toggle + GA + Partytown still work.

**Effort:** Medium-High. Do this last.

---

## Item 4 — Minor hardening (NICE-TO-HAVE)

- **CRM modal — escape `id`:** `src/pages/admin/crm.astro` (~line 347) interpolates `${id}` unescaped into `insertAdjacentHTML`. It's an app-generated integer (low risk), but escape it for consistency with the `name`/`message` handling already there.
- **Upload limits:** `src/pages/api/admin/client-files.json.ts` POST has no app-level MIME allow-list or size cap (relies on Vercel Blob's 5TB default). Admin is trusted, so low risk — but add a sane `maximumSizeInBytes` and optional content-type allow-list to prevent accidental huge/odd uploads.
- ~~**Content-Type validation:** some endpoints don't assert `application/json`~~ — Done independently: `auth.json.ts`, `client/auth.json.ts`, and `links.json.ts` all validate Content-Type (confirmed by direct read, 2026-09-19).

**Effort:** Trivial each.

---

## Recommended order

1. **Item 1b (forgot-password rate limiting)** — highest remaining priority; small effort, infra already built.
2. **Item 2 (password policy)** — small, high value, no infra. Quick win.
3. **Item 3 (CSP)** — highest effort + regression risk; do last regardless of what else is picked up.

## Cross-cutting reminders

- Branch per item; `npm run check` before push; PR → squash-merge → Vercel deploy.
- For a new table/column: see the updated migration pattern above — `npm run db:generate` locally, then apply the resulting SQL to prod by hand via the Turso dashboard SQL Shell (not `db:migrate`, given prod's untracked migration history — see migration pattern note above for why).
- Add a unit test for any non-trivial pure logic (rate-limit window math, password policy) — `test/unit/*.test.ts`, run with `npm run test:run`.
- Update `docs/ISSUES.md` to tick off any newly resolved items, matching the `~~ISSUE-N: Title~~ (FIXED)` convention already used there (see ISSUE-21).
