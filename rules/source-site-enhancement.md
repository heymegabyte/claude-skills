---
last_reviewed: 2026-06-29
superseded_by: null
name: "source-site-enhancement"
priority: 3
pack: "website-build"
triggers:
  - "rebuild"
  - "optimize"
  - "enhance"
  - "modernize"
  - "clone site"
paths:
  - "org:website_build"
---

# Source-Site Enhancement

Fires on `re(build|make|do)|rebuild|optimi[sz]ed?|enhanced?|upgraded?|modern(ize|ized)?|better version|clone|mirror|recreate` + domain prompt. Bare-domain prompts resolving 200 = enhancement mode (never homepage-only).

## Output set

- `union(SOURCE_URLS, STANDARD_PAGE_SET[org_type], DEMOGRAPHIC_LOCALES, AI_DISCOVERED_JEWELS)` minus `CRUFT_URLS`
- Each cruft URL → 301 to canonical
- Never just-source. Never just-standard. Always all three.

## Phase order (NON-NEGOTIABLE — every rebuild)

1. **`crawler`** → `_url_inventory.json` (sitemap.xml → robots.txt → HTML BFS → Wayback fallback → CMS index endpoints)
2. **`classify`** each URL into `keep|merge|301|drop`:
   - **keep** — unique content
   - **merge** — ≤200 words AND topically redundant with sibling
   - **301** — cruft (see CRUFT_PATTERNS)
   - **drop** — internal admin `/account|/cart|/checkout|/wp-admin`
3. **`org_type_infer`** via skill 02 (`nonprofit|saas|local|portfolio|gov|church|edu`)
4. **`gap_detect`** — diff source vs `STANDARD_PAGE_SET[org_type]` from `15-site-generation/page-set-expansion.md`; every missing page gets researched content (never stubbed)
5. **`jewels_discover`** — org-type-specific high-value absent pages:
   - nonprofit: `/parish-toolkit|/planned-giving|/financials|/annual-report|/donate/refurbish|/ways-to-give|/transcript|/alumni|/press|/testimonials|/partners`
   - saas: `/changelog|/security|/status|/integrations|/customers|/roadmap|/api-docs`
   - local: `/specials|/gallery|/team|/reviews|/insurance|/financing`
   - portfolio: `/now|/uses|/colophon|/reading-list`
6. **`i18n_expand`** per `i18n-by-demographics.md`
7. **`ia_normalize`** — flatten dupes, conditionally nest service routes, normalize Squarespace slugs, emit `_redirects` 301:
   - `/home`→`/`, `/blog-1`→`/blog`, `/our-mission-1`→`/about`, `/new-gallery-2`→`/gallery`, `/holiday-express-2`→`/holiday-express`
   - `/testpage|/new-page-*` → drop
   - `/health-clinic` → `/services/health-clinic` ONLY when org has 9+ services; keep flat otherwise
   - `/blog/2019/10/13/npnd379mz6gljrtr2l90bd7vdnf4cm` → `/blog/{semantic-slug-from-title}`

## CRUFT_PATTERNS (301 to canonical — NEVER ship live)

- `/home$`
- `/index\.(html?|php)$`
- `^/?wp-(content|admin|includes)`
- `/new-page-\d+$`
- `/test-?page$`
- `/page-\d+$`
- `/blog-1$`, `/blog-2$`
- `/-1$`, `/-2$`
- `.+-(copy|backup|old|draft|test|tmp)(-\d+)?$`
- `/[a-z]+-\d+$` when sibling `/[a-z]+` exists
- `/[a-f0-9]{20,}$`
- `/blog/\d{4}/\d{1,2}/\d{1,2}/[a-z0-9]{20,}$` (Squarespace random slugs)
- Build fails if any survive into deploy.

## JEWEL_RESEARCH (real content, never stub)

- Generate via Claude Opus 4.8 w/ org-type playbook
- Sources by org type:
  - **nonprofit** — Form 990 / Charity Navigator / GuideStar
  - **saas** — sec.gov 10-K + Crunchbase + G2
  - **local** — Google Places + Yelp + state-license-registry
  - **portfolio** — GitHub + LinkedIn + personal-blog scrape
- Every quantitative claim cited per `citations.md`
- Every contact entity (email/phone/address) hyperlinked per `always.md`
- Every page ships: ≥5 JSON-LD blocks + 5+ FAQ accordions + ≥2 outbound canonical links + ≥3 internal sibling links

## IA_NORMALIZE_RULES

- **Services nesting (conditional)**: ≤8 services → flat `/{service}`; 9+ services → `/services/{service}` + `/services` index
- Never force flat→nested rebuild for small orgs (needless 301 chains hurt SEO)
- **Legal isolation**: `/privacy|/terms|/accessibility` always top-level
- **Contact**: every site MUST have `/contact` — pull NAP from Places API + scrape + footer
- **Canonicals**: `/our-mission|/who-we-are|/about-us` → `/about`; `/our-team|/staff|/leadership` → `/team`; `/what-we-do|/how-we-do-it|/programs` → `/services` when appropriate

## SQUARESPACE_DEDUPE

- Squarespace JSON API returns canonical + random-id versions — keep canonical, drop random-id, emit 301
- Same applies to Wix `_compiler/page-data` dupes + WordPress `?p=123` permalinks

## HARD_GATE_PAGE_COUNT

- Deployed site MUST have `keep_count + standard_gap_count + jewel_count + locale_count*(keep+standard+jewel)` pages
- Nonprofits min: `keep + 14 standard + 10 jewels`
- njsk.org reference: 8 unique non-blog source + 14 standard + 10 jewels + 129 blog posts × 3 locales = ~480 routes
- Build fails when deployed-route-count < expected

## SUCCESS_DEFINITION

One-line `re(build|optimize|enhance) X.com` succeeds only when ALL are live:

- (a) Every source URL resolves OR 301s
- (b) Every standard-page-set entry for inferred org type has real content
- (c) Every demographic locale has full route mirror
- (d) Every jewel page has researched content + citations
- (e) IA normalized + cruft redirected + Squarespace dupes deduped

Anything less = prompt failed, not rebuild.

## Parallel-agent playbook (MONITOR-FIRE first tool-call — sequential = build fail)

Decompose within 30s into independent + dependent passes. Fan out parallel `Agent` spawns in a SINGLE multi-tool message.

### Canonical fan-out for `rebuild X.com`

1. **Agent-A `crawler`** → `_url_inventory.json` `{url, classification, org_type_hints[], original_status}`
2. **Agent-B `demographics`** → `_locales.json` `{locales[], hreflang_pairs[]}` via ACS B16001 on `_research.json.service_area`
3. **Agent-C `org-type-inferrer`** → `_org_type.json` via skill 02
4. **Agent-D `media-walker`** → `_assets/` + `_videos.json` + `_image_briefs.json`
5. **Agent-E `brand-extractor`** → `_brand.json` palette+fonts+tone via GPT Image 2 vision on homepage
6. **Agent-F..K `jewel-content-authors`** (one per jewel batch) → typed-block JSON
7. **Agent-L..N `i18n-translators`** (one per locale beyond English) → Workers AI Llama 3.3 70B first pass + Claude Opus 4.8 polish on top-10 conversion routes per `i18n-by-demographics.md`
8. **Agent-O `IA-normalizer`** → `_redirects` 301 manifest + slug rename map + service nesting from `_url_inventory.json`+`_org_type.json`
9. **Agent-P `squarespace-dedup`** → augment `_redirects` for CMS-specific dupes

### Execution sequencing

- **Main thread during agent wall-time**: write `PLAN.md` route tree + design tokens + media/file counts + validators list
- Fire Agent-D through Agent-P all parallel once Agent-A+B+C complete
- Fold outputs → build → deploy → verify per `verification-loop.md` once jewel-authors+translators complete
- NEVER `sleep|poll|tail` — completion notification driven
- Sub-agent prompts 100-300 words per `full-autonomy.md`

## Self-improvement closure (SAME TURN)

- Re-issued identical/near-identical rebuild prompt = monitor-orchestration shortcoming signal
- BEFORE doing requested work: append gap to `monitor-orchestration.md` § Known shortcomings + cross-link from relevant rule
- Rule update is part of the turn, never deferred
