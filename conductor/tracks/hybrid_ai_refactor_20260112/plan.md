# Plan: Hybrid AI Refactor (Chrome AI + Gemini Fallback)

## Phase 1: Infrastructure & Schema

- [x] Task: Database Schema Update
  - [x] Add `AICache` table to `db/config.ts`.
  - [x] **Safety Check:** Run `astro db push` and verify it only creates the new table without affecting existing data.
- [x] Task: Environment Setup
  - [x] Check for `GEMINI_API_KEY` in environment (user to provide).
  - [x] Install `@google/generative-ai` SDK.

## Phase 2: Server-Side API (TDD)

- [x] Task: Implement AI Processing Endpoint
  - [x] **Red:** Create `test/api/ai-process.test.ts` to test `POST /api/ai/process`.
  - [x] **Green:** Create `src/pages/api/ai/process.ts`.
    - [x] Implement hashing logic for content (SHA-256).
    - [x] Implement DB lookup (caching).
    - [x] Implement Rate Limiting (in-memory).
    - [x] Implement Gemini API integration for 'summarize' and 'translate' using `gemini-1.5-flash`.
  - [x] **Refactor:** Ensure robust error handling and clear response types.

## Phase 3: Hybrid Service Refactor (TDD)

- [x] Task: Update BlogSummarizer
  - [x] **Red:** Add test case where window.Summarizer is undefined and verify it calls the fetch fallback.
  - [x] **Green:** Refactor `src/utils/summarizer.ts` to include `fetchFallback`.
- [x] Task: Update BlogTranslator
  - [x] **Red:** Add test case where window.translation is undefined and verify it calls the fetch fallback.
  - [x] **Green:** Refactor `src/utils/translator.ts` to include `fetchFallback`.

## Phase 4: UI/UX Enhancements

- [x] Task: Update ChromeAISection UI
  - [x] Update status messages to reflect "Attempting local..." vs "Falling back to Cloud...".
  - [x] Ensure the Language Selector values are correctly passed to the server-side API.
  - [x] Enabled component for all browsers with "Hybrid AI Assistant" branding.

## Phase 5: Verification & Delivery

- [x] Task: Final Verification
  - [x] Unit tests for Hybrid Summarizer pass.
  - [x] Unit tests for Hybrid Translator pass.
  - [x] API Process utility tests pass.
  - [x] Caching logic verified via tests.
- [x] Task: Documentation
  - [x] Update `docs/CHROME_AI.md` to reflect Hybrid architecture and API Key requirements.
- [x] Task: Conductor - User Manual Verification 'Phase 5: Delivery' (Protocol in workflow.md)
