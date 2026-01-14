# Plan: Hotfix Gemini Models

## Phase 1: Fix Model Name

- [x] Task: Update AI Server
  - [x] Change model to `gemini-1.5-flash` (the standard stable name).
  - [x] Add better error logging in `src/pages/api/ai/process.ts` to capture the full upstream error details.

## Phase 2: Verify Summarizer Catch

- [x] Task: Review Summarizer Catch
  - [x] Ensure the `try/catch` block in `summarizeBlogPost` covers the exact error string being thrown.

## Phase 3: Verification

- [x] Task: Manual Verification
  - [x] Run `npm run dev` and test translation (expecting fallback success).
