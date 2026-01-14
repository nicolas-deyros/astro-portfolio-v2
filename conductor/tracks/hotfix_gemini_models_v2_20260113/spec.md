# Specification: Hotfix Gemini Models V2

## 1. Overview

The server-side fallback is failing with 404 errors for both `gemini-1.5-flash` and `gemini-pro` on the `v1beta` API. This hotfix will force the use of the specific model version `gemini-1.5-flash-001` and implement a model listing debug step to identify available models.

## 2. Root Cause Analysis

- The `v1beta` API endpoint used by the SDK does not support the aliases `gemini-1.5-flash` or `gemini-pro` in the current environment configuration.
- Server returns 500 because the catch block doesn't handle the 404 gracefully enough to recover (it just logs and returns 500).

## 3. Functional Requirements

- **Model Name**: Change to `gemini-1.5-flash-001`.
- **Debugging**: If a 404 occurs, call `genAI.getGenerativeModel({ model: '...' })....` -> NO, call `genAI.listModels()` (if available via REST) or just log the error deeply.
- **Resilience**: If the specific model fails, try `gemini-pro-vision` or just fail gracefully with a 503 Service Unavailable.

## 4. Acceptance Criteria

- [ ] **Translator/Summarizer**: Server-side fallback succeeds with `gemini-1.5-flash-001`.
