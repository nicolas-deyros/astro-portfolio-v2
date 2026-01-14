# Plan: Fix AI Translation & Summarization Implementation

## Phase 1: Environment & Verification

- [x] Task: Verify Reproduction
  - [x] Start dev server: `npm run dev`.
  - [x] Use `chrome-devtools-mcp` to attach to the page.
  - [x] Capture Console Logs: detailed capture of "No output language" warning and "not supported" error using `get_console_message`.
  - [x] Inspect Network: check for any failed model download requests using `get_network_request` (if applicable).
  - [x] Check `src/lib/summarizer.ts` and `src/lib/translator.ts` for current implementation gaps.

## Phase 2: Summarizer Service Repair (TDD)

- [x] Task: Fix Summarizer Configuration
  - [x] **Red:** Create/Update unit test in `test/utils/summarizer.test.ts` to expect an output language parameter in `create()`.
  - [x] **Green:** Update `src/utils/summarizer.ts` (and `src/lib/summarizer.ts` if distinct) to accept and pass the language parameter to the API.
  - [x] **Refactor:** Ensure default falls back safely to 'en'.

- [~] Task: Implement Timeout Handling
  - [ ] **Red:** Add test case simulating a long download/model initialization timeout.
  - [ ] **Green:** Implement timeout logic in `Summarizer` class to catch hanging promises and return a specific "Download Timeout" error.

## Phase 3: Translator Service Repair (TDD)

- [x] Task: Robust Availability Checks
  - [x] **Red:** Update `test/utils/translator.test.ts` to mock `canTranslate` returning 'no' and verify it throws/returns correct error before attempting translation.
  - [x] **Green:** Modify `src/utils/translator.ts` to strictly check `canTranslate({ source: 'en', target: 'es' })` before calling `createTranslator`.
- [x] Task: Support Dynamic Language Pairs
  - [x] **Red:** Add test for switching target languages (e.g., 'es' to 'ja').
  - [x] **Green:** Refactor `Translator` class to handle dynamic source/target pairs rather than hardcoded values.

## Phase 4: UI/UX & Integration

- [x] Task: Language Selector Component
  - [x] Create a reusable `LanguageSelector.astro` component.
  - [x] Options: English (en), Spanish (es), Japanese (ja), etc.
- [x] Task: Integrate Selector with ChromeAISection
  - [x] Update `src/components/ChromeAI/ChromeAISection.astro` to include the language selector for both tabs.
  - [x] Pass selected language to `handleSummaryGeneration` and `handleTranslation`.
- [x] Task: User Feedback Implementation
  - [x] Improved "Downloading Model" status updates.
  - [x] Added initialization guard to prevent duplicate event listeners.

## Phase 5: Delivery

- [x] Task: Final Verification with DevTools
  - [x] Start dev server: `npm run dev`.
  - [x] Use `chrome-devtools-mcp` to verify fixes.
  - [x] Validated both Summarizer and Translator with new Language Selectors.
- [x] Task: Documentation
  - [x] Run `npm run docs:sync`.
  - [x] Update `docs/CHROME_AI.md` with new setup instructions.
- [x] Task: Conductor - User Manual Verification 'Phase 5: Delivery' (Protocol in workflow.md)
  - [ ] Start dev server: `npm run dev`.
  - [ ] Use `chrome-devtools-mcp` to verify no console warnings appear during summarization.
  - [ ] Use `chrome-devtools-mcp` to verify successful translation network/console activity.
  - [ ] Run `npm run check:full` to ensure no regressions.
- [ ] Task: Documentation
  - [ ] Run `npm run docs:sync`.
  - [ ] Update `docs/CHROME_AI.md` with new setup instructions.
- [ ] Task: Conductor - User Manual Verification 'Phase 5: Delivery' (Protocol in workflow.md)
