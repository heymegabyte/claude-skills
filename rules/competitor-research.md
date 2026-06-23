---
name: "competitor-research"
priority: 3
pack: "website-build"
triggers:
  - "competitor"
  - "benchmark"
  - "rebuild"
paths:
  - "org:website_build"
---

# Competitor Research

Identify top 5-10 audience-comparable sites, score on 100-pt rubric, iterate until OUR site outscores EVERY competitor on EVERY dim by ≥15%. Skipping = build fail.

Precedes `website-build-doctrine.md` Phase 0. Phase 0 gathers facts about OUR subject; this gathers facts about EVERYONE ELSE. Both complete before code.

## When fires

- Every one-line website prompt per `16-cinematic-website-prime-directive`
- Every site rebuild classifying as enhancement-mode per `source-site-enhancement.md`
- Every iteration of `website-build-doctrine.md` § Phase 6

## Three non-skippable acts

1. **Identify** — top 5-10 audience-comparable sites. Org-type aware: nonprofit = peer nonprofits + adjacent service orgs same metro. Local = top-3 Google Business + top-3 Yelp same ZIP. SaaS = 3-5 most-traffic'd direct per SimilarWeb + top-3 Google primary keyphrase.
2. **Score** — 100-pt rubric (§ Rubric). Capture screenshots, route inventory, AI-vision scores, distinctive features, copy-paste-worthy patterns into `_competitors.json`.
3. **Beat** — design + build + iterate until OUR site outscores EVERY on EVERY dim by ≥15%. Phase 6 loop terminates ONLY when satisfied.

## Phase order

### 1. `competitor_identify`

- Org-type infer per `02-goal-and-brief` first
- Pull top 10 per org-type:
  - **Nonprofit** — Charity Navigator + GuideStar peers same NTEE code, GreatNonprofits, Network for Good, Mighty Cause, peer Form 990 same-mission filters
  - **Local business** — Google Maps top-10 in service area (Places API `nearby` w/ type filter), Yelp top-10 by category + ZIP, Bing Local, Apple Maps Place Cards, BBB peer accreditees
  - **SaaS** — SimilarWeb top 10 by category, G2 top-rated, Capterra leaders, Product Hunt top-of-week, Google `"alternatives to {primary competitor}"` + `"vs {primary competitor}"`
  - **Portfolio** — Awwwards / SiteInspire / CSSDA winners same craft, Dribbble + Behance top profiles same vertical
  - **Restaurant / salon / medical / legal / retail** — Google Maps top-10 + Yelp top-10 + closest 3 chains
  - **Edu / gov / church** — peer institution within 50mi + same denomination/sector + national association directory
- Output: `_competitors.json` w/ `{domain, name, rank_source, rank_position, captured_at, why_a_competitor}`
- Cap at 10. Document cuts.

### 2. `competitor_capture`

- Fire parallel `Agent` per `monitor-orchestration.md` § Decomposition (10 competitors = 10 parallel)
- Per-agent task:
  - Full sitemap + robots crawl per `source-site-enhancement.md` § Phase 1 (BFS depth 3) → `_competitors/{domain}/_url_inventory.json`
  - Screenshot every distinct route via Browser Rendering REST API (`/screenshot` viewport 1920×1080 + 390×844) → `_competitors/{domain}/screenshots/{route}.{viewport}.png`
  - Key copy via `/content` REST → `_competitors/{domain}/{route}.md`
  - Wayback 1y + 3y → `_competitors/{domain}/wayback/`
  - Extract: brand palette (AI-vision OKLCH), fonts (`getComputedStyle` via `/scrape`), JSON-LD types, conversion paths (CTAs counted + categorized), AI-native features, tech stack (Wappalyzer signature)
- Headers + UA per `fetch-defaults.md`; CF-protected sites need Playwright/Chrome MCP fallback
- Persist under `_competitors/{domain}/` — gitignored except digest

### 3. `competitor_score`

- Run `09-brand-and-content-system` AI-vision rubric + competitor-specific addendum on EVERY captured route, ALL viewports
- Output: per-competitor `_competitors/{domain}/_score.json` w/ per-dim scores 0-100 + overall composite
- Aggregate: `_competitor_aggregate.json` w/ per-dim MAX across all — the floor we must clear by ≥15%

#### Rubric (100 pts, 10 dims × 10 each)

1. **Visual polish** — typography hierarchy, color discipline, brand consistency, whitespace, motion quality
2. **IA** — route count per org-type, navigation discoverability, breadcrumb sanity, internal linking density
3. **Copy** — Flesch ≥60, banned-slop density per `copy-writing.md`, specific-not-generic claims, citation density per `citations.md`, voice consistency
4. **Conversion** — clarity of primary CTA, secondary-CTA hierarchy, trust signals above fold, friction count, sticky-CTA presence
5. **SEO + AI-search** — JSON-LD richness per `always.md`, FAQPage presence, OG card branding, hreflang per `i18n-by-demographics.md`, llms.txt, sitemap freshness
6. **Perf** — LCP, CLS, INP via PageSpeed Insights API; budget per `quality-metrics.md`
7. **A11y** — axe violations at 6 viewports, contrast, keyboard nav, focus visibility, WCAG 2.2 AA per `always.md`
8. **Trust** — real-person bios w/ `Person` JSON-LD + `sameAs`, real testimonials w/ verifiable attribution, license/accreditation badges, EEAT, security.txt + privacy/terms
9. **AI-native features** — generative content quality, voice/chat interfaces, interactive maps, personalization, podcast snippets, AI search optimization
10. **Distinctiveness** — AI vision compares against `_competitors/*/screenshots/` to score

#### Per-route scoring

- Score EVERY captured route, not just homepage
- Per-competitor aggregate = mean across routes
- Across all competitors per-dim aggregate = MAX (we must beat the BEST on every dim)

### 4. `competitor_synthesize`

- For each dim where ANY competitor scores >85, write one-line directive to `_competitor_directives.md`: "On dim X, floor is Y/100 (set by {competitor}). Our build must hit ≥{Y+15}/100"
- For each AI-native feature on ANY competitor absent from 5+ others: "Match {feature} OR ship superior {alternative} (set by {competitor})"
- For each distinctive copy/layout pattern worth borrowing: one-paragraph note in `_competitor_inspiration.md` w/ screenshot path — never copy verbatim per `copy-writing.md` § anti-slop
- For each GAP no competitor filled: directive in `_competitor_gaps.md` — distinctive moat
- Synthesis is mandatory input to `website-build-doctrine.md` Phases 0, 1, 2, 3, 4

## Loop termination gate

`website-build-doctrine.md` Phase 6 CANNOT exit until ALL TRUE:

1. OUR per-dim score ≥ `_competitor_aggregate.json` MAX + 15 points on EVERY dim
2. Every directive in `_competitor_directives.md` has implementation cited in PR/commit
3. Every AI-native feature on any competitor matched or surpassed
4. ≥3 entries from `_competitor_gaps.md` SHIPPED
5. AI-vision QA at 6 viewports scores ≥8/10 AND outscores every competitor's same-route screenshot head-to-head

Phase 6 re-scores OUR build every iteration. Any failed gate → fire another improvement pass per `extra-mile.md` + `supreme-polish.md`. Loop NOT allowed to terminate on time/token budget/"good enough."

## Token discipline

- 10 competitors = 10 sub-agents (100-300 word brief each), return ≤200-word summary
- Raw screenshots + scrapes stay in `_competitors/{domain}/`
- Re-scoring incremental — only re-render OUR changed routes via Browser Rendering, compare against cached competitor screenshots
- Browser Rendering REST API per `god-tier-engineering.md` § Pattern 9 — `/screenshot` + `/content` free up to CF quota
- Use `15-site-generation/research-pipeline` Conf<T> pattern so every rubric score cites screenshot + AI-vision prompt

## Storage

- `_competitors/{domain}/` per-competitor folder (gitignored: raw screenshots + scrapes)
- `_competitor_aggregate.json` — floor (committed)
- `_competitor_directives.md` — design directives (committed)
- `_competitor_inspiration.md` — patterns worth borrowing (committed)
- `_competitor_gaps.md` — markets to own (committed)
- `_competitor_loop_log.ndjson` — every Phase 6 iteration's per-dim score + gate verdict (committed; auditable)
