# Specification: Hotfix AI Timeouts & Database Seeding

## 1. Overview

Critical regressions have been identified:

1. **AI Summarizer**: Timeouts during model download/initialization.
2. **AI Translator**: Fails to translate despite UI updates.
3. **Database**: The `Links` table is empty, and `db:seed` crashes with a libuv assertion error.

## 2. Problem Statement

- **AI**: The `waitForModelDownload` logic might be too aggressive or not properly detecting state changes in Chrome v143.
- **DB**: `npm run db:seed` fails, leaving the app without critical content.

## 3. Functional Requirements

- **AI Resilience**: Increase default timeouts and improve the polling logic for model downloads. Ensure the `onProgress` callback receives accurate status.
- **Database Stability**: Fix the `db:seed` script or `astro db` configuration to prevent crashes and ensure data is seeded correctly.

## 4. Acceptance Criteria

- [ ] **Summarizer**: Successfully downloads model (or handles existing model) and generates summary without timeout.
- [ ] **Translator**: Successfully translates content.
- [ ] **Links**: The `/links` page displays seeded data.
