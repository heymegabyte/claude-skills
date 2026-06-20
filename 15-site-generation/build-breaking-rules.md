---
name: "15 build-breaking site-rebuild rules"
description: "Universal site-rebuild gates: source-site logo walks + theme match + brand-splash, full-corpus mandate (default keep every original page), media+video extraction, gorgeous loop pre-deploy, grammar audit, cross-site _redirects + canonical chain, complete blog/content corpus import, source-site contact info preservation, deep crawl, linked PDF (CV Timeline), donation/give CTA Stripe-first GiveDirectly UX, publication tile deeplink-or-redirect, impact/stat rollup section mandatory. Migrated verbatim from rules/always.md 2026-05-03."
metadata:
  version: "1.0.0"
  updated: "2026-05-03"
  effort: "high"
  context: "fork"
license: "Rutgers"
compatibility:
  claude-code: ">=2.0.0"
  agentskills: ">=1.0.0"
---

# 15 — Build-Breaking Site Generation + Rebuild Rules

> **Model migration note (pass-76, 2026-06-09)**: `DALL-E` → **GPT Image 1.5** + `GPT-4o` → **GPT Image 2 vision**. Per `platform.openai.com/docs/deprecations`. Pipeline gates unchanged.

Migrated from `~/.claude/rules/always.md` 2026-05-03.

## Every site rebuild (source site exists)

### Logo extraction chain

Walk ALL logo sources in order:

1. Header `<img>`
2. `<link rel=icon>`
3. `<link rel=apple-touch-icon>`
4. `og:image`
5. `wp-content/squarespace/wix` theme paths
6. `favicon.ico`
7. Wayback

- Use original logo+favicon whenever any path above resolves. Brand equity > AI novelty — NEVER replace real logos with AI-generated ones. AI generation is LAST RESORT only.

### Theme + brand-splash extraction

- Match source theme (light vs dark) when extractable.
- Extract logo's icon-only region as `brand-splash.png` (hero bg) + `brand-mark.png` (favicon source).
- Match logo font as `--font-heading` site-wide.

### Media walk

Walk EVERY page for ALL:

- `<img>` + `<picture>` + CSS bg
- Slider/swiper/splide/glide + Squarespace/Wix gallery
- Lazy `data-src` + `og:image`
- Downloadable PDFs/DOCs (resumes, brochures, menus)

- Preserve slider groups with order.

### Augmentation

- Ship `original_image_count × 1.4` minimum (`× 2.0` typical).
- Augment via GPT Image 1.5 (primary), Pexels, Pixabay, Google CSE.
- Feature linked PDFs prominently (e.g. team CVs on `/about`).

### Post-build vision pass

- GPT Image 2 vision scan vs source → classify gaps as `local-skill | universal-skill | template | one-off` → auto-edit appropriate file with dated incident citation → push template repo same prompt.

## Every site rebuild (full-corpus mandate)

***DEFAULT IS KEEP EVERY ORIGINAL PAGE***

### Crawler scope

Crawler MUST enumerate the source's complete URL set:

- `sitemap.xml` → `robots.txt` → HTML link graph BFS
- CMS-specific index pages: `/blog`, `/news`, `/press`, `/portfolio`, `/projects`, `/team`, `/services`, `/case-studies`, `/publications`, `/events`, `/awards`, `/recipes`, `/locations`, `/products`
- Squarespace `/config/pages`, WP `wp-sitemap-posts-*.xml`, Wix `_api/v1/sitemap.xml`
- Wayback fallback

- Rebuild EVERY URL — never stop at homepage, never stop at top-level nav.

### Default policy

- Every original URL becomes a live route (200 OK with full content+metadata+JSON-LD).
- Merge permitted ONLY when two pages are clearly duplicates or thin (≤200 words).
- Merged pages MUST emit `_redirects` entry `original-url 301 canonical-url 301`.

### Build gate

- `validate-urls.mjs` curls every original URL against deployed site — any 404 or unintended 410 = fail.

### Per-page requirements

Every page must run through:

- AI editorial pass (clean grammar+typography+rhythm WITHOUT rewriting facts/quotes/dates/names).
- Universal hyperlink mandate.
- ≥2 contextual internal links to sibling routes + ≥1 outbound link to canonical sources/journals/orgs/PDFs.

## Every site rebuild (media+video — both extracted)

***IMAGES AND VIDEO BOTH EXTRACTED***

### Video walk

Walker MUST capture:

- `<video>` + `<source>` + `<iframe src*=youtube|vimeo|wistia|loom>`
- `data-video-id` + CSS `background-video`
- Autoplay-loop hero MP4s + animated WebPs + lottie `.json` animations

### `_videos.json` output

- Schema: `(src/poster/duration/dims/transcript-if-available)`. Consumed by template's `<VideoEmbed>` component (lazy-load, poster-first, captions if VTT exists). Hero videos preserve their slot when source uses one.

### Augmentation

- Pexels Video API + YouTube Data API search by topic.
- GPT Image 1.5 image generation is PURPOSE-CRAFTED PER SLOT.

### Per-slot GPT Image 1.5 prompt mandatory fields

1. Route+section it lives in
2. Page topic+intent
3. Brand palette tokens (e.g. "matte navy #060610 + cyan accent #00E5FF")
4. Composition+aspect ratio (16:9 hero / 1:1 card / 4:5 portrait)
5. Subject specificity ("octogenarian volunteer plating soup, soft window light, documentary style" NOT "people helping")
6. Negative prompt (no text, no watermarks, no AI artifacts, no extra fingers, no logos)

- Generic "create a hero image" prompts = fail; per-slot specificity required. Same prompt template applies to GPT Image 1.5, Ideogram, Stability — reuse the slot-prompt across providers with a fallback chain.

## Every site (deep crawl)

- When source has list pages (`publications|team|portfolio|projects|services|case-studies|blog index`), crawler MUST follow each detail link, extract short summary + outbound link per item, skip quoted academic abstracts (duplicate-content risk).

## Every site (dual-vision checkpoints)

***PER-SECTION + PER-ROUTE + FINAL PRE-PUBLISH — UNIVERSAL — BUILD-BREAKING — see ~/.claude/rules/visual-inspection.md***

Site generation MUST fire dual-vision at 4 checkpoints:

1. **Per-section** — Claude Vision (FREE, Sonnet 4.6 via Max 20x OAuth) after each section renders at 1bp (1280). Catches white-on-white, overflow, missing-image, broken grid before next section builds atop.
2. **Per-route** — Claude Vision at all 6 breakpoints (375/390/768/1024/1280/1920) after route assembles + mission-doctrine grade (cinematic_floor + latest_tech_flex).
3. **Per-iteration** — Claude Vision diffs current build vs previous build screenshots. Catches "earlier build was better" regression class.
4. **Final pre-publish** — GPT Image 2 vision on homepage 6bp + Claude Vision on every route 6bp. Both must hit ≥8/10 across cinematic_floor + latest_tech_flex + brand_fidelity + accessibility + hero_impact.

### GPT Image 2 vision veto

- Homepage only. Brand-fidelity GPT Image 2 vision judge compares rendered ATF vs source-site screenshot.

### Cost cap

**$0.50 GPT Image 2 vision per build** allocation:

- ~$0.10 hero/ATF
- ~$0.15 brand-fidelity vs source
- ~$0.10 final 6bp homepage
- ~$0.15 reserve arbitration

- Claude Vision marginal cost ZERO on Max 20x — use uncapped.

### Auth

- **Claude Vision** — via `~/.claude/.credentials.json.claudeAiOauth` OAuth bearer (NEVER API key on macOS spawn — burns metered credits on flat-rate plan, see ~/.claude/rules/auth-spawned-claude.md).
- **GPT Image 2 vision** — via `OPENAI_API_KEY`.

### Consensus

- Both ≥8 → ship.
- One <8 → remediate (3-round cap, then log `_iteration_log.json.visual_carryover[]` + fix-forward).
- Persistent disagreement → Computer-Use third pass.

### Tier 1 (FREE) gate

- Playwright a11y tree + axe-core + DOM-walker contrast runs FIRST every checkpoint. Catches ~80% with zero token spend.

### Logging

- Every vision call logs `vision_provider`, `auth_mode`, `cost_cents` to D1 `audit_logs`.

### Validator (`validate-site-dual-vision.mjs`)

- Assert `_iteration_log.json.vision_checkpoints[]` contains per-section + per-route + final entries with `claude_vision_score`+`gpt4o_score`(when fired)+`evidence[]` populated.
- Assert `audit_logs` shows `auth_mode='max-oauth'` for every Claude Vision call (API-key fallback = warning).
- Assert build-cap `SUM(cost_cents) WHERE vision_provider='gpt-4o' AND build_id=<id> <= 50`.

## Every site (gorgeous loop pre-deploy)

- Final critique-and-edit LLM pass — "Make this website even more beautiful + gorgeous + creative + intuitive + clever + witty + interesting + cool" — max 3 rounds, each round applies concrete edits. Runs AFTER content/build, BEFORE deploy.

## Every site (grammar audit)

- Post-generation LLM pass fixes typos, subject-verb agreement, tense, Oxford-comma WITHOUT rewriting/removing information. No content reduction, no paraphrase.

## Every linked PDF

***PRIMARY RESEARCH — NOT JUST AN ASSET***

When source site links a PDF (CV, resume, brochure, menu, whitepaper, annual report):

1. `pdftotext` → structured-fact extraction (LLM with strict JSON schema)
2. `_pdf_facts.json` keyed by URL BEFORE Phase 1 build

### CV as picture-of-the-soul

- Every position, education, publication, grant, award, project becomes a structured fact available to all generation prompts.
- CVs render as interactive Timeline component on `/about` (or new `/cv` route): vertical chronology, year markers, expandable role/event cards with concise summary + hyperlinks, in-viewport fadeIn, supplementary metadata with ≥7:1 contrast.

### Web-research enrichment per timeline node

- Via Exa/Tavily/Perplexity — find related papers, institution pages, news mentions — include all as outbound links.

## Every site (impact/stat rollup section mandatory)

***UNIVERSAL — non-profit + SaaS + service business***

### When this fires

- Every site whose `_research.json` resolves ≥3 quantifiable stats (donors|volunteers|meals served|customers|years operating|lives impacted|revenue|$ raised|publications|projects shipped|members|clients|countries served) MUST render an "Our Impact in Numbers" section.

### Layout

- Section title variants: "Our Impact in Numbers" | "By the Numbers" | "Trusted by Thousands" | "Our Track Record" | "Since YYYY".
- Above-fold-or-second-screen on homepage.
- 3-4 column responsive grid (1col@375 | 2col@768 | 4col@1280).
- Each stat = oversized animated counter (`clamp(2.5rem,8vw,5rem)`) + label below + optional icon above.
- Counter rolls in via IntersectionObserver+rAF per "Every stat block" rule.
- Section uses brand-accent-tinted bg with subtle gradient OR solid bg-secondary band — visually distinct from neighboring sections.

- NEVER ship a non-profit/SaaS/service site without stat-rollup when stats exist.

### Validator (`validate-stat-counter-section.mjs`)

- For sites with `_research.json.stats[].length >= 3`, assert `dist/index.html` contains `<section data-section="stats">` with ≥3 `[data-stat-counter]` children AND each counter has `data-stat-end` numeric attribute.

## Every site rebuild (cross-site _redirects + canonical chain)

***BETWEEN OLD+NEW LIVE INSTANCES — UNIVERSAL — BUILD-BREAKING when both resolve***

### Trigger

- When rebuilding under new hosting/URL while old URL still resolves (test/preview deploys, parallel migrations, A/B between projectsites.dev subdomain and original custom domain).

### Requirements

- `_redirects` MUST emit a 301 from EVERY original-site URL to matching new-site URL.
- Build gate: parse `_url_inventory.json`, for every original URL emit `<original-path> 301 https://<new-host><new-path>` line.
- New site uses different slug/path scheme? Emit per-URL mapping NOT wildcards.
- Old hosting (Squarespace/WP/Wix) cannot serve `_redirects` — new host MUST own `<link rel="canonical" href="https://<new>/<path>">` on every page.
- Pair with sitemap submission to GSC + IndexNow ping.

### Validator (`validate-cross-site-redirects.mjs`)

- When env `OLD_SITE_URL` set, fetch original sitemap, intersect with new sitemap, assert every original URL appears in `_redirects` OR resolves identically via canonical chain.

## Every site rebuild (complete blog/content corpus import)

***NEVER SUBSAMPLE — reinforces full-corpus mandate***

### Trigger

- When source site has blog/news/journal/article/post index.

### Requirements

- Import EVERY post (no "import top 10 latest" — import all 120+, all 500+, all 2000+).
- Pagination 12-24 per page, total count visible, infinite-scroll OR numbered pages with prev/next/first/last.
- Each post: full metadata + BlogPosting JSON-LD, author byline + publish date + tags + categories + reading time, ≥3 related-posts + share buttons + comment thread (when source had it).
- Categories+tags become FUNCTIONAL filter chips that actually filter the listing — not styled stubs.
- Per-post images extracted from source + augmented per "Every page (media density)" rule.

### Validator (`validate-blog-corpus-complete.mjs`)

- When source detected as blog (`/blog|/news|/articles|/journal|/posts|/press|/updates|/insights|/stories`): assert `_corpus.json.posts.length >= source_blog_post_count * 1.0`, blog index renders ALL posts via pagination, ≥2 functional filter taxonomies (category + tag minimum).

## Every donation/give CTA (Stripe-first GiveDirectly UX)

***UNIVERSAL — BUILD-BREAKING — non-profit + church + school + community***

### When this fires

- Every site classified as `non_profit | church | school | community_org | charity | foundation | religious_org`.

### Requirements

- MUST ship a Stripe-Checkout donation flow. NEVER PayPal-as-default — PayPal optional secondary.

### Layout pattern (GiveDirectly-inspired)

1. **Monthly tab DEFAULT-active** (4× LTV vs one-time), One-Time tab secondary
2. **Preset amounts row** of 4-6 chips ($25 | $50 | $100 | $250 | $500 | Other) with mid-tier ($100) pre-selected
3. **Custom-amount text input** with `inputmode="numeric"` + currency prefix
4. **Impact-statement string** under amount ("$50 = 30 meals" | "$100 = 1 family/month") pulled from `_research.json.impact_metrics[]`
5. **Single primary CTA** "Donate $100/month" rendering live amount + cadence
6. **Stripe Checkout redirect** on submit: `POST /api/donate/checkout` → `stripe.checkout.sessions.create({mode: amount.recurring ? 'subscription' : 'payment', line_items, success_url, cancel_url})`
7. **Trust row** — tax-deductible badge + EIN + 501(c)(3) verification link + payment-card icons + lock icon
8. **Optional add-on checkbox** "Cover the 2.9% processing fee so 100% reaches the cause" (auto-adds to amount)

### Stripe setup

- Stripe Connect when site is multi-tenant marketplace; standard Stripe account otherwise.
- Tax-receipt email auto-fires via Stripe webhook → Resend.

### Validator (`validate-donation-stripe-first.mjs`)

- Assert `/donate` (or homepage donate section) contains: `<form data-donation>` with monthly tab `aria-pressed=true` by default, Stripe-Checkout endpoint, ≥4 preset chips, impact-statement renders, tax-deductible trust row visible.
- PayPal/Venmo/Zelle/check options live in collapsible "Other ways to give" expander BELOW Stripe form, never as default tab.

## Every publication card (enriched)

***ABSTRACT + JOURNAL + PDF + YEAR + AUTHORS — UNIVERSAL — BUILD-BREAKING — extends "Every publication tile"***

### When this fires

- When a site has a `/publications`, `/research`, `/papers`, or `/portfolio` page.

### Required fields per card

1. **Abstract/summary** — 2-4 sentence paraphrase (NOT copy-paste of quoted abstract — duplicate content risk) derived from Crossref/Semantic Scholar/PubMed
2. **Authors** — full author list as `Lastname, F., Lastname, F., et al.` hyperlinked to ORCID or institution profile when resolvable
3. **Journal/venue name** — styled badge, hyperlinked to journal homepage
4. **Year** — displayed prominently, used for chronological grouping
5. **DOI or direct URL** — primary CTA button "View Article →" (`target=_blank, rel=noopener`)
6. **PDF link** — when available via Unpaywall API `https://api.unpaywall.org/v2/{doi}?email=hey@megabyte.space` returns `best_oa_location.url_for_pdf` — render secondary CTA "Download PDF" if non-null

### Listing layout

- Group cards by year (descending) with year dividers: `<h2 class="year-divider" data-year="2024">2024</h2>`.
- Never a flat unsorted list.
- Filter by research area/topic (use `keywords[]` from Crossref response).

### Validator (`validate-publications-enriched.mjs`)

- For every `[data-card-type=publication]`, assert `data-abstract`, `data-authors`, `data-journal`, `data-year` attributes, at least one CTA `<a href>` pointing to external host, year-divider elements present.

## Every publication tile (deeplink or redirect)

***NEVER INTERNAL DUPLICATE-CONTENT STUB***

### Requirements

- Publication tiles MUST link DIRECTLY to canonical external academic URL (DOI > PubMed > arXiv > journal article URL > publisher landing page) — NEVER to internal `/publications/<slug>` route that just re-displays metadata + abstract.

### Discovery chain (skill 15 publication-deeplink-resolver)

1. Scrape source-site publication PDF/citation block for DOI/journal name/year
2. Crossref API `https://api.crossref.org/works?query.title=<title>&query.author=<lastname>`
3. PubMed E-utilities `esearch.fcgi?db=pubmed&term=<title>+<author>` for biomedical
4. arXiv API for STEM preprints
5. Google Scholar scrape via Serper/Tavily as last resort
6. Journal homepage search if title matches exactly

- Persist `_publications.json[].deeplink_url` BEFORE Phase 1 build.

### Tile requirements

- `<a href="<deeplink>" target="_blank" rel="noopener noreferrer">` wrapping entire surface.
- NO internal `/publications/<slug>` route when deeplink resolved.
- When deeplink unavailable after full discovery chain, `_redirects` MUST emit `/publications/<slug> 301 /publications#<slug>` (anchor to expanded card on index) — NEVER stand up a duplicate-content stub route.

### Validator (`validate-publication-deeplinks.mjs`)

- Every `[data-card-type=publication]` element href MUST point to external host.
- `_redirects` MUST cover any internal `/publications/<slug>` URLs from sitemap.

## Every site with blog source corpus (rebuild as blog)

***SITE_TYPE OVERRIDE — UNIVERSAL — BUILD-BREAKING***

### Trigger

- When source site crawler detects `>5 blog/news/article posts` (path matches `/blog|/news|/articles|/journal|/posts|/press|/updates|/insights|/stories` AND ≥5 detail pages with `published_date` metadata), `site_type` MUST be overridden to `blog` regardless of prompt's implied type.

### Requirements

1. Import ALL posts (per "Complete Blog/Content Corpus" rule)
2. REWRITE each post for quality — fix grammar, sharpen headlines (4-8 words), punch up first paragraphs (Flesch ≥60), add internal links — NEVER alter facts/dates/quotes/sources
3. Re-extract ALL media from each source post + supplement with GPT Image 1.5 per-slot prompts + Pexels Video for hero sections
4. Homepage becomes magazine-style blog index (featured post hero, category filter row, 3-column grid, pagination, sidebar with top tags + search)
5. Every post gets: unique title/meta/H1, 600+ words, featured image (R2-hosted), FAQPage JSON-LD, author byline, publish date, reading time, ≥3 related-posts links, share buttons, category+tag chips

### Validator (`validate-blog-site-type.mjs`)

- When `_research.json.source_blog_post_count >= 5`: assert `_build_config.json.site_type === "blog"`, homepage renders `[data-section="blog-index"]`, `_corpus.json.posts.length >= source_blog_post_count`.

## Every site rebuild (source-site contact info preservation)

***UNIVERSAL — BUILD-BREAKING***

### Trigger

- When source contains direct staff/department emails, direct phone extensions, named-person contact cards, or department contact lists.

### Requirements

- Preserve EVERY contact — never collapse 12 staff emails into a single `info@` catch-all.
- Scrape `/contact`, `/staff`, `/team`, `/about`, `/leadership`, `/board`, `/clergy`, `/faculty`, footer + body mailto: links. Extract every `mailto:`, `tel:`, named-person card into `_contacts.json[]` keyed by name.

### Render

- `/contact` page has "Direct Contacts" section: per-staff card with photo + name + role + dept + email MailLink + phone TelLink + dept badge.
- Footer: general info + `/contact` deep-link.
- Department list cards: dept name + dept-level email + dept phone.

### Validator (`validate-contact-preservation.mjs`)

- When source has `>3 mailto:` links OR named-person contact pages: assert `_contacts.json[].length >= source_contact_count * 0.95`, assert `dist/contact.html` renders ≥`source_contact_count * 0.95` distinct mailto: hyperlinks.

## Every site with ≥2 team members in research (team page mandatory)

***UNIVERSAL — BUILD-BREAKING***

### Trigger

- When `_research.json.team[].length >= 2` OR source has `/team`, `/staff`, `/people`, `/faculty`, `/leadership`, `/board`, `/clergy`, `/about#team`.

### Requirements

- Dedicated `/team` route MUST be generated (OR integrated as section-with-anchor on `/about` for teams ≤4 people).

### Each person card MUST include

- **Headshot** (square, consistent per skill 12 team headshot rule)
- **Full name**
- **Job title / role**
- **Department** if applicable
- **Bio** 50-120 words (extracted from source, editorially improved — never rewritten, never fabricated)
- **Credentials/certifications** as styled badge pills (PhD, MD, JD, PE, CPA, MBA, etc.)
- **Social links** (LinkedIn primary, ORCID for researchers, Twitter/X secondary) as icon links with brand-hex hover
- **Email** as mailto: link when source had it
- **JSON-LD `Person` schema** (see "Every team member" rule)

### Ordering + layout

- Leadership/founders first, then alphabetical or by role seniority.
- Grid: 3-column at 1280px, 2-col at 768px, 1-col at 375px.

### Validator (`validate-team-page.mjs`)

- When `_research.json.team.length >= 2`, assert `/team` route exists (200 OK) OR `/about#team` has `[data-section="team"]` with ≥2 `[data-card-type="person"]` children.

## Every site (branded 404 + 500 error pages)

***UNIVERSAL — BUILD-BREAKING***

### `404.html` requirements

- On-brand design with logo at top.
- `<h1>Page not found</h1>` (or equivalent in site's voice).
- Brief empathetic message ≤2 sentences.
- Search input (`<form action="/blog"><input type="search" placeholder="Search…"></form>`).
- Top 5 most important site links as cards/chips.
- Primary CTA back to homepage.
- Full branding (nav, footer, theme, fonts) — NOT a plain white page.

### `500.html` requirements

- Same branding + `<h1>Something went wrong</h1>`, brief message, retry CTA, contact email `<a href="mailto:…">`.

### Worker integration (`src/index.ts` site-serving)

- Intercept 404 from R2 `object.status === 404` → serve `sites/<slug>/404.html` with 404 status code.
- Intercept uncaught errors → serve `sites/<slug>/500.html` with 503.

### Validator (`validate-error-pages.mjs`)

- Assert `sites/<slug>/404.html` exists in R2 AND contains `<h1>` + logo `<img>` + homepage `<a href="/">` + search `<input>`.
- Assert `curl <site-url>/nonexistent-path-xyz` returns HTTP 404 (not 200 with empty body or CF default).

## Every professional-services or consulting site (process / how-it-works section)

***UNIVERSAL — BUILD-BREAKING***

### Trigger

- When `_research.json.category` matches `legal | medical | dental | consulting | financial | marketing | engineering | architecture | accounting | coaching | therapy | design-agency | research | education | real-estate`.

### Requirements

- Homepage MUST contain a "How It Works" or "Our Process" section with 3-5 numbered steps.
- Each step: step number as large accent numeral or icon, step title (4-8 words), step description (20-40 words), optional icon illustration.
- Horizontal steps at ≥768px; vertical timeline at mobile.
- Every step title linked to deeper service detail page when one exists.
- Section title variants: "Our Process" | "How We Work" | "Your Journey" | "The Path Forward" | "What to Expect".
- Placement: between hero and testimonials/social proof.

### Validator (`validate-process-section.mjs`)

- Assert homepage HTML contains `[data-section="process"]` OR `[data-section="how-it-works"]` with ≥3 `[data-step]` children, each having `[data-step-number]` + `[data-step-title]`.

## Every company founded ≥20 years ago (heritage timeline section)

***UNIVERSAL — BUILD-BREAKING***

### Trigger

- When `(current_year - _research.json.founded_year) >= 20` OR source contains "Since YYYY", "Established YYYY", "Founded in YYYY", OR any About page references decades of history.

### Requirements

1. **"Since YYYY" badge** on hero section styled with subtle aged/gold/serif treatment
2. **Company milestones timeline section** on `/about`: vertical at mobile, alternating left-right at desktop; each node = year (oversized accent numeral), event title (5-10 words), 1-2 sentence description, optional image thumbnail; minimum 5 milestone entries (founding, expansions, product launches, name changes, ownership transitions, facility moves, award years)
3. **Heritage stat counters** in homepage stats section: "X Years in Business" counter using calculated years, rolls in via IntersectionObserver
4. **"Family-owned since YYYY"** or **"3rd generation"** notes in hero subheadline when applicable

### Validator (`validate-heritage-timeline.mjs`)

- When `_research.json.founded_year` set and age ≥20: assert `/about` has `[data-section="timeline"]` with ≥5 `[data-milestone]` children, assert homepage hero contains `[data-badge="heritage"]`.

## Every site with ≥2 testimonials in research

***TESTIMONIALS SECTION — UNIVERSAL — BUILD-BREAKING***

### Trigger

- When `_research.json.testimonials[].length >= 2` OR source has any review/testimonial/quote section.

### Each testimonial card MUST include

- **Quoted text** in `<blockquote>` with opening quote mark.
- **`<cite>` element** wrapping person name + job title/company (MANDATORY — no anonymous testimonials unless source explicitly omits identity).
- **Star rating** as accessible SVG stars (1-5) when source has rating data.
- **Avatar**: source photo if available → GPT Image 1.5 headshot fallback → initials monogram badge final fallback (NEVER no avatar).

### Layout

- Carousel for ≥5 testimonials (autoplay 4s, pause on hover, prev/next arrows, dot indicators, keyboard accessible).
- Grid for 2-4 testimonials.

### Social proof augmentation

- Google Places API rating + count displayed as "⭐ 4.8 (127 Google reviews)" when `GOOGLE_PLACES_API_KEY` available.

### Validator (`validate-testimonials.mjs`)

- When `_research.json.testimonials.length >= 2`: assert homepage `[data-section="testimonials"]` exists with ≥2 `<blockquote>` elements each containing `<cite>`, each `<blockquote>` has non-empty text ≥20 chars.

## Every team member (Person JSON-LD)

***UNIVERSAL — BUILD-BREAKING***

### Minimum schema

```json
{"@context":"https://schema.org","@type":"Person","name":"<full name>","jobTitle":"<title>","worksFor":{"@type":"Organization","name":"<business name>","url":"<site url>"},"image":"<absolute-url-to-headshot>","description":"<bio 1 sentence>","sameAs":["<linkedin-url>","<orcid-url>","<twitter-url>"]}
```

### Extended fields when available

- `"knowsAbout":["<topic>","<topic>"]`
- `"alumniOf":{"@type":"CollegeOrUniversity","name":"<school>"}`
- `"award":["<award name>"]`
- `"hasOccupation":{"@type":"Occupation","name":"<role>"}`

### Placement

- Inline `<script type="application/ld+json">` inside each person card component.
- AND on their individual detail page `/team/<slug>` if one exists.
- Author bylines on blog posts MUST link the `Person` JSON-LD to the post's `BlogPosting.author` field.

### Validator (`validate-person-jsonld.mjs`)

- For every `[data-card-type="person"]`, assert adjacent or parent `<script type="application/ld+json">` contains `"@type":"Person"` with non-empty `name`, `jobTitle`, `worksFor.name`.

## Every testimonials section (AggregateRating + Review JSON-LD)

***UNIVERSAL — BUILD-BREAKING***

### Trigger

- When a site's testimonials section exists.

### Requirements

**(a) `AggregateRating` JSON-LD** on `Organization` or `LocalBusiness` JSON-LD:

```json
"aggregateRating":{"@type":"AggregateRating","ratingValue":"4.8","bestRating":"5","worstRating":"1","ratingCount":"127","reviewCount":"127"}
```

- Pull values from Google Places API when available; synthesize from testimonials count when no explicit rating (use count only: `"reviewCount":"8"`).

**(b) Individual `Review` JSON-LD** for each testimonial:

```json
{"@type":"Review","author":{"@type":"Person","name":"Jane D."},"reviewBody":"…","datePublished":"2024-01-15","reviewRating":{"@type":"Rating","ratingValue":"5"}}
```

- When testimonials have no date, use approximate year from source ("2024" inferred from recency).

### Validator (`validate-review-jsonld.mjs`)

- For every page with `[data-section="testimonials"]`, assert `<script type="application/ld+json">` contains `"@type":"AggregateRating"` nested in Organization/LocalBusiness + ≥1 `"@type":"Review"` block.

## Every FAQ section (FAQPage JSON-LD validator)

***UNIVERSAL — BUILD-BREAKING***

### Requirements

Every page rendering a FAQ section MUST:

1. Use semantic markup — `<details><summary>Question?</summary><div>Answer.</div></details>` OR `<section data-faq><div data-faq-item>…</div></section>` with ARIA accordion attrs
2. Include FAQPage JSON-LD on the same page:

   ```json
   {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Q?","acceptedAnswer":{"@type":"Answer","text":"A."}}]}
   ```

   One entry per FAQ item.
3. Draw from real source-site FAQ content OR generated from `_research.json` most-common-questions — NEVER fabricated generic questions. FAQ count: minimum 5 items; maximum 20 per page section.
4. Answers MUST be complete, self-contained (no "contact us for more info" as sole answer).

### Validator (`validate-faq-jsonld.mjs`)

- For every `[data-section="faq"]` or `<details>` parent with ≥3 children: assert `<script type="application/ld+json">` contains `"@type":"FAQPage"` with `mainEntity.length >= 3`, each entry has non-empty `name` + `acceptedAnswer.text ≥ 20 chars`.

## Every site with extractable source logo (brand colors from logo)

***UNIVERSAL — BUILD-BREAKING***

### Trigger

- When `_brand.json.logo.original_url` HEAD-200s OR `_brand.json.logo.original_icon_url` HEAD-200s OR Logo.dev/Brandfetch returned non-empty.

### Requirements

- Site's primary+secondary brand colors MUST be extracted from the logo via GPT Image 2 vision — NEVER guessed from category/business-type/industry default.

### Required `_brand.json` shape

```json
{
  "primary": "#hex",
  "secondary": "#hex",
  "accent": "#hex",
  "color_source": "logo_vision_extraction" | "header_dom_scrape" | "cta_dom_scrape" | "wordpress_theme_json" | "industry_default",
  "color_source_url": "<extraction-source-url>",
  "logo_dominant_pixels": ["#hex","#hex","#hex"],
  "confidence": 0-1
}
```

### Extraction priority chain (FIRST match wins, walk each before falling through)

1. **GPT Image 2 vision** on logo PNG/SVG with prompt "extract the dominant brand colors as 6-digit hex, no descriptions, return JSON {primary,secondary,accent,reasoning}" using `imageDetail: "high"`
2. **DOM scrape** of source `header`/`nav` `background-color` + `<button class*="cta"|"btn-primary">` `background-color` via Playwright `getComputedStyle`
3. **`wp-content/themes/*/theme.json` palette field** for WordPress sites
4. **`og:image` dominant-color extraction** via vision (last resort before fallback)
5. **Industry default** ABSOLUTE LAST RESORT — MUST log warning + flag `color_source: "industry_default"`

### Validator (`validate-brand-colors.mjs`)

- When `_brand.json.logo.original_url` set, `color_source !== "industry_default"` (build fails).
- GPT Image 2 vision RE-RUN at validate-time: claimed primary hex returns ΔE ≤ 30 against logo's dominant pixel cluster (CIE 2000).
- `theme-color` meta tag in `dist/index.html` === `_brand.json.primary` exactly (case-insensitive).
- `mask-icon color` meta tag === `_brand.json.primary` (single source of truth).
- `_brand.json.confidence >= 0.7` when `color_source === "logo_vision_extraction"`.

**Reference incidents**:

- lonemountainglobal.projectsites.dev (2026-05-06): `theme-color: #1d3557` (navy) AND `mask-icon color: #2d6a4f` (green) — two hardcoded category-default colors not present in logo.
- njsk.org (2026-05-01): burgundy guess instead of extracted color — drove `feedback_brand_color_extraction.md`.

## Every page with ≥3 H2 headings (table of contents)

***BUILD-BREAKING — long-form content pages***

### Trigger

- Every page whose `<article>` or `<main>` contains ≥3 distinct `<h2>` headings.

### Requirements

**(a) Desktop (≥1024px)** — `<nav class="toc" aria-label="Table of contents">` as sticky sidebar:

```css
position: sticky; top: var(--nav-height, 5rem); max-height: calc(100vh - 6rem); overflow-y: auto
```

Left rail (25% width) alongside main content (75%).

**(b) Mobile** — collapsed accordion at TOP of `<main>` (above first H2):

```html
<details class="toc-mobile"><summary>On this page</summary><ol>…</ol></details>
```

**(c) TOC entries** — `<ol>` with one `<li><a href="#section-slug">Section Title</a></li>` per H2. Auto-generated from `querySelectorAll('h2[id]')` on DOMContentLoaded. H3 entries optional as indented children.

**(d) Active state** — IntersectionObserver highlights currently-in-view H2's TOC entry with accent color.

**(e)** All H2 elements MUST have `id` attributes (kebab-cased from text — auto-applied by build step).

### Validator (`validate-toc.mjs`)

- Assert `<nav class="toc">` or `<details class="toc-mobile">` present, each H2 has corresponding `<a href="#…">` in TOC, each H2 has non-empty `id` attr.

## Every site rebuild (logo-text-color → navbar polarity)

***UNIVERSAL — BUILD-BREAKING — extends "BRAND COLORS FROM LOGO"***

### Trigger

- When source-site logo contains rendered text (wordmark logos, virtually all professional brand logos).

### Requirements

- Navbar/header background polarity MUST be driven by the logo's text-pixel luminance — NOT by site-theme aesthetic preference.

### GPT Image 2 vision pass on the logo MUST extract separately

- `_brand.json.logo.text_pixel_color = "#hex"`, `_brand.json.logo.text_luminance = 0-1`.
- Prompt: `"Identify the TEXT/wordmark pixels in this logo (ignore background, ignore decorative marks). Return JSON {text_hex, text_luminance, bg_hex, bg_luminance, reasoning}"`.

### Navbar rule

- **White-or-light logo text (luminance ≥ 0.7)** → navbar background MUST be dark (≤ 0.25 luminance, primary brand color OR `#0a0a1a`).
- **Dark logo text (luminance ≤ 0.3)** → navbar background MUST be light (≥ 0.85 luminance, white/off-white).
- Same rule applies to hero band, footer, any section where logo renders.

### Contrast gate

- Header background-luminance vs logo text-luminance MUST satisfy `|Δluminance| ≥ 4.5:1` per WCAG.

### Logo variants

- Header MUST swap a separate logo variant when global theme polarity conflicts. Template ships `logo-light.png` for dark backgrounds + `logo-dark.png` for light backgrounds — `<picture>` swaps based on container `--bg-luminance` custom prop.

### Validator (`validate-navbar-polarity.mjs`)

- Compute header `background-color` via Playwright `getComputedStyle`, fetch logo from header, run GPT Image 2 vision `text_luminance` check against header bg — fail when contrast <4.5:1.

## Every site rebuild (progressive iteration enhancement + dual-source scrape)

***UNIVERSAL — BUILD-BREAKING — minimal-spend goody queue per build***

### Concept

- Every site rebuild is a versioned, additive iteration — NOT a from-scratch regeneration.
- `sites.iteration_count INTEGER DEFAULT 0` increments on every successful build.

### Dual-scrape requirement

- Build pipeline MUST scrape BOTH: original source site AND previous projectsites.dev deploy (when `iteration_count >= 1`).
- Persist `_dual_scrape.json = {original: {...}, previous_build: {...}, diff_strategy: "merge" | "override"}` BEFORE Phase 1.

### Goody queue (ordered, applied per iteration N as minimal-spend additive enhancement)

1. Person JSON-LD + ORCID enrichment per researcher
2. Publication sub-page enrichment to 300-500w (per "Every publication sub-page" rule)
3. Web Audio API podcast player UI shell on `/about` (loads progressive enhancement audio when iteration ≥ 3)
4. AI-generated founder podcast via ElevenLabs Studio or NotebookLM (single 5-10min episode per founder, R2-hosted, ~$2-4 API cost)
5. Infographic gallery — 3-6 Recraft/Vega-Lite/GPT-Image-2 generated infographics on `/research`
6. AI-generated explainer video via HeyGen (60-90s, founder avatar + key talking points, ~$5-8)
7. Press kit page (`/press`) with logo downloads + bio variants + headshots + quotable stats
8. Interactive timeline component (Person/Organization timeline with year markers)
9. Speaking engagements aggregator (scraped from Google Scholar + conference sites via Exa)
10. Citation graph viz (D3-based, publication citation network)
11. AI-generated short-form video clips (`/highlights` route, 30s vertical clips from longer content)
12. Interactive case study deep-dives with scroll-driven storytelling (scrollama.js)
13. Personalized email-subscribe (Listmonk integration with topic preferences)
14. Full-text on-site search (Orama @ R2)
15. Reading-time + estimated-progress indicators per long-form page
16. Annotated map of research field sites / project locations
17. Embeddable widget per publication (researchers can iframe into their own pages)
18. RSS + Atom feeds for blog + publications
19. WebMention/Bridgy integration for academic Twitter+Mastodon cross-posting
20. ActivityPub publishing for federated discovery

- Order is roughly cheapest+highest-conversion-impact first.

### Container behavior

- Reads `sites.iteration_count` at boot, applies goodies `[0..N]` from the queue, marks `_iteration_log.json[N].applied_goodies[]`.

### Validator (`validate-progressive-iteration.mjs`)

- Assert `sites.iteration_count` incremented.
- Assert `_iteration_log.json[current_iteration].applied_goodies.length >= current_iteration`.

### Premium tier acceleration

- Paid `/create` upgrade flag (`builds.opt_in_premium_multimedia = true`) accelerates the queue 3× per iteration (~$15 per build for 3 simultaneous goodies).

## Every publication sub-page (enrich 300-500w supporting parent kw OR 301)

***UNIVERSAL — BUILD-BREAKING — extends "Every publication tile"***

### Trigger

- When source has historical `/publications/<slug>` sub-pages AND publication-tile rule resolved a canonical external deeplink. Two valid policies:

### Policy (a) ENRICH

- Keep internal route when iteration counter permits AND we host 300-500 words of original value-add commentary (NEVER a duplicate of the abstract, NEVER a 50-word stub).

Required content for enriched sub-page:

1. Breadcrumb + back-to-/publications link
2. Full citation block (APA 7th + DOI + journal link)
3. 2-4 paragraph original commentary: why this paper matters, key findings in plain language, methodology highlights, connections to other research, ≥2 corroborating sources cited per `~/.claude/rules/citations.md`
4. "Read full article →" outbound link as primary CTA
5. ≥3 internal links to related publications
6. JSON-LD — `BlogPosting` OR `ScholarlyArticle` with `citation: CreativeWork[]`
7. `og:image` derived from publication abstract via GPT Image 1.5 per-slot prompt (NEVER generic stock image)

### Policy (b) 301 REDIRECT

- Emit `_redirects: /publications/<slug> 301 /publications#<slug>` when iteration counter is low OR no original commentary can be sourced. NEVER ship a thin stub.

### Validator (`validate-publication-subpage.mjs`)

- For every `/publications/<slug>` route: assert `word_count_in_main >= 300 AND has BlogPosting/ScholarlyArticle JSON-LD AND ≥2 outbound citations` OR `_redirects` covers the slug.

## Every linked PDF CV (recent-works expansion + YouTube feature embeds)

***UNIVERSAL — BUILD-BREAKING — extends "Every linked PDF"***

### Trigger

- When `_pdf_facts.json.publications[]` or `.recent_works[]` or `.projects[]` has any entry with `year >= current_year - 5`.

### Requirements

**(a)** Feature ≥3 most-recent works in a hero-adjacent "Recent Work" or "Latest Research" section above-fold-or-second-screen on `/about` (or `/cv` route) — NOT buried at the bottom.

**(b)** For each recent-work entry: YouTube Data API search (`q="<title>" OR q="<author lastname> <topic keyword>"`, `videoEmbeddable=true`, `maxResults=3`) + Exa/Tavily search for conference talks, podcast appearances, news clips. Render top match as `<iframe>` inside work card OR "Watch the talk" CTA (>0.7 cosine title+keywords match).

**(c)** Vimeo Data API as secondary video source when YouTube returns no embeddable match.

**(d)** When zero video matches exist: AI-generate 30-60s explainer via HeyGen (gated to `iteration_count >= 3`).

**(e)** Render each work-card as multimedia bundle: title + year badge + journal/venue + 2-sentence plain-language summary + DOI/canonical CTA + video embed OR audio snippet OR infographic.

**(f)** `/about` hero adds "Featured Work" carousel pulling top 3 recent works with autoplay-paused-on-hover + accessible prev/next.

### Validator (`validate-recent-works-expansion.mjs`)

- When `_pdf_facts.json.publications[].some(p => p.year >= currentYear - 5)`: assert `/about` or `/cv` renders `[data-section="recent-works"]` with ≥3 `[data-card-type="recent-work"]` children AND ≥1 child contains YouTube `<iframe>` OR `[data-video-embed]` OR `[data-audio-snippet]` OR `[data-infographic]`.

## Every site (digital immersive interactive experiences)

***UNIVERSAL — BUILD-BREAKING — on-page generative AI interactions for visitor engagement***

### Trigger

- Every site whose `_brand.json.tier >= 2` (paid tier OR `iteration_count >= 4`).

### Requirements

- MUST ship at least 2 of the following 8 visitor-facing interactive AI experiences.

### Available experiences

1. **"Ask the Founder" chat widget** — RAG over `_pdf_facts.json` + `_publications.json` + `_research.json`, Claude Haiku 4.5, rate-limited via KV (5 queries/IP/hour), persistent thread in localStorage, gorgeous chat UI with avatar+typing indicator, cites source page/publication for every response
2. **"Generate Your Own Infographic"** — visitor enters topic, GPT-Image-2 generates custom infographic with site brand colors, downloadable PNG, R2-cached by `sha256(topic+brand)`, rate-limited 3/IP/day
3. **"AI Reading Companion"** — sidebar on long-form pages; visitor highlights paragraph, AI offers plain-English summary, follow-up question prompts, related publications
4. **"Voice Your Question"** — Web Audio API + Whisper API: visitor speaks question, gets synthesized founder-voice answer (ElevenLabs cloned voice when iteration ≥5 + premium tier) OR text answer with citation
5. **"Interactive Citation Graph"** — D3 force-directed graph of publication co-citation network, click node to see connections, zoom/pan/filter by year or topic, links open external DOI
6. **"Personalized Reading List"** — visitor selects 2-3 interest tags, AI surfaces 5 most-relevant publications + 3 most-relevant blog posts, optional email signup
7. **"Generate a Custom Audio Brief"** — visitor selects research theme, ElevenLabs Studio generates 60-90s audio summary (rate-limited 1/IP/day, R2-cached)
8. **"Live Data Visualization"** — when site has `_research.json.timeseries[]`, render interactive Vega-Lite chart with hover/filter/zoom + "Explain this trend" Claude narration button

### Implementation contract

- Each experience is a `<section data-experience="<name>">` component.
- Gates on `iteration_count` thresholds (simpler ones unlock at 2, expensive ones at 5+).
- Every API call goes through worker proxy (`/api/experience/<name>`) with auth-via-Turnstile + rate-limit-via-KV + budget-cap-per-site (`builds.budget_remaining_cents` decrements).

### Validator (`validate-interactive-experiences.mjs`)

- When `iteration_count >= 4`: assert ≥2 `[data-experience]` sections, each has working `/api/experience/<name>` endpoint, each has Turnstile widget, each has rate-limit copy block.

## Every build (creativity + love + stars doctrine)

***UNIVERSAL — soft-build-influencing, not pixel-gated***

### Doctrine

- Every build pipeline prompt operates under: **build with creativity + love + stars — surprise, delight, wow, amaze, inspire**.

### System prompt preamble

```
"You are building a website for someone real. Bring creativity, care, and craft. Surprise them with delightful touches. Choose the more beautiful option when in doubt. The owner should see this site and feel awe — not corporate compliance. Add at least one unexpected delight per page (a clever microcopy moment, a meaningful animation, a thoughtful empty state, an interactive Easter egg, a hover-reveal, a parallax narrative beat) without sacrificing performance or accessibility. Aim for: impressive, inspirational, joyful, good-good-good. Reject anything that smells like template filler."
```

- System prompt injected via `prompts/_creativity_preamble.txt` loaded by every `.prompt.md` through `loadPromptWithPreamble()` in the prompt registry.

### Delight moments tracking

- `_iteration_log.json` records `delight_moments[]` — orchestrator MUST log at least N delight moments where N = `min(iteration_count + 1, 6)`.

### Validator-lite (`validate-delight-moments.mjs`, info-mode)

- Logs warnings when `delight_moments.length < min(iteration_count + 1, 6)` — does NOT fail the build, gates against complacency.

**Reference**: Brian directive (2026-05-10): "I want AI to be creative + love + stars and build upgrades + recommendations + boosts that impress + wow + amaze + inspire + good-good-good so that you incorporate all the best recommendations + tips + what I've said into the ultimate, ready-to-go, repeatable-build process that steadily improves the website each time you boost it."

## Every site (gamification layer)

***UNIVERSAL — BUILD-BREAKING — owner-visible meta-layer that compounds iteration loyalty***

### Concept

- Every published `*.projectsites.dev` MUST ship a Clerk-gated owner-only meta-layer (`<aside data-owner-only data-gamification-bar>`). Public visitors see ZERO gamification chrome.

### Twelve mechanics (all D1-tracked)

1. **XP = `sites.iteration_count`** with named levels: L1 Seed → L3 Sprout → L5 Bloom → L10 Apex → L20 Legend. Level transitions trigger Resend congrats email + confetti micro-animation on next owner visit.
2. **Owner top-bar** — fixed-bottom-right pill showing `LVL N · Next: <goody>` + "Rebuild" CTA + "Showcase rank #N"; respects `prefers-reduced-motion` + Esc-dismissable per session.
3. **Achievement registry** — `D1.achievements (id, site_id, slug, earned_at)` with seed badges: `first_build` (iter 1), `founder_mode` (iter 3 + multimedia shipped), `polished` (Lighthouse a11y+perf ≥95), `cited` (every claim APA-sourced), `federated` (ActivityPub live), `viral` (embeddable widget on 3rd-party site via referer log), `beloved` (≥100 hearts), `streaker` (4 consecutive weekly rebuilds), `patron` (premium `/create` opt-in).
4. **Streak counter** — `sites.weekly_streak_count` increments when `last_rebuild_at - prev_rebuild_at <= 8 days`; resets to 0 on gap; 4-week streak → `builds.budget_remaining_cents += 2000`.
5. **Public showcase leaderboard** — `projectsites.dev/showcase` ranks all sites by `(iteration_count × 10) + (achievements.length × 5) + lighthouse_avg + engagement_signals_normalized`; 24/page, filter by category; top 10 weekly = "Site of the Week" badge; cron `0 9 * * 1` recomputes + emails winners.
6. **Goody queue as unlock tree** — owners spend "build credits" (1 per achievement, 3 per level-up) to skip ahead or cherry-pick; `sites.build_credits` integer column; premium `/create` = direct credit purchase ($5 = 5 credits).
7. **Referral loop** — every site emits signed `?ref=<slug>` in shared URLs; new owner signing up with ref token gives BOTH sites `+1 build_credit + budget_remaining_cents=500`; `D1.referrals (referrer_slug, referee_slug, created_at)`.
8. **Visitor heart button** — bottom-right of every published site, Turnstile-protected + KV rate-limited (1 heart/IP/24h); increments `sites.heart_count`; ≥100 hearts mints `beloved`.
9. **Delight-moment voting** — each `delight_moments[]` entry renders thumbs-up button at component level (owner-toggle in dashboard); top-voted moments (>10 votes) auto-promoted to skill 15 reusable templates registry.
10. **Weekly streak email** via Resend cron — Subject: "Your `<slug>.projectsites.dev` is N days since last rebuild — rebuild to unlock goody #X"; deep-links to `/dashboard?action=rebuild`.
11. **Build-quality score** — composite `(contrast_pass_pct × 25) + (a11y_score × 25) + (perf_score × 25) + (content_depth_score × 15) + (delight_moments_count × 10)`; 0-100 gauge + drives leaderboard rank.
12. **Premium tier as status** — `/create` opt-in mints public-visible `data-tier="patron"` on `<html>` → Patron badge in showcase + 3× iteration rate + access to Sora/HeyGen/ElevenLabs voice clone goodies.

### D1 schema

```sql
ALTER TABLE sites ADD COLUMN heart_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sites ADD COLUMN weekly_streak_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sites ADD COLUMN build_credits INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sites ADD COLUMN owner_user_id TEXT;
ALTER TABLE sites ADD COLUMN last_rebuild_at TEXT;
ALTER TABLE builds ADD COLUMN budget_remaining_cents INTEGER NOT NULL DEFAULT 0;
CREATE TABLE achievements (id INTEGER PRIMARY KEY AUTOINCREMENT, site_id TEXT NOT NULL, slug TEXT NOT NULL, earned_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (site_id) REFERENCES sites(id), UNIQUE(site_id, slug));
CREATE TABLE referrals (id INTEGER PRIMARY KEY AUTOINCREMENT, referrer_slug TEXT NOT NULL, referee_slug TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(referrer_slug, referee_slug));
```

### Validator (`validate-gamification-layer.mjs`)

- Assert every published site has `<aside data-gamification-bar data-owner-only hidden>` in static HTML.
- Assert showcase route at `https://projectsites.dev/showcase` returns 200 + lists current site when `iteration_count ≥ 1`.
- Assert achievements query for current site returns ≥1 row (`first_build` at minimum).

**Reference**: Brian directive (2026-05-10) "Tell us how we can gamify projectsites.dev."

## Every site (1337 LAYER #1 — Konami dev console)

***UNIVERSAL — BUILD-BREAKING — owner-flex pure-CSS+vanilla-JS***

### Concept

- Every published site MUST ship the Konami-code dev console (↑↑↓↓←→←→BA) — hidden owner-flex overlay materializing a translucent terminal pinned bottom-left.

### Styling

```css
position: fixed;
backdrop-filter: blur(12px);
border: 1px solid var(--accent);
font-family: 'JetBrains Mono';
```

### Four read-only inspectors

1. **`build_id`** from `<meta name="build-id">`
2. **`iteration_count` + `applied_goodies[]`** from `<meta name="iteration-state" content='{...}'>`
3. **`delight_moments[]` registry** from `<meta name="delight-moments" content='[...]'>`
4. **Live performance** — `performance.getEntriesByType('navigation')[0]` (TTFB, DCL, LCP), `performance.memory.usedJSHeapSize`, `navigator.connection.effectiveType`

- Monospace bordered table; closes on Esc OR `[×]` corner; respects `prefers-reduced-motion`.
- Key sequence handler MUST debounce (window=2.5s rolling), reset on wrong key, be leak-free.
- Ships at `apps/project-sites/public/scripts/konami-console.js` (≤4KB gzipped, vanilla — NO framework).
- HTML stub auto-included in every generated template `<head>`: `<script defer src="/_assets/konami-console.js"></script>`.
- ARIA-live region for activation toast: "🎮 dev console armed".

### Validator (`validate-konami-console.mjs`)

- Assert every dist HTML contains `script[src*="konami-console"]` AND `<meta name="build-id">` is non-empty.

**Reference**: Brian directive (2026-05-10) "Okay, implement all of your top recommendations" — #1 of 1337 brainstorm.

## Every site (1337 LAYER #2 — live SSE build stream)

***UNIVERSAL — BUILD-BREAKING — visitor-facing transparency***

### Endpoint

- Every site MUST expose `/build/:slug/live` Server-Sent-Events endpoint streaming in-flight build progress from D1 `audit_logs` WHERE `action LIKE 'build_%' AND site_id = :slug AND created_at >= sites.last_build_started_at`.

### SSE message shape

```
event: build_progress
data: {"phase": "research|asset|generation|inspection|quality|domain", "step": "...", "elapsed_ms": N, "percent": 0-100, "skill_id": "15-site-generation", "delight_count": N, "current_subagent": "...", "log_tail": "≤80 chars"}
```

### Worker route (`apps/project-sites/src/routes/live_stream.ts`) MUST

- Verify slug exists + build in transient state (status IN `building|generating|imaging|uploading|collecting`).
- Set headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`.
- Poll D1 every 750ms via `setInterval` inside `ReadableStream`.
- Close on terminal status OR 10min hard cap.
- Emit `event: build_complete\ndata: {"url": "https://<slug>.projectsites.dev", "iteration": N, "duration_ms": N, "achievements_minted": [...]}` on success.
- Emit `event: build_failed\ndata: {"reason": "...", "retry_url": "..."}` on failure.

### Client integration

- Owner dashboard + showcase listing card render `<live-build-stream slug="...">` web component that EventSource-subscribes, animates progress bar, types log tail char-by-char (`@keyframes typewriter`).

### Validator (`validate-live-build-stream.mjs`)

- Smoke test: `curl https://api.projectsites.dev/build/<slug>/live -N` returns `event: build_progress` within 2s + closes cleanly on `build_complete`.

**Reference**: Brian 1337 brainstorm rec #2.

## Every site (1337 LAYER #3 — build-replay scrubber)

***UNIVERSAL — BUILD-BREAKING — historical iteration timeline***

### Trigger

- Every site at `iteration_count >= 2`.

### Requirements

- MUST ship `/showcase/:slug/replay` route rendering a horizontal scrubber timeline replaying visual evolution across every iteration.
- R2 stores `sites/<slug>/iter-<N>/screenshot-1280.jpg` (1280×720 JPEG ≤180KB) per build via Playwright pre-deploy snapshot.
- D1 `iteration_snapshots (id, site_id, iteration, screenshot_r2_key, taken_at, lighthouse_perf, lighthouse_a11y, delight_count, applied_goodies_json)`.
- UI: full-width `<input type="range" min="1" max="<iteration_count>" step="1">` styled with brand accent + tick marks; scrubbing updates `<img src>` instantly (preload all snapshots); side panel shows metadata (date, applied goodies, Lighthouse delta, delight moments); Lighthouse sparkline (Chart.js or vanilla SVG ≤2KB inline); auto-play button (▶) cycles at 1.2s/frame.

### Validator (`validate-build-replay.mjs`)

- When `iteration_count >= 2`: assert R2 contains `iter-<N>/screenshot-1280.jpg` for every N in `[1..iteration_count]`, `/showcase/<slug>/replay` returns 200 + contains `<input type="range" data-replay-scrubber>` + ≥`iteration_count` `<img data-replay-frame>` preloaded.

**Reference**: Brian 1337 brainstorm rec #11.

## Every site (1337 LAYER #4 — AI-narrated changelog)

***UNIVERSAL — BUILD-BREAKING — iteration → audio storytelling***

### Trigger

- Every build at `iteration_count >= 2`.

### Pipeline

**(a)** Post-deploy step diffs `_iteration_log.json[N-1]` vs `[N]`, extracting `applied_goodies`, `delight_moments`, content depth, and Lighthouse deltas into `_changelog_brief.json`.

**(b)** Claude generates 60-90s second-person narration script with brand voice + Flesch ≥60 per `~/.claude/rules/copy-writing.md`.

**(c)** ElevenLabs `text-to-speech` API (voice="Adam" default, founder voice clone when iteration ≥5 + premium tier) renders MP3 ≤512KB.

**(d)** Audio cached at `sites/<slug>/iter-<N>/changelog.mp3` in R2 with `?v=<build_id>` cache buster.

**(e)** Script text persisted at `sites/<slug>/iter-<N>/changelog.txt` for accessibility + AI search indexing.

- Owner dashboard renders compact audio player on iteration card: `<audio controls preload="metadata">` + transcript expander.
- Public showcase replay scrubber optionally plays changelog audio narrating each iteration.
- Cost: ~$0.30/iteration (ElevenLabs `Eleven Multilingual v2` @ $0.30/1000 chars × ~1000 chars).

### Validator (`validate-changelog-audio.mjs`)

- When `iteration_count >= 2`: assert R2 contains `iter-<N>/changelog.mp3` + `changelog.txt`, AND dashboard `/dashboard/<slug>` renders `<audio>` with `data-changelog-iter` attribute.

**Reference**: Brian 1337 brainstorm rec #13.

## Every site (1337 LAYER #5 — diff-as-art generative artwork)

***UNIVERSAL — BUILD-BREAKING — AST diff → PWA wallpaper***

### Trigger

- Every build at `iteration_count >= 2`.

### Pipeline

**(a)** Post-build git-diff between iteration tags produces `_diff_stats.json = {files_changed, additions, deletions, churn_score, file_tree_diff[]}`.

**(b)** Deterministic generator (`generateDiffArt(stats, brand_colors)` in `apps/project-sites/src/services/diff_art.ts`) seeds canvas at three dimensions:

- 1080×1920 (portrait phone wallpaper)
- 2400×1260 (desktop wallpaper)
- 1200×630 (OG card)

- Brand primary/secondary/accent colors; additive lines = bright strokes, deletions = dark strokes, file tree → spiral geometry.

**(c)** Output saved at `sites/<slug>/iter-<N>/art-{phone,desktop,og}.png` in R2.

**(d)** `/showcase/:slug` renders diff-art as dominant visual — downloadable + shareable via Web Share API.

**(e)** PWA `share_target` accepts incoming images so visitors can fork derivative pieces.

- Each piece seeded by `sha256(slug + iteration + brand_primary)` — deterministic + reproducible.

### Validator (`validate-diff-art.mjs`)

- When `iteration_count >= 2`: assert R2 contains all three art dimensions per iteration, `/showcase/<slug>` has `<img data-diff-art="phone|desktop|og">` AND `<button data-share-art>` invokes `navigator.share()`.

**Reference**: Brian 1337 brainstorm rec #15.

## Every site (1337 LAYER #6 — hidden owner /_terminal)

***UNIVERSAL — BUILD-BREAKING — Clerk-gated WebContainer shell***

### Concept

- Every site MUST expose hidden, Clerk-gated `/_terminal` route booting a WebContainer in-browser instance with site's source tree mounted read-only.
- Unauthenticated → 404 (NEVER 403 — leaks existence). Owner (Clerk session matches `sites.owner_user_id`) → 200.

### UI

- Full-viewport dark xterm.js terminal; sidebar file tree (CodeMirror read-only); bottom command palette (Cmd+K).

### Allowed in-shell commands (whitelist enforced server-side in `apps/project-sites/src/routes/terminal.ts`)

- `ls`, `cat`, `grep`, `wc`, `find`, `tree`
- `git log`, `git diff <iter-N>..<iter-M>`
- `npm run lighthouse <route>` (returns cached report from R2)
- `validate-route <path>` (runs validator subset)
- `rebuild --goody <N>` (queues partial rebuild, decrements `build_credits`)
- `tail audit-log` (last 50 audit_log rows)

- Forbidden: any `rm`/`mv`/`write`/`curl --data`/`fetch POST`/network egress beyond R2-read + D1-read.
- WebContainer API mounts snapshot from R2 (`sites/<slug>/iter-<N>/source-tree.tar`); owner edits volatile only.
- Every command audited to `audit_logs (site_id, action='terminal:<cmd>', actor='owner', meta_json)`.

### Validator (`validate-owner-terminal.mjs`)

- Assert `/_terminal` returns 404 when unauthenticated; returns 200 with `<div id="xterm-container">` when Clerk session matches `owner_user_id`.

**Reference**: Brian 1337 brainstorm rec #37.

## Every site (1337 LAYER #7 — Server-Timing per skill)

***UNIVERSAL — BUILD-BREAKING — observability flex***

### Requirements

- Every Worker response from `apps/project-sites/src/` MUST emit `Server-Timing` HTTP headers breaking response composition down by skill/service unit.
- Format: `Server-Timing: <name>;dur=<ms>;desc="..."` one entry per service called.

### Required entries when applicable

- `site_resolve;dur=...;desc="KV lookup + D1 fallback"`
- `r2_fetch;dur=...;desc="Static asset"`
- `template_render;dur=...;desc="..."`
- `ai_inference;dur=...;desc="<model>"`
- `validation;dur=...;desc="..."`
- `auth;dur=...;desc="Clerk verify"`
- `analytics;dur=...;desc="PostHog enqueue"`
- `total;dur=...;desc="Sum"`

### Implementation

- `apps/project-sites/src/middleware/server_timing.ts` exports `serverTimingMiddleware()` exposing `c.set('timings', new Map())` for handlers.
- Every service helper (`getSite`, `fetchR2`, `renderTemplate`, `callLLM`, `verifyTurnstile`, `checkRateLimit`) MUST call `c.get('timings').set(name, perf - start)` after its work.
- Build pipeline workflow emits `Server-Timing` too from `/api/internal/build-status`.

### Validator (`validate-server-timing.mjs`)

- Assert every API response has `Server-Timing` header with `total;dur=` entry + ≥3 sub-entries + no entry's `dur` is negative or NaN.

**Reference**: Brian 1337 brainstorm rec #45.

## Every site (1337 LAYER #8 — audio-reactive hero)

***UNIVERSAL — BUILD-BREAKING — Web Audio analyser → hero shader***

### Trigger

- Every site at `iteration_count >= 3` whose `_brand.json.has_founder_audio === true`.

### Requirements

- MUST ship audio-reactive hero — `<canvas>` background responding to founder's voice or site's audio brief via Web Audio analyser.
- Hero contains `<audio data-hero-audio src="..." preload="metadata">` with play button overlay.
- On play: `AudioContext.createAnalyser()` taps audio stream; `getByteFrequencyData(buffer)` drives brand-colored particle field on `<canvas>` layered behind hero text.
- Renderer at `apps/project-sites/public/scripts/audio-hero.js` (≤6KB gzipped, vanilla, pure 2D canvas): particle count by mid-band amplitude, hue by treble peak, gravity by bass peak.
- Respects `prefers-reduced-motion` (static brand-gradient instead).
- Mute button persists in `localStorage`.
- Safari iOS fallback: cached frequency snapshot as static frequency bars.

### Validator (`validate-audio-reactive-hero.mjs`)

- When `iteration_count >= 3` AND audio exists: assert hero contains `<canvas data-audio-hero>` + `<audio data-hero-audio>` + `<script src*="audio-hero">` AND `prefers-reduced-motion` CSS rule present.

**Reference**: Brian 1337 brainstorm rec #46.

## Every site (founder personal-brand multimedia profile)

***UNIVERSAL — BUILD-BREAKING — when one founder dominates the source***

### Trigger

- When founder name appears in `>50%` of source page bios/bylines/author lists OR is org's sole named individual in `/about`/`/team`/`/leadership`.

### Requirements

- Rebuild MUST upgrade `/about` from generic org page into full multimedia personal-brand profile.

### Required sections (in order)

**(a) Hero band** — founder portrait (square 1:1, AI-upscaled to ≥1024×1024 if needed) + name + credentials row + 1-sentence positioning statement

**(b) CV timeline** — interactive vertical chronology from `_pdf_facts.json` OR scraped from source `/about`/`/cv`/LinkedIn

**(c) Research focus** — 3-5 thematic clusters with iconography, each linking to relevant publications

**(d) Publications carousel** — top 6 publications by citation count or recency per "Every publication card" enrichment rule

**(e) Speaking + media** — talks, interviews, podcast guest appearances aggregated via Exa search

**(f) Press kit downloads** — high-res headshot + bio (50w/150w/500w variants) + logo lockup

**(g) AI-augmented multimedia layer** (iteration ≥ 3): ElevenLabs-narrated "About Me in 90 seconds" audio, NotebookLM podcast covering career arc, HeyGen avatar video introducing research mission, infographic summarizing impact stats

**(h) Contact + social** — direct email + ORCID + Google Scholar + LinkedIn + ResearchGate + Mastodon as icon row with brand-hex hover

### Validator (`validate-founder-multimedia-profile.mjs`)

- When `_research.json.dominant_founder` resolved (single-founder ratio >0.5): assert `/about` renders `[data-section="founder-hero"]` + `[data-section="founder-timeline"]` + `[data-section="founder-publications"]`; when `iteration_count >= 3`, assert `[data-multimedia="audio"]` + `[data-multimedia="video"]` OR `[data-multimedia="podcast"]` present.

## Every site rebuild (TEMPLATE LEVERAGE #1 — mandatory clone-first)

***UNIVERSAL — BUILD-BREAKING — 10-min build target***

### Requirements

- Every new build MUST `git clone`-equivalent fetch the latest `template.projectsites.dev` build artifact bundle from R2 (`templates/projectsites/latest/`) BEFORE any AI generation step.

### Template ships full production-ready shell with

- Routing skeleton, Tailwind tokens (`--brand-primary`/`--brand-secondary`/`--brand-accent`/`--font-heading`/`--font-body`)
- Components: hero/about/team/services/blog-grid/contact/footer
- Validators, SW+manifest stubs, Analytics+Sentry+PostHog snippets
- Per-route metadata helper, JSON-LD generators, sitemap+robots+humans+well-known/security.txt
- Stripe-first donation widget stub, cal.diy embed stub, ElevenLabs audio brief stub, NotebookLM podcast embed slot
- Konami console + audio-reactive hero scripts pre-bundled

### Generation reduces to

1. Brand-token swap
2. Content slot fill from `_research.json`
3. Per-route copy + JSON-LD synthesis
4. Media slot fill from Media Slot Manifest

- Compute-bound time floor: research (3min) + brand extraction (1min) + content synthesis (3min) + media fill (2min) + validators+deploy (1min) = ~10min.
- NEVER scaffold from zero — reserved for `template.projectsites.dev` itself.

### Validator (`validate-template-leverage.mjs`)

- Assert `_build_metadata.json.template_version` matches R2 manifest at `templates/projectsites/latest/manifest.json`.
- Assert build duration ≤ 15min (10min target, 15min hard cap including 1 retry).

**Reference**: Brian directive (2026-05-10) "leverage template.projectsites.dev to really be done in about 10 minutes".

## Every site rebuild (TEMPLATE LEVERAGE #2 — brand-token-first overlay)

***UNIVERSAL — BUILD-BREAKING***

### Requirements

- After template clone, FIRST generation step MUST emit `_brand_tokens.css` overlay rewriting:
  - `--brand-primary`/`--brand-secondary`/`--brand-accent`
  - `--bg-primary`/`--bg-elevated`
  - `--text-primary`/`--text-muted`
  - `--font-heading`/`--font-body`
  - `--radius-card`/`--shadow-elevation`
- Generation tasks downstream NEVER hardcode hex/font-family values — reference tokens only.

### Validator (`validate-brand-tokens-overlay.mjs`)

- Assert `dist/assets/brand-tokens.css` exists + contains every required CSS custom property.
- Assert `grep` of `dist/**/*.{html,css,js}` finds ZERO inline hex colors outside `brand-tokens.css` (whitelist: og-image PNG generators + branded SVG icons in `_brand.json.brand_svg_inline_whitelist[]`).

**Reference**: prompt-improvements brainstorm rec #2 (2026-05-10).

## Every site rebuild (TEMPLATE LEVERAGE #3 — content-slot JSON only)

***UNIVERSAL — BUILD-BREAKING***

### Requirements

- Content generation prompts MUST emit a single `_content_slots.json` matching template's slot manifest at `templates/projectsites/latest/_slot_schema.json` — never freeform HTML.

### Slot schema is a Zod-validated map

```ts
{
  "hero.headline": "string ≤80chars",
  "hero.subhead": "string ≤160chars",
  "hero.cta_primary.label": "string ≤24chars",
  "hero.cta_primary.href": "url",
  "about.body_md": "markdown ≤800chars",
  "team[]": "Person[]",
  "publications[]": "Publication[]",
  "testimonials[]": "Testimonial[]",
  "faq[]": "QAItem[]",
  "process_steps[]": "Step[]",
  ...
}
```

- Template renderer ingests JSON + brand-tokens + media manifest + research corpus → renders deterministic HTML.

### Validator (`validate-content-slots.mjs`)

- Assert every slot defined in schema has a value (no nulls, no empty strings) OR is explicitly marked `optional: true`.

**Reference**: prompt-improvements brainstorm rec #3 (2026-05-10).

## Every site rebuild (TEMPLATE LEVERAGE #4 — diff-patch iteration)

***UNIVERSAL — BUILD-BREAKING — repeat builds patch, not regenerate***

### Requirements

- Every rebuild at `iteration_count >= 2` MUST run in diff-patch mode:
  1. Load `_content_slots.json` + `_brand_tokens.css` from previous iteration
  2. Identify slots whose source data CHANGED or which a goody mutates
  3. Regenerate ONLY those slots; leave everything else identical
- Iteration ≥2 = ~3-5min (vs 10min cold).
- Diff computed by sha256-ing each slot's source-data lineage; unchanged hash = skip.

### Validator (`validate-diff-patch-iteration.mjs`)

- When `iteration_count >= 2`: assert `_iteration_log.json[current].slots_regenerated[]` < 50% of total slot count AND `slots_skipped_hash_match[]` is populated.

**Reference**: prompt-improvements brainstorm rec #4 (2026-05-10).

## Every site rebuild (TEMPLATE LEVERAGE #5 — template-version pinning + changelog)

***UNIVERSAL — BUILD-BREAKING***

### Requirements

- Every build's `_build_metadata.json` MUST include: `template_version: "<semver>"`, `template_commit_sha: "<git>"`, `template_changelog_since_last_build: [...]` (when iteration ≥ 2).
- Downstream sites do NOT auto-upgrade when `template.projectsites.dev` master advances — owner must explicitly opt-in via dashboard "Upgrade to template v<X>" CTA (with diff preview).
- Cron `0 12 * * 1` (Mondays noon UTC) emails owners digest of new template features + one-click upgrade link.

### Validator (`validate-template-version-pinning.mjs`)

- Assert `_build_metadata.json.template_version` matches a real entry in R2 `templates/projectsites/versions/<v>/manifest.json`.
- Assert version is NOT silently bumped (current === previous unless `_iteration_log.json[current].template_upgrade_intentional === true`).

**Reference**: prompt-improvements brainstorm rec #5 (2026-05-10).

## Every site rebuild (TEMPLATE LEVERAGE #6 — slot-level prompt caching)

***UNIVERSAL — BUILD-BREAKING***

### Requirements

- Every Claude/GPT call generating content for a slot MUST send cacheable system prefix containing: (1) full slot schema, (2) brand voice + tone guide synthesized from research, (3) Mission Doctrine + Creativity Doctrine preambles.
- `cache_control: { type: 'ephemeral' }` breakpoint set at end of system prefix per `~/.claude/rules/prompt-cache.md`.
- Per Anthropic prompt caching (min 1024 tokens, 5min TTL, 90% savings on hits), prefix constant across all 60 slot calls → 59/60 calls hit cache.
- Cost reduction: ~$0.40/build → ~$0.05/build.

### Validator (`validate-slot-prompt-caching.mjs`)

- Assert build's PostHog/Sentry trace shows `cache_read_input_tokens > cache_creation_input_tokens` by ≥10× across slot generation calls.

**Reference**: prompt-improvements brainstorm rec #6 (2026-05-10).

## Every site rebuild (TEMPLATE LEVERAGE #7 — template-is-a-living-product)

***UNIVERSAL — BUILD-BREAKING — every build feeds template improvements upstream***

### Requirements

- Every build whose `delight_moments[]` contains a NEW moment (not in `templates/projectsites/delight_moments_catalog.json`) MUST emit `_template_improvement_proposal.json`.

### Proposal schema

```ts
{ slug, source_site, description, generalization_pattern, suggested_template_file, snippet, evidence_screenshot_r2_key }
```

- Cron `0 0 * * 1` (Mondays midnight UTC) aggregates proposals, ranks by repeated occurrence (≥3 sites surfacing same pattern), opens GitHub Issue against `heymegabyte/template-projectsites`.

### Validator (`validate-template-improvement-pipeline.mjs`)

- When `delight_moments[]` contains new entries vs prior iteration: assert `_template_improvement_proposal.json` exists with ≥1 proposal AND each proposal has `evidence_screenshot_r2_key` resolving to a real R2 object.

**Reference**: prompt-improvements brainstorm rec #7 (2026-05-10).

## Every site rebuild (TEMPLATE LEVERAGE #8 — template pre-warm cache)

***UNIVERSAL — BUILD-BREAKING***

### Requirements

- Container boot MUST pre-warm template assets (HTML shells, component partials, font files, image stubs, validator binaries) into in-memory cache DURING the `research` phase (CPU is idle then).
- `template_prewarm.ts` background worker streams `templates/projectsites/latest/**` from R2 into `Map<string, Buffer>` during first 60s of research.
- Saves ~45s on cold-start template fetch.

### Validator (`validate-template-prewarm.mjs`)

- Assert `_build_metadata.json.template_prewarm_duration_ms` exists + < 90000.
- Assert research phase + template prewarm complete within the same wall-clock window (parallel, not sequential).

**Reference**: prompt-improvements brainstorm rec #8 (2026-05-10).

## Every site rebuild (CINEMATIC FLOOR #1 — hero must be full-screen video or particle field)

***UNIVERSAL — BUILD-BREAKING — every site, no exceptions***

### Requirements

- Every site hero MUST be one of three cinematic treatments — flat-image heroes are BUILD FAIL.

### Allowed treatments

**(a) Full-screen video** — autoplay+muted+playsinline+loop H.264 MP4 ≤4MB OR HLS stream, `<source type="video/webm">` fallback, 16:9 desktop / 9:16 mobile (sourced from GPT Image 1.5 Video v2 OR Sora OR HeyGen OR original site's video assets OR Pexels free 4K library)

**(b) WebGL/Canvas particle field** — Three.js OR vanilla WebGL shader at 60fps, `prefers-reduced-motion` → static gradient fallback, GPU memory ≤256MB

**(c) Scroll-driven cinematic** — `scroll-timeline: --hero` CSS transitioning through 3-5 layered images with parallax + opacity easing

### Hero MUST also include

- Animated headline (typewriter OR fade-up-stagger OR text-mask reveal)
- Micro-interactive CTA (magnetic hover OR ripple-on-hover)
- Brand badge/logo lockup

### Validator (`validate-cinematic-hero.mjs`)

- Assert hero contains `<video autoplay muted playsinline loop>` OR `<canvas data-particle-field>` OR `[style*="scroll-timeline"]`/`@scroll-timeline` CSS.
- Assert hero height ≥ 90vh on desktop.

**Reference**: prompt-improvements brainstorm rec #29 (2026-05-10) + Mission Doctrine "cinematic_floor" mandate.

## Every site (CINEMATIC FLOOR #2 — section transitions with scroll-driven animation)

***UNIVERSAL — BUILD-BREAKING***

### Requirements

- Every section boundary MUST animate on scroll-into-view via `IntersectionObserver` OR native `animation-timeline: view()` (Chrome 115+).
- Allowed entrance treatments: fade-up-stagger (children fade up 12px, 80ms stagger), reveal-mask (`clip-path inset 0→0%`), parallax-slide (background-position vs scroll), pin-and-reveal.
- Forbidden: pop-in (instant appear), bounce (childish), spin (cliché).
- Duration: 600ms cap per `~/.agentskills/11-motion-and-interaction-system/build-breaking-rules.md`.

### Validator (`validate-section-transitions.mjs`)

- Assert every `<section>` (excluding hero + footer) has `data-animate-on-scroll` attribute OR matching `animation-timeline: view()` CSS rule.
- Assert no two adjacent sections share the same treatment.

**Reference**: prompt-improvements brainstorm rec #30 (2026-05-10).

## Every site (CINEMATIC FLOOR #3 — typography must breathe)

***UNIVERSAL — BUILD-BREAKING***

### Requirements

- **H1 font-size**: `clamp(2.5rem, 6vw + 1rem, 7rem)`
- **H1 line-height**: ≤1.05
- **Body line-length**: ≤75ch via container queries
- **Body line-height**: 1.6-1.75
- **Vertical rhythm**: `:where(h1+*, h2+*, h3+*)` adjacent-sibling spacing
- **Text-wrap**: `balance` on headings, `pretty` on body paragraphs
- **Font-feature-settings**: `'ss01', 'cv11'` (or font-specific alternates) for variable fonts

### Validator (`validate-cinematic-typography.mjs`)

- Assert H1 computed font-size at 1920px ≥ 64px.
- Assert body computed line-height ∈ [1.5, 1.85].
- Assert `text-wrap` rule present in CSS for `h1, h2, h3` OR `p`.

**Reference**: prompt-improvements brainstorm rec #31 (2026-05-10).

## Every site (CINEMATIC FLOOR #4 — color depth + gradient meshes)

***UNIVERSAL — BUILD-BREAKING***

### Requirements

- MUST include ≥1 multi-stop conic/radial gradient OR mesh-gradient (`background: conic-gradient(...)` + `background-blend-mode: screen|overlay|multiply`) in hero OR feature section — flat single-color backgrounds across entire site = BUILD FAIL.
- Use OKLCH/OKLab color space for perceptually uniform gradients, `color-mix(in oklch, ...)` for derived shades, `background-color: light-dark(...)` for theme-adaptive surfaces.

### Validator (`validate-color-depth.mjs`)

- Assert `dist/**/*.css` contains ≥1 `conic-gradient` OR `radial-gradient` with ≥3 color stops OR ≥1 mesh-gradient SVG `<filter>`.
- Assert ≥1 `oklch(` OR `oklab(` OR `color-mix(` usage.

**Reference**: prompt-improvements brainstorm rec #32 (2026-05-10).

## Every site (CINEMATIC FLOOR #5 — custom cursor + micro-cursors)

***UNIVERSAL — BUILD-BREAKING — desktop only***

### Requirements

- Every site on `(pointer: fine)` desktop MUST ship custom cursor layer: small accent-colored dot follower + outer ring, scales 1.0→1.6 on hover over interactive elements, transforms to contextual glyph (arrow on links, `+` on images, text-caret on text fields).
- Vanilla JS ≤2KB; single `<div data-cursor>` + `<div data-cursor-ring>` positioned `fixed`, driven by `requestAnimationFrame` on `mousemove`.
- NEVER on touch devices (`@media (pointer: coarse)` disables); respects `prefers-reduced-motion` (degrade to default OS cursor).

### Validator (`validate-custom-cursor.mjs`)

- Assert `<div data-cursor>` + `<div data-cursor-ring>` in DOM + JS handler hooked.
- Assert `@media (pointer: coarse) { [data-cursor], [data-cursor-ring] { display: none; } }` present.

**Reference**: prompt-improvements brainstorm rec #33 (2026-05-10). Supersedes "click ripple only — no cursor follower" rule in `11-motion-and-interaction-system/build-breaking-rules.md`.

## Every site (CINEMATIC FLOOR #6 — sound design opt-in)

***UNIVERSAL — BUILD-BREAKING — single audible toggle, no autoplay***

### Requirements

- Every site MUST ship optional sound design — UI clicks, hover chimes, success tones, scroll whooshes — gated behind a single header/footer 🔊 toggle defaulting OFF (autoplay forbidden).
- Web Audio API plays per-event samples sourced from royalty-free libraries bundled in R2 at `templates/projectsites/sound-kit/v1/{click,hover,success,scroll,reveal}.mp3` (each ≤8KB, MP3 32kbps mono).
- User preference persists in `localStorage`; `prefers-reduced-motion` forces OFF.

### Validator (`validate-sound-design.mjs`)

- Assert site has `<button data-sound-toggle aria-pressed="false">` in header/footer + `<audio>` preload of ≥3 sound effects.
- Assert `prefers-reduced-motion` media query overrides preference.

**Reference**: prompt-improvements brainstorm rec #34 (2026-05-10).

## Every site (MISSION DOCTRINE — DELIGHT #1 — goody-queue delight floor per iteration)

***UNIVERSAL — BUILD-BREAKING***

### Requirements

- `_iteration_log.json[current].delight_moments[]` MUST contain ≥`min(iteration_count + 1, 6)` moments AND ≥1 drawn from the next-up entry in the 20-entry goody queue at `~/.claude/projects/-Users-apple-emdash-projects-projectsites-dev/memory/project_progressive_rebuild.md`.
- Iteration N MUST consume goody index `N % 20` and register delight evidence.
- If goody is structurally infeasible for the build's site type, skip + log reason in `_iteration_log.json[current].goody_skipped_reasons[]` + advance to next index.

### Validator (`validate-goody-queue-consumption.mjs`)

- Assert `delight_moments[]` length ≥ floor AND at least one moment's `source` === `"goody_queue:<index>"`.

**Reference**: prompt-improvements brainstorm rec #41 (2026-05-10).

## Every site (MISSION DOCTRINE — DELIGHT #2 — unexpected 404 + 500 experience)

***UNIVERSAL — BUILD-BREAKING***

### Requirements

- Every site MUST ship 404 AND 500 pages as cinematic mini-experiences — animated brand mascot OR custom illustration OR SVG illustration OR mini-game (Snake, Pong, brand-colored Tetris) — never the framework default.

### 404 MUST include

- Large headline, brand-styled illustration/animation, "Back to home" CTA, search box (`/?q=<term>`), suggested-pages list (3 random from sitemap).

### 500 MUST include

- Empathetic copy ("Something broke — we've been notified"), correlation ID display, status page link, retry CTA.

### Validator (`validate-error-experience.mjs`)

- Assert 404 + 500 contain `[data-error-illustration]` OR `<svg data-error-art>` OR `<canvas data-error-mini-game>` AND CTA buttons present.

**Reference**: prompt-improvements brainstorm rec #42 (2026-05-10).

## Every site (MISSION DOCTRINE — DELIGHT #3 — Konami easter egg escalation)

***UNIVERSAL — BUILD-BREAKING — iteration ≥ 5 unlocks more***

### Requirements

- Every site at `iteration_count >= 5` MUST extend the Konami dev console with ≥1 site-specific Easter egg unlocked by additional gesture (e.g. `Shift+?` opens command palette, double-tap brand logo cycles hidden theme, scrolling down 10× then up triggers confetti).
- Easter eggs themed to site domain: medical/non-profit = gentle whimsy; portfolio = dev-flex shortcuts; local business = brand mascot.
- Each egg registers as a `delight_moments[]` entry.

### Validator (`validate-easter-egg-escalation.mjs`)

- When `iteration_count >= 5`: assert ≥1 additional event listener beyond Konami code AND `delight_moments[]` contains entry with `source === "easter_egg_escalation"`.

**Reference**: prompt-improvements brainstorm rec #43 (2026-05-10).

## Every site (MISSION DOCTRINE — DELIGHT #4 — post-deploy evidence GIF)

***UNIVERSAL — BUILD-BREAKING***

### Requirements

- Every successful build MUST generate a 1080×1920 (9:16 portrait) MP4 + GIF screen-recording: homepage hero → scroll → CTA → footer at 1.5× speed.
- Captured by Playwright `page.video()` with `viewport: { width: 1080, height: 1920 }` post-deploy.
- Saved to `sites/<slug>/iter-<N>/deploy-walkthrough.{mp4,gif}` in R2 (≤2MB each).
- Owner dashboard renders walkthrough on iteration card; showcase listing uses it as preview thumbnail (autoplay on hover); weekly digest cron emails it to owner.

### Validator (`validate-deploy-walkthrough.mjs`)

- Assert R2 contains `.mp4` + `.gif`, both ≤2MB, dashboard renders `<video data-walkthrough>`.

**Reference**: prompt-improvements brainstorm rec #44 (2026-05-10).

## Every site (MISSION DOCTRINE — DELIGHT #5 — personalized owner greeting)

***UNIVERSAL — BUILD-BREAKING — Clerk session-aware welcome***

### Requirements

- Every site MUST detect owner (Clerk session matches `sites.owner_user_id`) and surface non-intrusive top-bar OR toast: "Welcome back, `<first_name>`. Site is on iteration `<N>`. `<X>` visitors since your last login. `<Y>` new hearts."
- Owner-only — public visitors never see it.
- Server-side render decision in worker route based on Clerk session lookup (never client-only injection — avoids CLS + ensures indexers see clean public HTML).

### Validator (`validate-owner-greeting.mjs`)

- Assert owner-visiting fixture sees `[data-owner-greeting]`; non-owner fixture does NOT.

**Reference**: prompt-improvements brainstorm rec #45 (2026-05-10).

## Every site (MISSION DOCTRINE — DELIGHT #6 — revisitor detection + subtle evolution)

***UNIVERSAL — BUILD-BREAKING***

### Requirements

- Every site MUST detect returning visitors via `localStorage.first_visit_at` + `last_visit_at` and subtly evolve the experience: visit #2 shows different hero variant OR "Welcome back" badge OR reveals hidden section OR plays different audio brief.
- Ship ≥2 hero variants (A/B); non-destructive variant selector in `<head>` early-script reads localStorage + sets `data-visitor-variant` on `<html>` before paint.
- NEVER show "Welcome back" to first-time visitors.

### Validator (`validate-revisitor-evolution.mjs`)

- Assert ≥2 `[data-hero-variant]` elements exist AND CSS selector `html[data-visitor-variant="returning"] [data-hero-variant="b"]` is defined.

**Reference**: prompt-improvements brainstorm rec #46 (2026-05-10).

## Every prompt run (PROMPT MECHANICS #1 — concurrent tool calls default)

***UNIVERSAL — BUILD-BREAKING***

### Requirements

- Every build orchestrator running multi-step pipelines MUST batch independent tool calls into a single response wherever no data dependency exists.
- Research subagents fan out 3-5 parallel; brand extraction + sitemap walk + asset audit run in parallel; per-route content generation fan out (1 per route, max 10 concurrent); validators fan out.
- Sequential ONLY when later step consumes earlier step's output.

### Validator (`validate-concurrent-tool-call-discipline.mjs`)

- Parse build trace: assert `max_concurrent_subagent_calls >= 3` AND `phases_with_serialized_independent_calls === 0`.

**Reference**: prompt-improvements brainstorm rec #47 (2026-05-10) + `~/.claude/CLAUDE.md` "Parallelization" mandate.

## Every prompt run (PROMPT MECHANICS #2 — system-prefix cache breakpoints explicit)

***UNIVERSAL — BUILD-BREAKING***

### Requirements

- Every Anthropic API call MUST set explicit `cache_control: { type: 'ephemeral' }` breakpoints at: end of doctrine preamble, end of skill bundle, end of research corpus injection, end of slot schema.
- Maximum 4 breakpoints per request (Anthropic limit).

### Validator (`validate-cache-breakpoints.mjs`)

- Assert build trace shows ≥3 distinct `cache_control` breakpoints used.
- Assert average `cache_read_input_tokens / total_input_tokens` ratio ≥ 0.7 across slot generation calls.

**Reference**: prompt-improvements brainstorm rec #48 (2026-05-10) + `~/.claude/rules/prompt-cache.md`.

## Every prompt run (PROMPT MECHANICS #3 — structured-output JSON schema enforcement)

***UNIVERSAL — BUILD-BREAKING***

### Requirements

- Every content-generation LLM call MUST request structured JSON output via `response_format: { type: 'json_schema', json_schema: { ... } }` (OpenAI) OR Anthropic tool-use forced response.
- Freeform-string generation is BUILD FAIL for any slot bound to typed data.
- Pre-validated by Zod schema before persisting to `_content_slots.json`.

### Validator (`validate-structured-outputs.mjs`)

- Assert every content-gen LLM call in trace has `response_format` OR `tools` block.
- Assert parsed response validates against Zod slot schema.

**Reference**: prompt-improvements brainstorm rec #49 (2026-05-10).

## Every prompt run (PROMPT MECHANICS #4 — self-critique loop until convergence)

***UNIVERSAL — BUILD-BREAKING***

### Requirements

- Every generated slot MUST pass a self-critique gate before persisting — second LLM call with rubric: "is this content slop? does it violate banned-words list? is Flesch ≥60? does it match brand voice? is it factually consistent with research corpus?" Returning `{ accept: bool, score: 0-100, issues: [...] }`.
- Reject + regenerate up to 3× before falling back to human-review queue.

### Validator (`validate-self-critique-loop.mjs`)

- Assert every persisted slot in `_content_slots.json` has accompanying `_content_slots_critique.json[slot_key].accept === true` + `score >= 75`.

**Reference**: prompt-improvements brainstorm rec #50 (2026-05-10) + Zero Recommendations gate.
