---
name: "website-completeness-checklist"
priority: 2
pack: "website-build"
triggers:
  - "build a website"
  - "complete website"
  - "finish the website"
  - "is it done"
  - "completeness"
paths:
  - "org:website_build"
---

# Website Completeness Checklist (50 — none optional)

The flat, scannable "is it actually finished?" gate every one-line site build runs BEFORE declaring done. The `[[website-build-manifest]]` is the acceptance index (cross-links to detail); THIS is the literal 50-point checklist — a site ships only when all 50 pass. Each maps to a verifier (Playwright/Lighthouse/axe/build-gate) — assert, never assume. Grounded in `[[always]]` · `[[website-page-and-site-gates]]` · `[[legal-and-error-surfaces]]` · `[[verification-loop]]`.

## Routes & navigation

1. Every nav/footer/CTA/in-body link resolves to a real route returning 200 — crawl the build; any internal 404 = build fail. No `#`/`javascript:void` placeholders.
2. Generate the FULL standard page set for the org type (never a single-page stub) — e.g. nonprofit floor 14+ routes; local-business: home/about/services/contact/reviews/+service pages.
3. Every route serves a per-pathname `<head>` (title/desc/canonical/OG) via Worker HTMLRewriter — never one shared index.html head.
4. Global nav + footer present and identical on EVERY page — no page missing chrome.
5. Breadcrumbs + BreadcrumbList JSON-LD on every page below top level.
6. Branded 404 (nav+search+links, real 404 status) + 500 error boundary (on-brand, no stack trace).
7. Zero visible "coming soon"/placeholder sections — built or removed, never shipped half-done.

## Content

8. Zero lorem ipsum / "TODO" / "[placeholder]" / dummy text in shipped HTML.
9. Real specific copy on every heading/button/link — never "Click here", "Learn more", "Untitled".
10. Real sourced facts only — no invented stats, fake testimonials, or fabricated bios; omit over fabricate.
11. Descriptive factual alt text on every meaningful image (never "image123" / empty).
12. Real, NAP-consistent contact info (email/phone/address identical) across every page.
13. Every form field: label + validation message + visible success AND error state.
14. Designed empty state, loading state, and zero-results state wherever data renders.

## Visual completeness

15. Distinct default / hover / focus-visible / active states on every interactive element — none identical.
16. Clean at 6 breakpoints (375/390/768/1024/1280/1920) — no horizontal scroll, overlap, or clipped text.
17. One consistent type scale + spacing scale site-wide — no arbitrary one-off sizes.
18. Dark mode complete on every component if designed; otherwise `<meta name="color-scheme">` declared.
19. Working lightbox on all image groups — no raw unclickable galleries.
20. Cinematic motion (View Transitions / scroll reveal / `@starting-style`) AND a `prefers-reduced-motion` branch ending in the final state.
21. CLS < 0.05 — every image/embed has explicit dimensions or `aspect-ratio`.
22. Brand colors + fonts applied everywhere — no unstyled/system-font fallback sections.

## Assets

23. Favicon set (ico + 16/32 + apple-touch 180 + maskable) + `site.webmanifest` + OG 1200×630 per route — all present + resolving.
24. AVIF-primary (+WebP/JPEG fallback) with responsive `srcset`; no PNG > 200KB shipped.
25. Every internal asset ref resolves to a real file (asset-existence gate).
26. Self-hosted woff2 fonts, preloaded; no render-blocking external font CSS; no FOUT/FOIT.
27. LCP image has `fetchpriority="high"` + a preload link.
28. JS chunks ≤ 250KB gzip via route code-splitting.

## SEO / GEO

29. Title 50–60 + meta desc 120–156 + canonical on every route.
30. JSON-LD per page, accurate types only (WebPage floor; Organization/LocalBusiness/FAQPage only when real).
31. `sitemap.xml` (content-true `lastmod`) + AI-split `robots.txt` + `humans.txt` + `.well-known/security.txt`.
32. 2+ internal links + 1+ outbound authority link per content page.
33. OG + Twitter card per route, validated against Rich Results.
34. Quotable 40–60-word answer block per page for AI-search/GEO.

## Functionality

35. Every form submits to a real endpoint (Turnstile + Zod + Resend or D1) — test an ACTUAL submission, assert success.
36. Contact/HQ page with an address renders a branded, address-pointed Google Map.
37. Search works if present; newsletter double-opt-in if present; every booking/external link resolves.
38. Analytics instrumented (PostHog + Workers Tracing) behind a consent gate.
39. All self-generable secrets auto-provisioned (signing/session/Turnstile) — zero placeholders.
40. Non-trivial features behind flags (`enabled=0` default) — nothing permanently-on at launch.

## Accessibility

41. Skip-to-content as first focusable + logical heading order (no skips) + landmark regions.
42. axe 0 violations at all 6 breakpoints; fully keyboard-operable; visible focus everywhere.
43. Contrast AA (4.5:1 text / 3:1 large/UI); never color as the only signal.
44. `/accessibility` statement page with WCAG 2.2 AA + ADA/EAA conformance noted.

## Legal / compliance

45. `/privacy` + cookie-consent gate (if analytics/cookies) + `/terms` (if accounts/payments) — footer-linked every page.
46. GDPR/CCPA deletion path implemented if any PII is stored.

## Verification (no "done" without these)

47. Deployed to a real URL + CDN purged — "build succeeded" ≠ done.
48. Playwright E2E on the LIVE url: load home → navigate via clicks → submit a form → assert content + 0 console errors, at 6 breakpoints.
49. Live Lighthouse: Perf ≥ 90 / A11y ≥ 95 / SEO ≥ 95 / BP ≥ 95 · axe 0 · AI-vision ≥ 8/10 (thresholds authoritative from `~/.claude` `EMDASH_*` env).
50. Per-route Self-Verify Statement (what shipped + each gate green) before announcing done.
