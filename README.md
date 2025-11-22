# 🚀 Nicolás Deyros Portfolio

A modern, high-performance portfolio built with Astro, featuring comprehensive testing, SEO optimization, and enterprise-level admin functionality.

[![Built with Astro](https://astro.badg.es/v2/built-with-astro/small.svg)](https://astro.build)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?Style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Performance](https://img.shields.io/badge/Lighthouse-91%2F100-green)](https://developers.google.com/web/tools/lighthouse)

## ✨ Overview

This portfolio showcases modern web development practices with a focus on performance, accessibility, and developer experience. Built with Astro's Islands Architecture for optimal performance and enhanced with comprehensive testing and enterprise-level features.

## 🎯 Key Features

- **🌙 Smart Theme System** - Automatic dark/light mode with system preference detection
- **📝 Advanced Blog System** - MDX support with audio integration and Chrome AI features
- **🔗 Smart Links Management** - Server-side tag filtering with bookmarkable URLs
- **🔐 Enterprise Admin Panel** - Secure authentication with session management
- **🚀 Performance Optimized** - 91.3/100 Lighthouse score with Core Web Vitals optimization
- **🧪 Comprehensive Testing** - Automated performance, SEO, and accessibility testing

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/nicolas-deyros/astro-portfolio-v2.git
cd astro-portfolio-v2

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run test suite
npm run lint         # Run all linters
npm run format       # Format code with Prettier
```

## 🛠️ Tech Stack

**Core**: Astro, TypeScript, Tailwind CSS  
**Database**: Astro DB (SQLite)  
**Testing**: Vitest, Puppeteer, Playwright  
**AI**: Chrome AI APIs (Translation, Summarization)  
**Deployment**: Vercel

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) directory:

- **[Features Guide](./docs/FEATURES.md)** - Detailed feature documentation
- **[Admin System](./docs/ADMIN.md)** - Admin panel and authentication
- **[Chrome AI Integration](./docs/CHROME_AI.md)** - AI features implementation
- **[Testing Guide](./docs/TESTING.md)** - Testing philosophy and setup
- **[Performance](./docs/PERFORMANCE_TESTING.md)** - Performance optimization
- **[Security](./SECURITY.md)** - Security measures and best practices

## 🏗️ Component Architecture

### Form Components

The contact form has been refactored into reusable, maintainable components following DRY principles:

**Custom Hooks:**

- `useContactForm` - Centralizes form state, validation, and submission logic using Formik
  - Manages submit status (idle, submitting, success, error)
  - Handles form validation with Yup schema
  - Provides clean API for form integration

**Reusable Components:**

- `Input.tsx` - Standardized input field with validation and error animations
- `TextArea.tsx` - Standardized textarea with validation and error animations
- Both components feature:
  - Consistent error handling and display
  - Smooth animations for validation feedback
  - Accessibility-first design
  - TypeScript type safety

**Benefits:**

- 70% reduction in ContactUS.tsx code (596 → 176 lines)
- Improved maintainability and testability
- Consistent UX across all form fields
- Easy to extend with new form fields

### Configuration

**Centralized Site Config:**

- `site.config.ts` - Single source of truth for site metadata
  - Author information
  - Email configuration
  - Meta tags and SEO data

**Security Middleware:**

- Standard HTTP security headers
- X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- Referrer-Policy for privacy

## 🏗️ Project Structure

```
src/
├── components/      # Reusable UI components
│   └── Form/        # Form components (Input, TextArea, ContactUS)
├── config/          # Centralized configuration
├── content/         # Blog posts and data collections
├── hooks/           # Custom React hooks (useContactForm)
├── layouts/         # Page layouts
├── middleware.ts    # Security middleware
├── pages/           # Route pages and API endpoints
└── styles/          # Global styles and utilities

docs/               # Comprehensive documentation (see docs/README.md)
test/               # Test suites and utilities
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
