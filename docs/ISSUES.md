# Known Issues & Technical Debt

> Identified via Astro framework, Clean Code, and Error Handling Patterns skill reviews (2026-02-18).
> See `CLAUDE.md → Technical Debt` for summary.

---

## 🔴 Critical — DRY Violations

### ~~ISSUE-01: Duplicate Email Implementation~~ (FIXED)

|             |                                                                                                                                                                                               |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Files**   | `src/lib/email.ts` (52 lines, React Email), ~~`src/pages/api/sendEmail.json.ts`~~                                                                                                             |
| **Problem** | Two completely separate email systems. `email.ts` uses React Email templates (clean). `sendEmail.json.ts` has inline HTML, manual validation, manual escapeHtml, separate Resend client init. |
| **Impact**  | Bugfixes must be applied twice. Template drift. Inconsistent validation.                                                                                                                      |
| **Fix**     | Refactored `sendEmail.json.ts` to delegate to `email.ts` service, or replace the API endpoint entirely with an Astro Action.                                                                  |
| **Effort**  | Medium (2-3 hours)                                                                                                                                                                            |

### ~~ISSUE-02: Triplicate Auth Logic~~ (FIXED)

|             |                                                                                                                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Files**   | `src/actions/links.ts`, `src/pages/api/links.json.ts`, `src/lib/session.ts`                                                                                                                  |
| **Problem** | Three different auth strategies for the same admin functionality. `actions/links.ts` uses Authorization header with Bearer token — different from the cookie-based approach everywhere else. |
| **Impact**  | Security inconsistency, maintenance overhead, potential bypass vectors.                                                                                                                      |
| **Fix**     | Unified all auth on `session.ts` centralized functions (`validateSession`, `requireAuthentication`).                                                                                         |
| **Effort**  | Medium (2-3 hours)                                                                                                                                                                           |

### ~~ISSUE-03: Duplicate Zod Schemas in Actions~~ (FIXED)

|             |                                                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **File**    | `src/actions/links.ts`                                                                                                                                  |
| **Problem** | `createLink` and `updateLink` have identical Zod schemas for title, URL, tags, date. Tag-cleaning logic is also duplicated (lines 189-193 and 264-268). |
| **Impact**  | Validation changes must be applied in two places.                                                                                                       |
| **Fix**     | Extracted `linkBaseSchema` constant and `cleanTags()` utility function.                                                                                 |
| **Effort**  | Low (30 minutes)                                                                                                                                        |

---

## 🔴 Critical — SRP Violations

### ISSUE-04: `audioPlayer.ts` God Class

|                     |                                                                                                                                                                                                             |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **File**            | `src/lib/audioPlayer.ts` (892 lines, 39 methods)                                                                                                                                                            |
| **Problem**         | Single class handles: Web Audio API context, Speech Synthesis, HTML parsing (`extractFromHTML` — 117 lines), Markdown parsing, text chunking, audio visualization, progress tracking, and state management. |
| **Clean Code Rule** | Functions max 20 lines (ideal 5-10), single responsibility per class.                                                                                                                                       |
| **Fix**             | Split into: `AudioEngine`, `SpeechEngine`, `ContentExtractor`, `Visualizer`, `ProgressTracker`.                                                                                                             |
| **Effort**          | High (4-6 hours)                                                                                                                                                                                            |

### ISSUE-05: `admin/links.astro` God File

|             |                                                                                                                                                                                                                             |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **File**    | `src/pages/admin/links.astro` (1325 lines)                                                                                                                                                                                  |
| **Problem** | Server-side data fetching, 3 dialog modals (error, delete confirm, update confirm), full CRUD UI (form + table + pagination + search + filter + bulk ops), and all JavaScript interaction logic — all in one `.astro` file. |
| **Fix**     | Extract: `LinkFormModal.astro`, `ConfirmDialog.astro`, `LinksTable.astro`, client-side JS into `lib/linksAdmin.ts`.                                                                                                         |
| **Effort**  | High (4-6 hours)                                                                                                                                                                                                            |

---

## ⚠️ Medium

### ISSUE-06: Magic Numbers

| File                  | Line        | Value                                | Suggested Constant                                 |
| --------------------- | ----------- | ------------------------------------ | -------------------------------------------------- |
| `api/auth.json.ts`    | 46, 65      | `2 * 60 * 60 * 1000` / `2 * 60 * 60` | `SESSION_DURATION_MS` / `SESSION_DURATION_SECONDS` |
| `session.ts`          | 17          | `32`                                 | `TOKEN_BYTE_LENGTH`                                |
| `session.ts`          | 36          | `16`                                 | `SESSION_ID_BYTE_LENGTH`                           |
| `browserDetection.ts` | 38, 48, 116 | `129`                                | `MIN_CHROME_AI_VERSION`                            |
| `audioPlayer.ts`      | various     | `32767`                              | `MAX_SPEECH_CHUNK_LENGTH`                          |

**Effort:** Low (1 hour)

### ISSUE-07: Debug Logs in Production

| File                | Lines              |
| ------------------- | ------------------ |
| `api/links.json.ts` | 114, 147, 191, 216 |
| `admin/links.astro` | 128                |

**Fix:** Remove all `console.log` debug statements. Keep `console.error` for actual errors.
**Effort:** Low (15 minutes)

### ISSUE-08: Unnecessary Comments

Comments that restate what the code does (violates clean-code "no obvious comments"):

| File            | Line | Comment                                              |
| --------------- | ---- | ---------------------------------------------------- |
| `session.ts`    | 16   | `// Generate 32 bytes of random data`                |
| `session.ts`    | 20   | `// Convert to base64url (URL-safe base64)`          |
| `session.ts`    | 26   | `// Add timestamp for uniqueness`                    |
| `auth.json.ts`  | 23   | `// Validate credentials using environment variable` |
| `links.json.ts` | 134  | `// Convert id to number if it's a string`           |

**Fix:** Remove comments that restate code. Keep only "why" comments.
**Effort:** Low (15 minutes)

---

## 💡 Minor — Astro Best Practices

### ISSUE-09: Ineffective `prerender` in Component

|             |                                                                                                          |
| ----------- | -------------------------------------------------------------------------------------------------------- |
| **File**    | `src/components/TopPosts.astro`                                                                          |
| **Problem** | `export const prerender = true` in a component has no effect — prerender is a page-level directive only. |
| **Fix**     | Remove the export.                                                                                       |
| **Effort**  | Trivial (1 minute)                                                                                       |

### ISSUE-10: Date Schema Using `transform` Instead of `coerce`

|             |                                                                                                                                                          |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **File**    | `src/content/config.ts`                                                                                                                                  |
| **Problem** | Uses `z.string().transform()` to convert date strings. Astro recommends `z.coerce.date()` which handles more formats and provides better type inference. |
| **Fix**     | Replace with `z.coerce.date()`.                                                                                                                          |
| **Effort**  | Low (10 minutes)                                                                                                                                         |

### ISSUE-11: DRY Violation in `HybridAudioPlayerWrapper`

|             |                                                                           |
| ----------- | ------------------------------------------------------------------------- |
| **File**    | `src/components/AudioPlayer/HybridAudioPlayerWrapper.astro`               |
| **Problem** | Props are passed through from wrapper to inner component with repetition. |
| **Fix**     | Use prop spread (`{...Astro.props}`).                                     |
| **Effort**  | Low (10 minutes)                                                          |

### ISSUE-12: `session.ts` — Near-Duplicate Token Functions

|             |                                                                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **File**    | `src/lib/session.ts` (lines 15-43)                                                                                               |
| **Problem** | `generateSecureToken` (32 bytes + base64url + timestamp) and `generateSecureSessionId` (16 bytes + base64url) share 90% of code. |
| **Fix**     | Extract `randomBase64Url(byteLength: number): string` helper.                                                                    |
| **Effort**  | Low (15 minutes)                                                                                                                 |

### ISSUE-13: `utils.ts` Single-Function antipattern

|              |                                                                                                                                                                   |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **File**     | `src/lib/utils.ts` (7 lines, single `cn()` function)                                                                                                              |
| **Problem**  | Clean-code skill says: _"utils.ts with 1 function → Put code where used."_                                                                                        |
| **Decision** | **Keep as-is.** `cn()` is an industry-standard Tailwind CSS pattern likely imported by many components. Exception justified. Do NOT add unrelated functions here. |

---

## 🔴 Critical — Error Handling

### ISSUE-14: No Custom Error Hierarchy

|             |                                                                                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Files**   | `src/actions/links.ts`, `src/lib/email.ts`, all API endpoints                                                                                                 |
| **Problem** | Every error is a generic `Error`. No way to distinguish auth, validation, not-found, or service errors at the catch site. Callers must parse message strings. |
| **Fix**     | Create `ApplicationError` hierarchy: `UnauthorizedError`, `NotFoundError`, `ValidationError`, `ExternalServiceError` with code and statusCode.                |
| **Effort**  | Medium (3-4 hours)                                                                                                                                            |

### ISSUE-15: Error Context Destroyed by Wrapping

|             |                                                                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **File**    | `src/actions/links.ts` (lines 208, 286, 322, 362)                                                                                        |
| **Problem** | `throw new Error(\`Failed to create link: ${error.message}\`)` discards the original stack trace. Makes production debugging impossible. |
| **Fix**     | Use ECMAScript 2022 Error `cause` option: `new ApplicationError('...', { cause: error })`.                                               |
| **Effort**  | Low (30 minutes, after ISSUE-14)                                                                                                         |

### ISSUE-16: Errors Swallowed in Actions

|             |                                                                                                                                                                                         |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **File**    | `src/actions/index.ts` (lines 45-51)                                                                                                                                                    |
| **Problem** | The catch block logs the error then returns `{success: false, message: "generic"}`. The caller (React component) can't distinguish email failure from DB failure from validation error. |
| **Fix**     | Return typed error responses with error codes, or re-throw with Astro's `ActionError`.                                                                                                  |
| **Effort**  | Low (1 hour)                                                                                                                                                                            |

### ISSUE-17: Middleware Has Zero Error Handling

|             |                                                                                                                                                                      |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **File**    | `src/middleware.ts`                                                                                                                                                  |
| **Problem** | No try-catch around `requireAuthentication()` or `next()`. If DB connection fails, middleware crashes with unhandled exception — no graceful error page, no logging. |
| **Fix**     | Wrap in try-catch with fallback error response and logging.                                                                                                          |
| **Effort**  | Low (30 minutes)                                                                                                                                                     |

---

## ⚠️ Medium — Error Handling

### ISSUE-18: Inconsistent API Error Response Format

|             |                                                                                                                 |
| ----------- | --------------------------------------------------------------------------------------------------------------- |
| **Files**   | `api/auth.json.ts` (`{success, message}`), `api/links.json.ts` GET (`{error}`), PUT/DELETE (`{error, details}`) |
| **Problem** | Three different error response shapes across API endpoints. Clients can't reliably parse errors.                |
| **Fix**     | Unify on: `{ success: false, error: { code, message, details? } }`.                                             |
| **Effort**  | Medium (2 hours)                                                                                                |

### ISSUE-19: `sendEmail.json.ts` Catches Too Broadly

|             |                                                                                                                                               |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **File**    | `src/pages/api/sendEmail.json.ts` (lines 13-275)                                                                                              |
| **Problem** | Entire 260-line handler in single outer try-catch. JSON parse error, DB error, and email service error all produce same generic 500 response. |
| **Fix**     | Structured error handling with specific catches per operation, or refactor to use `lib/email.ts` (see ISSUE-01).                              |
| **Effort**  | Included with ISSUE-01                                                                                                                        |

### ISSUE-20: `audioPlayer.ts` Silent Async Failures

|             |                                                                                                                                                           |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **File**    | `src/lib/audioPlayer.ts` (lines 140-146)                                                                                                                  |
| **Problem** | `loadText()` catches errors and stores in state but resolves the Promise. Caller's `await loadText()` succeeds, then `play()` tries to play empty chunks. |
| **Fix**     | Re-throw after updating state, or return a Result type.                                                                                                   |
| **Effort**  | Low (30 minutes)                                                                                                                                          |

### ISSUE-21: No Auth Rate Limiting

|             |                                                                                               |
| ----------- | --------------------------------------------------------------------------------------------- |
| **File**    | `src/pages/api/auth.json.ts` (login case)                                                     |
| **Problem** | No rate limiting, no lockout, no delay on failed login attempts. Enables brute-force attacks. |
| **Fix**     | Add in-memory rate limiter (e.g., failed attempts counter per IP with exponential backoff).   |
| **Effort**  | Medium (2-3 hours)                                                                            |

---

---

## 🔴 Critical — API Design

### ISSUE-22: Verb-Based URL (`/api/sendEmail.json`)

|             |                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| **File**    | `src/pages/api/sendEmail.json.ts`                                                                                         |
| **Problem** | URL uses a verb (`sendEmail`) instead of resource noun. REST conventions: resources are nouns, HTTP methods imply action. |
| **Fix**     | Rename to `POST /api/contact` or `POST /api/messages`, or deprecate in favor of `sendEmail` Astro Action.                 |
| **Effort**  | Low (30 minutes)                                                                                                          |

### ISSUE-23: RPC-in-REST Pattern (`/api/auth.json`)

|             |                                                                                                                             |
| ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| **File**    | `src/pages/api/auth.json.ts`                                                                                                |
| **Problem** | Single POST endpoint with `action` body field routes 3 operations (login, logout, validate). This is RPC disguised as REST. |
| **Fix**     | Restructure: `POST /api/sessions` (login), `DELETE /api/sessions` (logout), `GET /api/sessions/current` (validate).         |
| **Effort**  | Medium (2-3 hours)                                                                                                          |

### ISSUE-24: Wrong HTTP Status Codes

|             |                                                                                                                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Files**   | `auth.json.ts`, `sendEmail.json.ts`, `links.json.ts`                                                                                                                             |
| **Problem** | Endpoints return `200 OK` for errors (invalid credentials, validation failures, missing resources) with `{success: false}` body. Clients can't use HTTP status to detect errors. |
| **Fix**     | Use proper codes: 401 (auth), 400/422 (validation), 404 (not found), 204 (logout success), 415 (wrong content-type).                                                             |
| **Effort**  | Medium (2 hours)                                                                                                                                                                 |

### ISSUE-25: Dual API Surface for Same Resources

|             |                                                                                                                                                                   |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Files**   | REST: `api/sendEmail.json.ts`, `api/links.json.ts` — Actions: `actions/index.ts`, `actions/links.ts`                                                              |
| **Problem** | Both REST endpoints and Astro Actions manage the same resources (email, links) with different validation, auth, and response formats. Two code paths to maintain. |
| **Fix**     | Consolidate on Astro Actions (type-safe, integrated) and deprecate REST endpoints, or share a service layer.                                                      |
| **Effort**  | High (1 day, strategic decision)                                                                                                                                  |

---

## ⚠️ Medium — API Design

### ISSUE-26: Missing Content-Type Validation

|             |                                                                                                                                                                                               |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Files**   | `api/auth.json.ts`, `api/links.json.ts`                                                                                                                                                       |
| **Problem** | `sendEmail.json.ts` validates `Content-Type: application/json` (good). The other two endpoints do not — sending non-JSON causes cryptic parse errors instead of `415 Unsupported Media Type`. |
| **Fix**     | Add Content-Type check to `auth.json.ts` and `links.json.ts`.                                                                                                                                 |
| **Effort**  | Low (15 minutes)                                                                                                                                                                              |

### ISSUE-27: No API Versioning

|              |                                                                                                                         |
| ------------ | ----------------------------------------------------------------------------------------------------------------------- |
| **Files**    | All `api/*.json.ts` endpoints                                                                                           |
| **Problem**  | No versioning strategy. URLs are `/api/links.json` not `/api/v1/links`. Breaking changes can't be rolled out gradually. |
| **Decision** | **Accept for now.** Internal admin API only. Add versioning if API becomes public.                                      |

---

## 🔴 Critical — SEO

### ISSUE-28: No Canonical Tags

|            |                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------- |
| **File**   | `src/components/Head.astro`                                                                       |
| **Impact** | High — duplicate content from www/non-www, trailing slashes, query params splits ranking signals. |
| **Fix**    | Add `canonical` prop to `<SEO>` component using `Astro.url`.                                      |
| **Effort** | Low (15 minutes)                                                                                  |

### ISSUE-29: No Structured Data (JSON-LD)

|            |                                                                           |
| ---------- | ------------------------------------------------------------------------- |
| **Files**  | All pages — none have any `schema.org` markup.                            |
| **Impact** | High — missing rich snippets (Person, BlogPosting, BreadcrumbList, site). |
| **Fix**    | Create `StructuredData.astro` component with JSON-LD per page type.       |
| **Effort** | High (4-6 hours)                                                          |

### ISSUE-30: OG Image is favicon.svg

|            |                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------ |
| **File**   | `src/components/Head.astro` (lines 53, 66)                                                 |
| **Impact** | High — social shares show tiny icon instead of preview. Most platforms won't render SVG.   |
| **Fix**    | Create 1200×630 PNG OG image. Ideally auto-generate per-page with `satori` / `@vercel/og`. |
| **Effort** | Medium (2-3 hours)                                                                         |

---

## ⚠️ Medium — SEO

### ISSUE-31: Blog Posts — No Per-Post OG Images

|            |                                                                                           |
| ---------- | ----------------------------------------------------------------------------------------- |
| **File**   | `src/pages/blog/[slug].astro`                                                             |
| **Impact** | Medium — all blog shares look identical on social platforms, reducing click-through rate. |
| **Fix**    | Add `ogImage` field to blog schema, or auto-generate OG images with post title.           |
| **Effort** | Medium (2-3 hours)                                                                        |

### ISSUE-32: 404 Page — Heading Hierarchy Violation

|            |                                                                 |
| ---------- | --------------------------------------------------------------- |
| **File**   | `src/pages/404.astro` (line 10)                                 |
| **Impact** | Low-Medium — H1 → H3 skips H2, breaking WCAG heading structure. |
| **Fix**    | Change `<h3>` to `<h2>`.                                        |
| **Effort** | Low (5 minutes)                                                 |

### ISSUE-33: 404 Page — Missing Meta Description

|            |                                             |
| ---------- | ------------------------------------------- |
| **File**   | `src/pages/404.astro` (line 6)              |
| **Impact** | Low — no meta description passed to Layout. |
| **Fix**    | Add `description="Page not found"` prop.    |
| **Effort** | Low (5 minutes)                             |

---

## Priority Order

### Quick Wins (≤2 hours total)

ISSUE-07, 08, 09, 10, 11, 12 (clean code), ISSUE-15, 16, 17, 20 (error handling), ISSUE-22, 26 (API design), ISSUE-28, 32, 33 (SEO)

### Medium Effort (2-4 hours each)

ISSUE-01, 02, 03, 06 (clean code), ISSUE-14, 18, 21 (error handling), ISSUE-23, 24 (API design), ISSUE-30, 31 (SEO)

### Large Refactors (4-6 hours each)

ISSUE-04, 05 (SRP), ISSUE-19 (w/ ISSUE-01), ISSUE-25 (API consolidation), ISSUE-29 (structured data)
