---
name: "per-route-metadata"
description: "Static head metadata contract per route. RouteMetadata interface, hydrated <head> template, per-route OG image (Satori-rendered, never hero photo reuse), generous internal linking, publication+external-source linking patterns."
updated: "2026-05-01"
---

# Per-Route Static Head Metadata (***BUILD-BREAKING — EVERY ROUTE***)

Every route emits a fully-hydrated static `<head>` at SSG / prerender time. NEVER client-router-only — crawlers and AI agents read the raw HTML before JS executes.

## RouteMetadata Interface (SSOT — type-checked at build)

```ts
interface RouteMetadata {
  route: string; slug: string;
  title: string; description: string; canonicalUrl: string;
  siteName: string; locale: string;
  type: 'website'|'article'|'profile'|'product'|'service'|'local_business'|'nonprofit';
  keywords: string[];
  image: { url: string; secureUrl: string; width: 1200; height: 630; alt: string; mimeType: 'image/jpeg'|'image/png'|'image/webp' };
  twitter: { card: 'summary_large_image'; title: string; description: string; image: string; imageAlt: string };
  jsonLd: Record<string, unknown>[];
  robots: { index: boolean; follow: boolean };
}
```

**Source:** `src/data/page-meta.ts` exports `Record<route, RouteMetadata>`. Blog / dynamic routes derive at build via the same factory.

**Hard gate:** every `<Route path>` in `App.tsx` has an entry — fail if any route resolves to `index.html`'s static title.

## Per-Route Head Template (paste verbatim — SSOT)

```html
<title>{{title}}</title>
<meta name="description" content="{{description}}" />
<link rel="canonical" href="{{canonicalUrl}}" />
<meta property="og:title" content="{{title}}" />
<meta property="og:description" content="{{description}}" />
<meta property="og:type" content="{{type}}" />
<meta property="og:url" content="{{canonicalUrl}}" />
<meta property="og:site_name" content="{{siteName}}" />
<meta property="og:locale" content="{{locale}}" />
<meta property="og:image" content="{{image.url}}" />
<meta property="og:image:secure_url" content="{{image.secureUrl}}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:type" content="{{image.mimeType}}" />
<meta property="og:image:alt" content="{{image.alt}}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{{twitter.title}}" />
<meta name="twitter:description" content="{{twitter.description}}" />
<meta name="twitter:image" content="{{twitter.image}}" />
<meta name="twitter:image:alt" content="{{twitter.imageAlt}}" />
<meta name="robots" content="{{index}}, {{follow}}" />
<script type="application/ld+json">{{jsonLd}}</script>
<meta name="theme-color" content="{{brandThemeColor}}" />
<meta name="application-name" content="{{siteName}}" />
<meta name="apple-mobile-web-app-title" content="{{siteName}}" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="mobile-web-app-capable" content="yes" />
```

## Per-Route OG Image (***1200×630 — DESIGNED CARD, NEVER HERO PHOTO***)

- **Generate with Satori preferred** — edge-rendered, deterministic, brand-card layout: title + sitelogo + accent gradient + tagline + brand watermark
- **Fallback** — gpt-image-1.5 with brand colors + business name + tagline + logo bottom-right
- **NEVER** — reuse homepage hero photo as OG image — must be a designed card
- **Store at** `r2://sites/<slug>/og/<route-slug>.jpg` (≤100KB, JPEG q=85, 1200×630)
- Each route gets a unique card
- **Build gate** — every route's `og:image` URL HEADs 200 + size ≤100KB + dimensions 1200×630

## Generous Internal Linking (***≥5 PER PAGE — body-copy contextual***)

- Every page contains **≥5 internal links woven into body copy** with descriptive anchor text (never "click here", "learn more")
- When body mentions: institutions / journals / conferences / awards / organizations / people / places, link them
- Internal where a relevant page exists; outbound `rel="noopener" target="_blank"` to authoritative source otherwise (journal name → journal homepage, university → official site, conference → official site)
- Anchor text varies — never repeat identical text site-wide
- **Hard gate:** `validate-internal-links.mjs` counts contextual `<a>` per page, flags pages with <5 or with repeated identical anchors >2×

## Publication / External-Source Linking (***FOR PORTFOLIO/ACADEMIC/PRESS LISTINGS***)

When site lists publications, papers, articles, talks, press, awards, podcasts, each item card MUST contain:

1. Auto-extracted ~40-word summary from the original detail page (crawled at research time)
2. Deep-link to original (`target="_blank" rel="noopener"`)
3. Hyperlinked source name (journal / publisher / conference) → its homepage or DOI

### Rules

- NEVER import direct quoted abstracts (SEO duplicate-content risk + copyright)
- Summary = our paraphrase
- Date + author + type + ISBN (if any) extracted as structured metadata (BlogPosting / Article / ScholarlyArticle JSON-LD)

### Build gate

Every publication card has summary + outbound link + source-name link OR fail.

## Publication Item Schema

```ts
interface PublicationItem {
  title: string; summary: string;  // ~40 words paraphrase, NEVER quoted abstract
  authors: string[]; date: string;
  source: { name: string; url: string };  // journal homepage, conference site
  deepLink: string;  // direct link to article/DOI
  type: 'paper'|'article'|'talk'|'book_chapter'|'podcast'|'press';
  isbn?: string; doi?: string;
}
```

## Sub-Page Type Mapping

- **homepage** → `website`
- **about / team / bio** → `profile`
- **service / product detail** → `service` / `product`
- **blog post** → `article`
- **restaurant / salon / clinic** → `local_business`
- **nonprofit** → `nonprofit`

### JSON-LD schema by type

- **home** — WebSite + Organization
- **bio** — Person + ProfilePage
- **service** — Service + Organization
- **article** — BlogPosting + BreadcrumbList
- **local** — LocalBusiness + PostalAddress + GeoCoordinates
- **nonprofit** — NGO + Organization

Always + BreadcrumbList on non-home routes.

## Anchor Text Variation (anti-templating)

Never reuse identical anchor text across the site. Vary phrasing per occurrence: "her work at Boston University" / "Boston University doctoral program" / "BU's nutrition department". Each occurrence reads naturally in context.

## Validator: validate-route-metadata.mjs

For every route in `sitemap.xml`:

- Fetch raw HTML (NOT executed JS)
- Assert:
  - Title 50-60ch
  - Desc 120-156ch
  - Canonical present
  - `og:image` + `og:title` + `og:description` present non-empty
  - `twitter:card=summary_large_image`
  - JSON-LD parseable + ≥4 blocks
  - h1 in raw HTML before any `<script>`
- Fail build on any violation
- Wired into `gate` script (skill 07 `quality-gates.md`)
