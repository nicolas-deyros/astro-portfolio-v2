# Specification: Hotfix Gemini API Version

## 1. Overview

The Gemini SDK defaults to the `v1beta` API endpoint, which is returning 404 errors for standard models like `gemini-pro` and `gemini-1.5-flash-001` in the current environment. This hotfix will explicitly configure the SDK to use the stable `v1` API version.

## 2. Root Cause

- SDK defaults to `v1beta`.
- `v1beta` endpoint is rejecting model names that are valid in `v1` or generally available.

## 3. Functional Requirements

- **API Version**: Explicitly set `apiVersion: 'v1'` when calling `getGenerativeModel`.
- **Model Name**: Use `gemini-1.5-flash` (standard) or `gemini-pro`.

## 4. Acceptance Criteria

- [ ] **Translator**: Server-side fallback succeeds (200 OK) using `v1` API.
