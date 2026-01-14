# Plan: Hotfix AI Timeouts & Database Seeding

## Phase 1: Database Fix

- [x] Task: Debug DB Seed
  - [x] Investigate `db/seed.ts` and `package.json` script.
  - [x] Try running `astro db execute db/seed.ts` directly without `--remote` for local dev.
  - [x] Fix the `Assertion failed` error (likely related to process exit handling).

## Phase 2: AI Resilience

- [x] Task: Extend Timeouts
  - [x] Increase `maxWaitTime` in `ChromeAISection.astro` to 5 minutes (300000ms) for initial download.
  - [x] Update `src/utils/summarizer.ts` polling interval to be less aggressive (e.g., 2s).
- [x] Task: Fix Translation Logic
  - [x] Verify `BlogTranslator` is correctly instantiated and called.
  - [x] Ensure `outputLanguage` / `targetLanguage` mapping is correct.

## Phase 3: Verification

- [x] Task: Verify Links
  - [x] Check `http://localhost:4321/links` shows data.
- [x] Task: Verify AI
  - [x] Generate summary (wait for download).
  - [x] Translate article.
