---
name: "Performance Optimization"
description: "Canonical owner of Core Web Vitals, JS/CSS budgets, image optimization, lazy loading, font loading strategy, preconnect/prefetch, code splitting, tree shaking, and compression. Ensures every deploy meets performance thresholds before shipping."
always-load: false---

# Performance Optimization

## Core Web Vitals Targets
| Metric | Good | Our Target |
|--------|------|------------|
| LCP | <2.5s | <2.0s |
| INP | <200ms | <100ms |
| CLS | <0.1 | <0.05 |

## Bundle Budgets
| Asset | Budget | Hard Limit |
|-------|--------|------------|
| Worker script | 500KB | 1MB(free)/10MB(paid) |
| Initial JS | 150KB gz | 250KB gz |
| Initial CSS | 50KB gz | 80KB gz |
| Per-route chunk | 50KB gz | 100KB gz |
| Total page weight | 800KB | 1.5MB |
| Hero image | 100KB | 200KB |
| Web font/family | 50KB | 80KB |

## Image Targets
WebP photo 80% <200KB, AVIF 65% <150KB (with WebP fallback), PNG logo <50KB, SVG <10KB (SVGO), OG 1200x630 <100KB.

## Rules
1. Measure before optimizing (Lighthouse + Web Vitals first)
2. Images: WebP/AVIF, correctly sized, lazy below-fold, R2/CDN + cache headers
3. Fonts: `font-display: swap`, preload critical font, self-host from R2
4. JS not needed on first paint: deferred/lazy via dynamic `import()`
5. CSS above-fold inlined, remainder loaded async
6. Every `<img>`: explicit width+height (prevents CLS)
7. Preconnect to critical origins (API, CDN, analytics, fonts)
8. Worker CPU: 10ms avg, 50ms p99
9. Verify tree shaking: inspect output bundle, configure sideEffects
10. Compression automatic on CF (Brotli/gzip). Don't double-compress.
11. Cache: static `max-age=31536000, immutable`, HTML `max-age=60, s-maxage=3600`, API `private, no-store`
12. No render-blocking third-party scripts (all via GTM async)

## Key Patterns

**Font Loading:**
```html
<link rel="preload" href="/fonts/space-grotesk-700.woff2" as="font" type="font/woff2" crossorigin>
<!-- font-display: swap, unicode-range: U+0000-00FF (Latin subset) -->
```

**Images:** `<picture>` with AVIF/WebP/fallback. Above-fold: `loading="eager" fetchpriority="high"`. Below-fold: `loading="lazy" fetchpriority="low"`.

**Resource Hints:** Preconnect critical origins, dns-prefetch less-critical, prefetch next likely nav.

**Code Splitting (Angular 19):** Lazy-load routes with `loadComponent: () => import(...)`.

**Worker Timing:** Middleware logs `Server-Timing: worker;dur=X` header. Warn if >50ms.

**Cache Headers (Hono):** `/assets/*` immutable. HTML short cache + stale-while-revalidate.

**Playwright Performance Test:**
```typescript
test('Core Web Vitals', async ({ page }) => {
  await page.goto(PROD_URL);
  // Observe LCP + CLS via PerformanceObserver, expect LCP<2500, CLS<0.1
});
```

## Checklist
Lighthouse >= 90, LCP <2.5s on 4G, INP <200ms, CLS <0.1, no render-blocking resources, font-display swap, images WebP/AVIF+lazy+dimensions, JS <150KB gz, CSS <50KB gz, preconnect critical origins, cache headers correct, Worker CPU <50ms p99, no layout shifts from dynamic content, third-party async via GTM, Server-Timing header.

## Ownership
**Owns:** CWV measurement, bundle budgets, image optimization, lazy loading, font strategy, resource hints, code splitting, tree shaking, cache headers, Worker CPU monitoring, compression, regression detection.
**Never owns:** Visual design (->10), testing setup (->07), deployment (->08), analytics (->23), SEO (->28), image generation (->12).
