# Plan: Remove Hybrid AI Assistant

## Phase 1: UI & Component Removal

- [x] Task: Remove from Page
  - [x] Edit `src/pages/blog/[slug].astro` to remove `<ChromeAISection />` import and usage.
- [x] Task: Delete Components
  - [x] Delete `src/components/ChromeAI/` directory.

## Phase 2: Logic & API Removal

- [x] Task: Delete Utilities
  - [x] Delete `src/utils/summarizer.ts`.
  - [x] Delete `src/utils/translator.ts`.
  - [x] Delete `src/utils/ai-server.ts`.
- [x] Task: Delete API Endpoint
  - [x] Delete `src/pages/api/ai/` directory.

## Phase 3: Infrastructure Cleanup

- [x] Task: Database Cleanup
  - [x] Remove `AICache` from `db/config.ts`.
  - [x] Run `npx astro db push` to sync schema (will likely warn about data loss or just drop table).
- [x] Task: Dependency Cleanup
  - [x] `npm uninstall @google/generative-ai`.

## Phase 4: Test Cleanup

- [x] Task: Remove Tests
  - [x] Delete `test/utils/summarizer.test.ts`.
  - [x] Delete `test/utils/translator.test.ts`.
  - [x] Delete `test/api/ai-process.test.ts`.
  - [x] Delete `test/components/ChromeAISection.test.ts` (if exists).
  - [x] Delete `test/integration/chrome-ai-components.test.ts`.
  - [x] Delete `test/performance/chrome-ai-performance.test.ts`.
  - [x] Delete `test/error-handling/chrome-ai-errors.test.ts`.
  - [x] Update `package.json` scripts to remove `ai:*` scripts.

## Phase 5: Verification

- [x] Task: Final Check
  - [x] Run `npm run check:full`.
  - [x] Verify blog post page in browser.
