# Specification: Fix AI Translation & Summarization Implementation

## 1. Overview

The blog's Chrome AI features (Translation and Summarization) are currently broken locally and in production. The Summarizer fails due to missing output language parameters and model download timeouts. The Translator fails with an "unsupported language pair" error for English to Spanish. This track will resolve these critical bugs and implement a robust language selection system for both features to ensure stability and usability.

## 2. Problem Statement

- **Summarizer:** Fails with `No output language was specified` warning and `Model download timed out` error.
- **Translator:** Fails with `Translation from en to es is not supported`.
- **Environment:** Chrome v143 (Experimental AI APIs).

## 3. Functional Requirements

### 3.1 Summarizer Service

- **Fix Configuration:** Must explicitly specify the output language in the Summarizer API request to resolve safety/quality warnings.
- **Timeout Handling:** Implement robust error handling for "Model download timed out". If the model is downloading, the UI should reflect this state (e.g., "Downloading model... 30%") rather than just failing after a timeout.
- **Language Selection:** Allow the user to select the desired summary language (defaulting to current page language or English).

### 3.2 Translator Service

- **Availability Check:** Before attempting translation, strictly verify that the specific language pair (e.g., `en` -> `es`) is available using the `canTranslate` or `availability` API.
- **Download Trigger:** If the pair is "readily" available, translate. If "downloadable" or "after-download", trigger the download with user feedback before attempting translation.
- **Language Selection:** Implement a UI control (dropdown) to allow users to select the target language for translation.

### 3.3 UI/UX

- **Error Feedback:** Replace console errors with user-visible alerts (Toasts or inline messages) when operations fail.
- **Loading States:** Distinctly show "Downloading Model" vs "Processing" states.

## 4. Technical Constraints

- Must use existing Chrome AI MCP/Interfaces.
- Source language is assumed to be English (`en`) for existing blog content.
- Supported target languages must include at least: English (`en`), Spanish (`es`), and Japanese (`ja`) (based on the console warning suggestion).

## 5. Acceptance Criteria

- [ ] **Summarizer:** Generates a summary without "No output language specified" console warning.
- [ ] **Translator:** Successfully translates English content to Spanish (`es`) without "not supported" errors.
- [ ] **Language Selector:** User can select a target language, and both Summarizer and Translator respect this selection.
- [ ] **Resilience:** If a model takes too long to download, the user is informed to wait/retry rather than seeing a crash.
