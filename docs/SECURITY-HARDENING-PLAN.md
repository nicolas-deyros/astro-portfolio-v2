# Security Hardening Plan

> Status: **planned, not started.** Created after a security audit of the client portal + admin system (June 2026).
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

- Error helpers: `src/lib/errors.ts` → `ApplicationError`, `UnauthorizedError`, `ValidationError`, `createErrorResponse`, `createSuccessResponse`. Use these for consistent JSON responses (and a 429 will need a new `TooManyRequestsError` — see item 1).
- DB client: `src/lib/db.ts` (`db`). Local dev auto-creates tables when `TURSO_DATABASE_URL` is unset (uses `file:local.db`); prod uses Turso via `TURSO_DATABASE_URL`.
- **Migration pattern (IMPORTANT — three places must stay in sync):** when adding a table/column,
  1. add it to `src/db/schema.ts`,
  2. add idempotent `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE` to the local-dev block in `src/lib/db.ts`,
  3. add it to `tools/migrate-client-tables.mjs` (the script that migrates **prod** Turso — reads `ASTRO_DB_REMOTE_URL`/`ASTRO_DB_APP_TOKEN` from `.env.local`),
  4. optionally `npm run db:generate` for a Drizzle migration file (note: drizzle.config wants `TURSO_*` env names, but `.env.local` uses `ASTRO_DB_*` — map them, or rely on the migrate script which is the established path).
  Run prod migration **before** deploying code that uses the new schema (additive/nullable = backward-compatible).

**Workflow:** branches only (no direct commits to `master`); `npm run check` before push; PR → squash-merge → Vercel auto-deploys. Verify build with `npm run build`, lint with eslint config at `./config/eslint.config.js`, tests with `npm run test:run`.

---

## Item 1 — Rate limiting (HIGHEST PRIORITY)

**Problem:** No rate limiting anywhere. Two abusable endpoints:

- `src/pages/api/client/forgot-password.json.ts` — scripted requests with a known email → victim gets hundreds of reset emails; burns Resend quota; harms sender reputation.
- `src/pages/api/client/auth.json.ts` (`action: 'login'`) — unlimited password brute-force, no lockout.
- (Also consider `src/pages/api/auth.json.ts` admin login. Lower priority: `set-password.json.ts` tokens are 32-byte random — brute-force infeasible, skip.)

Listed as a known gap in `docs/ISSUES.md` ("No auth rate limiting").

**Why in-memory won't work:** Vercel serverless = many short-lived instances; an in-memory counter doesn't persist across invocations/cold starts. Must be DB-backed (Turso) or an external store (Vercel KV / Upstash). **Recommendation: Turso table** — no new dependency, consistent with the rest of the stack.

**Design:**

- New table `RateLimits` (add via the 3-place migration pattern above):
  ```
  key TEXT PRIMARY KEY,        -- e.g. "login:<ip>", "forgot:<emailLower>", "login:<emailLower>"
  count INTEGER NOT NULL,
  windowStart TEXT NOT NULL    -- ISO timestamp
  ```
- New lib `src/lib/rateLimit.ts`:
  ```ts
  // returns { ok: boolean, retryAfterSeconds?: number }
  export async function checkRateLimit(key: string, limit: number, windowMs: number)
  ```
  Fixed-window is simplest and good enough: if `now - windowStart > windowMs` reset count=1; else increment; if `count > limit` → not ok. One upsert + read. (Sliding window is nicer but more code — start with fixed window; `// ponytail: fixed window, switch to sliding if abuse continues`.)
- Get client IP from `src/lib/clientSession.ts` `createDeviceFingerprint` pattern (`x-forwarded-for` first hop → `x-real-ip` → `cf-connecting-ip`).
- Add `TooManyRequestsError` to `src/lib/errors.ts` (statusCode 429, code `RATE_LIMITED`); include `Retry-After`. `createErrorResponse` should map it to a 429.

**Suggested limits:** login 5 / 15 min per IP **and** per email; forgot-password 3 / 15 min per IP **and** per email. Tune later.

**Apply in:** `client/auth.json.ts` (login branch, before password check), `client/forgot-password.json.ts` (before lookup), optionally `api/auth.json.ts`. Keep forgot-password's existing **no-enumeration** behavior (still return the generic success message even when rate-limited? — No: return 429 generically, it doesn't leak account existence).

**Verification:** unit test the window logic (`test/unit/rate-limit.test.ts`, vitest, `--config ./config/vitest.config.ts`); manually hammer the endpoint and confirm 429 + `Retry-After`. Confirm a normal user flow still works.

**Effort:** Medium (needs the table + migration in all 3 places + prod migration run).

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
- **Content-Type validation:** some endpoints don't assert `application/json` (noted in `docs/ISSUES.md`). The newer client-portal endpoints already do; audit older ones (`auth.json.ts`, `links.json.ts`).

**Effort:** Trivial each.

---

## Recommended order

1. **Item 2 (password policy)** — small, high value, no infra. Quick win.
2. **Item 1 (rate limiting)** — highest security value; needs the table + migration.
3. **Item 4 (minor hardening)** — cheap cleanups, bundle into either PR above or its own.
4. **Item 3 (CSP)** — last; highest effort + regression risk.

## Cross-cutting reminders

- Branch per item; `npm run check` before push; PR → squash-merge → Vercel deploy.
- For Item 1's table: run the **prod** migration (`node tools/migrate-client-tables.mjs`) **before** merging the code that reads it. Verify read-only first (see how `setupTokenHash` was added this cycle — same pattern).
- Add a unit test for any non-trivial pure logic (rate-limit window math, password policy) — `test/unit/*.test.ts`, run with `npm run test:run`.
- Update `docs/ISSUES.md` to tick off "No auth rate limiting" and any others resolved.
