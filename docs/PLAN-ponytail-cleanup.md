# Ponytail Cleanup — Implementation Plan

> Source: repo-wide ponytail over-engineering audit (2026-06-18).
> Goal: delete verified-dead code. Every step is gated on verification so nothing breaks.
> Each cut is independent — they can ship as one PR or three.

**Pre-flight (run once, on a fresh branch off master):**

```bash
git switch master && git pull
npm run git:start chore/ponytail-cleanup "chore: remove dead link actions, audio wrapper branches, unused error classes"
npm run type-check   # baseline: must be green BEFORE any change
npm run test:run     # baseline: record current pass/fail state
```

If the baseline is not green, stop and fix that first — otherwise you can't attribute later failures to the cuts.

---

## Cut 1 — Delete dead link actions (biggest, ~383 lines)

**Why safe:** `actions/links.ts` exports 6 actions with zero consumers. The admin UI
(`useAdminLinks.ts`) drives links via the REST endpoint `/api/links.json`, which is
untouched. Only `actions/index.ts` references `links.ts` (spread). No test imports it.

**Steps:**

- [ ] Delete `src/actions/links.ts`
- [ ] In `src/actions/index.ts`: remove `import { server as linkActions } from './links'` and the `...linkActions` line from the `server` object (leaving `sendEmail`).
- [ ] `npm run type-check` → zero errors (proves no dangling references)
- [ ] `npm run test:integration` → `test/e2e/links.test.ts` still passes (REST path intact)
- [ ] `npm run build` → exits 0
- [ ] Commit: `refactor: remove unused link Astro actions (dead dual-API surface)`

**Rollback:** `git checkout master -- src/actions/links.ts src/actions/index.ts`

---

## Cut 2 — Collapse audio wrapper to its only-used branch (~80 lines)

**Why safe:** `HybridAudioPlayerWrapper.astro` has 5 branches switching on a `client`
prop. Its single caller (`src/pages/blog/[slug].astro:133`) passes `client="visible"`.
The other 4 branches (load/idle/media/only) are never reached.

**Steps:**

- [ ] In `HybridAudioPlayerWrapper.astro`: delete the `load`, `idle`, `media`, and `only` branches; keep only the `client === 'visible'` branch rendered unconditionally with `client:visible`.
- [ ] Remove the `client` prop from the `Props` interface and the destructure.
- [ ] Remove `client="visible"` from the caller in `src/pages/blog/[slug].astro` (now redundant).
- [ ] `npm run type-check` → zero errors
- [ ] `npm run build` → exits 0
- [ ] Manual/visual: blog post page still renders the audio player (the only place it appears).
- [ ] Commit: `refactor: collapse audio wrapper to the single client directive in use`

**Rollback:** `git checkout master -- src/components/AudioPlayer/HybridAudioPlayerWrapper.astro src/pages/blog/[slug].astro`

**Note:** Keep the wrapper file — it provides the styling `<div>` + scoped styles. Don't inline into the page.

---

## Cut 3 — Remove speculative error subclasses (~24 lines)

**Why safe:** `ForbiddenError`, `NotFoundError`, `ConflictError`, `ExternalServiceError`
have zero consumers repo-wide (incl. tests). `ApplicationError`, `UnauthorizedError`,
`ValidationError`, `toApplicationError`, `createSuccessResponse`, `createErrorResponse`
stay (all used).

**Steps:**

- [ ] In `src/lib/errors.ts`: delete the 4 unused subclass definitions.
- [ ] `npm run type-check` → zero errors
- [ ] `npm run test:critical` → passes
- [ ] Commit: `refactor: drop unused ApplicationError subclasses (yagni)`

**Rollback:** `git checkout master -- src/lib/errors.ts`

> Add any of these back the moment a catch site actually needs to branch on it — one line each.

---

## Ship

- [ ] `npm run check:full` → lint + all tests green
- [ ] `npm run build` → exits 0
- [ ] `gh pr ready` → `gh pr merge --auto --squash`

## Verification Checklist (after all cuts)

- [ ] `npm run type-check` — zero errors
- [ ] `npm run build` — exits 0
- [ ] `npm run test:run` — same pass set as the baseline (no new failures)
- [ ] Admin links page: create / edit / delete / bulk-delete still work (REST path)
- [ ] Blog post page: audio player renders and plays

---

## Out of scope (flagged, not in this plan)

- `fallow:*` npm scripts were dropped from `package.json` in PR #63 but `.fallowrc.json`,
  `.github/workflows/fallow.yml`, and CLAUDE.md still reference them. Decide: restore the
  scripts or remove the config. This is drift/correctness, not over-engineering.
