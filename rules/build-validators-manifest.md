---
name: "build-validators-manifest"
priority: 2
pack: "website-build"
triggers:
  - "build a website"
  - "build_validators"
  - "build gate"
  - "validator"
paths:
  - "org:website_build"
---

# Build Validators Manifest (scaffold ALL of these into `build_validators.ts`)

The canonical list of build-gate validators a generated projectsites.dev / Emdash site MUST wire into `scripts/build_validators.ts` (run in CI + pre-deploy). The `[[website-completeness-checklist]]` is the 62-point human gate; THIS is the machine enforcement that makes those points fail the build mechanically. The cloned template ships almost none of these — scaffold the full set from this spec on every build; a checklist point with no validator is an unenforced point.

> Each row: `validate-*.mjs` · what it greps/asserts in `dist/` · fail code · checklist # it enforces. Validators live in the GENERATED site's `scripts/validators/`, orchestrated by `build_validators.ts` — NOT this plugin. This rule is the WHAT; the build CREATES each from the spec.

## Routes & structure

- **validate-links** — crawl `dist/`; every internal `<a href>` resolves to a real route (200). Fail `routes.dead_link`. (#1)
- **validate-page-set-completeness** — every org-type standard route exists (nonprofit floor 14+, etc.). Fail `routes.page_missing`. (#2)
- **validate-route-metadata** — RAW-HTTP per route: unique server-rendered title/desc/canonical/OG, no shared index head. Fail `meta.client_only` / `meta.duplicate`. (#3, #50)
- **validate-body-content** — RAW-HTTP per route: the static HTML `<body>` contains the real page content (an `<h1>` + a meaningful body text length), NOT an empty `<div id="root">`. A client-only SPA fails this — its content is invisible to crawlers/AI-search. Fail `ssr.empty_body`. (#3)
- **validate-ssr-head** — RAW-HTTP: routes don't all share the homepage head (SPA-fallback + no prerender + no edge rewriter = collapse). Fail `seo.client_only_head`. (#3)
- **validate-no-orphans** — every route reachable from nav/footer within 2 clicks. Fail `routes.orphan`. (#55)
- **validate-error-pages** — `/404` returns 404 + branded; error boundary present. Fail `routes.error_page_missing`. (#6)

## Content & depth

- **validate-no-placeholder** — zero `lorem|TODO|\[placeholder\]|Untitled|Click here|Learn more` in shipped HTML. Fail `content.placeholder`. (#7, #8, #9)
- **validate-word-count** — rendered body words per route ≥ 800 for content pages (contact ~300, legal/utility exempt). Fail `content.thin_page`. (#47, #48)
- **validate-homepage-sections** — homepage has ≥ 6 distinct `<section>`. Fail `content.homepage_thin`. (#49)
- **validate-faq** — ≥ 5 Q&A + FAQPage JSON-LD on home + each service page. Fail `content.faq_missing`. (#53)
- **validate-hyperlinks** — unlinked email/phone in HTML = fail `links.unlinked_contact` (build-break); unlinked address/institution = warn. (#12, per `[[always]]`)
- **validate-keyphrase** — one primary keyphrase per page (title+H1+first-100w+URL); no two pages share it. Fail `seo.cannibalization`. (#57)

## Assets & performance

- **validate-assets** — every internal asset ref resolves to a real file; favicons/webmanifest/OG present. Fail `assets.missing`. (#23, #25)
- **validate-image-formats** — AVIF-primary + srcset; no PNG > 200KB; LCP img has `fetchpriority`+preload. Fail `assets.unoptimized`. (#24, #27)
- **validate-no-cdn-hotlinks** — no hotlinked external images; all self-hosted/R2. Fail `assets.hotlink`. (#25)
- **perf-budget** — JS chunk ≤ 250KB gz; per-route asset budget. Fail `perf.budget_exceeded`. (#28)
- **validate-cls** — every img/embed has explicit dimensions or `aspect-ratio`. Fail `perf.cls_risk`. (#21)

## SEO / structured data

- **validate-jsonld** — JSON-LD per page, accurate types only, validates against Rich Results. Fail `seo.jsonld_invalid` / `seo.jsonld_padded`. (#30)
- **validate-sitemap** — `sitemap.xml` content-true `lastmod` (not build-time); robots/humans/security.txt present + live-curl-checked. Fail `seo.sitemap_stale`. (#31, per `[[always]]`)
- **validate-internal-links** — ≥ 2 internal + 1 outbound authority link per content page. Fail `seo.thin_linking`. (#32)

## Functionality, a11y, legal

- **validate-forms** — every form: Turnstile + Zod + real endpoint; a live test submission returns success. Fail `forms.broken`. (#35)
- **validate-map** — contact/HQ page with an address renders a branded address-pointed map. Fail `func.map_missing`. (#36)
- **validate-email-auth** — sending domain SPF+DKIM+DMARC + RFC 8058 unsub. Fail `email.unauthenticated`. (#35)
- **validate-skip-link** — first focusable is the skip link → `#main-content`. Fail `a11y.skip_link_missing`. (#41)
- **validate-axe** — axe 0 violations at 6 breakpoints. Fail `a11y.axe_violation`. (#42)
- **validate-contrast** — all text/UI clears AA (4.5:1 / 3:1). Fail `a11y.contrast`. (#43)
- **validate-legal** — `/privacy` + consent gate (if analytics) + `/accessibility` + `/terms` (if accounts/payments), footer-linked. Fail `legal.surface_missing`. (#44, #45)
- **validate-consent-gate** — analytics fires only post-opt-in. Fail `legal.no_consent_gate`. (#38, #45)

## Brand & visual

- **validate-brand** — brand colors/fonts applied; no unstyled/system-font sections (the template's lone existing validator). Fail `brand.unstyled`. (#22)
- **validate-secrets** — no placeholder secrets in build; all self-generable ones provisioned. Fail `secrets.placeholder`. (#39)

## Orchestration

- `build_validators.ts` imports every validator above, runs them over `dist/` after build, aggregates `{ validator, code, route, detail }` failures, and EXITS NON-ZERO on any build-break code — blocking deploy. Warn-level codes log but don't block.
- Wire into CI (`lefthook` pre-push + the deploy workflow) so no site deploys with an unenforced checklist point.

## See

- `[[website-completeness-checklist]]` — the 62 human-readable points these enforce
- `[[website-build-manifest]]` · `[[verification-loop]]` · `[[always]]` (§ validator references)
