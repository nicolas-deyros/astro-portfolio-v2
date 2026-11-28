# Performance Testing Guide

## Lighthouse CI

`.github/workflows/lighthouse.yml` audits every successful Vercel **preview** deployment with Lighthouse CI.

| Setting   | Value                                                                |
| --------- | -------------------------------------------------------------------- |
| Pages     | `/`, `/blog`, `/blog/vibe-coding-productivity`, `/contact`, `/links` |
| Runs      | 3 per page                                                           |
| Threshold | 90 in Performance, Accessibility, Best Practices and SEO             |
| Level     | `warn`: a low score adds a warning and does not fail the job         |
| Reports   | Uploaded as the `lighthouse-results` artifact of the workflow run    |

Change thresholds in `config/lighthouserc.cjs`. To make a category blocking, change its level from `warn` to `error`.

### Preview differences

- The `is-crawlable` audit is skipped, because Vercel previews send `x-robots-tag: noindex`.
- The Vercel preview toolbar (`vercel.live`) is blocked, because it does not ship to production.

## Setup

Previews are behind Vercel Deployment Protection, so the workflow needs a bypass secret.

1. In Vercel: **Project Settings → Deployment Protection → Protection Bypass for Automation**. Generate the secret.
2. Store it in GitHub: `gh secret set VERCEL_AUTOMATION_BYPASS_SECRET`.

Without the secret the job fails with `VERCEL_AUTOMATION_BYPASS_SECRET is not set`.

`config/lighthouse-auth.cjs` exchanges the secret for a cookie by requesting `/favicon.ico`. Do not pass the secret in Lighthouse `extraHeaders` or in an audited URL: third-party hosts such as Google Analytics would receive it.

## Manual checks

- **Chrome DevTools**: open the page, then DevTools → Lighthouse → Generate report.
- **PageSpeed Insights**: <https://pagespeed.web.dev/> (production only).
