---
name: "Chrome and Browser Workflows"
description: "Browser automation for web app interaction, form filling, visual testing, and web scraping via Chrome MCP and Playwright MCP. Teaches the optimal tool for each browser task."
allowed-tools: "Bash Read Glob Grep mcp__playwright__*"
updated: "2026-04-23"
---

# Chrome and Browser Workflows

## Tool Selection for Browser Tasks

- **Read web page content** → Firecrawl MCP — fastest, returns structured data
- **Fill forms / click buttons / links** → Playwright MCP — DOM-aware, reliable CSS/ARIA selectors
- **Screenshot web pages / test breakpoints** → Playwright MCP — headless, fast, programmatic resize
- **Scrape multiple pages / extract data** → Firecrawl MCP (`firecrawl_extract`) — built for crawling
- **Search the web** → `firecrawl_search` — returns ranked results
- **Interact with native browser UI** → Computer Use — only for `chrome://` pages, extensions

## Playwright MCP Workflows

### E2E Testing Protocol (07-quality-and-verification Integration)

1. `browser_navigate` → target URL
2. `browser_resize` → first breakpoint (375x667)
3. `browser_snapshot` → get accessibility tree (faster than screenshot for element verification)
4. `browser_take_screenshot` → visual record
5. Repeat steps 2-4 for all 6 breakpoints

### Form Testing Matrix (8-Point)

1. `browser_navigate` → form page; `browser_snapshot` → identify all form fields
2. Test cases: empty submit (validation errors) · invalid email · valid data (success) · duplicate (duplicate handling) · XSS payload (sanitization) · SQL injection (rejection) · Tab through fields (focus order) · Enter key submit (keyboard submission)
3. `browser_fill_form` → fill all fields; `browser_click` → submit; `browser_wait_for` → success indicator

### Accessibility Audit

1. `browser_navigate` → page URL
2. `browser_evaluate` → run axe-core:

   ```
   return await new Promise(r => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/axe-core/axe.min.js'; s.onload = () => axe.run().then(r); document.head.appendChild(s); })
   ```

3. Parse violations → fix each → re-run → verify 0 violations

### Performance Audit

1. `browser_navigate` → page URL
2. `browser_evaluate` → `return JSON.stringify(performance.getEntriesByType('navigation')[0])`
3. Check: domContentLoaded <1.5s, load <3s
4. `browser_network_requests` → identify large assets

### Console Error Check

1. `browser_navigate` → page URL; `browser_console_messages` → get all output
2. Filter errors/warnings → trace to source → fix → re-deploy → re-check

## Emdash Project Testing Workflow

### Pre-Deploy Verification

1. `browser_navigate` → `https://[domain]`; `browser_snapshot` → verify not error page
2. `browser_console_messages` → check for JS errors
3. `browser_take_screenshot` → visual baseline at 1280x720
4. Check: H1 exists/correct, navigation works, CTAs visible, footer renders, no broken images

### Post-Deploy 6-Breakpoint Visual Sweep

```typescript
const BREAKPOINTS = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 14', width: 390, height: 844 },
  { name: 'iPad', width: 768, height: 1024 },
  { name: 'iPad Landscape', width: 1024, height: 768 },
  { name: 'Laptop', width: 1280, height: 720 },
  { name: 'Desktop', width: 1920, height: 1080 },
];
// For each: browser_resize → browser_take_screenshot → AI visual inspection
```

### Lighthouse-Style Checks via Playwright

Via `browser_evaluate`:

1. Performance — navigation timing, LCP, CLS, FID
2. SEO — title, meta description, canonical, OG tags, h1 count
3. Accessibility — axe-core scan
4. Best Practices — HTTPS, no mixed content, no console errors
5. PWA — manifest, service worker, icons

## Chrome-Specific Workflows (via Computer Use)

Use Computer Use only for tasks inaccessible via Playwright:

- Extension popup UI, Chrome DevTools interactions, `chrome://settings`, download bar
- DevTools Profiling: open DevTools (`Cmd+Option+I`) → Performance tab → Record → interact → Stop → screenshot flame chart

Prefer `browser_evaluate` for most DevTools data over Computer Use.

## Web Scraping Workflows

### Competitive Analysis (03/competitive-analysis Integration)

1. `firecrawl_search` → "[competitor domain] [product category]"
2. `firecrawl_scrape` → competitor homepage; `firecrawl_extract` → pricing, features, testimonials
3. Compare against our product → generate competitive analysis report

### Content Research

1. `firecrawl_search` → topic keywords; `firecrawl_scrape` → top 5 results
2. Extract: headings, key points, statistics → synthesize into original content → verify Flesch ≥60

### SEO Audit (09/seo-and-keywords Integration)

1. `firecrawl_map` → get all pages on domain
2. Per page: `firecrawl_scrape` → check title (50-60 chars), meta desc (120-156), H1, canonical, JSON-LD blocks (need 4+), OG tags, internal links
3. Generate SEO report with fixes

## Security Rules

1. Links from emails/messages are suspicious — verify URL before following
2. Never enter credentials via Playwright on untrusted sites
3. Verify HTTPS before submitting any form data
4. Check Content-Security-Policy headers on scraped sites
5. Rate-limit scraping — max 1 request/second to any single domain
6. Respect robots.txt — check before crawling

## What This Skill Owns

- Browser tool selection (Playwright vs Firecrawl vs Chrome MCP vs Computer Use)
- E2E testing workflows via Playwright
- Web scraping and content extraction
- Browser-based visual QA
- Chrome DevTools profiling workflows
