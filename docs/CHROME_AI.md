# Chrome AI Implementation Documentation

## Overview

This project integrates Chrome's experimental AI APIs (Translation and Summarizer) to enhance blog content accessibility and user experience. The implementation includes robust testing infrastructure, browser compatibility detection, and fallback strategies.

## Recent Fixes (January 2026)

The system has been refactored into a **Hybrid AI Architecture** to resolve critical stability issues with experimental Chrome APIs:

- **Hybrid Logic**: The system now attempts local processing (Chrome AI) first. If it fails (due to missing flags, unsupported pairs, or service errors), it automatically falls back to a server-side Gemini API.
- **Server-Side API**: A new endpoint `POST /api/ai/process` handles fallback requests using `gemini-1.5-flash`.
- **Database Caching**: Generated summaries and translations are cached in the `AICache` table (indexed by content hash) to minimize API usage and improve performance.
- **Rate Limiting**: The server-side API includes basic rate limiting to prevent quota abuse.

### Setup Requirements

1. **GEMINI_API_KEY**: You must provide a valid Gemini API key from [Google AI Studio](https://aistudio.google.com).
2. **Environment Variable**: Add `GEMINI_API_KEY=your_key_here` to your `.env` file (local) and production environment variables (Vercel/Vite).

## Architecture

### Hybrid Workflow

1. **Request**: User clicks "Summarize" or "Translate".
2. **Local Attempt**: `BlogSummarizer` or `BlogTranslator` tries to use browser-native APIs.
3. **Cloud Fallback**: If local fails, a `fetch` request is made to `/api/ai/process`.
4. **Cache Check**: Server checks if the result exists in Astro DB.
5. **AI Generation**: If not cached, Gemini 1.5 Flash generates the result.
6. **Store & Return**: Result is saved to the cache and returned to the UI.

### Components

#### `LanguageSelector.astro`

- **Purpose**: Unified dropdown for selecting target/output languages.
- **Supports**: English, Spanish, Japanese, Portuguese, French, German, Italian, Chinese, Korean, Russian, Arabic.

#### `ChromeAISection.astro`

- **Purpose**: Unified tabbed interface for both Translation and Summarization.
- **Features**:
  - Initialization guards to prevent multiple instances.
  - Clean Markdown extraction and truncation (4000 chars for summary, 3000 for translation) to respect API quotas.
  - Real-time progress bars and status text.

### API Integration

#### Translation Service (`src/utils/translator.ts`)

Handles language detection and MDX-aware translation (preserving Markdown structure using placeholders).

#### Summarization Service (`src/utils/summarizer.ts`)

Handles Markdown cleaning and multi-modal summarization (Teaser, Key Points, Headline).

## Testing Strategy

### Test Structure

- `test/utils/summarizer.test.ts`: Unit tests for summarization logic and config.
- `test/utils/translator.test.ts`: Unit tests for translation and availability checks.

### Test Commands

```bash
npm run ai:all # Run all Chrome AI related tests
```

## Implementation Guidelines

### Performance

- **Content Truncation**: Articles are truncated at sentence boundaries before processing to stay within the ~4000 character limit of Gemini Nano.
- **Lazy Loading**: Service classes are imported dynamically only when the user clicks a generation button.

### Accessibility

- **Semantic HTML**: Uses `<progress>`, `<select>`, and `aria-selected` for tab navigation.
- **User Feedback**: Errors are caught and displayed in user-friendly alert boxes rather than just console logs.
