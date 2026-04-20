---
name: "quality-gate"
description: "7-check quality assurance gate that MUST pass before any deployment is considered complete. Covers E2E tests, visual inspection, link verification, SEO/structured data, performance, accessibility, and security. Run after every deployment."
---

# Quality Gate — Ship Nothing Broken

## When to Run

- After every `wrangler deploy`
- After any HTML/CSS/JS change
- Before telling the user "it's done"
- When asked to "ensure everything works/looks perfect"

## The 7 Checks

### 1. E2E Tests (Playwright)

```bash
npx playwright test --reporter=list
```

**Required: 0 failures.** If no tests exist, create them covering:
- All pages load (200)
- Navigation works
- Forms submit and validate
- Videos/iframes load
- Mobile responsive layout
- All buttons/links are clickable

### 2. Visual Screenshots

```bash
# Desktop
npx playwright screenshot --viewport-size=1280,720 https://yoursite.com desktop.png
# Mobile
npx playwright screenshot --viewport-size=375,812 https://yoursite.com mobile.png
```

Review for: layout breaks, overflow, text readability, image loading, spacing, alignment, footer completeness. If GPT-4o available, send for AI design critique.

### 3. Link Verification

```bash
curl -s https://yoursite.com | grep -oP 'href="[^"]*"' | sort -u | while read href; do
  url=$(echo $href | tr -d '"' | sed 's/href=//')
  [[ "$url" == /* ]] && url="https://yoursite.com$url"
  [[ "$url" == http* ]] && echo "$(curl -sI "$url" | head -1) → $url"
done
```

### 4. SEO & Structured Data

```bash
# JSON-LD count (should be 4+)
curl -s https://yoursite.com | grep -c 'application/ld+json'
# Meta tags present
curl -s https://yoursite.com | grep -c 'og:title\|og:description\|og:image\|twitter:card'
# Sitemap
curl -sI https://yoursite.com/sitemap.xml | head -1
# Robots.txt
curl -sI https://yoursite.com/robots.txt | head -1
```

### 5. Performance

- Images: all < 200KB (compress with Pillow if needed)
- Total page: < 5MB
- Fonts: `display=swap`
- Images: `loading="lazy"`
- Videos: `preload="auto"` or `lazy`

### 6. Accessibility

- [ ] All images have descriptive `alt` text
- [ ] All interactive elements have `cursor: pointer`
- [ ] All links/buttons have hover + focus-visible + active states
- [ ] Skip-to-content link exists
- [ ] ARIA labels on nav, hamburger, social icons
- [ ] Focus-visible outlines on all focusable elements

### 7. Security

- [ ] CSP headers in Cloudflare Worker
- [ ] X-Frame-Options: SAMEORIGIN
- [ ] X-Content-Type-Options: nosniff
- [ ] HTTPS enforced
- [ ] Form inputs validated client-side AND server-side
- [ ] No API keys in client-side code

## Quick Commands

```bash
# Full gate (copy-paste this)
echo "=== Tests ===" && npx playwright test --reporter=list && \
echo "=== SEO ===" && curl -s https://SITE | grep -c 'ld+json' && \
echo "=== Sitemap ===" && curl -sI https://SITE/sitemap.xml | head -1 && \
echo "=== Robots ===" && curl -sI https://SITE/robots.txt | head -1
```

## After Passing

1. Purge Cloudflare cache
2. Final curl to verify live site
3. Ask: "What would make this 10% more beautiful?"
4. If the answer is quick (< 5 min), do it and re-run gate
