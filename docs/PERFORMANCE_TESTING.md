# Performance Testing Guide

## Overview

This project includes comprehensive Core Web Vitals testing using Google's Lighthouse and web-vitals libraries.

## What it Tests

### Core Web Vitals (Google's Key Metrics)

- **LCP (Largest Contentful Paint)**: ≤ 2.5 seconds
- **FID (First Input Delay)**: ≤ 100 milliseconds
- **CLS (Cumulative Layout Shift)**: ≤ 0.1
- **FCP (First Contentful Paint)**: ≤ 1.8 seconds

### Lighthouse Scores

- **Performance**: ≥ 90/100
- **Accessibility**: ≥ 90/100
- **Best Practices**: ≥ 90/100
- **SEO**: ≥ 90/100

### Pages Tested

- Homepage (/)
- Blog listing (/blog)
- Individual blog posts (sample of 3)
- Contact page (/contact)
- Links page (/links)

## How to Run Performance Tests

### Method 1: Manual (Recommended)

1. **Start the dev server:**

   ```bash
   npm run dev
   ```

2. **In another terminal, run performance tests:**
   ```bash
   npm run test:performance
   ```

### Method 2: Using Chrome DevTools

1. Open your site in Chrome
2. Open DevTools (F12)
3. Go to "Lighthouse" tab
4. Select "Performance", "Accessibility", "Best Practices", "SEO"
5. Click "Generate report"

### Method 3: Online Tools

- **PageSpeed Insights**: https://pagespeed.web.dev/
- **GTmetrix**: https://gtmetrix.com/
- **WebPageTest**: https://www.webpagetest.org/

## Understanding Results

### Core Web Vitals Scoring

- **Good**: Green scores (LCP ≤ 2.5s, FID ≤ 100ms, CLS ≤ 0.1)
- **Needs Improvement**: Yellow scores
- **Poor**: Red scores

### Performance Optimization Tips

If tests fail, consider these optimizations:

#### For LCP (Largest Contentful Paint)

- Optimize images (use WebP format, proper sizing)
- Minimize render-blocking resources
- Improve server response times
- Use CDN for static assets

#### For CLS (Cumulative Layout Shift)

- Set size attributes on images and videos
- Reserve space for dynamic content
- Avoid inserting content above existing content
- Use CSS aspect-ratio for responsive media

#### For FCP (First Contentful Paint)

- Minimize critical resource loading
- Remove unused CSS/JavaScript
- Optimize fonts loading
- Enable text compression

## Continuous Integration

Add performance testing to your CI/CD pipeline:

```yaml
# .github/workflows/performance.yml
name: Performance Tests

on: [push, pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm run preview &
      - run: sleep 10
      - run: npm run test:performance
```

## Troubleshooting

### Common Issues

1. **"Page not accessible" errors**
   - Ensure dev server is running on http://localhost:4321
   - Check if the page exists and loads correctly

2. **Timeout errors**
   - Increase timeout in test configuration
   - Check internet connection for external resources

3. **Low performance scores**
   - Check browser extensions (disable for testing)
   - Ensure dev server isn't throttled
   - Test on production build for accurate results

### Debug Mode

Run tests with debug information:

```bash
DEBUG=lighthouse:* npm run test:performance
```

## Performance Budget

Current thresholds are set for optimal user experience:

- Mobile-first approach
- Modern browser capabilities
- Good network conditions

Adjust thresholds in `test/performance.test.ts` based on your requirements.
