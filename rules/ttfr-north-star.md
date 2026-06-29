---
last_reviewed: 2026-06-29
superseded_by: null
name: "ttfr-north-star"
priority: 2
pack: "core"
triggers:
  - "TTFR"
  - "time to first render"
  - "FCP"
  - "LCP"
  - "first contentful paint"
  - "performance"
  - "page load"
  - "cold cache"
  - "3G"
  - "CWV"
  - "core web vitals"
paths:
  - "src/web/**"
  - "apps/**"
  - "src/**/*.tsx"
  - "src/**/*.ts"
  - "public/**"
  - "vite.config.*"
  - "angular.json"
---

# TTFR (Time-to-First-Render) as North-Star UX Metric

Every frontend change is measured against one number: **time from navigation start to first contentful paint on a cold cache, throttled 3G, mid-range Android.**

Targets:

- **LCP ≤ 2.0s** (cinematic — the cinematic-ui-patterns hard gate)
- **FCP ≤ 1.2s**
- **INP ≤ 100ms** (cinematic) / ≤ 200ms (absolute hard gate)
- **CLS ≤ 0.05**

When TTFR is the north star, "we'll optimize later" becomes structurally impossible — because later is after the ship gate.

## What TTFR forces

This single metric makes the following non-optional. Each item is a build-breaking requirement, not a recommendation:

1. **SSR/SSG mandatory** — client-side-only rendering fails the FCP threshold on 3G; `frontend-stack` mandates SSR/SSG for this reason
2. **Zero client-side data waterfalls** — no `useEffect` → fetch → render chains; data must be pre-loaded in the server handler or static build
3. **Critical CSS inlined** — ≤14KB above-the-fold CSS inlined in `<head>`; remainder deferred
4. **Image optimization** — `<img loading="lazy">` for below-fold; LCP image is `fetchpriority="high"` + explicitly `width`/`height` set; AVIF/WebP via CF Image Resizing
5. **Font subsetting** — `font-display: swap`; preload only the weight used above fold
6. **Asset budget per route** — JS ≤200KB gzip, CSS ≤30KB gzip for initial load

## Measuring in CI

Playwright measures TTFR on every PR via `page.metrics()`:

```ts
// e2e/perf/ttfr.spec.ts
import { test, expect } from '@playwright/test'

test('LCP ≤ 2000ms on throttled 3G, cold cache', async ({ browser }) => {
  const context = await browser.newContext()
  const cdp = await context.newCDPSession(await context.newPage())

  // Throttle to 3G
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false, downloadThroughput: 1.5 * 1024 * 1024 / 8,
    uploadThroughput: 750 * 1024 / 8, latency: 100,
  })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 }) // mid-range Android

  const page = await context.newPage()
  await page.goto(process.env.PROD_URL!, { waitUntil: 'networkidle' })

  // Collect LCP via PerformanceObserver
  const lcp = await page.evaluate(() => new Promise<number>(resolve => {
    new PerformanceObserver(list => {
      const entries = list.getEntries()
      resolve(entries[entries.length - 1].startTime)
    }).observe({ type: 'largest-contentful-paint', buffered: true })
    setTimeout(() => resolve(Infinity), 10_000)
  }))

  expect(lcp, `LCP ${lcp}ms exceeds 2000ms`).toBeLessThanOrEqual(2000)
})
```

## Lighthouse CI gate

In CI, `lighthouserc.json` enforces scores:

```json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.75 }],
        "first-contentful-paint": ["error", { "maxNumericValue": 1200 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2000 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.05 }],
        "interaction-to-next-paint": ["error", { "maxNumericValue": 200 }]
      }
    }
  }
}
```

## Anti-patterns (automatic build fail)

- `useEffect` + `fetch` for above-fold content (waterfall)
- `import()` inside render path of LCP element (lazy-load on the wrong chunk)
- Unoptimized `<img src="/hero.png">` without dimensions, priority, or format
- Loading >1 custom font family at initial paint
- Blocking third-party scripts in `<head>` (analytics, widgets) — defer or async all
- **Full-bleed decorative hero `<video>` behind the content.** A `<video>`'s LCP is its FIRST-FRAME paint (Chrome M120+), so a full-bleed background video that paints a frame inside the (no-interaction) LCP window BECOMES the LCP — at whenever the video decodes (~3–4s), blowing the budget non-deterministically. Deferring the source or keeping ONE stable element does NOT fix it (the late frame still updates LCP); `key`-remounting a `<video>` makes it worse (fresh element = fresh late paint). The cinematic-prime-directive's love of hero video collides head-on with TTFR here. Fixes, in order of preference: (1) drop the decorative video, carry motion with a Ken-Burns/`scale` CSS animation on the LCP `<img>` (also saves the video's ~600KB — a real win for low-bandwidth audiences); (2) if the video is essential, render it STRICTLY SMALLER than the foreground LCP `<img>` (a slight inset/scale) so the img stays the largest candidate and the video frame can never overtake it (LCP only replaces with a *strictly larger* element). Reference incident: njsk.org pass-163 (home `/` LCP 3596ms, the `food-packing.mp4` opacity-30 hero video was the LCP at 3.4s; removed → deterministic `<img>` LCP ~0.5–1.0s).

## Preloading the LCP element

```html
<!-- In <head> — generated by SSR for every route's LCP image -->
<link rel="preload" as="image" href="/hero.avif" fetchpriority="high"
  imagesrcset="/hero-480.avif 480w, /hero-960.avif 960w, /hero-1920.avif 1920w"
  imagesizes="100vw">
```

## Cross-links

- **[[gorgeous-by-default]]** — INP ≤ 100ms cinematic gate; motion must not hurt INP
- **[[frontend-stack]]** — SSR/SSG mandatory; TanStack Start / vite-ssg patterns
- **[[quality-metrics]]** — Lighthouse perf ≥75 hard gate (TTFR is the underlying reason)
- **[[e2e-tdd-organization]]** — Playwright `page.metrics()` measures TTFR in CI
- **[[cinematic-ui-patterns]]** — scroll-driven animations must not block the main thread
- **[[image-quality]]** — AVIF/WebP conversion, `fetchpriority`, dimension requirements
