# Source-Site Enhancement (***UNIVERSAL — every "rebuild X.com" / "optimized version of X" / "enhanced njsk.org" prompt***)

## When this fires
- Phrase detect: `re(build|make|do)|rebuild|optimi[sz]ed?|enhanced?|upgraded?|modern(ize|ized)?|better version|clone|mirror|recreate` + domain
- Bare-domain prompts when the domain resolves 200 (source exists ⇒ enhancement mode by default, never homepage-only)

## Output set
- `union(SOURCE_URLS, STANDARD_PAGE_SET[org_type], DEMOGRAPHIC_LOCALES, AI_DISCOVERED_JEWELS)` minus `CRUFT_URLS`
- Each cruft URL → 301 to canonical
- Never just-source. Never just-standard. Always all three sets.

## Phase order (***NON-NEGOTIABLE — every rebuild***)
1. **`crawler`** → `_url_inventory.json` (sitemap.xml → robots.txt → HTML BFS → Wayback fallback → CMS index endpoints)
2. **`classify`** each URL into `keep|merge|301|drop`
   - `keep` = unique content
   - `merge` = ≤200 words AND topically redundant with sibling
   - `301` = cruft (see CRUFT_PATTERNS)
   - `drop` = internal admin like `/account|/cart|/checkout|/wp-admin`
3. **`org_type_infer`** via skill 02 (nonprofit|saas|local|portfolio|gov|church|edu)
4. **`gap_detect`** — diff source page-set against `STANDARD_PAGE_SET[org_type]` from `15-site-generation/page-set-expansion.md`; every missing standard page gets researched content (never stubbed)
5. **`jewels_discover`** — org-type-specific high-value pages absent from source but standard in best-in-class peers:
   - nonprofit: `/parish-toolkit|/planned-giving|/financials|/annual-report|/donate/refurbish|/ways-to-give|/transcript|/alumni|/press|/testimonials|/partners`
   - saas: `/changelog|/security|/status|/integrations|/customers|/roadmap|/api-docs`
   - local: `/specials|/gallery|/team|/reviews|/insurance|/financing`
   - portfolio: `/now|/uses|/colophon|/reading-list`
6. **`i18n_expand`** per [[i18n-by-demographics]]
7. **`ia_normalize`** — flatten dupes, conditionally nest service routes (see IA_NORMALIZE_RULES), normalize Squarespace slugs, emit `_redirects` 301 for every URL change
   - `/home`→`/`, `/blog-1`→`/blog`, `/our-mission-1`→`/about`, `/new-gallery-2`→`/gallery`, `/holiday-express-2`→`/holiday-express`
   - `/testpage|/new-page-*` → drop
   - `/health-clinic` → `/services/health-clinic` ONLY when org has 9+ services; otherwise keep flat
   - `/blog/2019/10/13/npnd379mz6gljrtr2l90bd7vdnf4cm` → `/blog/{semantic-slug-from-title}`

## CRUFT_PATTERNS (***301 to canonical — NEVER ship as live route***)
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

## JEWEL_RESEARCH (***each gap page gets real content, never stub***)
- Generate via Claude Opus 4.7 with org-type playbook
- Sources by org type:
  - **nonprofit** — Form 990 / Charity Navigator / GuideStar
  - **saas** — sec.gov 10-K + Crunchbase + G2
  - **local** — Google Places + Yelp + state-license-registry
  - **portfolio** — GitHub + LinkedIn + personal-blog scrape
- Every quantitative claim cited per [[citations]]
- Every contact entity (email/phone/address) hyperlinked per [[always]]
- Every page ships: ≥5 JSON-LD blocks + 5+ FAQ accordions + ≥2 outbound canonical links + ≥3 internal sibling links

## IA_NORMALIZE_RULES
- **Services nesting (conditional)**:
  - ≤8 services → keep flat `/{service}` URLs (e.g., `/health-clinic`, `/dining-hall`)
  - 9+ services → nest under `/services/{service}` + create index `/services` listing all
  - Either way: emit clean URLs; never force a rebuild from flat→nested for small orgs (creates needless 301 chains that hurt SEO during transition)
- **Legal isolation**: `/privacy|/terms|/accessibility` always top-level, not footer-only
- **Contact dedicated**: every site MUST have `/contact` even if source lacks one — pull NAP from Places API + scrape + footer
- **About dedicated**: `/our-mission|/who-we-are|/about-us` → canonical `/about`
- **Team dedicated**: `/our-team|/staff|/leadership` → `/team`
- **Services rename**: `/what-we-do|/how-we-do-it|/programs` → `/services` when appropriate per org type

## SQUARESPACE_DEDUPE
- Squarespace JSON API returns BOTH canonical + random-id versions of every post — keep canonical, drop random-id, emit 301 for the random-id URL
- Example: `/blog/2019/10/13/npnd379mz6gljrtr2l90bd7vdnf4cm` 301 → `/blog/{actual-title-slug}`
- Same applies to Wix `_compiler/page-data` dupes + Wordpress `?p=123` permalinks

## HARD_GATE_PAGE_COUNT
- Deployed site MUST have `keep_count + standard_gap_count + jewel_count + locale_count*(keep+standard+jewel)` pages
- `keep_count = SOURCE_URLS.filter(c=>c.classification==='keep').length`
- Nonprofits min: `keep + 14 standard + 10 jewels`
- njsk.org reference: 8 unique non-blog source + 14 standard nonprofit + 10 jewels + 129 blog posts × 3 locales = ~480 routes
- Build fails when deployed-route-count < expected

## SUCCESS_DEFINITION
One-line prompt `re(build|optimize|enhance) X.com` produces a deployed site where:
- (a) Every source URL resolves to live content OR 301
- (b) Every standard-page-set entry for the inferred org type is live with real content
- (c) Every demographic locale has a full route mirror
- (d) Every jewel page exists with researched content + citations
- (e) IA is normalized + cruft redirected + Squarespace dupes deduped

Anything less = the prompt failed, not the rebuild.

## Reference incident (***2026-05-21***)
User issued `create an optimized version of njsk.org`.
- **Original** (Squarespace): 8 unique non-blog routes (`/donate|/faq|/health-clinic|/holiday-express|/how-we-do-it|/our-mission|/our-team|/we-need|/women-childrens-center|/the-mens-dining-hall-1|/mass-schedule-sj|/volunteer-1`) + 50+ random-slug blog dupes + 8 dead pages (`/home|/blog-1|/testpage|/new-page-1|/new-gallery-2|/holiday-express-2|/our-mission-1|/holidayexpress|/holidayexpress2`)
- **Single prompt should output** the clone at `njsk-org.manhattan.workers.dev`:
  - 8 keep
  - 14 nonprofit-standard (`/about|/team|/services|/services/health-clinic|/services/mens-dining-hall|/services/womens-center|/contact|/blog|/mass-schedule|/faq|/donate|/volunteer|/we-need|/privacy`)
  - 10 jewels (`/alumni|/annual-report|/financials|/parish-toolkit|/partners|/planned-giving|/press|/testimonials|/transcript|/ways-to-give|/donate/refurbish`)
  - 2 locales × all routes (`/es/*|/pt/*` per Newark demographics: 36% Hispanic / large Brazilian-Portuguese diaspora)
  - 129 cleaned blog slugs
  - `_redirects` for all 50+ Squarespace random-IDs + 9 dead-page 301s
  - Total ~210 routes
- Single prompt MUST produce this — not 30 incremental prompts.

## Parallel-agent playbook (***MONITOR-FIRE on first tool-call message — sequential = build fail***)
Rebuild prompts trigger [[monitor-orchestration]] per `always.md` line 10 (multi-faceted brief). The Monitor (main thread) decomposes within 30 seconds into independent + dependent passes. Independent passes fan out as parallel `Agent` spawns in a SINGLE multi-tool message — never serialize.

### Canonical fan-out for `rebuild X.com`
1. **Agent-A `crawler`** — sitemap+robots+HTML BFS+Wayback fallback → `_url_inventory.json` with `{url, classification(keep|merge|301|drop), org_type_hints[], original_status}` per URL
2. **Agent-B `demographics`** — ACS B16001 lookup on `_research.json.service_area` → `_locales.json` `{locales[], hreflang_pairs[]}`
3. **Agent-C `org-type-inferrer`** — skill 02 inference from prompt+domain+`_research.json.category` → `_org_type.json`
4. **Agent-D `media-walker`** — image+video+PDF+logo extraction from source → `_assets/` + `_videos.json` + `_image_briefs.json`
5. **Agent-E `brand-extractor`** — GPT-4o vision on source homepage → `_brand.json` palette+fonts+tone
6. **Agent-F..K `jewel-content-authors`** (one per jewel batch: financials+annual-report | planned-giving+ways-to-give | parish-toolkit+partners | press+testimonials | transcript+alumni | donate-campaigns) → each emits 2-3 jewel page contents as typed-block JSON
7. **Agent-L..N `i18n-translators`** (one per locale beyond English) → consume union-route corpus → emit `/{locale}/*` translated routes via Workers AI Llama 3.3 70B first pass + Claude Opus 4.7 polish on top-10 conversion routes per [[i18n-by-demographics]]
8. **Agent-O `IA-normalizer`** — consume `_url_inventory.json`+`_org_type.json` → emit `_redirects` 301 manifest + slug rename map + service-hierarchy nesting plan
9. **Agent-P `squarespace-dedup`** — CMS-specific dupe detection (Squarespace random-IDs, Wix `_compiler/page-data`, WP `?p=` permalinks) → augment `_redirects`

### Execution sequencing
- **Foreground** (main thread during agent wall-time): write `PLAN.md` route tree + design tokens + media+file counts + validators list
- Once Agent-A+B+C complete (prerequisites), fire Agent-D through Agent-P all parallel
- Once jewel-authors+translators complete, fold outputs into `<boltArtifact>` envelope, build, deploy, verify per [[verification-loop]]
- NEVER `sleep|poll|tail` agent files — completion notification driven
- Sub-agent prompts 100-300 words per [[full-autonomy]] — beyond that = cloning context

## Self-improvement closure (***SAME TURN, NOT NEXT***)
- When the user re-issues an identical or near-identical rebuild prompt, that = monitor-orchestration shortcoming-signal (rule §Follow-up)
- BEFORE doing the requested work: append the gap to [[monitor-orchestration]] § Known shortcomings AND cross-link from the relevant rule
- Rule update is part of the turn, never deferred
- Per [[brian-preferences]] "How to improve? → always find 50 more things, explore every branch, never cap effort" — exhaust the improvement surface in-turn

## See
- [[monitor-orchestration]] (Monitor pattern + Known shortcomings #7)
- [[i18n-by-demographics]]
- [[15-site-generation/page-set-expansion]]
- [[15-site-generation/source-fidelity-loop]]
- [[15-site-generation/SKILL]] `URL preservation` block
- [[always]] hyperlink mandate + multi-faceted-prompt rule (line 10)
- [[citations]] quantitative-claim mandate
- [[copy-writing]] anti-slop
- [[full-autonomy]] sub-agent discipline
