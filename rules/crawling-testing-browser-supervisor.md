---
name: "crawling-testing-browser-supervisor"
priority: 3
pack: "research"
triggers:
  - "crawl"
  - "playwright"
  - "scrape"
paths:
  - "*"
---

# Crawling + Testing + Browser Supervisor

Vitest for units, Playwright for E2E + browser automation, Crawlee for OSS crawl/import pipelines. License-gated tools (Firecrawl, browser-use) only after review. The testing/automation-browser arm of the supervisor system.

## When this fires

- Any test (unit/integration/E2E), browser automation, or crawl/import pipeline

## Tooling + when to use

- **Vitest** — unit + integration tests (the default per `code-style`; replaces Karma in Angular via `@analogjs/vitest-angular`)
- **Playwright** + **@playwright/test** — E2E + browser automation; homepage-first, real-user navigation per `e2e-tdd-organization`
- **Crawlee** — OSS crawling/import pipelines (HTTP/Cheerio/Playwright/Puppeteer); backend-only per `workflow-automation-supervisor`
- **Firecrawl** — ONLY after a license/deployment review (managed crawl)
- **browser-use** — ONLY after a license/deployment review (agentic browser)

## Rules

- **TDD-first** — failing Playwright spec BEFORE implementation per `e2e-tdd-organization`; watch RED → GREEN
- **Vitest** for every pure function / service method (mock D1/KV/R2/fetch — never real APIs in units)
- **Playwright** E2E from the homepage outward, 6 breakpoints × 3 browsers, axe-clean, console-error-free per `verification-loop`
- **Crawlee** for crawl/import — validate + sanitize output, respect robots/rate-limits per `workflow-automation-supervisor`
- **Add fixtures, mocks, and reproducible CI commands** — every suite is hermetic + parallel-safe
- License-gated tools (Firecrawl/browser-use) stay behind an adapter + a documented license decision in `package-preference-registry`
