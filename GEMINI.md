# Gemini Project Context

## 🚀 Project Overview

**Nicolás Deyros Portfolio** is a modern, high-performance portfolio site built with **Astro**. It features a hybrid rendering model (Server-Side Rendering + Static Generation), comprehensive testing strategies, SEO optimization, and an enterprise-level admin panel.

The project emphasizes performance (Lighthouse 90+), accessibility, and developer experience, utilizing **Astro Islands** architecture for optimal client-side hydration.

## 🛠️ Technology Stack

- **Framework:** [Astro 5.x](https://astro.build)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS 4.x](https://tailwindcss.com/)
- **UI Libraries:** [React 19](https://react.dev/) (for complex interactive islands)
- **Database:** [Astro DB](https://docs.astro.build/en/guides/astro-db/) (SQLite based)
- **Content:** MDX (Markdown + JSX) with Content Collections
- **Testing:** Vitest (Unit/Integration), Puppeteer/Playwright (end-to-end), Lighthouse (Performance)
- **AI Integration:** Chrome AI APIs (Translation, Summarization)
- **Deployment:** Vercel

## 🏗️ Architecture

### Core Patterns

- **Islands Architecture:** Interactive UI components (mostly React) are isolated "islands" within static HTML, hydrated only when needed (`client:load`, `client:visible`).
- **Hybrid Rendering:** Configured with `output: 'server'` (via Vercel adapter) allowing a mix of static pages and dynamic server-rendered routes (e.g., Admin panel).
- **Atomic Design:** Components are organized by complexity (e.g., `src/components/Form/Input.tsx` vs `src/components/Header/Header.astro`).
- **Content-Driven:** Uses Astro Content Collections (`src/content/`) with Zod schema validation for type-safe content management.

### Key Directories

- `src/pages/`: File-based routing (static pages, dynamic routes `[slug]`, API endpoints).
- `src/components/`: Reusable UI components (Astro & React).
- `src/content/`: MDX blog posts and configuration (`config.ts`).
- `src/layouts/`: Page wrappers (e.g., `index.astro`).
- `src/lib/` & `src/utils/`: Shared helper functions and logic.
- `db/`: Database schema (`config.ts`) and seed data (`seed.ts`).
- `test/`: Comprehensive test suites (Unit, end-to-end, Performance, Integration).
- `docs/`: Detailed project documentation (`ARCHITECTURE.md`, `DEVELOPMENT.md`, etc.).

## ⚡ Key Commands

### Development

- `npm run dev`: Start local development server (http://localhost:4321).
- `npm run build`: Build for production.
- `npm run preview`: Preview the production build locally.
- `npm run db:seed`: Seed the local SQLite database.
- `npm run db:studio`: Open Astro DB Studio interface.

### Testing

- `npm test`: Run all tests (Vitest).
- `npm run test:watch`: Run tests in watch mode.
- `npm run test:unit`: Run unit tests.
- `npm run test:integration`: Run integration tests.
- `npm run test:performance`: Run performance tests.
- `npm run test:admin`: Run admin interface specific tests.
- `npm run ai:all`: Run all Chrome AI related tests.

### Code Quality

- `npm run lint`: Run ESLint.
- `npm run format`: Format code with Prettier.
- `npm run check`: Run critical checks (Lint + Critical Tests).
- `npm run check:full`: Run full suite (Lint + All Tests).
- `npm run spell`: Check spelling (CSpell).

## 📝 Development Conventions

- **Type Safety:** Strict TypeScript is enforced. All new code must be typed.
- **Styling:** Use Tailwind CSS utility classes. For component-specific styles, use scoped `<style>` blocks in Astro files or CSS Modules.
- **Testing:** New features must include tests.
  - **Unit:** For utility functions and logic.
  - **Integration:** For checking component interactions and API endpoints.
  - **End-to-end:** For critical user flows.
- **Commits:** Follow conventional commits (checked by `commitlint`).
- **Linting:** Pre-commit hooks (`lint-staged`) automatically lint and format changes. Pre-push hooks run critical tests.
- **Documentation:** Maintain documentation in `docs/` for significant architectural changes.
