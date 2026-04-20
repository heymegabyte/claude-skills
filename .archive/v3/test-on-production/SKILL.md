---
name: test-on-production
description: "ALWAYS test on the live production site. Local tests are necessary but NOT sufficient. Every feature must be verified on the real production URL after deployment. This catches CSP issues, CDN caching, DNS problems, and real-world behavior that local dev can't simulate."
---

# Test on Production — Not Just Local

## The Rule

After every deployment, run the FULL test suite against the **production URL**, not localhost.

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    baseURL: 'https://yoursite.com', // PRODUCTION, not localhost
  },
});
```

## Why Production, Not Local

Local dev can't catch:
- **CSP blocking** — YouTube, Google Maps, GA/GTM may be blocked by headers
- **CDN caching** — stale assets served from Cloudflare edge
- **DNS issues** — custom domain routing failures
- **CORS** — cross-origin requests that work on localhost but fail in prod
- **Mixed content** — HTTP resources on HTTPS pages
- **Third-party failures** — APIs that rate-limit or block non-production origins
- **Asset 404s** — files uploaded to R2 but not in the right path

## The Sequence

1. Deploy to production
2. Purge Cloudflare cache (ALWAYS — stale cache = false positives)
3. Wait 2-3 seconds for edge propagation
4. Run Playwright against production URL
5. If failures: fix, redeploy, re-purge, re-test

## Verification Checklist

```bash
# Quick production health check
curl -sI https://yoursite.com | head -5           # 200?
curl -sI https://yoursite.com/robots.txt | head -1  # 200?
curl -sI https://yoursite.com/sitemap.xml | head -1  # 200?
curl -s https://yoursite.com | grep -c 'ld+json'    # 4+?
```

## What to Test

- Every page returns 200
- All images load (no broken references)
- All iframes render (YouTube, Google Maps)
- Contact form submits successfully
- Newsletter signup works
- Phone numbers are clickable (tel: links)
- Navigation works (desktop + mobile)
- Footer links work
- Legal pages load (/privacy, /terms)
- PWA manifest loads (/site.webmanifest)
