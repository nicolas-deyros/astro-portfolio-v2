# Development Guide

Complete guide for developers working on the Nicolás Deyros Portfolio project.

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (or pnpm 7.0.0+)
- **Git**: For version control
- **Visual Studio Code**: Recommended editor with extensions

### Initial Setup

#### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/nicolas-deyros/astro-portfolio-v2.git
cd astro-portfolio-v2

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

#### 2. Environment Configuration

Edit `.env` with your configuration:

```bash
# Database (Development uses SQLite)
DATABASE_URL="file:./dev.db"

# Admin Authentication
ADMIN_SECRET_KEY="your-super-secret-key-here"

# Optional: Analytics and monitoring
VERCEL_ANALYTICS_ID="your-analytics-id"
```

#### 3. Database Setup

```bash
# Generate database schema
npm run db:generate

# Seed with sample data
npm run db:seed
```

#### 4. Start Development

```bash
# Start development server
npm run dev

# Server will be available at http://localhost:4321
```

## 🛠️ Development Workflow

### Daily Development

```bash
# Start development server
npm run dev

# Run tests in watch mode
npm run test:watch

# Check code quality
npm run lint

# Format code
npm run format
```

### Git Workflow & Quality Gates

The project uses a highly automated workflow. All feature development must follow the protocols defined in `CLAUDE.md`.

#### Automation Scripts

- `npm run session:init`: **Daily Driver.** Syncs Git, updates dependencies, and checks environment health.
- `npm run git:start <branch> [desc]`: Starts a new feature with a Draft PR on GitHub.
- `npm run docs:sync`: Checks for documentation drift and suggests changelog updates.
- `npm run git:ship`: Finalizes a feature, runs full checks, and handles the delivery process.

#### Quality Hooks (Husky)

- **Pre-commit**: Automatically formats and lints staged files via `lint-staged`.
- **Pre-push**: Runs critical tests and type checking.

### Code Quality Checks

```bash
# Run all linters
npm run lint:all

# Fix auto-fixable issues
npm run lint:fix

# Check spelling
npm run lint:spell

# Check for security issues
npm audit
```

### Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:performance

# Generate coverage report
npm run test:coverage
```

## 📁 Project Structure

### Root Directory Organization

```
astro-portfolio-v2/
├── src/                 # Source code
├── test/               # Test suites (organized by type)
├── config/             # Configuration files
├── tools/              # Development scripts and utilities
├── docs/               # Comprehensive documentation
├── db/                 # Database schema and seeding
├── public/             # Static assets
├── .husky/             # Git hooks
├── .github/            # GitHub workflows and templates
├── package.json        # Dependencies and scripts
├── astro.config.mjs    # Astro configuration
├── tsconfig.json       # TypeScript configuration
├── README.md           # Project overview
├── CHANGELOG.md        # Version history
└── SECURITY.md         # Security policy
```

### Source Code Organization

```
src/
├── components/          # Reusable UI components
│   ├── Header/         # Navigation components
│   ├── Footer/         # Footer components
│   ├── Form/           # Form components
│   ├── Link/           # Link and navigation components
│   └── List/           # List and display components
├── content/            # Content collections and data
│   ├── blog/          # Blog post MDX files
│   ├── config.ts      # Content collection schemas
│   └── links.json     # Static link data
├── layouts/           # Page layout components
├── pages/             # File-based routing
│   ├── api/          # API endpoints
│   ├── blog/         # Blog pages and routing
│   ├── admin/        # Admin interface pages
│   └── ...           # Other application pages
├── styles/           # Global styles and utilities
└── lib/              # Shared utilities and helpers
```

### Test Organization

```
test/
├── unit/              # Unit tests
│   ├── seo.test.ts           # SEO validation tests
│   ├── mdx.test.ts           # Content validation tests
│   └── grammar-checker.test.ts # Grammar checking tests
├── e2e/               # End-to-end tests
│   ├── links.test.ts         # Links functionality tests
│   ├── accessibility.test.ts # Accessibility compliance tests
│   └── links-tag-filtering.test.ts # Tag filtering integration tests
├── integration/       # Integration tests
├── performance/       # Performance tests
├── components/        # Component-specific tests
├── utils/             # Utility function tests
└── error-handling/    # Error handling tests
```

### Configuration Organization

```
config/
├── eslint.config.js         # ESLint configuration
├── commitlint.config.js     # Commit message linting
├── vitest.config.ts         # Test configuration
├── cspell.json             # Spell checking configuration
└── cspell-custom-dictionary.txt # Custom dictionary
```

### Development Tools

```
tools/
├── grammar-checker.ts       # Grammar validation utilities
├── test-grammar.ts         # Grammar testing scripts
├── run-performance-tests.ts # Performance testing utilities
├── test-clean.ts           # Test cleanup utilities
├── test-fast.ts            # Fast test execution
└── test-performance.ts     # Performance test runner
```

### Key Directories

#### `/src/components/`

Organized by function and complexity:

- **Atomic Components**: Basic UI elements (buttons, inputs)
- **Molecule Components**: Composed components (forms, cards)
- **Organism Components**: Complex sections (headers, footers)

#### `/src/pages/`

File-based routing structure:

- **Static Pages**: `index.astro`, `about.astro`
- **Dynamic Routes**: `[slug].astro`, `[...page].astro`
- **API Endpoints**: `/api/*.ts` for server functions

#### `/src/content/`

Content management:

- **Collections**: Type-safe content with Zod schemas
- **Blog Posts**: MDX files with frontmatter
- **Static Data**: JSON files for structured data

## 🧩 Component Development

### Component Guidelines

#### Astro Components

```astro
---
// TypeScript frontmatter
interface Props {
	title: string
	description?: string
}

const { title, description } = Astro.props
---

<!-- HTML template -->
<article class="prose dark:prose-invert">
	<h1>{title}</h1>
	{description && <p>{description}</p>}
</article>

<style>
	/* Scoped styles */
	article {
		/* Component-specific styles */
	}
</style>
```

#### React Components (when needed)

```tsx
interface ButtonProps {
	children: React.ReactNode
	onClick?: () => void
	variant?: 'primary' | 'secondary'
}

export function Button({
	children,
	onClick,
	variant = 'primary',
}: ButtonProps) {
	return (
		<button onClick={onClick} className={`btn btn-${variant}`}>
			{children}
		</button>
	)
}
```

### Styling Guidelines

#### Tailwind CSS Usage

```astro
<!-- Responsive design -->
<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
	<!-- Dark mode support -->
	<div class="bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
		<!-- State variants -->
		<button
			class="bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-300">
		</button>
	</div>
</div>
```

#### Custom CSS (when needed)

```css
/* Global styles in src/styles/global.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom component classes */
@layer components {
	.btn-primary {
		@apply rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600;
	}
}
```

## 🗄️ Database Development

### Schema Development

```typescript
// db/config.ts
import { defineDb, defineTable, column } from 'astro:db'

const Links = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		title: column.text(),
		url: column.text(),
		tags: column.text(),
		date: column.date(),
	},
})

export default defineDb({
	tables: { Links },
})
```

### Data Operations

```typescript
// Using Astro DB
import { db, Links } from 'astro:db'

// Insert data
await db.insert(Links).values({
	title: 'Example Link',
	url: 'https://example.com',
	tags: 'web, development',
	date: new Date(),
})

// Query data
const allLinks = await db.select().from(Links)
const recentLinks = await db
	.select()
	.from(Links)
	.where(gte(Links.date, thirtyDaysAgo))
	.orderBy(desc(Links.date))
```

## 🧪 Testing Guidelines

### Test Organization

```
test/
├── unit/              # Unit tests
├── integration/       # Integration tests
├── e2e/              # End-to-end tests
├── performance/      # Performance tests
└── utils/            # Test utilities
```

### Writing Tests

#### Unit Tests

```typescript
import { describe, it, expect } from 'vitest'
import { formatDate } from '../src/lib/utils'

describe('formatDate', () => {
	it('should format date correctly', () => {
		const date = new Date('2025-01-01')
		const formatted = formatDate(date)
		expect(formatted).toBe('January 1, 2025')
	})
})
```

#### Integration Tests

```typescript
import { describe, it, expect, beforeAll } from 'vitest'

describe('Blog API', () => {
	beforeAll(async () => {
		// Setup test database
	})

	it('should return blog posts', async () => {
		const response = await fetch('/api/blog')
		const posts = await response.json()
		expect(Array.isArray(posts)).toBe(true)
	})
})
```

### Performance Testing

```typescript
import { test, expect } from '@playwright/test'

test('homepage performance', async ({ page }) => {
	await page.goto('/')

	// Measure Core Web Vitals
	const metrics = await page.evaluate(() => {
		return {
			lcp: performance.getEntriesByType('largest-contentful-paint')[0],
			fid: performance.getEntriesByType('first-input')[0],
			cls: performance.getEntriesByType('layout-shift'),
		}
	})

	expect(metrics.lcp.startTime).toBeLessThan(2500)
})
```

## 📝 Content Development

### Blog Posts

Create new blog posts in `src/content/blog/`:

````mdx
---
title: 'Your Blog Post Title'
description: 'Brief description for SEO and previews'
date: '2025-01-01'
author: 'Author Name'
category: 'Technology'
tags: ['astro', 'webdev', 'performance']
draft: false
---

# Your Blog Post Content

Regular Markdown content with enhanced features:

## Code Examples

```typescript
const example = 'code highlighting works'
```
````

## Interactive Components

<CustomComponent prop="value" />
```

### Content Schema Validation

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content'

const blog = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string().max(60),
		description: z.string().max(160),
		date: z.string().transform(str => new Date(str)),
		author: z.string(),
		category: z.string(),
		tags: z.array(z.string()).optional(),
		draft: z.boolean().default(false),
	}),
})

export const collections = { blog }
```

## 🔧 Configuration

### Astro Configuration

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import mdx from '@astrojs/mdx'
import db from '@astrojs/db'

export default defineConfig({
	site: 'https://www.nicolasdeyros.dev/',
	output: 'server',
	adapter: vercel(),
	integrations: [tailwind(), mdx(), db(), react(), icon()],
})
```

### TypeScript Configuration

```json
{
	"compilerOptions": {
		"target": "ES2022",
		"module": "ESNext",
		"moduleResolution": "node",
		"strict": true,
		"jsx": "preserve",
		"jsxImportSource": "astro",
		"allowSyntheticDefaultImports": true,
		"baseUrl": ".",
		"paths": {
			"@/*": ["src/*"],
			"@components/*": ["src/components/*"],
			"@layouts/*": ["src/layouts/*"]
		}
	}
}
```

## 🚀 Deployment

### Build Process

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Check build output
npm run astro check
```

### Environment Variables for Production

```bash
# Production environment variables
DATABASE_URL="your-production-database-url"
ADMIN_SECRET_KEY="your-production-secret-key"
SITE_URL="https://your-domain.com"
```

### Deployment Commands

```bash
# Deploy to Vercel
vercel deploy

# Deploy to production
vercel deploy --prod
```

## 🔍 Debugging

### Development Debugging

```typescript
// Enable debug mode
const DEBUG = import.meta.env.DEV

if (DEBUG) {
	console.log('Debug info:', { data })
}
```

### Error Handling

```typescript
try {
	// Risky operation
	await riskyOperation()
} catch (error) {
	console.error('Operation failed:', error)
	// Handle gracefully
	return { error: 'Operation failed' }
}
```

## 📚 Learning Resources

### Astro Documentation

- [Official Astro Docs](https://docs.astro.build/)
- [Astro Islands](https://docs.astro.build/en/concepts/islands/)
- [Content Collections](https://docs.astro.build/en/guides/content-collections/)

### Project-Specific Resources

- [Architecture Documentation](./ARCHITECTURE.md)
- [Features Guide](./FEATURES.md)
- [Testing Guide](./TESTING.md)
- [Admin System](./ADMIN.md)

## 🤝 Contributing Guidelines

### Code Standards

- **TypeScript**: Use strict TypeScript for all new code
- **Formatting**: Prettier for consistent formatting
- **Linting**: ESLint for code quality
- **Testing**: Write tests for new features
- **Documentation**: Update docs for significant changes

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature description"

# Push and create PR
git push origin feature/your-feature-name
```

### Pull Request Guidelines

1. **Clear Description**: Explain what and why
2. **Tests**: Include relevant tests
3. **Documentation**: Update docs if needed
4. **Performance**: Consider performance impact
5. **Security**: Review for security implications
