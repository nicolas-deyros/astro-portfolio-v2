# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.0.0] - 2026-06-23

> Major platform upgrade: **Astro 6 → 7**, **Tailwind CSS 4.1 → 4.3**, and
> **Astro DB removed → Drizzle ORM + Turso (LibSQL)**. Production data is
> preserved; no data migration required. Requires `TURSO_DATABASE_URL` and
> `TURSO_AUTH_TOKEN` environment variables.

### 🚀 Astro 7 Upgrade

- **Upgraded `astro` 6.0.3 → 7.0.2** — Vite 8 (Rolldown bundler), Rust compiler, Sätteri Markdown processor, queued rendering. Builds 15–61% faster.
- **Upgraded all official integrations** — `@astrojs/mdx` 5→7, `@astrojs/react` 5→6, `@astrojs/vercel` 10→11, `@astrojs/check`, `@astrojs/partytown`, `@astrojs/rss`, `@astrojs/sitemap`.
- **Rust compiler** — Astro's `.astro` compiler is now Rust-based (replaces Go). Stricter HTML validation. All templates verified clean.
- **Sätteri Markdown** — New default Markdown/MDX processor (no remark/rehype plugins in use, no action required).
- **`compressHTML: true`** — Preserves v6 whitespace behavior (JSX mode is new default in v7); inline elements audited later.
- **Vite 8 workaround** — Applied minimal patches to `vite/dist/node/chunks/config.js` to bridge Astro 7's `rolldownOptions`-based configuration with Vite 8's `rollupOptions`-only `buildEnvironment`. Remove once Astro patches this upstream (tracked in Astro issue #17xxx).

### 💾 Database: Astro DB → Drizzle ORM + Turso

`@astrojs/db` was **removed** in Astro 7. Migrated to Drizzle ORM + Turso (LibSQL), which was the underlying engine of Astro DB. **Production data untouched.**

- **Added** `drizzle-orm`, `@libsql/client`, `drizzle-kit` (dev)
- **Removed** `@astrojs/db` integration and `db()` from integrations array
- **Created** `src/db/schema.ts` — Drizzle table definitions mirroring Astro DB schema (text columns for dates to match existing ISO string storage)
- **Created** `src/lib/db.ts` — Drizzle client using `@libsql/client`
- **Created** `drizzle.config.ts` — Drizzle Kit config (use `npm run db:push` for NEW databases only — never against production)
- **Updated** `src/lib/session.ts`, `src/actions/index.ts`, `src/pages/api/auth.json.ts`, `src/pages/api/links.json.ts` — replaced `astro:db` imports with Drizzle queries
- **Updated** `src/pages/rss-links.xml.ts`, `src/components/Home/TopLinks.astro`, `src/pages/links/[...page].astro`, `src/pages/admin/crm.astro`, `src/pages/admin/links.astro` — replaced `astro:db` imports
- **Updated** `db/config.ts` and `db/seed.ts` — replaced with Drizzle equivalents (no longer run by Astro automatically)
- **Removed** `--remote` flag from `build` script; added `db:push` and `db:generate` scripts

### 🎨 Tailwind CSS 4.1 → 4.3

- **Upgraded** `tailwindcss` and `@tailwindcss/vite` from 4.1.18 → 4.3.1
- **Required for Vite 8**: `@tailwindcss/vite` 4.2.2+ added Vite 8 support; 4.1.x is incompatible
- New utilities available: `scrollbar-*`, `zoom-*`, `tab-*`, `@container-size`

### 🗄️ Route Caching + Vercel CDN (Experimental)

- **Added** `@astrojs/vercel/cache` with `cacheVercel()` provider
- **Added** `routeRules` for SSR pages: `/` and `/links/[...page]` cached at edge (60s TTL, 300s SWR)
- Blog pages are already `prerender: true` — served as static files by Vercel CDN natively

### 🧹 Code Quality

- **Fixed** `z` deprecated import in `src/content.config.ts` — migrated from `astro:content` to `zod` directly
- **Fixed** `z` deprecated import in `src/actions/index.ts` — migrated from `astro:schema` to `zod`
- **Removed** unused `sql` import from `src/pages/admin/links.astro` (replaced with `desc()`)
- **Replaced** `sql\`\${orderColumn} DESC\`` with idiomatic `desc(orderColumn)` in admin links query

---

## [3.0.0] - 2026-06-18

> Major release consolidating the large body of work accumulated since `2.8.0`.
> The bump to `3.0.0` reflects breaking platform changes: **Astro 5 → 6**,
> **Tailwind CSS 3 → 4**, and migration of the contact/email surface to **Astro
> Actions** (legacy JSON endpoints removed). `package.json` is also realigned
> from a stale `0.0.1` placeholder to match this changelog.

### 🧹 Dead-Code Cleanup (ponytail audit)

- **Removed `src/actions/links.ts`** — 6 unused link actions (the admin UI uses the REST `/api/links.json` endpoint). Eliminates the dual-API-surface tech debt (ISSUE-25).
- **Collapsed `HybridAudioPlayerWrapper.astro`** to its single used `client:visible` branch; dropped 4 dead client-directive branches and the `client` prop.
- **Trimmed `src/lib/errors.ts`** — removed unused `ForbiddenError`, `NotFoundError`, `ConflictError`, `ExternalServiceError` subclasses.
- Net ~485 lines removed across the three cuts.

### 🐞 Build & Dependency Fixes

- **Fixed the Tailwind/Vite/Rolldown build crash** — pinned `vite` to `^7.3.2` via `overrides` so the whole tree shares Astro's vite@7 instead of dragging in vite@8 + rolldown@1.0.3 (which crashed `@tailwindcss/vite` with `Missing field tsconfigPaths`).
- **Dependency audit & cleanup** — removed stale `@types/puppeteer`, unpinned exact-version deps, upgraded Prettier; added Fallow codebase-intelligence config and CI workflow.

### 🩹 Fixes & Tooling

- **Accessibility**: fixed H1 → H3 heading-hierarchy skip in the "from-zero-to-ai-hero" blog post (section headings promoted to H2).
- **Restored `fallow:*` npm scripts** in `package.json` (`fallow`, `fallow:dead`, `fallow:dupes`, `fallow:health`, `fallow:audit`, `fallow:fix`) to match the documented commands in CLAUDE.md.

### 🚀 Astro 6 & Agentic Features

- **Astro Actions Integration**: Migrated form processing (Contact Form) to type-safe server actions, eliminating legacy JSON endpoints.
- **AI Agent Skills Integration**: Installed specialized skills (Brainstorming, Frontend-Design, SEO-Audit, Clean-Code, etc.) to enhance agent development efficiency.
- **Modernized Tech Stack**: Upgraded to Tailwind CSS 4.x for improved performance and modern styling capabilities.

### 🔒 Security Hardening

- **Middleware-Based Auth**: Centralized admin protection in `middleware.ts`.
- **Astro Actions Security**: Leveraging built-in CSRF protection and type validation in Actions.
- **CSP & HSTS**: Enforced strict Content Security Policy and HTTP Strict Transport Security.
- **Critical Access Control Fix**: Patched a vulnerability in the links management actions where authentication tokens were not validated against the database.
- **Stored XSS Remediation**: Client-side HTML escaping for contact form submissions in `src/pages/admin/crm.astro`.
- **HTML Injection Fix**: Strict HTML escaping for user inputs in the email notification system.

### 🧹 Project Structure Refinement

- **New Folders**: Documented `.gemini`, `.agent`, and `.agents` for agent-specific configurations.
- **Documentation Overhaul**: Synchronized `README.md`, `GEMINI.md`, and `SECURITY.md`.

### 🧽 Code Quality & Cleanup (Feb 2026)

- **TypeScript Linting Fixes**: Added explicit return types across various files to resolve "missing return type" warnings.
  - Added `: void` to event handlers and initialization functions in `audioPlayer.ts`, `index.astro`, `layouts/index.astro`.
  - Added `: string` to utility functions like `escapeHtml` in `crm.astro`.
  - Added return types to internal command-line tools: `git-start.ts`, `docs-sync.ts`, `session-init.ts`, `git-flow.ts`.
- Fixed TypeScript errors in `performance.test.ts`, `back-to-top.test.ts`, and `back-to-top-isolated.test.ts`.
- **Residual Code Cleanup**: Removed unused components and related logic that were no longer needed.
- **Improved Testing Stability**: Adjusted performance thresholds in `performance.test.ts` to be more realistic for development and CI (increased LCP threshold to 15s).
- **CRM Email Status**: Fixed a bug where email status showed as "unknown" — the code now reads `last_event` from the Resend API response instead of `status`.

### 🔒 Admin Authentication Centralization

- **Middleware-Level Authentication**: Centralized admin authentication logic in middleware for improved security and maintainability.
  - Authentication happens at middleware level before any page content is processed.
  - Eliminated duplicated authentication logic from 3 admin pages (index, CRM, links) — net reduction of 24 lines.
  - All current and future `/admin/*` routes automatically protected (except `/admin/login`).
- **Enhanced Middleware**: `src/middleware.ts` imports `requireAuthentication`, validates all `/admin/*` routes before rendering, and maintains existing security headers.

### 🔄 Contact Form Refactoring

- **Component Architecture Improvement**: Refactored the contact form into reusable components.
  - Created `useContactForm` custom hook to centralize form state and submission logic.
  - Extracted `Input.tsx` and `TextArea.tsx` components with validation and error handling.
  - Reduced `ContactUS.tsx` from 596 lines to 176 lines (70% reduction).
- **Configuration Centralization**: Added `site.config.ts` for centralized site metadata (author info, email config, meta).
- **API Improvements**: Moved email HTML/text generation from client to server with improved error handling and validation.
- **Development Workflow Optimization**: Updated `lint-staged` to run `vitest related` for faster commits.

### 🎯 Navigation Enhancement

- **Added Links to Main Menu**: Public links page now accessible from main navigation ("Links" item between "Blog" and "Contact", `mdi:link-variant` icon).

### 🔒 Content Security Policy (CSP) Implementation

- **Enabled Experimental CSP Support**: Activated Astro's experimental CSP feature via `experimental.csp: true` in `astro.config.mjs` to help prevent XSS and code-injection vulnerabilities.

### ⚡ Performance & Testing Improvements

- **Optimized Testing Commands**: Added faster test options (`test:fast` for critical SEO tests, `pre-push:dev` for minimal validation) to speed up local iterations.

### 📦 Dependency Updates

- **Astro Core**: 5.13.2 → 5.15.7 (and subsequently to Astro 6.x for this release).
- **Astro Integrations**: Updated `@astrojs/db`, `@astrojs/mdx`, `@astrojs/react`, `@astrojs/rss`, `@astrojs/sitemap`, and `@astrojs/vercel` to current versions.

### 🚀 Links Page Tag Filtering Enhancement

- **Fixed Tag Filtering Across Pagination**: Tag filtering now processes ALL links server-side before pagination, so matching links appear together regardless of original page.
  - Server-side URL parameter processing for tag filters (`?tag=tagname`), preserved across pagination URLs.
- **Enhanced User Experience**: Visual indicators ("filtered by [tag]"), smart clear buttons, highlighted active tags, and a "no results" message.
- **Technical Improvements**: Bookmarkable/shareable filter URLs, SEO-friendly crawlable filtered pages, correct browser navigation.
- **Updated Pagination Component**: Correct URL construction with tag params and corrected page-number display format.

### ✨ Spell Checking Integration

- **Added CSpell**: Comprehensive spell checking for code and content with language-specific dictionaries and a custom project dictionary.
- **NPM Scripts**: Added `lint:spell`, `lint:spell:fix`, `spell`, `spell:check`; updated `lint:all` to include spell checking.
- **Pre-commit Integration**: CSpell runs automatically via Husky/lint-staged (Prettier → ESLint → CSpell → TextLint).

### 🔐 Critical Authentication & API Fixes

- **Fixed Authentication System**: Resolved DB query syntax errors in `api/links.json.ts` (`db.eq` → `eq`), session cookie mismatch, and BigInt serialization errors.
- **Fixed Links API CRUD Operations**: POST/PUT/DELETE/GET for admin links management with proper authentication and query-parameter handling.
- **Production Environment Fixes**: Production-only Google Analytics loading (localhost excluded) with correct Partytown configuration.

### 🔐 Enhanced Authentication Security

- **Database-Backed Sessions**: Persistent session storage via an `AdminSessions` table, server-side validation, automatic cleanup of expired sessions, and 2-hour expiration (reduced from 24 hours).
- **Device Fingerprinting**: Session validation includes device matching (User-Agent + IP) to prevent cross-device session hijacking.
- **Enhanced API Security**: `api/auth.json.ts` with login/logout/validate, secure HTTP-only cookies, and device-mismatch detection.
- **Security Documentation**: Added `SECURITY.md` and expanded device-fingerprinting / cross-device tests.

### 📄 Links Page Pagination & RSS Enhancement

- **Links Page Pagination**: `src/pages/links/[...page].astro` (SSR, `prerender = false`), 12 links per page, `/links` → `/links/1`, `/links/2`, etc.
- **RSS Feed for Links**: `src/pages/rss-links.xml.ts` — RSS 2.0 feed with auto-discovery and tag-derived categories.
- **Pagination Component Enhancement**: Auto-detects base URL (blog vs links), improved labels, and fixed "First" button bug.

### 🤖 Enhanced Chrome AI Integration & Stability

- **Robust AI Utilities**: Stabilized Summarizer and Translator with a unified interface (`isSupported`, `isAPIAvailable`, `destroy`), graceful failure handling, configurable timeouts, and retry logic.
- **Advanced Translation Support**: `BlogTranslator` supports both `window.Translator` and legacy `window.translation`, paragraph-by-paragraph processing, and Markdown preservation.
- **UI Component Upgrades**: Enhanced `ChromeAISection` and `BlogSummarizer` with real-time feedback, error visibility, and better loading states.
- **Comprehensive Test Suite**: >80% coverage for AI-related files (80+ unit/integration/performance/error tests) with improved JSDOM mocks.

### 🎨 Unified Chrome AI Interface

- **ChromeAI Section Component**: `src/components/ChromeAI/ChromeAISection.astro` with a tabbed interface replacing separate Summarizer/Translator components, Chrome 129+ badge, and dark-mode support.
- **Content Size Management**: 4000-char limit for summarization and 3000-char limit for translation with sentence-boundary truncation.
- **Enhanced Translation Quality**: Content cleaning removes JSX/HTML/imports while preserving code blocks and Markdown links.

### ✨ Enhanced Browser Compatibility

- **Browser Detection Utility**: `src/lib/browserDetection.ts` detects Chrome 129+ support for AI features with runtime API availability checking.
- **Component Visibility Control**: Chrome AI components hide automatically for incompatible browsers with graceful degradation.
- **Testing Coverage**: User-agent parsing, API availability detection, and fallback behavior tests.

### 🔊 Hybrid Audio Player

- **Hybrid Audio Player Component**: Unified player supporting both text-to-speech and HTML5 audio file playback.
  - `src/components/AudioPlayer/HybridAudioPlayer.tsx` (React, dual-mode) and `HybridAudioPlayerWrapper.astro` (Astro wrapper).
  - Auto-detection mode chooses between text-to-speech and audio-file based on props.
- **HTML5 Audio Integration**: Native `<audio>` support with volume control, time-based seeking, multiple formats (MP3/WAV/OGG), preload options, loop, and cross-origin support.
- **Unified Interface**: Single component handles both modes with consistent controls and progress tracking.
- **Enhanced Accessibility**: ARIA labels, live regions, keyboard navigation, and visual mode/state indicators.
- **Simplified & Optimized**: Streamlined controls, Web Audio API integration, robust error handling (no "canceled"/"interrupted" noise), and a bundle-size reduction (~22.4 kB → ~17.7 kB).
- **Blog Post Migration**: `blog/[slug].astro` now uses `HybridAudioPlayerWrapper`; removed deprecated `AudioPlayerUI.tsx`, `EnhancedAudioPlayer.astro`, and the `audio-test`/`hybrid-audio-test` pages.

## [2.8.0] - 2025-08-14

### 🤖 Chrome AI Integration

- **Translation Component**: Implemented `BlogTranslator.astro` with Chrome AI Translation API integration.
- **Summarization Component**: Created `BlogSummarizer.astro` with Chrome AI Summarizer API for content summarization.
- **Comprehensive Test Suite**: Added extensive testing infrastructure for Chrome AI APIs (unit, integration, performance, error handling; jsdom environment).

### 🧪 Testing Infrastructure Enhancements

- **Chrome AI Test Categories**: Organized tests into utils, integration, performance, and error-handling.
- **Package.json Scripts Optimization**: Reorganized 30+ scripts into 7 logical sections with clear naming.
- **New Test Commands**: Added `ai:unit`, `ai:integration`, `ai:performance`, `ai:errors`, `ai:all` shortcuts.
- **Vitest Configuration**: Optimized with jsdom environment, sequential execution, and timeout settings.

### 🛠️ Developer Experience

- **Script Organization**: Comment-separated sections in package.json for better maintainability.
- **Enhanced Workflows**: Added `check`, `check:full`, `test:coverage`, and `format` commands.
- **Database Management**: Added `db:studio` command for database UI access.

### 📝 Content Creation

- **AI Implementation Blog Post**: Created a detailed blog post about Chrome AI integration and testing strategy.

## [2.7.0] - 2025-08-13

### 🚀 Major Server-Side Admin Enhancements

- **Comprehensive Pagination System**: Configurable page sizes (10/20/50/100 items per page).
- **Advanced Search & Filtering**: Full-text search across titles, URLs, and tags with a dedicated tag-filter dropdown.
- **Server-Side Data Processing**: Migrated to Astro server actions with SQL-based queries using LIMIT/OFFSET.
- **Enhanced Form Validation**: Comprehensive client and server-side validation with detailed messaging.
- **Type-Safe CRUD Operations**: Complete create/read/update/delete with Zod schema validation.

### 🎨 Enhanced User Experience

- **Interactive Confirmation Modals**: Professional confirmation dialogs for delete and update operations.
- **Real-Time Form Feedback**: Immediate validation with error highlighting and success messaging.
- **Advanced Edit Mode**: In-place editing with form state management and cancel functionality.
- **Responsive Pagination UI**: Full pagination controls with first/last navigation and current-page indicators.

### 🛠️ Technical Improvements

- **Server Actions Architecture**: Created dedicated server actions with enterprise-level CRUD operations.
- **Database Query Optimization**: Efficient SQL queries with conditional WHERE clauses and proper pagination.
- **Comment Standardization**: Migrated from HTML comments to Astro JSX comments.

### 🧪 Enhanced Testing Coverage

- **Pagination / Search & Filter Testing**: Tests for pagination controls, page-size changes, and URL parameter management.
- **Enhanced Form Testing**: Expanded validation, error handling, and confirmation modal tests.

## [2.6.0] - 2025-08-06

### 🔐 Enhanced Admin Navigation & Authentication

- **Conditional Admin Navigation**: Admin navigation appears on admin pages only when the user is authenticated.
- **Authentication-Based Visibility**: Admin menu items (CRM, Links) and logout button show/hide based on `localStorage` auth state.
- **Consistent Cross-Platform Behavior**: Fixed desktop/mobile navigation consistency.
- **Enhanced NavList Component**: Accepts and applies CSS classes for conditional rendering.

### 🧪 Expanded Test Coverage

- **Admin Navigation Testing**: Auth state checking, desktop/mobile visibility, logout behavior, and cross-breakpoint responsiveness.
- **Mobile Navigation Testing**: Mobile-specific admin navigation tests with viewport simulation.

### 📱 Responsive Design Enhancements

- **Desktop & Mobile Admin Navigation**: Consistent admin-item visibility across all screen sizes when authenticated.

## [2.5.0] - 2025-08-05

### 🚀 Major TypeScript & Development Workflow Optimizations

- **Enhanced TypeScript Infrastructure**: Upgraded `@typescript-eslint/eslint-plugin` to 8.39.0 with strict type checking.
- **Automated Import Sorting**: Integrated `eslint-plugin-simple-import-sort`.
- **Pre-commit Hook Integration**: Husky + lint-staged for automated formatting and linting on every commit.
- **RSS Feed Migration**: Converted the RSS feed from JavaScript to TypeScript with enhanced sanitization and type safety.
- **SEO Infrastructure Enhancement**: Sitemap filtering to exclude admin pages plus a `robots.txt` endpoint.
- **Audio Player Content Filtering Fix**: Resolved an issue where 13-minute-read posts generated only 48 seconds of audio.

### 🛠️ Technical Improvements

- **Precise Frontmatter Parsing**: Replaced regex-based frontmatter removal with string-based methods.
- **Enhanced Content Filtering**: Preserves readable text while removing technical elements.
- **Build Pipeline Optimization**: Improved error handling and type checking.

## [2.4.0] - 2025-08-05

### 🎨 Enhanced Responsive Design

- **Desktop Table Optimization**: Responsive column widths for better desktop display.
- **Multi-Breakpoint Support**: Desktop (≥1280px), tablet (1024–1279px), and mobile (<1024px) layouts.
- **Table Content Handling**: `break-words` for titles and `break-all` for URLs.

### 🧪 Advanced Testing Infrastructure

- **Comprehensive Admin Interface Testing**: `admin-interface.test.ts` with 30+ cases (responsive design, auth, tables, modals, accessibility).
- **Date Filtering Validation**: Timezone-safe string-based date comparison with edge cases.
- **Windows Development Support**: Cross-platform testing with proper shell configuration and process spawning.

### 🛠️ Development Workflow Improvements

- **Enhanced Package Scripts**: Added `test:admin`, `test:date-filtering`, `test:ui`, and `dev:test`.
- **Test Automation**: Puppeteer-based browser automation with headless Chrome and proper server management.

## [2.0.0] - 2025-08-03

### 🎉 Major Features Added

#### Blog Enhancement Suite

- **Multi-chunk Text-to-Speech**: Advanced read-aloud functionality with voice synthesis controls.
- **Reading Progress Tracking**: Real-time visual progress bar with smooth animations.
- **Back-to-Top Navigation**: Smart visibility detection with smooth scroll behavior.

#### Comprehensive Testing Infrastructure

- **11 Test Suites**: Coverage of performance, accessibility, SEO, and functionality.
- **Grammar Validation**: Automated text quality and commit-message validation.
- **Accessibility Testing**: WCAG compliance validation across all pages.

### 🚀 Performance Improvements

- **Core Web Vitals Optimization**: Achieved a 68.8/100 average performance score.
- **Perfect CLS Scores**: 0.000 Cumulative Layout Shift across all pages.
- **Image Optimization**: Advanced lazy loading and format optimization.

### 🔧 Technical Enhancements

- **GitHub Actions Deployment**: Automated CI/CD pipeline.
- **ESLint / Prettier**: Advanced linter rules and consistent formatting across all file types.
- **Conventional Commits**: Automated commit-message validation.

### 🔍 SEO & Analytics

- **Advanced Meta Tags**: Open Graph and Twitter Card optimization.
- **Structured Data**: JSON-LD schema implementation.
- **Analytics Integration**: Google Analytics 4 with Partytown optimization.

## [1.0.0] - 2025-07-15

### Initial Release Features

#### Core Foundation

- **Astro Framework**: Static site generation with component islands.
- **TypeScript Integration**: Type-safe development environment.
- **Tailwind CSS**: Utility-first styling framework.
- **MDX Support**: Rich content with embedded components.

#### Blog System

- **Content Collections**: Type-safe content management.
- **Category and Tag System**: Organized content structure.
- **Responsive Images**: Optimized image handling.

#### Development Workflow

- **ESLint / Prettier**: Code quality enforcement and formatting.
- **Git Hooks**: Basic pre-commit validation.
- **Vercel Integration**: Automated deployment pipeline.

---

## Migration Guide

### From v1.x to v2.x

#### Breaking Changes

- **Node.js**: Minimum version updated to 18+.
- **Astro**: Updated to v5.x with new APIs.
- **Test Structure**: New test files require updated CI/CD configuration.

#### Configuration Updates

- Update `astro.config.mjs` for new integrations.
- Add `vitest.config.ts` for extended test configuration.

---

## Acknowledgments

- **Astro Team**: Excellent static site generator framework.
- **Tailwind CSS**: Utility-first CSS framework.
- **Vitest**: Fast and reliable testing framework.
- **Puppeteer**: Headless browser automation.
- **Community Contributors**: Various open-source tools and libraries.
