---
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

Fires on every `re(build|make|do)|rebuild|optimi[sz]ed?|enhanced?|upgraded?|modern(ize|ized)?|better version|clone|mirror|recreate` + domain prompt. Bare-domain prompts when domain resolves 200 = enhancement mode (never homepage-only).

## Output set

- `union(SOURCE_URLS, STANDARD_PAGE_SET[org_type], DEMOGRAPHIC_LOCALES, AI_DISCOVERED_JEWELS)` minus `CRUFT_URLS`
- Each cruft URL → 301 to canonical
- Never just-source. Never just-standard. Always all three.

## Phase order (NON-NEGOTIABLE — every rebuild)

1. **`crawler`** → `_url_inventory.json` (sitemap.xml → robots.txt → HTML BFS → Wayback fallback → CMS index endpoints)
2. **`classify`** each URL into `keep|merge|301|drop`:
   - keep = unique content
   - merge = ≤200 words AND topically redundant with sibling
   - 301 = cruft (see CRUFT_PATTERNS)
   - drop = internal admin like `/account|/cart|/checkout|/wp-admin`
3. **`org_type_infer`** via skill 02 (nonprofit|saas|local|portfolio|gov|church|edu)
4. **`gap_detect`** — diff source page-set vs `STANDARD_PAGE_SET[org_type]` from `15-site-generation/page-set-expansion.md`; every missing standard page gets researched content (never stubbed)
5. **`jewels_discover`** — org-type-specific high-value absent pages:
   - nonprofit: `/parish-toolkit|/planned-giving|/financials|/annual-report|/donate/refurbish|/ways-to-give|/transcript|/alumni|/press|/testimonials|/partners`
   - saas: `/changelog|/security|/status|/integrations|/customers|/roadmap|/api-docs`
   - local: `/specials|/gallery|/team|/reviews|/insurance|/financing`
   - portfolio: `/now|/uses|/colophon|/reading-list`
6. **`i18n_expand`** per `i18n-by-demographics.md`
7. **`ia_normalize`** — flatten dupes, conditionally nest service routes, normalize Squarespace slugs, emit `_redirects` 301:
   - `/home`→`/`, `/blog-1`→`/blog`, `/our-mission-1`→`/about`, `/new-gallery-2`→`/gallery`, `/holiday-express-2`→`/holiday-express`
   - `/testpage|/new-page-*` → drop
   - `/health-clinic` → `/services/health-clinic` ONLY when org has 9+ services; otherwise keep flat
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
- Fail build if any survive into deploy.

## JEWEL_RESEARCH (each gap page real content, never stub)

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

- **Services nesting (conditional)**:
  - ≤8 services → keep flat `/{service}` URLs
  - 9+ services → nest under `/services/{service}` + create index `/services` listing all
  - Either way: emit clean URLs; never force flat→nested rebuild for small orgs (needless 301 chains hurt SEO during transition)
- **Legal isolation**: `/privacy|/terms|/accessibility` always top-level, not footer-only
- **Contact dedicated**: every site MUST have `/contact` even if source lacks — pull NAP from Places API + scrape + footer
- **About dedicated**: `/our-mission|/who-we-are|/about-us` → canonical `/about`
- **Team dedicated**: `/our-team|/staff|/leadership` → `/team`
- **Services rename**: `/what-we-do|/how-we-do-it|/programs` → `/services` when appropriate

## SQUARESPACE_DEDUPE

- Squarespace JSON API returns BOTH canonical + random-id versions — keep canonical, drop random-id, emit 301 for random-id URL
- Example: `/blog/2019/10/13/npnd379mz6gljrtr2l90bd7vdnf4cm` 301 → `/blog/{actual-title-slug}`
- Same applies to Wix `_compiler/page-data` dupes + Wordpress `?p=123` permalinks

## HARD_GATE_PAGE_COUNT

- Deployed site MUST have `keep_count + standard_gap_count + jewel_count + locale_count*(keep+standard+jewel)` pages
- `keep_count = SOURCE_URLS.filter(c=>c.classification==='keep').length`
- Nonprofits min: `keep + 14 standard + 10 jewels`
- njsk.org reference: 8 unique non-blog source + 14 standard + 10 jewels + 129 blog posts × 3 locales = ~480 routes
- Build fails when deployed-route-count < expected

## SUCCESS_DEFINITION

One-line `re(build|optimize|enhance) X.com` produces deployed site where:

- (a) Every source URL resolves to live content OR 301
- (b) Every standard-page-set entry for inferred org type is live w/ real content
- (c) Every demographic locale has full route mirror
- (d) Every jewel page exists with researched content + citations
- (e) IA normalized + cruft redirected + Squarespace dupes deduped

Anything less = prompt failed, not rebuild.

## Parallel-agent playbook (MONITOR-FIRE first tool-call — sequential = build fail)

Rebuild prompts trigger `monitor-orchestration.md` per `always.md` line 10. Monitor decomposes within 30sec into independent + dependent passes. Independent passes fan out as parallel `Agent` spawns in SINGLE multi-tool message — never serialize.

### Canonical fan-out for `rebuild X.com`

1. **Agent-A `crawler`** — sitemap+robots+HTML BFS+Wayback → `_url_inventory.json` w/ `{url, classification, org_type_hints[], original_status}`
2. **Agent-B `demographics`** — ACS B16001 on `_research.json.service_area` → `_locales.json` `{locales[], hreflang_pairs[]}`
3. **Agent-C `org-type-inferrer`** — skill 02 inference from prompt+domain+`_research.json.category` → `_org_type.json`
4. **Agent-D `media-walker`** — image+video+PDF+logo extraction → `_assets/` + `_videos.json` + `_image_briefs.json`
5. **Agent-E `brand-extractor`** — GPT Image 2 vision on homepage → `_brand.json` palette+fonts+tone
6. **Agent-F..K `jewel-content-authors`** (one per jewel batch) → 2-3 jewel page contents as typed-block JSON
7. **Agent-L..N `i18n-translators`** (one per locale beyond English) → `/{locale}/*` translated via Workers AI Llama 3.3 70B first pass + Claude Opus 4.8 polish on top-10 conversion routes per `i18n-by-demographics.md`
8. **Agent-O `IA-normalizer`** — consume `_url_inventory.json`+`_org_type.json` → `_redirects` 301 manifest + slug rename map + service-hierarchy nesting
9. **Agent-P `squarespace-dedup`** — CMS-specific dupe detection (Squarespace random-IDs, Wix `_compiler/page-data`, WP `?p=`) → augment `_redirects`

### Execution sequencing

- Foreground (main thread during agent wall-time): write `PLAN.md` route tree + design tokens + media/file counts + validators list
- Once Agent-A+B+C complete (prerequisites), fire Agent-D through Agent-P all parallel
- Once jewel-authors+translators complete, fold outputs into `<boltArtifact>` envelope, build, deploy, verify per `verification-loop.md`
- NEVER `sleep|poll|tail` agent files — completion notification driven
- Sub-agent prompts 100-300 words per `full-autonomy.md`

## Self-improvement closure (SAME TURN)

- Re-issued identical/near-identical rebuild prompt = monitor-orchestration shortcoming-signal
- BEFORE doing requested work: append gap to `monitor-orchestration.md` § Known shortcomings AND cross-link from relevant rule
- Rule update part of turn, never deferred
- Per `brian-preferences.md` "How to improve? → always find 50 more things, explore every branch, never cap effort" — exhaust improvement surface in-turn
