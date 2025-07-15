# 🚀 Nicolás Deyros - Portfolio Website

A modern, responsive portfolio website built with Astro, featuring a blog, dark mode support, and smooth animations. Showcasing work as a Developer, Project Manager, and Advertiser.

[![Built with Astro](https://astro.badg.es/v2/built-with-astro/small.svg)](https://astro.build)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

## ✨ Features

- **🌙 Dark/Light Mode**: Seamless theme switching with system preference detection
- **📱 Responsive Design**: Optimized for all devices and screen sizes
- **📝 Blog System**: Content management with MDX support
- **🎭 Animations**: Smooth entrance animations and hover effects
- **♿ Accessibility**: WCAG compliant with proper ARIA labels
- **🔍 SEO Optimized**: Meta tags, structured data, and performance optimized
- **🎵 Text-to-Speech**: Read-aloud functionality for blog posts
- **📊 Reading Progress**: Visual progress bar for blog articles
- **🚀 Performance**: Optimized loading and Lighthouse scores

## 🛠️ Tech Stack

- **Framework**: [Astro](https://astro.build/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Content**: [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)
- **Typography**: [Tailwind Typography](https://tailwindcss.com/docs/typography-plugin)
- **Icons**: [Iconify](https://iconify.design/)
- **Code Quality**: [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/)
- **Git Hooks**: [Husky](https://typicode.github.io/husky/) + [Commitlint](https://commitlint.js.org/)
- **Deployment**: [Vercel](https://vercel.com/) / [Netlify](https://netlify.com/)

## 📂 Project Structure

```
├── public/
│   ├── images/           # Static images
│   └── favicon.ico       # Site favicon
├── src/
│   ├── assets/           # SVG assets (logo, etc.)
│   ├── components/       # Reusable components
│   │   ├── Header/       # Navigation components
│   │   ├── Footer/       # Footer component
│   │   ├── Home/         # Homepage components
│   │   ├── List/         # Social media links
│   │   └── Section.astro # Layout section wrapper
│   ├── content/          # Content collections
│   │   └── blog/         # Blog posts (MDX)
│   ├── layouts/          # Page layouts
│   │   └── index.astro   # Main layout
│   ├── pages/            # File-based routing
│   │   ├── blog/         # Blog pages
│   │   └── index.astro   # Homepage
│   └── styles/           # Global styles
├── .husky/               # Git hooks configuration
├── astro.config.mjs      # Astro configuration
├── eslint.config.js      # ESLint configuration
├── commitlint.config.js  # Commitlint configuration
├── .prettierrc           # Prettier configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

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

| Command              | Description                                  |
| -------------------- | -------------------------------------------- |
| `npm run dev`        | Start development server at `localhost:4321` |
| `npm run build`      | Build production site to `./dist/`           |
| `npm run preview`    | Preview production build locally             |
| `npm run lint`       | Run ESLint for code quality                  |
| `npm run lint:fix`   | Fix ESLint issues automatically              |
| `npm run format`     | Format code with Prettier                    |
| `npm run type-check` | Run TypeScript type checking                 |
| `npm run astro ...`  | Run Astro CLI commands                       |

## 📝 Content Management

### Adding Blog Posts

1. Create a new `.mdx` file in `src/content/blog/`
2. Add frontmatter with required fields:

```mdx
---
title: 'Your Post Title'
slug: 'your-post-slug'
date: '2024-01-15'
author: 'Your Name'
description: 'Post description for SEO'
image: { src: '/images/post-image.jpg', alt: 'Image description' }
category: 'Technology'
draft: false
---

Your content here...
```

### Content Fields

- **title**: Post title (required)
- **slug**: URL slug (required)
- **date**: Publication date (required)
- **author**: Author name (required)
- **description**: SEO description (required)
- **image**: Featured image with alt text (optional)
- **category**: Post category (optional)
- **draft**: Hide from production if true (optional)

## 🎨 Customization

### Dark Mode

The site uses Tailwind's class-based dark mode. Add dark mode styles using the `dark:` prefix:

```html
<div class="bg-white text-black dark:bg-gray-900 dark:text-white">Content</div>
```

### Styling

Customize styles using Tailwind utility classes or add custom CSS in the `src/styles/` directory.

## 🔧 Configuration

### Astro Configuration

Key settings in `astro.config.mjs`:

```js
export default defineConfig({
	integrations: [
		tailwind(),
		mdx(),
		// Add your integrations
	],
	// Your configuration
})
```

### ESLint Configuration

The project uses ESLint with TypeScript and Astro support. Configuration is in `eslint.config.js` with rules for:

- JavaScript/TypeScript
- Astro components
- JSX accessibility
- MDX files

### Prettier Configuration

Code formatting rules are defined in `.prettierrc`:

```json
{
	"semi": false,
	"singleQuote": true,
	"tabWidth": 2,
	"useTabs": true,
	"printWidth": 80
}
```

### Commitlint Configuration

Commit message conventions are enforced via `commitlint.config.js`:

```js
module.exports = {
	extends: ['@commitlint/config-conventional'],
	rules: {
		'type-enum': [
			2,
			'always',
			['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'],
		],
	},
}
```

### Git Hooks with Husky

Pre-commit hooks are configured in `.husky/`:

- **pre-commit**: Runs ESLint and Prettier
- **commit-msg**: Validates commit messages with commitlint

## 🌐 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically on push

### Netlify

1. Build the project: `npm run build`
2. Deploy the `dist/` folder to Netlify

### Manual Deployment

```bash
npm run build
# Upload dist/ folder to your hosting provider
```

## 📱 Social Media Integration

Update social media links in `src/pages/index.astro`:

```astro
<List
	href="https://github.com/your-username"
	icon="jam:github"
	target="_blank"
	title="GitHub"
	className={styles}
/>
```

## 🎯 Performance

- **Lighthouse Score**: 100/100 (Performance, Accessibility, Best Practices, SEO)
- **Core Web Vitals**: Optimized LCP, FID, and CLS
- **Bundle Size**: Minimal JavaScript footprint
- **Image Optimization**: Automatic optimization with Astro

## 🔍 Code Quality

The project maintains high code quality through:

- **ESLint**: Catches potential bugs and enforces coding standards
- **Prettier**: Ensures consistent code formatting
- **TypeScript**: Provides type safety and better developer experience
- **Husky**: Runs quality checks before commits
- **Commitlint**: Enforces conventional commit messages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes following the code style
4. Commit using conventional commits: `git commit -m 'feat: add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Commit Message Format
