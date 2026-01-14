# Plan: Hotfix Gemini Models V3

## Phase 1: Fix Model & Debugging

- [x] Task: Update AI Server
  - [x] Switch model to `gemini-pro`.
  - [x] Implement `listModels()` fallback in the catch block to log available models.

## Phase 2: Verification

- [~] Task: Manual Verification
  - [ ] Run `npm run dev`.
  - [ ] Trigger translation.
  - [ ] Check logs for success or model list.
