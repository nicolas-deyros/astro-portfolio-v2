# Plan: Hotfix Gemini API Version

## Phase 1: Force Stable API

- [x] Task: Update AI Server
  - [x] Modify `src/utils/ai-server.ts` to pass `{ apiVersion: 'v1' }` to `getGenerativeModel`.
  - [x] Revert model name to `gemini-1.5-flash` (standard stable).

## Phase 2: Verification

- [x] Task: Manual Verification
  - [x] Run `npm run dev`.
  - [x] Trigger translation.
