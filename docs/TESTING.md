# Testing Documentation

## Overview

This project includes a comprehensive testing infrastructure with 11 specialized test suites covering performance, accessibility, SEO, content validation, and UI components.

## Test Suites

### 🚀 Performance Testing

#### `test/performance-clean.test.ts`

- **Core Web Vitals**: LCP, FID, CLS measurements
- **Multi-page Testing**: Homepage, blog pages, static pages
- **Clean Environment**: Isolated server setup for accurate measurements
- **Thresholds**: Enforces production-ready performance standards

#### `test/performance.test.ts`

- **Alternative Performance Suite**: Different measurement approach
- **Comprehensive Coverage**: All page types with detailed metrics
- **CI/CD Integration**: Optimized for continuous integration

### 🔍 SEO & Content Validation

#### `test/seo.test.ts`

- **Meta Tags**: Title, description, Open Graph validation
- **Content Quality**: Heading hierarchy, keyword distribution
- **Schema Markup**: JSON-LD structured data validation
- **SEO Best Practices**: URL structure, internal linking

#### `test/mdx.test.ts`

- **Frontmatter Validation**: Required fields, data types
- **Content Structure**: Blog post schema compliance
- **Draft Handling**: Proper draft post detection

#### `test/accessibility.test.ts`

- **WCAG Compliance**: Color contrast, heading structure
- **Image Accessibility**: Alt text validation
- **Form Accessibility**: Label and input validation
- **Keyboard Navigation**: Tab order and focus management

### 🔗 Link & Content Validation

#### `test/links.test.ts`

- **Internal Links**: Navigation and content links validation
- **External Links**: Social media and reference links
- **Blog Content**: Cross-post references and citations

#### `test/page-links.test.ts`

- **Extended Link Testing**: Comprehensive URL validation
- **Markdown Links**: Proper formatting and structure
- **Mixed Content**: HTTP/HTTPS validation

### 🎨 UI Component Testing

#### `test/back-to-top.test.ts`

- **Basic Functionality**: Button presence and click behavior
- **Scroll Detection**: Visibility based on scroll position

#### `test/back-to-top-isolated.test.ts`

- **Isolated Environment**: Clean test setup for accurate results
- **Cross-page Testing**: Consistent behavior across pages
- **Animation Testing**: Smooth scroll and transitions

#### `test/back-to-top-optimized.test.ts`

- **Performance Optimized**: Fast execution for CI/CD
- **Essential Testing**: Core functionality validation

### ✍️ Content Quality

#### `test/grammar-checker.test.ts`

- **Commit Message Validation**: Conventional commit format
- **Text Quality**: Grammar and spelling checks
- **Textlint Integration**: Automated writing improvement

## Running Tests

### Individual Test Suites

```bash
# Performance testing
npm run test:performance        # Run performance tests
npm run test:clean             # Run clean performance setup

# UI component testing
npm run test:back-to-top       # Back-to-top button tests

# Content quality
npm run test:grammar           # Grammar and writing tests

# Fast execution
npm run test:fast              # Optimized test suite
```

### Comprehensive Testing

```bash
# All tests
npm run test                   # Run complete test suite

# Quality checks
npm run check:all              # Lint, text, and tests
npm run check:grammar          # Text quality only

# Watch mode
npm run test:watch             # Continuous testing
```

## Test Configuration

### Vitest Configuration (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		environment: 'node',
		globals: true,
		timeout: 60000, // Extended timeout for performance tests
		include: ['test/**/*.test.ts'],
		exclude: ['node_modules/', 'dist/', '.astro/'],
	},
})
```

### Test Environment

- **Node.js**: Server-side testing environment
- **Puppeteer**: Headless browser for performance testing
- **Lighthouse**: Performance metrics collection
- **Gray Matter**: Frontmatter parsing for content tests

## Performance Benchmarks

### Current Metrics (Automated Testing)

```
📊 PERFORMANCE SUMMARY
Average Performance Score: 68.8/100
Average LCP: 0.55s ✅
Average CLS: 0.000 ✅
All Core Web Vitals: PASSING ✅
```

### Page-specific Results

- **Homepage**: 75/100 (0.71s LCP)
- **Blog listing**: 75/100 (0.17s LCP)
- **Blog posts**: 50-75/100 (0.26-0.88s LCP)
- **Contact page**: 50/100 (1.54s LCP)
- **Links page**: 75/100 (0.20s LCP) ⭐

## CI/CD Integration

### GitHub Actions

Tests run automatically on:

- Pull requests to master
- Pushes to master branch
- Manual workflow dispatch

### Pre-commit Hooks

Quality checks run before each commit:

- ESLint code quality
- Prettier formatting
- Conventional commit validation
- Text quality checks

## Best Practices

### Writing Tests

1. **Descriptive Names**: Clear test descriptions
2. **Isolated Environment**: Clean setup/teardown
3. **Realistic Scenarios**: Test actual user interactions
4. **Performance Aware**: Optimize test execution time
5. **Error Handling**: Graceful failure handling

### Performance Testing

1. **Clean Environment**: Isolated server instances
2. **Consistent Conditions**: Stable testing environment
3. **Multiple Measurements**: Average results over multiple runs
4. **Threshold Enforcement**: Fail tests when performance degrades
5. **Real-world Scenarios**: Test actual page loads and interactions

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Tests use different ports (4321, 4322, 4323)
2. **Timeout Errors**: Extended timeouts for performance tests
3. **Browser Issues**: Puppeteer setup and Chrome dependencies
4. **Content Changes**: Update tests when content structure changes

### Debug Mode

```bash
# Verbose output
npm run test -- --reporter=verbose

# Single test file
npm run test test/performance-clean.test.ts

# Debug specific functionality
npm run test -- --grep "Core Web Vitals"
```

## Future Enhancements

- [ ] Visual regression testing with screenshot comparison
- [ ] Cross-browser testing with multiple browser engines
- [ ] A/B testing infrastructure for content optimization
- [ ] Automated accessibility reporting with detailed recommendations
- [ ] Performance budget enforcement with CI/CD integration
