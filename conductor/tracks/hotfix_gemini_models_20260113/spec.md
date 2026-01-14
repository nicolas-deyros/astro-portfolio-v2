# Specification: Hotfix Gemini Models

## 1. Overview

The previous hotfix introduced an invalid model name (`gemini-1.5-flash-latest`) which causes a 404 error from the Gemini API, resulting in a 500 Internal Server Error on the fallback endpoint.

## 2. Problem Statement

- **Gemini API**: `v1beta` does not support `gemini-1.5-flash-latest`.
- **Summarizer**: Fallback might not be triggering correctly for all error types.

## 3. Functional Requirements

- **Model Name**: Revert/Change to a stable model name. `gemini-1.5-flash` is generally correct, but if that failed before, we try `gemini-1.5-flash-001`.
- **Error Handling**: Improve server-side error logging to be more descriptive.

## 4. Acceptance Criteria

- [ ] **Translator**: Server-side fallback succeeds (returns 200 OK).
- [ ] **Summarizer**: Server-side fallback succeeds.
