# 🚀 Nicolás Deyros Portfolio

A modern, high-performance portfolio built with Astro, featuring comprehensive testing, SEO optimization, and enterprise-level admin functionality.

[![Built with Astro](https://astro.badg.es/v2/built-with-astro/small.svg)](https://astro.build)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](#### **🎵 Hybrid Audio Player**

- **Dual-Mode System**: Supports both text-to-speech and HTML5 audio file playback
- **Auto-Detection**: Automatically chooses between modes based on content type
- **Web Audio API Integration**: Advanced audio processing with Speech Synthesis API
- **HTML5 Audio Support**: Native audio file playback (MP3, WAV, OGG) with full controls
- **Smart Content Filtering**: Automatically excludes code blocks, images, and non-content elements
- **Progress Tracking**: Real-time playback position with seek functionality for both modes
- **Playback Controls**: Play, pause, stop with visual feedback and progress bar
- **Volume Control**: Real-time volume adjustment for audio files
- **Error Handling**: Robust error management with graceful fallbacks
- **Performance Optimized**: Chunked text processing for long articles
- **Cross-browser Compatibility**: Works across Chrome, Firefox, Safari, and Edgemg.shields.io/badge/Tailwind_CSS-38B2AC?Style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Performance](https://img.shields.io/badge/Lighthouse-91%2F100-green)](https://developers.google.com/web/tools/lighthouse)

## ✨ Key Features

### 🎨 **Modern User Experience**

- **🌙 Smart Theme System**: Automatic dark/light mode with system preference detection
- **📱 Responsive Design**: Optimized for all devices with smooth animations
- **♿ Accessibility**: WCAG compliant with proper ARIA support

### 📝 **Advanced Blog System**

- **📄 MDX Support**: Rich content with embedded interactive components
- **🎵 Audio Integration**: Read-aloud functionality with Hybrid Audio Player (Web Audio API + HTML5 Audio)
- **📊 Reading Progress**: Visual progress tracking for articles
- **🏷️ Smart Tagging**: Organized content with categories and filtering
- **🤖 Chrome AI Integration**: Real-time translation and content summarization
  - **🌐 Translation**: Multi-language support with Chrome AI Translation API
  - **📝 Summarization**: Automatic content summaries using Chrome AI Summarizer
  - **⚡ Progressive Enhancement**: Works gracefully without AI support
  - **🧪 Comprehensive Testing**: Full test suite for AI functionality

### 🔐 **Enterprise Admin System**

- **� Advanced Pagination**: Configurable page sizes with SQL-optimized queries
- **� Powerful Search**: Full-text search across content with tag filtering
- **🛡️ Server-Side Validation**: Type-safe CRUD operations with Zod schemas
- **🎯 Real-Time Feedback**: Interactive forms with immediate validation
- **� Secure Authentication**: Token-based auth with session management

### 🚀 **Performance & SEO**

- **⚡ Core Web Vitals**: 91.3/100 Lighthouse score with optimized LCP/FID/CLS
- **🔍 SEO Optimized**: Complete meta tags, structured data, and sitemaps
- **🖼️ Image Optimization**: Lazy loading with responsive image processing

### 🧪 **Comprehensive Testing**

- **🎯 Performance Testing**: Automated Core Web Vitals monitoring
- **🔍 SEO Validation**: Complete meta tags and content quality checks
- **♿ Accessibility Testing**: WCAG compliance and keyboard navigation
- **🔗 Link Validation**: Automated broken link detection

## 🔧 Admin Features

Access the admin panel at `/admin` with enterprise-level functionality:

- **📊 Data Management**: Paginated tables with 10/20/50/100 items per page
- **🔍 Advanced Search**: Real-time filtering by title, URL, tags
- **✏️ In-Place Editing**: Seamless edit mode with form validation
- **🗑️ Safe Operations**: Confirmation modals for destructive actions
- **📈 Performance**: Server-side SQL queries with LIMIT/OFFSET optimization

## 🧪 Testing Philosophy

Comprehensive testing ensures reliability and performance:

- **Performance**: Automated Lighthouse scoring with 91.3/100 target
- **SEO**: Meta tag validation and content quality scoring
- **Accessibility**: WCAG compliance with keyboard navigation testing
- **Functionality**: Complete admin interface and user journey testing

## 🛠️ Tech Stack

### **Core Framework**

- **Framework**: [Astro](https://astro.build/) - Static site generator with component islands
- **Language**: [TypeScript](https://www.typescriptlang.org/) - Type-safe development
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

### **Content & Media**

- **Content**: [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/) - Type-safe content management
- **Typography**: [Tailwind Typography](https://tailwindcss.com/docs/typography-plugin) - Beautiful prose styling
- **Icons**: [Iconify](https://iconify.design/) - Comprehensive icon library
- **Images**: [Astro Assets](https://docs.astro.build/en/guides/assets/) - Optimized image handling

### **AI & Enhanced Features**

- **Chrome AI Integration**: [Chrome AI APIs](https://developer.chrome.com/docs/ai/) - Translation and summarization
- **Translation**: Real-time content translation with language detection
- **Summarization**: Automatic content summarization with configurable length
- **Progressive Enhancement**: Graceful fallbacks for unsupported browsers
- **Testing Infrastructure**: Comprehensive test suite with jsdom + Puppeteer

### **Testing & Quality Assurance**

- **Testing Framework**: [Vitest](https://vitest.dev/) - Fast unit and integration testing
- **Browser Automation**: [Puppeteer](https://pptr.dev/) - Headless Chrome for performance testing
- **AI Testing**: Comprehensive Chrome AI test suite (unit, integration, performance, error handling)
- **Environment Simulation**: jsdom for browser API mocking and testing
- **Performance Testing**: Custom Core Web Vitals monitoring
- **Content Analysis**: [Gray Matter](https://github.com/jonschlinkert/gray-matter) - Frontmatter parsing
- **Code Quality**: [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/)

### **Development Workflow**

- **Git Hooks**: [Husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/lint-staged/lint-staged) - Automated pre-commit formatting and linting
- **Code Quality**: [ESLint](https://eslint.org/) with @typescript-eslint + [Prettier](https://prettier.io/) - Enhanced code standards
- **Import Organization**: [eslint-plugin-simple-import-sort](https://github.com/lydell/eslint-plugin-simple-import-sort) - Consistent import sorting
- **Commit Standards**: [Commitlint](https://commitlint.js.org/) - Conventional commit message validation
- **Package Manager**: npm with lockfile integrity
- **Development**: Hot reload with Astro dev server
- **Deployment**: [Vercel](https://vercel.com/) / [Netlify](https://netlify.com/) ready

## 📂 Project Structure

```
├── public/
│   ├── .well-known/
│   │   └── appspecific/
│   │       └── com.chrome.devtools.json  # Chrome DevTools config
│   ├── images/                           # Static images
│   └── favicon.svg                       # Site favicon
├── src/
│   ├── actions/
│   │   └── index.ts                      # Server actions
│   ├── assets/
│   │   ├── blog/                         # Blog post images
│   │   ├── astro.svg
│   │   ├── background.svg
│   │   ├── logo.svg                      # Profile image
│   ├── components/
│   │   ├── Form/
│   │   │   └── ContactUS.tsx             # Contact form component
│   │   ├── Header/
│   │   │   ├── Header.astro              # Main navigation
│   │   │   └── HeaderMenu.astro          # Mobile menu
│   │   ├── Home/
│   │   │   ├── TopLinks.astro            # Social links
│   │   │   └── TopPosts.astro            # Featured posts
│   │   ├── Link/
│   │   │   ├── Link.astro                # Link component
│   │   │   └── NavLink.astro             # Navigation link
│   │   ├── List/
│   │   │   ├── List.astro                # List component
│   │   │   └── NavList.astro             # Navigation list
│   │   ├── Translation/
│   │   │   ├── BlogTranslator.astro      # Chrome AI translation
│   │   │   └── BlogSummarizer.astro      # Chrome AI summarization
│   │   ├── Footer.astro                  # Site footer
│   │   ├── Head.astro                    # SEO head component
│   │   ├── Pagination.astro              # Blog pagination
│   │   └── Section.astro                 # Layout wrapper
│   ├── content/
│   │   ├── config.ts                     # Content collections config
│   │   ├── links.json                    # External links data
│   │   └── blog/                         # Blog posts (MDX)
│   │       ├── ai-debate-arena-google-ai-studio.mdx
│   │       ├── programmatic-advertising-guide.mdx
│   │       ├── relative-mobile-conversion-rate-dashboard.mdx
│   │       └── vibe-coding-productivity.mdx
│   ├── data/
│   │   └── navData.ts                    # Navigation configuration
│   ├── layouts/
│   │   └── index.astro                   # Main layout template
│   ├── lib/
│   │   └── utils.ts                      # Utility functions
│   ├── pages/
│   │   ├── api/
│   │   │   └── sendEmail.json.ts         # Contact form API
│   │   ├── blog/
│   │   │   ├── [...page].astro           # Blog pagination
│   │   │   ├── [slug].astro              # Blog post template
│   │   │   └── tags/
│   │   │       ├── [tag].astro           # Tag pages
│   │   │       └── index.astro           # All tags
│   │   ├── 404.astro                     # 404 error page
│   │   ├── contact.astro                 # Contact page
│   │   ├── index.astro                   # Homepage
│   │   └── links.astro                   # Links page
│   ├── schemas/
│   │   └── index.tsx                     # Type definitions
│   └── styles/
│       └── global.css                    # Global styles
├── test/                                 # Test suites
│   ├── admin-interface.test.ts           # Admin interface responsive design tests
│   ├── date-filtering.test.ts            # Date filtering and timezone tests
│   ├── links.test.ts                     # Link validation tests
│   ├── mdx.test.ts                       # MDX content tests
│   ├── performance.test.ts               # Performance testing
│   ├── performance-clean.test.ts         # Clean performance tests
│   └── seo.test.ts                       # SEO validation tests
├── db/                                   # Database configuration
│   ├── config.ts                         # Database setup
│   └── seed.ts                           # Database seeding
├── .husky/                               # Git hooks
├── astro.config.mjs                      # Astro configuration
├── eslint.config.js                      # ESLint rules
├── commitlint.config.js                  # Commit message rules
├── vitest.config.ts                      # Test configuration
├── tsconfig.json                         # TypeScript configuration
└── package.json                          # Dependencies & scripts
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or Yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/nicolas-deyros/portfolio.git
   cd portfolio
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Install Git hooks**

   ```bash
   npx husky install
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:4321
   ```

## 📜 Available Scripts

| Command                       | Description                                    |
| ----------------------------- | ---------------------------------------------- |
| `npm run dev`                 | Start development server at `localhost:4321`   |
| `npm run build`               | Build production site to `./dist/`             |
| `npm run preview`             | Preview production build locally               |
| `npm run lint`                | Run ESLint for code quality                    |
| `npm run lint:fix`            | Fix ESLint issues automatically                |
| `npm run lint:text`           | Run textlint for grammar and writing quality   |
| `npm run lint:text:fix`       | Fix textlint issues automatically              |
| `npm run format`              | Format code with Prettier                      |
| `npm run type-check`          | Run TypeScript type checking                   |
| `npm run test`                | Run all test suites                            |
| `npm run test:fast`           | Run fast test suite with optimized settings    |
| `npm run test:clean`          | Run performance tests with clean setup         |
| `npm run test:performance`    | Run Core Web Vitals performance tests          |
| `npm run test:back-to-top`    | Run back-to-top button functionality tests     |
| `npm run test:grammar`        | Run grammar and writing quality tests          |
| `npm run test:admin`          | Run admin interface and responsive tests       |
| `npm run test:date-filtering` | Run date filtering and timezone tests          |
| `npm run test:ui`             | Run combined UI tests (admin + date filtering) |
| `npm run test:watch`          | Run tests in watch mode                        |
| `npm run check:grammar`       | Check text quality and grammar                 |
| `npm run check:commit`        | Validate commit message format                 |
| `npm run check:all`           | Run all quality checks (lint, text, tests)     |
| `npm run astro ...`           | Run Astro CLI commands                         |

## 🧪 Testing Infrastructure

### **Comprehensive Test Suites**

This project includes extensive testing to ensure quality, performance, and SEO optimization:

#### **🔍 SEO Testing** (`test/seo.test.ts`)

- **Meta Tags Validation**: Ensures proper title, description, and social media tags
- **Content Quality**: Checks heading hierarchy, keyword distribution, and readability
- **WCAG Compliance**: Validates alt text, ARIA labels, and accessibility standards
- **Structured Data**: Verifies schema markup and meta information

#### **🚀 Performance Testing** (`test/performance.test.ts`)

- **Core Web Vitals**: Automated LCP, FID, and CLS measurements
- **Multi-page Testing**: Tests homepage, blog pages, and static pages
- **Performance Thresholds**: Ensures scores meet production standards
- **Automated Server Management**: Spins up dev server for CI/CD compatibility

#### **🔗 Link Validation** (`test/links.test.ts`)

- **Internal Links**: Validates all internal navigation and content links
- **External Links**: Checks external URLs for availability
- **Social Media**: Verifies social media profile links
- **Blog Content**: Tests all blog post internal and external references

#### **📝 Content Testing** (`test/mdx.test.ts`)

- **MDX Validation**: Ensures all blog posts have proper frontmatter structure
- **Content Structure**: Validates required fields and data types across all posts
- **Draft Detection**: Handles draft posts appropriately in build process
- **Schema Compliance**: Enforces consistent metadata structure

#### **⬆️ UI Component Testing** (`test/back-to-top*.test.ts`)

- **Multi-suite Testing**: Three comprehensive test files for different scenarios
- **Functionality Testing**: Validates button appearance, scroll behavior, and click actions
- **Cross-page Testing**: Ensures consistent behavior across blog listing and individual posts
- **Performance Testing**: Optimized test execution with isolated server instances

#### **🔤 Grammar & Writing Quality** (`test/grammar-checker.test.ts`)

- **Automated Grammar Checking**: Validates commit messages and content writing
- **Conventional Commits**: Enforces proper commit message format
- **Text Quality**: Checks for common writing issues and improvements
- **Integration Testing**: Works with textlint for comprehensive text analysis

#### **🖥️ Admin Interface Testing** (`test/admin-interface.test.ts`)

- **Authentication & Access**: Login form validation and page loading tests
- **Admin Navigation**: Conditional visibility testing for authenticated admin menu items
- **Authentication State**: LocalStorage-based auth validation and navigation behavior
- **Cross-Platform Navigation**: Desktop and mobile admin menu consistency testing
- **Logout Functionality**: Proper cleanup and redirect testing on logout
- **Responsive Design**: Desktop (≥1280px), tablet (1024-1279px), and mobile (<1024px) layouts
- **Table Functionality**: Sorting, column widths, status badges, and data display
- **Form Validation**: Add link form, required fields, and input styling
- **Modal Functionality**: Session expiry modals and edit dialog behavior
- **Accessibility**: ARIA labels, focus management, and contrast validation
- **Performance**: Load times, hover effects, and content handling optimization

#### **📅 Date Filtering & Timezone** (`test/date-filtering.test.ts`)

- **API Validation**: Links endpoint testing and date format verification
- **Timezone Fix Testing**: String-based date comparison to prevent UTC conversion issues
- **Content Filtering**: Ensures scheduled content doesn't appear prematurely
- **Edge Cases**: Date parsing consistency and timezone-independent comparisons
- **Homepage Integration**: Validates TopLinks component filtering behavior
- **Cross-component Testing**: Ensures consistent date handling across the application

### **Performance Benchmarks**

Current performance metrics (tested automatically):

```
📊 PERFORMANCE SUMMARY
Average Performance Score: 91.3/100
Average LCP: 1.24s ✅
Average CLS: 0.000 ✅
All Core Web Vitals: PASSING ✅
```

**Page-by-page breakdown:**

- Homepage: 75/100 (2.05s LCP)
- Blog listing: 90/100 (1.20s LCP)
- Blog posts: 90/100 (1.15-1.54s LCP)
- Contact page: 90/100 (1.11s LCP)
- Links page: 100/100 (0.73s LCP) ⭐

### **Running Tests**

```bash
# Run all tests
npm run test

# Run specific test suite
npm run test:performance     # Core Web Vitals testing
npm run test:back-to-top     # UI component functionality
npm run test:grammar         # Grammar and writing quality
npm run test:fast            # Optimized fast test execution
npm run test:clean           # Clean performance testing setup

# Run tests in watch mode
npm run test:watch

# Run comprehensive quality checks
npm run check:all            # Lint, text quality, and all tests
npm run check:grammar        # Text and grammar validation only

# Run tests with coverage
npm run test -- --coverage
```

## 📝 Content Management

### **Blog Post Structure**

Create new blog posts in `src/content/blog/` with the following frontmatter structure:

```mdx
---
title: 'Your Post Title'
slug: 'your-post-slug'
date: 'YYYY-MM-DD'
author: 'Author Name'
description: 'SEO-optimized description (max 160 characters)'
draft: false
category: 'Category Name'
tags: ['tag1', 'tag2', 'tag3']
image:
  src: '/path/to/image.jpg'
  alt: 'Descriptive alt text'
---

import { Image } from 'astro:assets'
import MyImage from '../../assets/blog/my-image.jpg'

# Your Content Here

<Image src={MyImage} alt="Description" class="rounded-lg shadow-lg" />

Your markdown content with MDX components...
```

### **Content Fields Reference**

| Field         | Type    | Required | Description                               |
| ------------- | ------- | -------- | ----------------------------------------- |
| `title`       | string  | ✅       | Post title (max 60 chars for SEO)         |
| `slug`        | string  | ✅       | URL-friendly identifier                   |
| `date`        | string  | ✅       | Publication date (YYYY-MM-DD)             |
| `author`      | string  | ✅       | Author name                               |
| `description` | string  | ✅       | Meta description (max 160 chars)          |
| `category`    | string  | ✅       | Content category                          |
| `tags`        | array   | ❌       | Array of tag strings                      |
| `image.src`   | string  | ❌       | Featured image path                       |
| `image.alt`   | string  | ❌       | Image alt text (required if src provided) |
| `draft`       | boolean | ❌       | Hide from production (default: false)     |

### **Content Features**

#### **📸 Image Handling**

- **Astro Assets**: Optimized image processing with `astro:assets`
- **Responsive Images**: Automatic srcset generation
- **Lazy Loading**: Built-in lazy loading for performance
- **Format Optimization**: WebP conversion where supported

#### **� Enhanced Audio Player**

- **Advanced Audio Engine**: Web Audio API integration with Speech Synthesis API for enhanced processing
- **Smart Content Filtering**: Automatically excludes code blocks, images, and non-content elements
- **Progress Tracking**: Real-time playback position with seek functionality
- **Playback Controls**: Play, pause, stop with visual feedback and progress bar
- **Error Handling**: Robust error management with graceful fallbacks
- **Performance Optimized**: Chunked text processing for long articles
- **Cross-browser Compatibility**: Works across Chrome, Firefox, Safari, and Edge

#### **⬆️ Back-to-Top Button**

- **Smart Visibility**: Appears only when user scrolls down significantly
- **Smooth Animation**: CSS transitions for appearance and scroll behavior
- **Cross-page Functionality**: Works consistently across all blog pages
- **Performance Optimized**: Throttled scroll event handling for smooth UX

#### **📊 Reading Progress**

- **Visual Progress Bar**: Shows reading completion percentage
- **Smooth Animation**: CSS transitions for progress updates
- **Responsive Design**: Works across all device sizes

#### **🔗 Social Sharing**

- **Open Graph**: Automatic meta tags for social media
- **Twitter Cards**: Optimized Twitter sharing
- **LinkedIn Integration**: Professional network sharing

### **Adding Media Content**

#### **YouTube Videos**

```mdx
<div class="relative mb-8 aspect-video w-full overflow-hidden rounded-lg shadow-lg">
	<iframe
		src="https://www.youtube.com/embed/VIDEO_ID?rel=0&modestbranding=1"
		class="absolute inset-0 h-full w-full"
		frameborder="0"
		allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
		allowfullscreen
		loading="lazy"
		title="Video Title"></iframe>
</div>
```

#### **Vimeo Videos**

```mdx
<div class="relative mb-8 aspect-video w-full overflow-hidden rounded-lg shadow-lg">
	<iframe
		src="https://player.vimeo.com/video/VIDEO_ID?badge=0&autopause=0"
		class="absolute inset-0 h-full w-full"
		frameborder="0"
		allow="autoplay; fullscreen; picture-in-picture"
		allowfullscreen
		loading="lazy"
		title="Video Title"
	/>
</div>
```

## 🎨 Customization & Theming

### **Dark Mode Implementation**

The site uses Tailwind's class-based dark mode with system preference detection:

```html
<!-- Automatic theme switching -->
<div class="bg-white text-black dark:bg-gray-900 dark:text-white">
	Content adapts to user preference
</div>
```

**Theme Toggle Features:**

- System preference detection on first visit
- LocalStorage persistence
- Smooth transitions between themes
- Icon animations for theme switcher

#### **Global Styles**

Custom CSS in `src/styles/global.css`:

```css
/* View transitions for smooth navigation */
@view-transition {
	navigation: auto;
}

/* Custom scrollbar styling */
::-webkit-scrollbar {
	width: 8px;
}

/* Reading progress bar */
.reading-progress {
	position: fixed;
	top: 0;
	left: 0;
	width: 0%;
	height: 3px;
	background: linear-gradient(90deg, #3b82f6, #8b5cf6);
	transition: width 0.3s ease;
	z-index: 1000;
}
```

### **Component Architecture**

#### **Astro Components**

- **Server-side rendering** by default
- **Client-side hydration** only when needed
- **TypeScript support** throughout

#### **Interactive Components**

```astro
---
// Component script (server-side)
export interface Props {
	title: string
	description?: string
}

const { title, description } = Astro.props
---

<!-- Component template -->
<div class="component-wrapper">
	<h2>{title}</h2>
	{description && <p>{description}</p>}
</div>

<!-- Client-side JavaScript (when needed) -->
<script>
	// Interactive behavior
	document.addEventListener('DOMContentLoaded', () => {
		// Component initialization
	})
</script>
```

## 🔧 Advanced Configuration

### **Astro Configuration** (`astro.config.mjs`)

```js
import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
	site: 'https://your-domain.com',
	integrations: [
		tailwind({
			applyBaseStyles: false, // Use custom global styles
		}),
		mdx({
			syntaxHighlight: 'shiki',
			shikiConfig: {
				theme: 'github-dark-dimmed',
			},
		}),
		sitemap(),
	],
	markdown: {
		remarkPlugins: [],
		rehypePlugins: [],
	},
	vite: {
		optimizeDeps: {
			include: ['@astrojs/markdown-remark'],
		},
	},
})
```

### **TypeScript Configuration** (`tsconfig.json`)

```json
{
	"extends": "astro/tsconfigs/strict",
	"compilerOptions": {
		"baseUrl": ".",
		"paths": {
			"@/*": ["src/*"],
			"@/components/*": ["src/components/*"],
			"@/layouts/*": ["src/layouts/*"],
			"@/assets/*": ["src/assets/*"]
		}
	}
}
```

### **Testing Configuration** (`vitest.config.ts`)

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		environment: 'node',
		globals: true,
		setupFiles: ['./test/setup.ts'],
		include: ['test/**/*.test.ts'],
		coverage: {
			reporter: ['text', 'html', 'lcov'],
			exclude: ['node_modules/', 'dist/', '.astro/'],
		},
	},
})
```

## 🚀 Performance Optimization

### **Core Web Vitals Optimization**

#### **Largest Contentful Paint (LCP)**

- **Image optimization**: WebP format, lazy loading, responsive images
- **Font loading**: Preload critical fonts, font-display: swap
- **Critical CSS**: Inline above-the-fold styles
- **Resource hints**: Preload, prefetch for critical resources

#### **First Input Delay (FID)**

- **Minimal JavaScript**: Only essential client-side code
- **Code splitting**: Dynamic imports for non-critical features
- **Service worker**: Background processing for heavy tasks

#### **Cumulative Layout Shift (CLS)**

- **Image dimensions**: Explicit width/height attributes
- **Font metrics**: Size-adjust for web fonts
- **Reserved space**: Placeholders for dynamic content

### **Bundle Optimization**

```js
// Dynamic imports for better code splitting
const LazyComponent = lazy(() => import('./LazyComponent'))

// Conditional loading based on user interaction
if (userInteracted) {
	await import('./InteractiveFeatures')
}
```

### **Image Optimization Pipeline**

```astro
---
import { Image } from 'astro:assets'
import heroImage from '../assets/hero.jpg'
---

<!-- Optimized responsive image -->
<Image
	src={heroImage}
	alt="Hero image"
	width={1200}
	height={600}
	quality={80}
	format="webp"
	loading="lazy"
	class="h-auto w-full"
/>
```

## 🌐 Deployment & Production

### **Alternative Deployment Options**

#### **Vercel Deployment** (Recommended for React/dynamic features)

1. **Push to GitHub**:

   ```bash
   git add .
   git commit -m "feat: ready for deployment"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Import your GitHub repository
   - Vercel automatically detects Astro configuration
   - Builds deploy automatically on push

3. **Environment Variables** (if needed):
   ```env
   # Add in Vercel dashboard
   CONTACT_EMAIL=your-email@domain.com
   ```

---

## 📄 License

MIT License - feel free to use this project as inspiration for your own portfolio!

---

**Built with ❤️ by Nicolás Deyros** | [Portfolio](https://nicolasdeyros.dev) | [LinkedIn](https://linkedin.com/in/nicolas-deyros)

_Last updated: August 13, 2025_
