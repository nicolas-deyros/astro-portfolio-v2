# Specification: Hotfix Gemini API & Summarizer

## 1. Overview

This hotfix addresses two critical bugs blocking the AI features:

1. **Summarizer**: Persistent "No output language" error despite previous fixes.
2. **Translator (Gemini Fallback)**: 404 Error when calling `gemini-1.5-flash`.

## 2. Root Cause Analysis

- **Summarizer**: The `outputLanguage` parameter might be ignored or named differently in the current Chrome Canary build.
- **Translator**: The `@google/generative-ai` SDK version or the specific model name `gemini-1.5-flash` is not resolving correctly in the `v1beta` API.

## 3. Functional Requirements

- **Summarizer**: Ensure the `outputLanguage` is passed correctly. If the local API fails with this specific error, strictly force the server-side fallback.
- **Gemini API**: Update the model name to a stable version (e.g., `gemini-1.5-flash-001` or `gemini-1.5-pro`) that is guaranteed to exist.

## 4. Acceptance Criteria

- [ ] **Summarizer**: Successfully generates a summary (either locally or via cloud) without the language error.
- [ ] **Translator**: Server-side fallback successfully returns a translation using the Gemini API.
