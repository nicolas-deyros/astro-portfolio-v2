# Specification: Hybrid AI Implementation (Chrome AI + Gemini Fallback)

## 1. Overview

The current client-side-only AI implementation using experimental Chrome APIs is unstable. This track refactors the system into a **Hybrid Architecture**. The application will attempt to use on-device Chrome AI first for privacy and speed. If it fails (due to browser version, flags, or service errors), it will transparently fall back to a server-side implementation powered by the **Google Gemini API**.

## 2. Goals

- Ensure 100% reliability for Summarization and Translation.
- Implement server-side fallback using Gemini API (`gemini-1.5-flash`).
- Cache AI results in the database to reduce API costs and improve speed.
- Maintain a seamless UI experience during fallback.
- **Cost Control:** Implement Rate Limiting and Caching to stay within free/low-cost tiers.

## 3. Functional Requirements

### 3.1 Hybrid Service Layer

- **Client-Side First:** `BlogSummarizer` and `BlogTranslator` will attempt to use `window.ai` or `window.Summarizer`.
- **Automatic Fallback:** If a `NotAllowedError`, `timeout`, or "not supported" error occurs, the service will call a new internal Astro API endpoint (`/api/ai/process`).
- **Unified Interface:** The UI should call a single method that manages the fallback logic internally.

### 3.2 Server-Side Processing (Astro API)

- **Endpoint:** `POST /api/ai/process`
- **Logic:**
  - Authenticate using `GEMINI_API_KEY` from environment variables.
  - Interface with `@google/generative-ai` SDK.
  - Support both `summarize` and `translate` actions.
- **Caching:**
  - Before calling Gemini, check if a summary/translation for the specific content and language already exists in the `AICache` table.
  - If found, return cached result.
  - If not found, call Gemini and save the result to the database.
- **Security & Cost Control:**
  - **Rate Limiting:** Implement a simple rate limiter (e.g., max 10 requests per IP per hour) to prevent abuse.
  - **Model:** Use `gemini-1.5-flash` (Cost-effective and fast).

### 3.3 Database Schema (Astro DB)

- **Table:** `AICache` (New Table - Non-destructive add)
  - `id` (Primary Key)
  - `hash` (Content hash to identify unique text)
  - `type` ('summary' or 'translation')
  - `targetLanguage` (e.g., 'es', 'ja')
  - `options` (JSON string for length, type, etc.)
  - `result` (The generated text)
  - `createdAt` (Timestamp)

### 3.4 UI/UX

- **Transparent Fallback:** Show "Attempting local processing..." followed by "Using Cloud AI..." if the fallback is triggered.
- **Language Support:** Both local and cloud paths must respect the selected target language.

## 4. Technical Constraints

- Requires `GEMINI_API_KEY` in `.env`.
- Use `crypto.subtle` for generating content hashes for cache keys.
- **Database Migration:** strictly ADD `AICache` table. Do not modify `Links` or `FormSubmissions`.

## 5. Acceptance Criteria

- [ ] **Reliability:** Summarization and Translation work even if Chrome AI flags are disabled.
- [ ] **Performance:** Cached results return in < 100ms.
- [ ] **Consistency:** The output language selector works for both local and fallback paths.
- [ ] **Security:** API keys are never exposed to the client.
- [ ] **Cost Safety:** Rate limiting prevents abuse.
