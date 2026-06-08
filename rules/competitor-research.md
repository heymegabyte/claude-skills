# Competitor Research

Build starts BEFORE the brand brief. Identify top 5-10 sites the audience compares us to, score on 100-pt rubric, iterate until OUR site outscores EVERY competitor on EVERY dim by ≥15%. Without this gate we ship a guess.

Precedes `website-build-doctrine.md` Phase 0. Phase 0 gathers facts about OUR subject; this rule gathers facts about EVERYONE ELSE. Both complete before code.

## When fires
- Every one-line website prompt (`make a website for X`, `rebuild X.com`, `build a site for Y`) per `16-cinematic-website-prime-directive`
- Every site rebuild classifying as enhancement-mode per `source-site-enhancement.md`
- Every iteration of `website-build-doctrine.md` § Phase 6 "Continuous Self-Improvement Loop"

## Three non-skippable acts
1. **Identify** — top 5-10 audience-comparable sites. Org-type aware: nonprofit competitors = peer nonprofits + adjacent service orgs in same metro, NOT for-profit SaaS. Local = top-3 Google Business + top-3 Yelp in same ZIP. SaaS = 3-5 most-traffic'd direct per SimilarWeb + top-3 Google for primary keyphrase.
2. **Score** — 100-pt rubric (§ Rubric). Capture screenshots, route inventory, AI-vision scores, distinctive features, copy-paste-worthy patterns into `_competitors.json`.
3. **Beat** — design + build + iterate until OUR site outscores EVERY on EVERY dim by ≥15%. Phase 6 loop terminates ONLY when satisfied.

## Phase order (executes before `website-build-doctrine.md` Phase 0)

### 1. `competitor_identify`
- Org-type infer per `02-goal-and-brief` first
- Pull top 10 per per-org-type sources:
  - **Nonprofit** — Charity Navigator + GuideStar peers in same NTEE code, GreatNonprofits, Network for Good, Mighty Cause, peer Form 990 same-mission filters
  - **Local business** — Google Maps top-10 in service area (Places API `nearby` w/ type filter), Yelp top-10 by category + ZIP, Bing Local, Apple Maps Place Cards, BBB peer accreditees
  - **SaaS** — SimilarWeb top 10 by category, G2 top-rated, Capterra leaders, Product Hunt top-of-week, Google `"alternatives to {primary competitor}"` + `"vs {primary competitor}"`
  - **Portfolio** — Awwwards / SiteInspire / CSSDA winners in same craft, Dribbble + Behance top profiles same vertical, Twitter "best devsite of 2026" threads
  - **Restaurant / salon / medical / legal / retail** — Google Maps top-10 + Yelp top-10 + closest 3 chains
  - **Edu / gov / church** — peer institution within 50mi + same denomination/sector + national association directory
- Output: `_competitors.json` w/ `{domain, name, rank_source, rank_position, captured_at, why_a_competitor}`
- Cap at 10. Beyond, returns diminish; pick highest-leverage. Document cut.

### 2. `competitor_capture`
- Per `_competitors.json` entry, fire parallel `Agent` per `monitor-orchestration.md` § Decomposition (10 competitors = 10 parallel, never serialize)
- Per-agent task:
  - Full sitemap + robots crawl per `source-site-enhancement.md` § Phase 1 (BFS depth 3, every URL → `_competitors/{domain}/_url_inventory.json`)
  - Screenshot every distinct route via Browser Rendering REST API (`/screenshot` viewport 1920×1080 + 390×844) → `_competitors/{domain}/screenshots/{route}.{viewport}.png`
  - Key copy via `/content` REST → `_competitors/{domain}/{route}.md`
  - Wayback 1y + 3y ago → `_competitors/{domain}/wayback/`
  - Extract: brand palette (AI-vision OKLCH), fonts (`getComputedStyle` via `/scrape`), JSON-LD types, conversion paths (CTAs counted + categorized), AI-native features, tech stack (Wappalyzer signature)
- Headers + UA per `fetch-defaults.md` — real-browser fingerprint; CF-protected sites need Playwright/Chrome MCP fallback
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
10. **Distinctiveness** — does site blend in or stand out? AI vision compares against `_competitors/*/screenshots/` to score

#### Per-route
- Score EVERY captured route, not just homepage
- Per-competitor aggregate = mean across routes
- Across all competitors per-dim aggregate = MAX (we must beat the BEST on every dim)

### 4. `competitor_synthesize`
- For each dim where ANY competitor scores >85, write one-line directive to `_competitor_directives.md`: "On dim X, floor is Y/100 (set by {competitor}). Our build must hit ≥{Y+15}/100"
- For each AI-native feature on ANY competitor absent from 5+ others: "Match {feature} OR ship superior {alternative} (set by {competitor})"
- For each distinctive copy / layout pattern worth borrowing: one-paragraph note in `_competitor_inspiration.md` w/ screenshot path — never copy verbatim per `copy-writing.md` § anti-slop
- For each GAP no competitor filled: directive in `_competitor_gaps.md` — distinctive moat
- Synthesis becomes mandatory input to `website-build-doctrine.md` Phase 0 (saturation), Phase 1 (clone), Phase 2 (enrichment), Phase 3 (swap-out replace any section not beating competitors), Phase 4 (AI-native spiral)

## Loop termination (the gate)
- `website-build-doctrine.md` Phase 6 "Continuous Self-Improvement Loop" CANNOT exit until ALL TRUE:
  1. OUR per-dim score ≥ `_competitor_aggregate.json` MAX + 15 points on EVERY dim
  2. Every directive in `_competitor_directives.md` has implementation cited in PR/commit
  3. Every AI-native feature on any competitor matched or surpassed
  4. ≥3 entries from `_competitor_gaps.md` SHIPPED (we lead in markets they ignored)
  5. AI-vision QA at 6 viewports scores ≥8/10 AND outscores every competitor's same-route screenshot head-to-head
- Phase 6 re-scores OUR build on every iteration. If any of 5 fails, fire another improvement pass per `extra-mile.md` + `supreme-polish.md`
- Loop NOT allowed to terminate on time / token budget / "good enough" — only when 5-gate check passes
- Skipping = "shipped a guess" = build fail

## Token discipline
- Parallel `Agent` spawns per `monitor-orchestration.md` § Decomposition — 10 competitors = 10 sub-agents, 100-300 word brief each
- Sub-agents return ≤200-word summary; raw screenshots + scrapes stay in `_competitors/{domain}/`
- Re-scoring incremental — only re-render OUR changed routes via Browser Rendering, then AI-vision compare against cached competitor screenshots
- Browser Rendering REST API per `god-tier-engineering.md` § Pattern 9 — `/screenshot` + `/content` free up to CF quota
- Use `15-site-generation/research-pipeline` Conf<T> pattern so every rubric score cites screenshot + AI-vision prompt

## Storage
- `_competitors/{domain}/` per-competitor folder (gitignored: raw screenshots + scrapes large)
- `_competitor_aggregate.json` — floor (committed)
- `_competitor_directives.md` — design directives (committed)
- `_competitor_inspiration.md` — patterns worth borrowing (committed)
- `_competitor_gaps.md` — markets to own (committed)
- `_competitor_loop_log.ndjson` — every Phase 6 iteration's per-dim score + gate verdict (committed; auditable)

## See
- `website-build-doctrine.md` · `16-cinematic-website-prime-directive` · `02-goal-and-brief` · `09-brand-and-content-system` · `source-site-enhancement.md` · `fetch-defaults.md` · `monitor-orchestration.md` · `extra-mile.md` · `supreme-polish.md` · `citations.md` · `i18n-by-demographics.md` · `15-site-generation/research-pipeline` · `god-tier-engineering.md` · `brian-preferences.md`
