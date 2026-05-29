# Competitor Research (***SUPREME — every website build, every rebuild, every iteration — gate -1***)

The website build starts BEFORE the user's brand brief. It starts with the websites we have to beat. We do not design in a vacuum, we do not "make it nice", we do not "ship and iterate". We identify the top 5–10 sites our user's audience would compare us to, we score each on a 100-point rubric, and we keep iterating until OUR site outscores EVERY competitor on EVERY dimension by ≥15%. Without this gate the build is shipping a guess, not a winner.

This rule precedes [[website-build-doctrine]] Phase 0. Phase 0 (context saturation) gathers facts about OUR subject; this rule gathers facts about EVERYONE ELSE doing the same thing. Both must be complete before code.

## When this fires
- Every one-line website prompt (`make a website for X`, `rebuild X.com`, `build a site for Y`) per [[16-cinematic-website-prime-directive]]
- Every site rebuild that classifies as enhancement-mode per [[source-site-enhancement]]
- Every iteration of [[website-build-doctrine]] § Phase 6 "Continuous Self-Improvement Loop" — re-scores competitors on every loop pass; the loop is NOT allowed to exit until OUR site beats them all

## The mandate — three non-skippable acts
1. **Identify** — list the top 5–10 sites the audience would compare to OUR build. Org-type aware: a nonprofit's competitors are peer nonprofits + adjacent service orgs in the same metro, NOT for-profit SaaS. A local-business competitor is the top-3 Google Business listings + the top-3 Yelp listings in the same ZIP. A SaaS competitor is the 3-5 most-traffic'd direct competitors per SimilarWeb + the top-3 Google search results for the primary keyphrase
2. **Score** — render each competitor on a 100-point rubric (see § Rubric). Capture screenshots, route inventory, AI-vision rubric scores, distinctive features, and copy-paste-worthy patterns into `_competitors.json`
3. **Beat** — design + build + iterate until OUR site outscores EVERY competitor on EVERY rubric dimension by ≥15%. Phase 6 self-improvement loop terminates ONLY when this gate is satisfied

## Phase order (***executes before [[website-build-doctrine]] Phase 0***)

### 1. `competitor_identify` — produce the list
- Org-type infer per [[02-goal-and-brief]] first (nonprofit / local-business / saas / portfolio / edu / gov / church / restaurant / salon / medical / legal / retail)
- Pull the top 10 candidates from per-org-type sources:
  - **Nonprofit** — Charity Navigator + GuideStar peers in the same NTEE code, GreatNonprofits, Network for Good, Mighty Cause, peer Form 990 same-mission filters
  - **Local business** — Google Maps top-10 in service area (Places API `nearby` with type filter), Yelp top-10 by category + ZIP, Bing Local, Apple Maps Place Cards, BBB peer accreditees
  - **SaaS** — SimilarWeb top 10 by category, G2 top-rated in category, Capterra leaders, Product Hunt top-of-week in the niche, Google search for `"alternatives to {primary competitor}"` + `"vs {primary competitor}"`
  - **Portfolio** — Awwwards / SiteInspire / CSSDA winners in same craft (designer / engineer / writer / photographer), Dribbble + Behance top profiles same vertical, Twitter "best devsite of 2026"-style threads
  - **Restaurant / salon / medical / legal / retail** — Google Maps top-10 + Yelp top-10 in service area + the closest 3 with national-brand recognition (chains in proximity)
  - **Edu / gov / church** — peer institution within 50mi + same denomination/sector + national association directory listings (NAIS, NCEA, etc.)
- Output: `_competitors.json` with `{domain, name, rank_source, rank_position, captured_at, why_a_competitor}` entries
- Cap at 10. Beyond that, returns diminish; pick the 10 highest-leverage. Document the cut.

### 2. `competitor_capture` — load each site into context
- For each `_competitors.json` entry, fire a parallel `Agent` per [[monitor-orchestration]] § Decomposition (10 competitors = 10 parallel agents; never serialize)
- Per-agent task:
  - Full sitemap + robots crawl per [[source-site-enhancement]] § Phase 1 (BFS to depth 3, capture every URL into `_competitors/{domain}/_url_inventory.json`)
  - Screenshot every distinct route via Browser Rendering REST API (`/screenshot` w/ viewport 1920x1080 desktop + 390x844 mobile) → `_competitors/{domain}/screenshots/{route}.{viewport}.png`
  - Capture key copy via `/content` REST endpoint → `_competitors/{domain}/{route}.md`
  - Wayback snapshot 1y ago + 3y ago to spot evolution trajectory → `_competitors/{domain}/wayback/`
  - Extract: brand palette (AI-vision OKLCH), fonts (`getComputedStyle` via `/scrape`), JSON-LD types present, conversion paths (CTAs counted + categorized), AI-native features (chat? voice? generative? interactive maps? podcasts?), tech stack (Wappalyzer signature via headers + script srcs)
- Headers + UA per [[fetch-defaults]] — real-browser fingerprint; Cloudflare-protected sites need Playwright/Chrome MCP fallback
- Persist everything under `_competitors/{domain}/` — gitignored except for the digest

### 3. `competitor_score` — apply the 100-point rubric to every captured site
- Run [[09-brand-and-content-system]] AI-vision rubric + a competitor-specific addendum on EVERY captured route, ALL viewports
- Output: per-competitor `_competitors/{domain}/_score.json` with per-dimension scores 0-100 and the overall composite
- Aggregate: `_competitor_aggregate.json` with per-dimension MAX score across all competitors — this is the floor OUR build must clear by ≥15%

#### Rubric (100 points across 10 dimensions, 10 each)
1. **Visual polish** — typography hierarchy, color discipline, brand consistency, whitespace, kinetic motion quality
2. **Information architecture** — route count appropriate to org-type per [[15-site-generation/page-set-expansion]], navigation discoverability, breadcrumb sanity, internal linking density
3. **Copy quality** — Flesch ≥60, banned-slop-word density per [[copy-writing]], specific-not-generic claims, citation density per [[citations]], voice consistency
4. **Conversion craft** — clarity of primary CTA, secondary-CTA hierarchy, trust signals visible above the fold, friction count to convert, sticky-CTA presence
5. **SEO + AI-search readiness** — JSON-LD richness per [[always]], FAQPage presence, OG card branding (custom not scraped), hreflang per [[i18n-by-demographics]], llms.txt presence, sitemap freshness
6. **Performance + Core Web Vitals** — LCP, CLS, INP measured via PageSpeed Insights API; budget per [[quality-metrics]]
7. **Accessibility** — axe-core violations at 6 viewports, contrast ratios, keyboard nav, focus visibility, WCAG 2.2 AA gates per [[always]]
8. **Trust + authority** — real-person bios w/ `Person` JSON-LD + `sameAs`, real testimonials w/ verifiable attribution, license/accreditation badges, EEAT signals, security.txt + privacy/terms presence
9. **AI-native features** — generative content quality, voice/chat interfaces, interactive maps, personalization, podcast snippets, AI search optimization
10. **Distinctiveness** — does this site look like 100 other sites in its category, or does it have a unique design language? Use AI vision to compare against `_competitors/*/screenshots/` to score "blends in" vs "stands out"

#### Per-route scoring
- Score EVERY captured route, not just the homepage
- Aggregate per-competitor = mean across routes
- Aggregate across all competitors per-dimension = MAX (we must beat the BEST competitor on every dimension, not the average)

### 4. `competitor_synthesize` — translate research into design directives
- For each rubric dimension where ANY competitor scores >85, write a one-line directive to `_competitor_directives.md`: "On dimension X, the floor is Y/100 (set by {competitor}). Our build must hit ≥{Y+15}/100"
- For each AI-native feature found on ANY competitor that's absent from the 5+ others, write a directive: "Match {feature} OR ship a superior {alternative} on our site (set by {competitor})"
- For each distinctive copy / layout pattern worth borrowing, capture as a one-paragraph note in `_competitor_inspiration.md` with the screenshot path — never copy verbatim per [[copy-writing]] § anti-slop, but use as a starting point
- For each GAP that no competitor has filled (markets we can own outright), write a directive in `_competitor_gaps.md` — these become our distinctive moat
- The synthesis becomes mandatory input to [[website-build-doctrine]] Phase 0 (context saturation), Phase 1 (template clone), Phase 2 (maximalist enrichment), Phase 3 (swap-out authority — replace any section that doesn't beat competitors), Phase 4 (AI-native spiral)

## Loop termination (***the gate***)
- [[website-build-doctrine]] Phase 6 "Continuous Self-Improvement Loop" CANNOT exit until ALL of these are TRUE:
  1. OUR site's per-dimension rubric score ≥ `_competitor_aggregate.json` MAX + 15 points on EVERY dimension
  2. Every directive in `_competitor_directives.md` has a corresponding implementation cited in the PR/commit
  3. Every AI-native feature found on any competitor has been matched or surpassed
  4. AT LEAST 3 entries from `_competitor_gaps.md` are SHIPPED on OUR build (we lead in markets they ignored)
  5. AI-vision QA at 6 viewports scores ≥8/10 against our own rubric AND outscores every competitor's same-route screenshot in a head-to-head AI-vision comparison
- Phase 6 self-rescores OUR build on every loop iteration. If any of the 5 gates fails, the loop fires another improvement pass per [[extra-mile]] + [[supreme-polish]]
- The loop is not allowed to terminate based on time, token budget, or "good enough" — only when the 5-gate check passes
- Skipping the gate = "we shipped a guess" = build fail

## Token discipline (how to do this without burning context)
- Parallel `Agent` spawns per [[monitor-orchestration]] § Decomposition — 10 competitors = 10 sub-agents, each gets 100-300 word brief
- Sub-agents return ≤200-word summary to main thread; raw screenshots + scrapes stay in `_competitors/{domain}/`
- Re-scoring on each Phase 6 loop iteration is incremental — only re-render OUR changed routes via Browser Rendering, then AI-vision compare against the cached competitor screenshots
- Browser Rendering REST API per [[god-tier-engineering]] § Pattern 9 — `/screenshot` + `/content` are free up to Cloudflare's quota; saturate them
- Use [[15-site-generation/research-pipeline]] Conf<T> pattern so every rubric score carries a citation back to the screenshot + the AI-vision-judgment prompt

## When this rule does NOT fire
- Internal tooling builds (admin dashboards, internal CRUD apps) — no public-facing audience, no competitors to beat
- Pure documentation sites where the comparison is "is the documentation right" not "is the site better than another"
- Throwaway / prototype builds explicitly tagged `--prototype` or in a `prototypes/` folder

## Storage
- `_competitors/{domain}/` per-competitor folder under the project root (gitignored: raw screenshots + scrapes are large)
- `_competitor_aggregate.json` — the floor we must clear (committed)
- `_competitor_directives.md` — design directives (committed)
- `_competitor_inspiration.md` — patterns worth borrowing (committed)
- `_competitor_gaps.md` — markets to own (committed)
- `_competitor_loop_log.ndjson` — every Phase 6 iteration's per-dimension score for OUR build + the gate-check verdict (committed; auditable history)

## Reference incident (***to be filled on first invocation***)
- Will be written the first time a build uses this rule end-to-end
- Capture: org type, # competitors identified, top competitor's overall score, # Phase 6 iterations until gate passed, distinctive markers we shipped that competitors lacked

## See
- [[website-build-doctrine]] — Phase 0 (saturation) consumes this rule's outputs; Phase 6 (self-improvement) terminates on this rule's gate
- [[16-cinematic-website-prime-directive]] — every one-line site prompt fires this rule first
- [[02-goal-and-brief]] — org-type inference drives the competitor-source choice
- [[09-brand-and-content-system]] — AI-vision rubric extension lives here
- [[source-site-enhancement]] — same crawl protocol as competitor capture (sitemap + robots + Wayback)
- [[fetch-defaults]] — realistic UA for the capture step
- [[monitor-orchestration]] — parallel sub-agent fan-out (10 competitors in parallel, never serial)
- [[extra-mile]] + [[supreme-polish]] — improvement-pass mechanics the loop uses
- [[citations]] — every quantitative competitor claim cites its source screenshot
- [[i18n-by-demographics]] — if competitors serve a multilingual community and we don't, that's a directive
- [[15-site-generation/research-pipeline]] — Conf<T> pattern for rubric scores
- [[god-tier-engineering]] — Browser Rendering REST API for parallel screenshot capture
- [[brian-preferences]] — "How to improve? always find 50 more things, explore every branch, never cap effort" — the loop termination gate operationalizes this for website builds
