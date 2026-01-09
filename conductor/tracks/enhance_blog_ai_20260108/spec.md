# Track Spec: Enhance Blog AI Integration and Testing Robustness

## 1. Overview

This track focuses on stabilizing and enhancing the built-in Chrome AI features (Summarization and Translation) within the portfolio's blog system. It also aims to improve the robustness and reliability of the entire AI-related test suite.

## 2. Objectives

- Improve error handling for Chrome AI APIs (Summarizer and Translator).
- Optimize the logic for detecting AI availability.
- Eliminate flakiness in AI-related unit and integration tests.
- Ensure 80%+ code coverage for AI utilities.

## 3. Scope

- `src/utils/summarizer.ts`
- `src/utils/translator.ts`
- `test/utils/summarizer.test.ts`
- `test/utils/translator.test.ts`
- `test/integration/chrome-ai-components.test.ts`
- `test/error-handling/chrome-ai-errors.test.ts`

## 4. Requirements

- The Summarizer must handle various model availability states (readily, after-download, unavailable).
- The Translator must support dynamic language pairs and gracefully handle unsupported languages.
- Tests must use reliable mocks for the Chrome AI window APIs.
- The UI components (`BlogSummarizer.astro`, `BlogTranslator.astro`) must reflect the AI status correctly (loading, success, error).

## 5. Success Criteria

- All `ai:*` test suites pass consistently.
- 80%+ code coverage for `summarizer.ts` and `translator.ts`.
- No regression in Lighthouse performance scores.
- Manual verification confirms correct AI feedback in the UI.
