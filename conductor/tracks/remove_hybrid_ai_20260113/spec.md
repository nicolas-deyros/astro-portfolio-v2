# Specification: Remove Hybrid AI Assistant

## 1. Overview

The experimental AI features (Summary and Translation) have proven too unstable across different environments and API versions. This track will completely remove the Hybrid AI Assistant from the codebase to restore stability and simplicity.

## 2. Functional Requirements

- **UI Removal**: Remove the "Hybrid AI Assistant" section from the Blog Post page (`src/pages/blog/[slug].astro`).
- **Code Cleanup**: Delete all AI-related components, utilities, and API endpoints.
- **Dependency Removal**: Uninstall `@google/generative-ai`.
- **Database**: Remove `AICache` table definition from `db/config.ts`.

## 3. Impact Analysis

- **Blog Pages**: Will no longer show the AI toolbar.
- **Database**: `AICache` table will become orphaned (no longer in schema).
- **Tests**: AI-related tests will be removed.

## 4. Acceptance Criteria

- [ ] **Blog Post**: Page loads without the AI section.
- [ ] **Build**: `npm run build` passes without errors.
- [ ] **Tests**: `npm test` passes (after removing AI tests).
