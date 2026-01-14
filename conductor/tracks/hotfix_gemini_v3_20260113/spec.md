# Specification: Hotfix Gemini Models V3

## 1. Overview

The Gemini API continues to return 404 for `gemini-1.5-flash` variants on the `v1beta` endpoint. This hotfix will switch to the generic `gemini-pro` model and implement a robust "List Models" debug step to definitive identify available models.

## 2. Root Cause

- The `v1beta` API endpoint default in the SDK seems to lack access to `1.5-flash` models for the current configuration.
- The 500 error from the server triggers confusing client-side errors.

## 3. Functional Requirements

- **Model Selection**: Switch to `gemini-pro`.
- **Debug Mode**: If `generateContent` fails with 404, the server MUST attempt to call `listModels()` and log the result to the server console. This allows us to see exactly what `v1beta` supports.

## 4. Acceptance Criteria

- [ ] **Translator**: Server-side fallback succeeds (200 OK) using `gemini-pro`.
- [ ] **Logs**: If it fails, the server logs contain a list of valid model names.
