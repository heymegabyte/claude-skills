---
skill: pseo-templates
version: 1.0.0
tags: [seo, pseo, programmatic-seo, content-templates, structured-data]
cross-links: [i18n-by-demographics, page-set-expansion, dynamic-sitemap-from-d1]
---

## Type 1: `{City} × {Service}` — Local Landing

- **Title**: `{Service} in {City}, {State} — [Brand] | Free Quote`
- **H1**: `{Service} in {City}: Trusted Local Experts`
- **Min words**: 900

### Body Skeleton

- **§1 Hero answer** — 2-sentence direct answer scoped to city + county with same-day availability
- **§2 Local trust signals** — BBB rating, years serving city, customer count, Google review avg; Maps iframe of service area polygon
- **§3 Service breakdown** — 3-5 sub-services scoped to city context (climate, local regs, common issues); 80-120 words each
- **§4 Neighborhood coverage** — 8-12 neighborhoods/zip codes served; anchor-link to sub-area pages
- **§5 CTA + local FAQ** — 3 FAQs (JSON-LD FAQPage) specific to city (permits, cost vs state avg, local issues); closing CTA with `telephone` schema

### JSON-LD

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "{Brand} {City}",
  "address": { "@type": "PostalAddress", "addressLocality": "{City}", "addressRegion": "{State}" },
  "areaServed": { "@type": "City", "name": "{City}" },
  "hasOfferCatalog": { "@type": "OfferCatalog", "name": "{Service}" }
}
```

- Add `FAQPage` for 3 local FAQs — only real questions, never fabricated
- Add `BreadcrumbList`: Home → `/{state}/{service}` → `/{city}/{service}`

### Internal Link Strategy

- Parent breadcrumb → `/{state}/{service}` state hub
- Siblings → 2-3 neighboring city pages via "Also serving nearby…"
- Service root → `/services/{service}` in breadcrumb
- Accept inbound from: state hub, sitemap index, homepage service grid

---

## Type 2: `{Integration} × {Use-Case}` — SaaS Connector

- **Title**: `{Integration} + {Product}: {Use-Case} in 5 Minutes`
- **H1**: `Connect {Integration} to {Product} for {Use-Case}`
- **Min words**: 1100

### Body Skeleton

- **§1 Outcome first** — 3 specific numbered outcomes before setup prose
- **§2 How it works** — ASCII/SVG data-flow diagram; exact API endpoints/webhooks; auth method (OAuth2/API key/PAT)
- **§3 Step-by-step setup** — numbered steps with exact UI labels; include webhook payload code snippet
- **§4 Use-case recipes** — 3 concrete recipes: trigger + action + example payload; ~100 words each in tabs/accordion
- **§5 Limits + pricing** — rate limits from both APIs; which tiers unlock the integration; link to `/pricing`

### JSON-LD

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Connect {Integration} to {Product}",
  "step": [
    { "@type": "HowToStep", "name": "Step 1", "text": "..." }
  ],
  "tool": [{ "@type": "HowToTool", "name": "{Integration}" }]
}
```

- Add `estimatedCost` and `totalTime` on `HowTo` when data is available

### Internal Link Strategy

- Parent: `/integrations` hub + `/{integration}` overview page
- Siblings: 3 other use-case pages for same integration
- Cross-sell: `/pricing` (anchor "available on Pro+") + `/docs/{integration}`

---

## Type 3: `{Competitor} vs {Product}` — Competitive

- **Title**: `{Competitor} vs {Product} ({Year}): Honest Comparison`
- **H1**: `{Competitor} vs {Product}: Which Is Right for You?`
- **Min words**: 1400

### Body Skeleton

- **§1 TL;DR verdict** — 2-sentence verdict committing to a winner per use case; never hedge both ways
- **§2 Side-by-side table** — 8-12 features; columns: Feature | {Competitor} | {Product}; use ✓/✗/Partial; cover pricing, free plan, API, SSO, SLA, data residency, mobile, offline
- **§3 Deep dives** — 3-4 genuine differences; 150-200 words each; cite G2/Capterra review excerpts with author handle + date
- **§4 Migration guide** — export steps, import steps, estimated time, data fidelity notes; link to migration tool/doc
- **§5 Pricing comparison** — date-stamped pricing (refresh monthly via cron); TCO at 10/50/500 seats; surface hidden costs (SSO tax, overages, support tiers)

### JSON-LD

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "{Competitor} vs {Product} ({Year})",
  "dateModified": "{YYYY-MM-DD}",
  "author": { "@type": "Organization", "name": "{Brand}" }
}
```

- No `FAQPage` on competitive pages — G2/Capterra own that SERP feature
- `dateModified` must be accurate and auto-updated by regeneration cron, never hardcoded

### Internal Link Strategy

- Link to `/alternatives/to-{competitor}` (high-intent sibling)
- Link to `/pricing` anchor "see full pricing breakdown"
- Link to 2 feature pages where {Product} wins
- Accept inbound from `/alternatives` hub + home nav "Compare" section

---

## Type 4: `Alternative to {Competitor}` — Intent

- **Title**: `Best {Competitor} Alternatives ({Year}) — {Product} & 4 Others`
- **H1**: `{Competitor} Alternatives: Top 5 Picks for {Year}`
- **Min words**: 1200

### Body Skeleton

- **§1 Why people leave {Competitor}** — G2/Reddit verbatim pain points (cite source + date); 4-6 bullets; most-cited complaints only
- **§2 Alternatives ranked table** — 5 tools including {Product}; columns: Tool | Best for | Starting price | Free trial | G2 rating; {Product} in row 1 (disclose home field advantage)
- **§3 Detailed reviews** — 150 words/tool: what it does, who for, 2 pros, 2 cons, pricing; {Product} at 250 words
- **§4 Decision matrix** — "If you need X → use Y"; 6-8 scenarios; plain language
- **§5 FAQ** — 4 questions matching live Google PAA for "{Competitor} alternative"

### JSON-LD

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Best {Competitor} Alternatives",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "{Product}", "url": "https://..." }
  ]
}
```

- Add `FAQPage` alongside `ItemList` in a single `@graph` array
- `ListItem.url` must resolve 200; validate at generation time

### Internal Link Strategy

- Each alternative name → its `/{competitor-name}-vs-{product}` page if it exists
- `/pricing` anchor "see how pricing compares"
- Accept inbound from competitor comparison page + `/alternatives` hub

---

## Type 5: `{Template-Name} Template / Example` — Library

- **Title**: `Free {Template-Name} Template — {Product} | Download & Customize`
- **H1**: `{Template-Name} Template: Ready to Use in {Product}`
- **Min words**: 800

### Body Skeleton

- **§1 Live preview embed** — interactive iframe or screenshot carousel above the fold; CTA "Use this template" → signup with `?template={id}`
- **§2 What's included** — exhaustive bullet list of all components, sections, fields, automations
- **§3 Customization guide** — 4-6 steps with exact field/setting names; screenshots per step
- **§4 Use-case context** — 150 words: job titles, team sizes, industries; 1 real customer quote; no fabricated testimonials
- **§5 Related templates** — 4-6 siblings in same category; card grid with thumbnail + 1-line description

### JSON-LD

```json
{
  "@context": "https://schema.org",
  "@type": "CreativeWork",
  "name": "{Template-Name} Template",
  "creator": { "@type": "Organization", "name": "{Brand}" },
  "license": "https://creativecommons.org/licenses/by/4.0/"
}
```

- `isPartOf` pointing to `/templates/{category}` strengthens topical clustering

### Internal Link Strategy

- Parent: `/templates` hub + `/templates/{category}` (breadcrumb)
- Related: 4 sibling templates in card grid, not bare links
- Upsell: `/pricing` anchor "unlock all 200+ templates on Pro"

---

## Type 6: `{Tool} Pricing` — Calculator

- **Title**: `{Tool} Pricing ({Year}): Plans, Costs & Calculator`
- **H1**: `{Tool} Pricing: What You'll Actually Pay`
- **Min words**: 1000

### Body Skeleton

- **§1 Interactive calculator** — React or vanilla JS; inputs: seat count, usage volume, add-ons; output: monthly + annual; URL params on change (`?seats=50&plan=pro`)
- **§2 Plan comparison table** — all public plans; columns: Plan | Price/mo | Seats | Key features | API | SLA; flag "most popular"; date-stamp header
- **§3 Hidden costs breakdown** — SSO tax, overage rates, support tiers, data export fees, implementation fees; true cost at startup/growth/enterprise scale
- **§4 ROI framing** — time saved/week × avg hourly rate = annual value; conservative math; cite assumption source; ≤150 words
- **§5 FAQ + pricing guarantee** — 4 questions: free trial, plan changes, limit overages, nonprofit/startup discounts; add `FAQPage` JSON-LD

### JSON-LD

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is there a free trial?",
      "acceptedAnswer": { "@type": "Answer", "text": "..." }
    }
  ]
}
```

- Add `SoftwareApplication` with `offers` array (one `Offer` per plan) in the same `@graph`
- `offers[].price` must match live pricing — stale structured data triggers manual actions

### Internal Link Strategy

- Link to feature pages for each plan's marquee features
- Link to `/{competitor}-vs-{product}` for any competitor mentioned
- Accept inbound from: homepage pricing section, competitor pages, `/alternatives` hub

---

## Thin-Content Avoidance Rules (All Types)

- 800 words = absolute floor; 900+ local, 1100+ connector, 1400+ competitive
- Every page: 1 unique image (not stock), 1 citable data point, 1 internal link pointing TO it (no orphans)
- Never emit JSON-LD fields from template variables without verifying values exist — fake structured data triggers Google manual actions
- Date-stamp all pricing and comparison data; D1 refresh cron regenerates pages when source data changes (hash-check first)
- Pages with <3 unique sentences = thin-content risk; ≥5 genuinely unique facts not shared with siblings
- `content_hash` in D1 prevents regeneration when nothing changed — idempotent by default, critical at 10k+ page scale

---

## D1 Schema for pSEO Pages

```sql
CREATE TABLE pseo_pages (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('local','integration','competitive','alternative','template','pricing')),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  h1 TEXT NOT NULL,
  variables TEXT NOT NULL,       -- JSON: { city, service, competitor, ... }
  word_count INTEGER,
  last_generated_at INTEGER,
  content_hash TEXT,
  published INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX pseo_pages_type ON pseo_pages(type);
CREATE INDEX pseo_pages_slug ON pseo_pages(slug);
CREATE INDEX pseo_pages_published ON pseo_pages(published, type);
```

- `variables` JSON column drives template interpolation; validate with Zod at insertion time
- `published = 0` pages served only to authenticated admins; promote via `/admin/feature-flags`

---

## Generation Pipeline

- Fetch variable rows from D1 → interpolate template → Workers AI Llama 3.3 70B FP8 (free tier) for unique sentences → validate word count ≥ floor → compare `content_hash`
- Skip regeneration if hash unchanged
- On hash change: upsert D1 row → write to KV (`pseo:{slug}`) with 1h TTL → ping sitemap index endpoint
- Gate all pSEO routes behind feature flag `pseo_enabled` (`enabled=0, rollout=0, stage='experimental'`); promote to stable after manual QA on ≥10 representative pages
- Cron cadence: pricing/competitive → daily; local/template → weekly; integration → on upstream API changelog event

---

## Cloudflare Worker Route Pattern

```ts
// worker/routes/pseo.ts
app.get('/:type/:slug', async (c) => {
  if (!await isFlagOn(c.env, 'pseo_enabled', null, null)) return c.notFound()
  const cached = await c.env.KV.get(`pseo:${c.req.param('slug')}`, 'json')
  if (cached) return c.html(renderPseoPage(cached))
  const row = await c.env.DB.prepare('SELECT * FROM pseo_pages WHERE slug=? AND published=1')
    .bind(c.req.param('slug')).first()
  if (!row) return c.notFound()
  const html = renderPseoPage(row)
  await c.env.KV.put(`pseo:${c.req.param('slug')}`, JSON.stringify(row), { expirationTtl: 3600 })
  return c.html(html)
})
```

- 404 (not 403) for unpublished/flagged-off pages per `rules/feature-flags.md`
- KV cache absorbs the D1 read cost at scale; invalidate on cron regeneration

---

## Sitemap Integration

- pSEO pages emit into type-partitioned sitemaps: `/sitemap-local.xml`, `/sitemap-integrations.xml`, `/sitemap-competitive.xml`, etc.
- Each sitemap ≤ 50k URLs; split by D1 pagination if needed
- `<lastmod>` = `last_generated_at` ISO timestamp from D1 row — never hardcode
- Index sitemap at `/sitemap.xml` references all partitions; submit only the index to GSC
- See `[[dynamic-sitemap-from-d1]]` for the full D1-backed sitemap Worker implementation

---

## See Also

- `[[i18n-by-demographics]]` — auto-trigger locale mirrors when ACS B16001 ≥10% community share
- `[[page-set-expansion]]` — discover which pSEO types to build per org type before generation
- `[[dynamic-sitemap-from-d1]]` — D1-backed partitioned sitemaps with `<lastmod>` accuracy
