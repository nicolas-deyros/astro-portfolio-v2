# Plan: Hotfix Gemini Models V2

## Phase 1: Fix Model Name

- [x] Task: Update AI Server
  - [x] Change model to `gemini-1.5-flash-001`.
  - [x] Remove the fallback to `gemini-pro` (since it also 404s).
  - [x] Update error handling to be more descriptive.

## Phase 2: Verification

- [x] Task: Manual Verification
  - [x] Run `npm run dev` and test translation.
