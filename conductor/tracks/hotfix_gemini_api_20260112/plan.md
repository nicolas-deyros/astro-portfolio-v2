# Plan: Hotfix Gemini API & Summarizer

## Phase 1: Gemini API Fix

- [x] Task: Update Model Name
  - [x] Modify `src/utils/ai-server.ts` to use `gemini-1.5-flash-latest` or `gemini-1.5-pro` (fallback to pro if flash is unstable).
  - [x] Verify with a test that mocks the _correct_ model name.

## Phase 2: Summarizer Fix

- [x] Task: Force Fallback on Language Error
  - [x] Update `src/utils/summarizer.ts` to catch the specific "No output language" warning/error and trigger `fetchFallback`.
  - [x] Verify parameter naming (`sharedContext` vs `outputLanguage`).

## Phase 3: Verification

- [x] Task: Manual Verification
  - [x] Run `npm run dev` and test both features.
