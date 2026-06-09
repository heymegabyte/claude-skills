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

ALWAYS use original logo+favicon when source is extractable via any path in this chain. Brand equity ALWAYS > AI novelty — NEVER replace real logos with AI-generated ones regardless of quality score. AI generation is LAST RESORT only, used exclusively when every extraction path returns 404/unreachable.

### Theme + brand-splash extraction

- Match source theme (light vs dark) always when extractable
- Extract logo's icon-only region as `brand-splash.png` (hero bg) + `brand-mark.png` (favicon source)
- Match logo font as `--font-heading` site-wide

### Media walk

Walk EVERY page for ALL:

- `<img>` + `<picture>` + CSS bg
- Slider/swiper/splide/glide + Squarespace/Wix gallery
- Lazy `data-src` + `og:image`
- Downloadable PDFs/DOCs (resumes, brochures, menus)

Preserve slider groups with order.

### Augmentation

- Ship `original_image_count × 1.4` minimum (`× 2.0` typical)
- Augment via GPT Image 1.5 (primary), Pexels, Pixabay, Google CSE
- Feature linked PDFs prominently (e.g. team CVs on `/about`)

### Post-build vision pass

GPT Image 2 vision scan vs source → classify gaps as `local-skill | universal-skill | template | one-off` → auto-edit appropriate file with dated incident citation → push template repo same prompt.

## Every site rebuild (full-corpus mandate)

***DEFAULT IS KEEP EVERY ORIGINAL PAGE***

### Crawler scope

Crawler MUST enumerate the source's complete URL set:

- `sitemap.xml` → `robots.txt` → HTML link graph BFS
- CMS-specific index pages: `/blog`, `/news`, `/press`, `/portfolio`, `/projects`, `/team`, `/services`, `/case-studies`, `/publications`, `/events`, `/awards`, `/recipes`, `/locations`, `/products`
- Squarespace `/config/pages`, WP `wp-sitemap-posts-*.xml`, Wix `_api/v1/sitemap.xml`
- Wayback fallback

Rebuild EVERY URL — never stop at homepage, never stop at top-level nav.

### Default policy

- Every original URL becomes a live route on the new site (200 OK with full content+metadata+JSON-LD)
- Merge permitted ONLY when two pages are clearly duplicates or thin (≤200 words)
- Merged pages MUST emit a `_redirects` entry `original-url 301 canonical-url 301` so the original URL never 404s

### Build gate

`validate-urls.mjs` curls every original URL against deployed site — any 404 or unintended 410 = fail.

### Per-page requirements

Every page must run through:

- AI editorial pass (clean grammar+typography+rhythm WITHOUT rewriting facts/quotes/dates/names)
- Universal hyperlink mandate
- ≥2 contextual internal links to sibling routes + ≥1 outbound link to canonical sources/journals/orgs/PDFs

## Every site rebuild (media+video — both extracted)

***IMAGES AND VIDEO BOTH EXTRACTED***

### Video walk

Walker MUST capture:

- `<video>` + `<source>` + `<iframe src*=youtube|vimeo|wistia|loom>`
- `data-video-id` + CSS `background-video`
- Autoplay-loop hero MP4s + animated WebPs + lottie `.json` animations

Alongside images.

### `_videos.json` output

Schema: `(src/poster/duration/dims/transcript-if-available)`. Consumed by template's `<VideoEmbed>` component (lazy-load, poster-first, captions if VTT exists). Hero videos preserve their slot when source uses one.

### Augmentation

- Pexels Video API + YouTube Data API search by topic
- GPT Image 1.5 image generation is PURPOSE-CRAFTED PER SLOT

### Per-slot GPT Image 1.5 prompt mandatory fields

1. Route+section it lives in
2. Page topic+intent
3. Brand palette tokens (e.g. "matte navy #060610 + cyan accent #00E5FF")
4. Composition+aspect ratio (16:9 hero / 1:1 card / 4:5 portrait)
5. Subject specificity ("octogenarian volunteer plating soup, soft window light, documentary style" NOT "people helping")
6. Negative prompt (no text, no watermarks, no AI artifacts, no extra fingers, no logos)

Generic "create a hero image" prompts = fail; per-slot specificity required. Same prompt template applies to GPT Image 1.5, Ideogram, Stability — reuse the slot-prompt across providers with a fallback chain.

## Every site (deep crawl)

When source has list pages (`publications|team|portfolio|projects|services|case-studies|blog index`), crawler MUST:

- Follow each detail link
- Extract short summary + outbound link per item
- Skip quoted academic abstracts (duplicate-content risk)

## Every site (dual-vision checkpoints)

***PER-SECTION + PER-ROUTE + FINAL PRE-PUBLISH — UNIVERSAL — BUILD-BREAKING — see ~/.claude/rules/visual-inspection.md***

Site generation MUST fire dual-vision at 4 checkpoints:

1. **Per-section** — Claude Vision (FREE, Sonnet 4.6 via Max 20x OAuth) after each section renders (hero|features|testimonials|impact|footer|etc.) at 1bp (1280). Catches white-on-white, overflow, missing-image, broken grid BEFORE next section adds atop broken foundation.
2. **Per-route** — Claude Vision at all 6 breakpoints (375/390/768/1024/1280/1920) after route assembles + mission-doctrine grade (cinematic_floor + latest_tech_flex).
3. **Per-iteration** — Claude Vision diffs current build vs previous build (`sites.iteration_count`) screenshots. Catches "earlier LMG was better" regression class.
4. **Final pre-publish** — GPT Image 2 vision on homepage 6bp + Claude Vision on every route 6bp. Both must hit ≥8/10 across cinematic_floor + latest_tech_flex + brand_fidelity + accessibility + hero_impact.

### GPT Image 2 vision veto

- Homepage only
- Brand-fidelity GPT Image 2 vision judge compares rendered ATF vs source-site screenshot — highest-ROI metered call

### Cost cap

**$0.50 GPT Image 2 vision per build** allocation:

- ~$0.10 hero/ATF
- ~$0.15 brand-fidelity vs source
- ~$0.10 final 6bp homepage
- ~$0.15 reserve arbitration

Claude Vision marginal cost ZERO on Max 20x — use uncapped.

### Auth

- **Claude Vision** — via `~/.claude/.credentials.json.claudeAiOauth` OAuth bearer (NEVER API key on macOS spawn — burns metered credits on flat-rate plan, see ~/.claude/rules/auth-spawned-claude.md)
- **GPT Image 2 vision** — via `OPENAI_API_KEY`

### Consensus

- Both ≥8 → ship
- One <8 → remediate (3-round cap, then log `_iteration_log.json.visual_carryover[]` + fix-forward)
- Persistent disagreement → Computer-Use third pass

### Tier 1 (FREE) gate

Playwright a11y tree + axe-core + DOM-walker contrast runs FIRST every checkpoint. Catches ~80% with zero token spend.

### Logging

Every vision call logs `vision_provider`, `auth_mode`, `cost_cents` to D1 `audit_logs`.

### Validator (`validate-site-dual-vision.mjs`)

- Assert `_iteration_log.json.vision_checkpoints[]` contains per-section + per-route + final entries with `claude_vision_score`+`gpt4o_score`(when fired)+`evidence[]` populated
- Assert `audit_logs` shows `auth_mode='max-oauth'` for every Claude Vision call (API-key fallback = warning)
- Assert build-cap `SUM(cost_cents) WHERE vision_provider='gpt-4o' AND build_id=<id> <= 50`

## Every site (gorgeous loop pre-deploy)

Final critique-and-edit LLM pass — "Make this website even more beautiful + gorgeous + creative + intuitive + clever + witty + interesting + cool" — max 3 rounds, each round applies concrete edits. Runs AFTER content/build, BEFORE deploy.

## Every site (grammar audit)

Post-generation LLM pass fixes:

- Typos
- Subject-verb agreement
- Tense
- Oxford-comma

WITHOUT rewriting/removing information. No content reduction, no paraphrase.

## Every linked PDF

***PRIMARY RESEARCH — NOT JUST AN ASSET***

When source site links a PDF (CV, resume, brochure, menu, whitepaper, annual report):

1. `pdftotext` → structured-fact extraction (LLM with strict JSON schema)
2. `_pdf_facts.json` keyed by URL BEFORE Phase 1 build

### CV as picture-of-the-soul

- Every position, education, publication, grant, award, project becomes a structured fact available to all generation prompts
- CVs specifically render as an interactive Timeline component on `/about` (or new `/cv` route)
- Vertical chronology, year markers, expandable role/event cards with concise summary + hyperlinks to institutions/journals/grants/papers
- In-viewport fadeIn, supplementary metadata in smaller text WITH ≥7:1 contrast

### Web-research enrichment per timeline node

Via Exa/Tavily/Perplexity — find the related papers, the institution pages, the news mentions — and include all as outbound links.

## Every site (impact/stat rollup section mandatory)

***UNIVERSAL — non-profit + SaaS + service business***

### When this fires

Every site whose `_research.json` resolves ≥3 quantifiable stats (donors|volunteers|meals served|customers|years operating|lives impacted|revenue|$ raised|publications|projects shipped|members|clients|countries served) MUST render an "Our Impact in Numbers" section.

### Layout

- Section title variants: "Our Impact in Numbers" | "By the Numbers" | "Trusted by Thousands" | "Our Track Record" | "Since YYYY"
- Above-fold-or-second-screen on homepage
- 3-4 column responsive grid (1col@375 | 2col@768 | 4col@1280)
- Each stat = oversized animated counter (`clamp(2.5rem,8vw,5rem)`) + label below + optional icon above
- Counter rolls in via IntersectionObserver+rAF per "Every stat block" rule
- Section uses brand-accent-tinted bg with subtle gradient OR solid bg-secondary band — visually distinct from neighboring sections

### Rule

NEVER ship a non-profit/SaaS/service site without stat-rollup when stats exist.

### Validator (`validate-stat-counter-section.mjs`)

For sites with `_research.json.stats[].length >= 3`, assert `dist/index.html` contains `<section data-section="stats">` with ≥3 `[data-stat-counter]` children AND each counter has `data-stat-end` numeric attribute.

## Every site rebuild (cross-site _redirects + canonical chain)

***BETWEEN OLD+NEW LIVE INSTANCES — UNIVERSAL — BUILD-BREAKING when both resolve***

### Trigger

When rebuilding under new hosting/URL while old URL still resolves (test/preview deploys, parallel migrations, A/B between projectsites.dev subdomain and original custom domain).

### Requirements

- `_redirects` MUST emit a 301 from EVERY original-site URL to matching new-site URL
- **Build gate**: parse `_url_inventory.json`, for every original URL emit `<original-path> 301 https://<new-host><new-path>` line
- New site uses different slug/path scheme (CMS migration changes `/post-id` → `/slug`)? Emit per-URL mapping NOT wildcards
- Old hosting (Squarespace/WP/Wix) cannot serve `_redirects` itself — so new host MUST own `<link rel="canonical" href="https://<new>/<path>">` on every page
- Pair with sitemap submission to GSC + IndexNow ping

### Validator (`validate-cross-site-redirects.mjs`)

When env `OLD_SITE_URL` set, fetch original sitemap, intersect with new sitemap, assert every original URL appears in `_redirects` OR resolves identically via canonical chain.

## Every site rebuild (complete blog/content corpus import)

***NEVER SUBSAMPLE — reinforces full-corpus mandate***

### Trigger

When source site has blog/news/journal/article/post index.

### Requirements

- Import EVERY post (no "import top 10 latest" — import all 120+, all 500+, all 2000+)
- Pagination 12-24 per page, total count visible, infinite-scroll OR numbered pages with prev/next/first/last
- Each post becomes a real route with:
  - Full metadata + structured data (BlogPosting JSON-LD)
  - Author byline + publish date + tags + categories + reading time
  - ≥3 related-posts + share buttons + comment thread (when source had it)
- Categories+tags become FUNCTIONAL filter chips (per "Every interactive feature" rule) that actually filter the listing — not styled stubs
- Per-post images (hero, inline, OG card) extracted from source post AND augmented per "Every page (media density)" rule

### Validator (`validate-blog-corpus-complete.mjs`)

When source detected as having a blog (path matches `/blog|/news|/articles|/journal|/posts|/press|/updates|/insights|/stories`):

- Assert `_corpus.json.posts.length >= source_blog_post_count * 1.0`
- Assert blog index renders ALL posts via pagination
- Assert ≥2 functional filter taxonomies (category + tag minimum)

## Every donation/give CTA (Stripe-first GiveDirectly UX)

***UNIVERSAL — BUILD-BREAKING — non-profit + church + school + community***

### When this fires

Every site whose research classifies as `non_profit | church | school | community_org | charity | foundation | religious_org`.

### Requirements

MUST ship a Stripe-Checkout donation flow. NEVER PayPal-as-default — PayPal optional secondary.

### Layout pattern (GiveDirectly-inspired)

1. **Monthly tab DEFAULT-active** (research shows 4× LTV vs one-time), One-Time tab secondary
2. **Preset amounts row** of 4-6 chips ($25 | $50 | $100 | $250 | $500 | Other) with mid-tier ($100) pre-selected
3. **Custom-amount text input** with `inputmode="numeric"` + currency prefix
4. **Impact-statement string** under amount ("$50 = 30 meals" | "$100 = 1 family/month") pulled from `_research.json.impact_metrics[]`
5. **Single primary CTA** "Donate $100/month" rendering live amount + cadence
6. **Stripe Checkout redirect** on submit: `POST /api/donate/checkout` → `stripe.checkout.sessions.create({mode: amount.recurring ? 'subscription' : 'payment', line_items, success_url, cancel_url})`
7. **Trust row** — tax-deductible badge + EIN + 501(c)(3) verification link + payment-card icons + lock icon
8. **Optional add-on checkbox** "Cover the 2.9% processing fee so 100% reaches the cause" (auto-adds to amount)

### Stripe setup

- Stripe Connect when site is multi-tenant marketplace
- Standard Stripe account otherwise
- Tax-receipt email auto-fires via Stripe webhook → Resend

### Validator (`validate-donation-stripe-first.mjs`)

For sites tagged non-profit/church/school, assert `/donate` (or homepage donate section) contains:

- `<form data-donation>` with monthly tab `aria-pressed=true` by default
- Stripe-Checkout endpoint
- ≥4 preset chips
- Impact-statement renders
- Tax-deductible trust row visible

PayPal/Venmo/Zelle/check options live in collapsible "Other ways to give" expander BELOW Stripe form, never as default tab.

## Every publication card (enriched)

***ABSTRACT + JOURNAL + PDF + YEAR + AUTHORS — UNIVERSAL — BUILD-BREAKING — extends "Every publication tile"***

### When this fires

When a site has a `/publications`, `/research`, `/papers`, or `/portfolio` page.

### Required fields per card

1. **Abstract/summary** — 2-4 sentence paraphrase (NOT copy-paste of quoted abstract — duplicate content risk) derived from Crossref/Semantic Scholar/PubMed abstract field
2. **Authors** — full author list as `Lastname, F., Lastname, F., et al.` hyperlinked to their ORCID or institution profile when resolvable
3. **Journal/venue name** — displayed as styled badge, hyperlinked to journal homepage
4. **Year** — displayed prominently, used for chronological grouping
5. **DOI or direct URL** — rendered as primary CTA button "View Article →" (`target=_blank, rel=noopener`)
6. **PDF link** — when available via Unpaywall API `https://api.unpaywall.org/v2/{doi}?email=hey@megabyte.space` returns `best_oa_location.url_for_pdf` — render secondary CTA "Download PDF" if non-null

### Listing layout

- Group cards by year (descending) with year dividers: `<h2 class="year-divider" data-year="2024">2024</h2>`
- Never a flat unsorted list
- Filter by research area/topic (use `keywords[]` from Crossref response)

### Validator (`validate-publications-enriched.mjs`)

For every `[data-card-type=publication]`, assert presence of:

- `data-abstract`, `data-authors`, `data-journal`, `data-year` attributes
- At least one CTA `<a href>` pointing to external host
- Year-divider elements present in listing page

## Every publication tile (deeplink or redirect)

***NEVER INTERNAL DUPLICATE-CONTENT STUB***

### Requirements

Publication/paper/article tiles in `/publications` (or `/research|/papers|/portfolio`) index MUST link DIRECTLY to canonical external academic URL (DOI > PubMed > arXiv > journal article URL > publisher landing page) — NEVER to internal `/publications/<slug>` route that just re-displays the same metadata + abstract (duplicate-content + no value-add).

### Discovery chain (skill 15 publication-deeplink-resolver)

1. Scrape source-site publication PDF/citation block for DOI/journal name/year
2. Crossref API `https://api.crossref.org/works?query.title=<title>&query.author=<lastname>` returns DOI
3. PubMed E-utilities `esearch.fcgi?db=pubmed&term=<title>+<author>` for biomedical
4. arXiv API for STEM preprints
5. Google Scholar scrape via Serper/Tavily as last resort
6. Journal homepage search if title matches exactly

Persist `_publications.json[].deeplink_url` BEFORE Phase 1 build.

### Tile requirements

- `<a href="<deeplink>" target="_blank" rel="noopener noreferrer">` wrapping entire surface
- NO internal `/publications/<slug>` route generated when deeplink resolved
- WHEN deeplink unavailable AFTER full discovery chain, `_redirects` MUST emit `/publications/<slug> 301 /publications#<slug>` (anchor link to expanded card on index page) — NEVER stand up a duplicate-content stub route

### Validator (`validate-publication-deeplinks.mjs`)

- Every `[data-card-type=publication]` element href MUST point to external host
- `_redirects` MUST cover any internal `/publications/<slug>` URLs from sitemap

## Every site with blog source corpus (rebuild as blog)

***SITE_TYPE OVERRIDE — UNIVERSAL — BUILD-BREAKING***

### Trigger

When source site crawler detects `>5 blog/news/article posts`:

- Path matches `/blog|/news|/articles|/journal|/posts|/press|/updates|/insights|/stories`
- AND at least 5 detail pages with `published_date` metadata

Site_type MUST be overridden to `blog` REGARDLESS of the one-line prompt's implied type.

**Rationale**: A blog business IS its content — rebuilding it as a generic 4-page brochure site destroys the core value.

### Requirements

1. **Import ALL posts** (per "Complete Blog/Content Corpus" rule)
2. **REWRITE each post for quality improvement** — fix grammar, improve clarity, sharpen headlines (4-8 words), punch up first paragraphs (Flesch ≥60), add internal links — but NEVER alter facts/dates/quotes/sources
3. **Re-extract ALL media from each source post** + supplement with GPT Image 1.5 per-slot prompts (post-topic-specific, brand-palette-matched) + Pexels Video for hero sections
4. **Homepage becomes magazine-style blog index** (featured post hero, category filter row, 3-column grid, pagination, sidebar with top tags + search)
5. **Every post gets**: unique title/meta/H1, 600+ words, featured image (R2-hosted), FAQPage JSON-LD, author byline, publish date, reading time, ≥3 related-posts links, share buttons, category+tag chips

### Validator (`validate-blog-site-type.mjs`)

When `_research.json.source_blog_post_count >= 5`:

- Assert `_build_config.json.site_type === "blog"`
- Assert homepage route renders `[data-section="blog-index"]`
- Assert `_corpus.json.posts.length >= source_blog_post_count`

## Every site rebuild (source-site contact info preservation)

***UNIVERSAL — BUILD-BREAKING***

### Trigger

When source site contains direct staff/department emails (`[a-z]+@<domain>`), direct phone extensions, named-person contact cards, department contact lists.

### Requirements

- MUST preserve EVERY one in the rebuild — never collapse 12 staff emails into a single `info@` catch-all

### Discovery

Scrape source `/contact`, `/staff`, `/team`, `/about`, `/leadership`, `/board`, `/clergy`, `/faculty`, `/leadership-team`, `/our-team`, footer mailto: links, body-text mailto: links. Extract every `mailto:`, every `tel:`, every named-person card with associated email/phone/role into `_contacts.json[]` keyed by name.

### Render

- `/contact` page contains a "Direct Contacts" section with named cards (per-staff card: photo + name + role + dept + email-as-MailLink + phone-as-TelLink + dept badge)
- Footer contains general info + `/contact` deep-link
- Department list cards: dept name + dept-level email + dept phone

### Validator (`validate-contact-preservation.mjs`)

When source site detected as having contact directory (`>3 mailto:` links OR named-person contact pages):

- Assert `_contacts.json[].length >= source_contact_count * 0.95` (allow 5% drop for spam-trap mailto's)
- Assert `dist/contact.html` renders ≥`source_contact_count * 0.95` distinct mailto: hyperlinks

## Every site with ≥2 team members in research (team page mandatory)

***UNIVERSAL — BUILD-BREAKING***

### Trigger

When `_research.json.team[].length >= 2` OR source site has any `/team`, `/staff`, `/people`, `/faculty`, `/leadership`, `/board`, `/clergy`, `/about#team` pages.

### Requirements

A dedicated `/team` route MUST be generated (OR integrated as a section-with-anchor on `/about` for small teams ≤4 people).

### Each person card MUST include

- **Headshot** (per skill 12 team headshot rule — square, consistent)
- **Full name**
- **Job title / role**
- **Department** if applicable
- **Bio** 50-120 words (extracted from source, editorially improved — never rewritten, never fabricated)
- **Credentials/certifications** displayed as styled badge pills (PhD, MD, JD, PE, CPA, MBA, etc.)
- **Social links** (LinkedIn primary, ORCID for researchers, Twitter/X secondary) as icon links with brand-hex hover
- **Email** as mailto: link when source had it
- **JSON-LD `Person` schema** (see "Every team member" rule)

### Ordering + layout

- Leadership/founders first, then alphabetical or by role seniority
- Grid: 3-column at 1280px, 2-col at 768px, 1-col at 375px

### Validator (`validate-team-page.mjs`)

When `_research.json.team.length >= 2`, assert `/team` route exists (200 OK) OR `/about#team` section has `[data-section="team"]` with ≥2 `[data-card-type="person"]` children.

## Every site (branded 404 + 500 error pages)

***UNIVERSAL — BUILD-BREAKING***

### `404.html` requirements

- On-brand design with logo at top
- `<h1>Page not found</h1>` (or equivalent in site's voice: "That page took a hike")
- Brief empathetic message ≤2 sentences
- Search input (`<form action="/blog"><input type="search" placeholder="Search…"></form>` pointing to site's search)
- Top 5 most important site links as cards/chips
- Primary CTA back to homepage
- Full branding (nav, footer, theme, fonts) — NOT a plain white page

### `500.html` requirements

- Same branding + `<h1>Something went wrong</h1>`
- Brief message, retry CTA
- Contact email `<a href="mailto:…">`

### Worker integration (`src/index.ts` site-serving)

- Intercept 404 from R2 `object.status === 404` → serve `sites/<slug>/404.html` with 404 status code
- Intercept uncaught errors → serve `sites/<slug>/500.html` with 503

### Validator (`validate-error-pages.mjs`)

- Assert `sites/<slug>/404.html` exists in R2 AND contains `<h1>` + logo `<img>` + homepage `<a href="/">` + search `<input>`
- Assert `curl <site-url>/nonexistent-path-xyz` returns HTTP 404 (not 200 with empty body or CF default)

## Every professional-services or consulting site (process / how-it-works section)

***UNIVERSAL — BUILD-BREAKING***

### Trigger

When `_research.json.category` matches `legal | medical | dental | consulting | financial | marketing | engineering | architecture | accounting | coaching | therapy | design-agency | research | education | real-estate`.

### Requirements

Homepage MUST contain a "How It Works" or "Our Process" section with 3-5 numbered steps. Each step:

- Step number rendered as large accent numeral or icon
- Step title (4-8 words)
- Step description (20-40 words)
- Optional icon illustration

### Layout

- Horizontal steps at ≥768px
- Vertical timeline at mobile
- Every step title linked to deeper service detail page when one exists

### Section title variants

"Our Process" | "How We Work" | "Your Journey" | "The Path Forward" | "What to Expect" — choose based on voice/register of the site.

### Placement

Between hero and testimonials/social proof.

### Validator (`validate-process-section.mjs`)

For sites with qualifying category, assert homepage HTML contains `[data-section="process"]` OR `[data-section="how-it-works"]` with ≥3 `[data-step]` children, each having `[data-step-number]` + `[data-step-title]`.

## Every company founded ≥20 years ago (heritage timeline section)

***UNIVERSAL — BUILD-BREAKING***

### Trigger

When `(current_year - _research.json.founded_year) >= 20` OR source site contains explicit "Since YYYY", "Established YYYY", "Founded in YYYY" text OR any `About` page content references decades of history.

### Requirements

1. **"Since YYYY" badge** on hero section (e.g. `<span class="badge-heritage">Since 1918</span>`) styled with subtle aged/gold/serif treatment
2. **Company milestones timeline section** on `/about` page:
   - Vertical timeline at mobile, alternating left-right at desktop
   - Each milestone node: year (oversized accent numeral), event title (5-10 words), 1-2 sentence description, optional image thumbnail
   - Min 5 milestone entries extracted from research (founding, key expansions, product launches, name changes, ownership transitions, facility moves, award years)
3. **Heritage stat counters** in homepage stats section: "X Years in Business" counter using calculated years (rolls in via IntersectionObserver per stat-counter rule)
4. **"Family-owned since YYYY"** or **"3rd generation"** notes in hero subheadline when applicable

### Validator (`validate-heritage-timeline.mjs`)

When `_research.json.founded_year` set and age ≥20:

- Assert `/about` HTML has `[data-section="timeline"]` with ≥5 `[data-milestone]` children
- Assert homepage hero contains `[data-badge="heritage"]`

## Every site with ≥2 testimonials in research

***TESTIMONIALS SECTION — UNIVERSAL — BUILD-BREAKING***

### Trigger

When `_research.json.testimonials[].length >= 2` OR source site has any review/testimonial/quote section.

### Each testimonial card MUST include

- **Quoted text** in a `<blockquote>` element, punctuated with opening quote mark (decorative `::before { content: '"' }` or SVG quote icon)
- **`<cite>` element** wrapping: person name + job title/company (MANDATORY — no anonymous testimonials unless source explicitly omits identity)
- **Star rating** rendered as accessible SVG stars (1-5) when source has rating data
- **Avatar**: use source photo if available → GPT Image 1.5 headshot as fallback → initials monogram badge as final fallback (NEVER no avatar)

### Layout

- Carousel pattern for ≥5 testimonials (autoplay 4s, pause on hover, prev/next arrows, dot indicators, keyboard accessible)
- Grid for 2-4 testimonials

### Section title

"What Clients Say" | "In Their Own Words" | "Trusted By" | "Customer Reviews" — choose based on site voice.

### Social proof augmentation

Google Places API rating + count displayed as "⭐ 4.8 (127 Google reviews)" when `GOOGLE_PLACES_API_KEY` available.

### Validator (`validate-testimonials.mjs`)

When `_research.json.testimonials.length >= 2`:

- Assert homepage `[data-section="testimonials"]` exists with ≥2 `<blockquote>` elements, each containing `<cite>`
- Assert each `<blockquote>` has non-empty text ≥20 chars

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

- Inline `<script type="application/ld+json">` inside each person card component
- AND on their individual detail page `/team/<slug>` if one exists
- Author bylines on blog posts MUST link the `Person` JSON-LD to the post's `BlogPosting.author` field

### Validator (`validate-person-jsonld.mjs`)

For every `[data-card-type="person"]`, assert adjacent or parent `<script type="application/ld+json">` contains `"@type":"Person"` with non-empty `name`, `jobTitle`, `worksFor.name`.

## Every testimonials section (AggregateRating + Review JSON-LD)

***UNIVERSAL — BUILD-BREAKING***

### Trigger

When a site's testimonials section exists (per "Every site with ≥2 testimonials" rule).

### Requirements

The containing page MUST include:

**(a) `AggregateRating` JSON-LD** on `Organization` or `LocalBusiness` JSON-LD:

```json
"aggregateRating":{"@type":"AggregateRating","ratingValue":"4.8","bestRating":"5","worstRating":"1","ratingCount":"127","reviewCount":"127"}
```

Pull values from Google Places API when available, or synthesize from testimonials count (when no explicit rating, use count only: `"reviewCount":"8"`).

**(b) Individual `Review` JSON-LD** for each testimonial:

```json
{"@type":"Review","author":{"@type":"Person","name":"Jane D."},"reviewBody":"…","datePublished":"2024-01-15","reviewRating":{"@type":"Rating","ratingValue":"5"}}
```

When testimonials have no date, use approximate year from source ("2024" inferred from recency).

### Validator (`validate-review-jsonld.mjs`)

For every page with `[data-section="testimonials"]`, assert `<script type="application/ld+json">` on page contains:

- `"@type":"AggregateRating"` nested in Organization/LocalBusiness
- ≥1 `"@type":"Review"` block

## Every FAQ section (FAQPage JSON-LD validator)

***UNIVERSAL — BUILD-BREAKING***

### Requirements

Every page rendering a FAQ section (accordion, numbered Q&A, toggle list, any `<dl>` question-answer pattern) MUST:

1. **Use semantic markup** — `<details><summary>Question?</summary><div>Answer.</div></details>` OR `<section data-faq><div data-faq-item>…</div></section>` with ARIA accordion attrs
2. **Include FAQPage JSON-LD** on the same page:

   ```json
   {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Q?","acceptedAnswer":{"@type":"Answer","text":"A."}}]}
   ```

   One entry per FAQ item
3. **Draw from real source-site FAQ content** OR generated from `_research.json` most-common-questions field — NEVER fabricated generic questions ("What are your hours?" as a stub). FAQ count: minimum 5 items; maximum 20 per page section
4. **Answers MUST be complete, self-contained** (no "contact us for more info" as sole answer — at minimum provide substantive answer THEN offer contact)

### Validator (`validate-faq-jsonld.mjs`)

For every `[data-section="faq"]` or `<details>` parent with ≥3 children:

- Assert `<script type="application/ld+json">` contains `"@type":"FAQPage"` with `mainEntity.length >= 3`
- Each entry has non-empty `name` + `acceptedAnswer.text ≥ 20 chars`

## Every site with extractable source logo (brand colors from logo)

***UNIVERSAL — BUILD-BREAKING***

### Trigger

When source-site logo is reachable (`_brand.json.logo.original_url` HEAD-200s OR `_brand.json.logo.original_icon_url` HEAD-200s OR Logo.dev/Brandfetch returned non-empty).

### Requirements

Site's primary+secondary brand colors MUST be extracted from that logo via GPT Image 2 vision — NEVER guessed from category/business-type/industry default.

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

### Extraction priority chain (FIRST match wins, MUST walk each before falling through)

1. **GPT Image 2 vision** on logo PNG/SVG with prompt "extract the dominant brand colors as 6-digit hex, no descriptions, return JSON {primary,secondary,accent,reasoning}" using `imageDetail: "high"`
2. **DOM scrape** of source `header`/`nav` `background-color` + `<button class*="cta"|"btn-primary">` `background-color` via Playwright `getComputedStyle`
3. **`wp-content/themes/*/theme.json` palette field** for WordPress sites
4. **`og:image` dominant-color extraction** via vision (last resort before fallback)
5. **Industry default** ABSOLUTE LAST RESORT, MUST log warning + flag `color_source: "industry_default"`

### Validator (`validate-brand-colors.mjs`)

- When `_brand.json.logo.original_url` set, `color_source !== "industry_default"` (build fails)
- When source logo is reachable, GPT Image 2 vision is RE-RUN at validate-time against the logo + claimed primary hex returns ΔE ≤ 30 against logo's dominant pixel cluster (CIE 2000) — primary hex must be visually present in logo
- `theme-color` meta tag in dist/index.html === `_brand.json.primary` exactly (case-insensitive)
- `mask-icon color` meta tag === `_brand.json.primary` (no separate hardcoded value — single source of truth)
- `_brand.json.confidence >= 0.7` when `color_source === "logo_vision_extraction"`

**Reference incidents**:

- lonemountainglobal.projectsites.dev (2026-05-06) shipped with `theme-color: #1d3557` (navy) AND `mask-icon color: #2d6a4f` (green) — two hardcoded category-default colors not present in LMG's actual logo, two different colors on the same site (no single brand source of truth)
- njsk.org (2026-05-01) shipped with burgundy guess instead of LMG-actual extracted color, drove the original `feedback_brand_color_extraction.md` memory

## Every page with ≥3 H2 headings (table of contents)

***BUILD-BREAKING — long-form content pages***

### Trigger

Every page whose main content `<article>` or `<main>` contains ≥3 distinct `<h2>` headings.

### Requirements

**(a) Desktop (≥1024px)** — `<nav class="toc" aria-label="Table of contents">` as sticky sidebar:

```css
position: sticky; top: var(--nav-height, 5rem); max-height: calc(100vh - 6rem); overflow-y: auto
```

Left rail (25% width) alongside main content (75%).

**(b) Mobile** — collapsed accordion at the TOP of `<main>` (above first H2):

```html
<details class="toc-mobile"><summary>On this page</summary><ol>…</ol></details>
```

Collapsed by default.

**(c) TOC entries** — `<ol>` with one `<li><a href="#section-slug">Section Title</a></li>` per H2. Auto-generated from all `<h2>` in content via `querySelectorAll('h2[id]')` on DOMContentLoaded. H3 entries optional as indented children.

**(d) Active state** — IntersectionObserver highlights the currently-in-view H2's TOC entry with accent color.

**(e) H2 elements** MUST all have `id` attributes (kebab-cased from text — auto-applied by build step).

### Validator (`validate-toc.mjs`)

For every page with ≥3 `<h2>` in main content:

- Assert `<nav class="toc">` or `<details class="toc-mobile">` present
- Each H2 has a corresponding `<a href="#…">` in TOC
- Each H2 has non-empty `id` attr

## Every site rebuild (logo-text-color → navbar polarity)

***UNIVERSAL — BUILD-BREAKING — extends "BRAND COLORS FROM LOGO"***

### Trigger

When the source-site logo contains rendered text (wordmark logos, "Lone Mountain Global" + mountain mark, virtually all professional brand logos).

### Requirements

The navbar/header background polarity MUST be driven by the logo's text-pixel luminance — NOT by site-theme aesthetic preference and NOT by overall logo dominant-pixel luminance (which can be the background, not the text).

### GPT Image 2 vision pass on the logo MUST extract separately

- `_brand.json.logo.text_pixel_color = "#hex"`
- `_brand.json.logo.text_luminance = 0-1`

Via prompt: `"Identify the TEXT/wordmark pixels in this logo (ignore background, ignore decorative marks). Return JSON {text_hex, text_luminance, bg_hex, bg_luminance, reasoning}"`.

### Navbar rule

- **White-or-light logo text (luminance ≥ 0.7)** → navbar background MUST be dark (`≤ 0.25` luminance, primary brand color OR pure dark `#0a0a1a`)
- **Dark logo text (luminance ≤ 0.3)** → navbar background MUST be light (`≥ 0.85` luminance, white/off-white)

Same rule applies to hero band, footer, any section where logo renders.

### Contrast gate

Header background-luminance vs logo text-luminance MUST satisfy `|Δluminance| ≥ 4.5:1` per WCAG.

### Logo variants

Header MUST swap a separate logo variant when the global theme polarity conflicts. Template ships `logo-light.png` for dark backgrounds + `logo-dark.png` for light backgrounds — `<picture>` swaps based on container `--bg-luminance` custom prop.

### Validator (`validate-navbar-polarity.mjs`)

For every dist HTML:

- Compute header `background-color` via Playwright `getComputedStyle`
- Fetch logo `<img>` from header
- Run GPT Image 2 vision `text_luminance` check against header bg
- Fail when contrast <4.5:1

## Every site rebuild (progressive iteration enhancement + dual-source scrape)

***UNIVERSAL — BUILD-BREAKING — minimal-spend goody queue per build***

### Concept

Every site rebuild is a versioned, additive iteration — NOT a from-scratch regeneration.

### D1 schema

`sites.iteration_count INTEGER DEFAULT 0` increments on every successful build.

### Dual-scrape requirement

Build pipeline MUST scrape BOTH:

- The original source site
- The previous projectsites.dev deploy (when `iteration_count >= 1`)

So quality compounds across rebuilds — original gives brand fidelity, previous deploy gives our editorial improvements + augmented assets.

Persist `_dual_scrape.json = {original: {...}, previous_build: {...}, diff_strategy: "merge" | "override"}` BEFORE Phase 1.

### Goody queue (ordered, applied per iteration N as minimal-spend additive enhancement)

1. Person JSON-LD + ORCID enrichment per researcher
2. Publication sub-page enrichment to 300-500w (per "Every publication sub-page" rule)
3. Web Audio API podcast player UI shell on `/about` (loads progressive enhancement audio when iteration ≥ 3)
4. AI-generated founder podcast via ElevenLabs Studio or NotebookLM (single 5-10min episode per founder, R2-hosted, ~$2-4 API cost)
5. Infographic gallery — 3-6 Recraft/Vega-Lite/GPT-Image-2 generated infographics summarizing key research findings, embedded on `/research`
6. AI-generated explainer video via HeyGen (60-90s, founder avatar + key talking points, ~$5-8)
7. Press kit page (`/press`) with logo downloads + bio variants + headshots + quotable stats
8. Interactive timeline component (Person/Organization timeline with year markers, replaces static `/about` chronology)
9. Speaking engagements aggregator (scraped from Google Scholar + conference sites via Exa)
10. Citation graph viz (D3-based, shows researcher's publication citation network)
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

Order is roughly cheapest+highest-conversion-impact first.

### Container behavior

Reads `sites.iteration_count` at boot, applies goodies `[0..N]` from the queue, marks `_iteration_log.json[N].applied_goodies[]`.

### Validator (`validate-progressive-iteration.mjs`)

- Assert `sites.iteration_count` incremented
- Assert `_iteration_log.json[current_iteration].applied_goodies.length >= current_iteration` (each build adds at least one new goody)

### Premium tier acceleration

Paid `/create` upgrade flag (`builds.opt_in_premium_multimedia = true`) accelerates the queue 3× per iteration (premium tier costs an extra ~$15 per build for 3 simultaneous goodies).

## Every publication sub-page (enrich 300-500w supporting parent kw OR 301)

***UNIVERSAL — BUILD-BREAKING — extends "Every publication tile"***

### Trigger

When source site has historical `/publications/<slug>` sub-pages (or `/research/<slug>`, `/papers/<slug>`, `/portfolio/<slug>`) AND the publication-tile rule resolved a canonical external deeplink (DOI/PubMed/arXiv/journal URL).

Two valid policies for the internal slug route:

### Policy (a) ENRICH

Keep internal route alive when iteration counter permits multimedia investment AND we can host 300-500 words of original value-add commentary supporting the parent page's target keywords (NEVER a duplicate of the abstract, NEVER a 50-word stub).

Required content for enriched sub-page:

1. **Breadcrumb + back-to-/publications link**
2. **Full citation block** (APA 7th + DOI + journal link)
3. **2-4 paragraph original commentary** written by Claude during build, focused on:
   - Why this paper matters in the field
   - Key findings explained in plain language
   - Methodology highlights
   - How it connects to other research on the parent `/publications` page
   - What readers should take away
   - MUST cite ≥2 corroborating sources from research (per `~/.claude/rules/citations.md`)
4. **"Read full article →" outbound link** as primary CTA to canonical external URL
5. **≥3 internal links** to related publications on the same site
6. **JSON-LD** — `BlogPosting` OR `ScholarlyArticle` with `citation: CreativeWork[]`
7. **`og:image`** derived from publication abstract via GPT Image 1.5 per-slot prompt (subject: research field theme, NEVER a generic stock image)

### Policy (b) 301 REDIRECT

When iteration counter is low OR no original commentary can be sourced:

- Emit `_redirects: /publications/<slug> 301 /publications#<slug>` (anchor to expanded card on listing)
- Ensure listing page renders the card in expanded state when hash matches

NEVER ship a thin internal stub that just re-shows the abstract — duplicate content penalty + zero user value.

### Validator (`validate-publication-subpage.mjs`)

For every `/publications/<slug>` route (depth=2), assert:

- `word_count_in_main >= 300 AND has BlogPosting/ScholarlyArticle JSON-LD AND ≥2 outbound citations`
- OR `_redirects` covers the slug

## Every linked PDF CV (recent-works expansion + YouTube feature embeds)

***UNIVERSAL — BUILD-BREAKING — extends "Every linked PDF"***

### Trigger

When source-site linked PDF (CV/resume/portfolio) extraction yields `_pdf_facts.json.publications[]` or `.recent_works[]` or `.projects[]` AND any entry has `year >= current_year - 5`.

### Requirements

**(a) Feature ≥3 of the most-recent works** in a hero-adjacent "Recent Work" or "Latest Research" section above-fold-or-second-screen on `/about` (or `/cv` route) — NOT buried in a chronological backlog at the bottom

**(b) For each recent-work entry**:

- Run YouTube Data API search (`q="<title>" OR q="<author lastname> <topic keyword>"`, `videoEmbeddable=true`, `maxResults=3`)
- AND Exa/Tavily search for conference-talk videos, podcast guest appearances, news interview clips on the topic
- Render top match as embedded `<iframe>` inside the work card OR as adjacent "Watch the talk" CTA when a strong match (`>0.7 cosine on title+keywords`) is found

**(c) Vimeo Data API** as secondary video source when YouTube returns no embeddable match

**(d) When zero video matches exist**:

- AI-generate a 30-60s explainer via HeyGen (founder avatar reading the abstract summary)
- Gated to `iteration_count >= 3` to control cost

**(e) Render each work-card as multimedia bundle**:

- Title + year badge + journal/venue + 2-sentence plain-language summary
- DOI/canonical outbound CTA
- Video embed OR audio podcast snippet OR infographic generated from key figures

**(f) `/about` hero section** adds a "Featured Work" carousel pulling the top 3 recent works with autoplay-paused-on-hover and accessible prev/next controls

### Validator (`validate-recent-works-expansion.mjs`)

When `_pdf_facts.json.publications[].some(p => p.year >= currentYear - 5)`:

- Assert `/about` or `/cv` route renders `[data-section="recent-works"]` with ≥3 `[data-card-type="recent-work"]` children
- AND ≥1 child contains a YouTube `<iframe>` OR `[data-video-embed]` OR `[data-audio-snippet]` OR `[data-infographic]`

## Every site (digital immersive interactive experiences)

***UNIVERSAL — BUILD-BREAKING — on-page generative AI interactions for visitor engagement***

### Trigger

Every site whose `_brand.json.tier >= 2` (paid tier OR iteration_count >= 4).

### Requirements

MUST ship at least 2 of the following 8 visitor-facing interactive AI experiences embedded as page sections.

**Goal**: visitors don't just READ the site, they INTERACT with AI that's been pre-trained on the site's research/brand corpus.

### Available experiences

1. **"Ask the Founder" chat widget** — RAG over `_pdf_facts.json` + `_publications.json` + `_research.json`, powered by Claude Haiku 4.5 with system prompt grounding it to ONLY answer from the corpus + cite source page/publication for every response, rate-limited via KV (5 queries/IP/hour), persistent thread in localStorage, gorgeous chat UI with avatar+typing indicator
2. **"Generate Your Own Infographic"** — visitor enters a topic from the site's research areas, GPT-Image-2 generates a custom infographic on-demand using site brand colors + template, downloadable PNG, R2-cached by `sha256(topic+brand)` so popular requests are free, rate-limited 3/IP/day
3. **"AI Reading Companion"** — sidebar on long-form pages, visitor highlights a paragraph, AI offers (a) plain-English summary, (b) follow-up question prompts, (c) related publications from the corpus
4. **"Voice Your Question"** — Web Audio API + Whisper API: visitor speaks a question, gets a synthesized founder-voice answer (ElevenLabs cloned voice when iteration ≥5 + premium tier) OR text answer with citation
5. **"Interactive Citation Graph"** — D3 force-directed graph of publication co-citation network, click any node to see connections, zoom/pan/filter by year or topic, links open external DOI
6. **"Personalized Reading List"** — visitor selects 2-3 interest tags, AI surfaces 5 most-relevant publications + 3 most-relevant blog posts from the corpus, optional email signup to receive the list
7. **"Generate a Custom Audio Brief"** — visitor selects a research theme, ElevenLabs Studio generates a 60-90s audio summary stitching key publication abstracts together (rate-limited 1/IP/day, R2-cached)
8. **"Live Data Visualization"** — when site has time-series stats in `_research.json.timeseries[]`, render an interactive Vega-Lite chart with hover/filter/zoom and an "Explain this trend" button that calls Claude to narrate the pattern

### Implementation contract

- Each experience is a `<section data-experience="<name>">` component
- Gates on `iteration_count` thresholds (simpler ones unlock at 2, expensive ones at 5+)
- Every API call goes through worker proxy (`/api/experience/<name>`) with auth-via-Turnstile + rate-limit-via-KV + budget-cap-per-site (`builds.budget_remaining_cents` decrements)

### Validator (`validate-interactive-experiences.mjs`)

When `iteration_count >= 4`:

- Assert ≥2 `[data-experience]` sections exist
- Each has a working `/api/experience/<name>` endpoint
- Each has a Turnstile widget
- Each has a rate-limit copy block

## Every build (creativity + love + stars doctrine)

***UNIVERSAL — soft-build-influencing, not pixel-gated***

### Doctrine

Every prompt in the build pipeline operates under the explicit doctrine: **build with creativity + love + stars — surprise, delight, wow, amaze, inspire**.

This is not a checklist gate (no `validate-creativity.mjs` script), but a system-prompt-level instruction that prepends every Claude/GPT call in the pipeline.

### System prompt preamble

```
"You are building a website for someone real. Bring creativity, care, and craft. Surprise them with delightful touches. Choose the more beautiful option when in doubt. The owner should see this site and feel awe — not corporate compliance. Add at least one unexpected delight per page (a clever microcopy moment, a meaningful animation, a thoughtful empty state, an interactive Easter egg, a hover-reveal, a parallax narrative beat) without sacrificing performance or accessibility. Aim for: impressive, inspirational, joyful, good-good-good. Reject anything that smells like template filler."
```

System prompt injection happens via `prompts/_creativity_preamble.txt` loaded by every `.prompt.md` automatically through `loadPromptWithPreamble()` in the prompt registry.

### Delight moments tracking

Each build's `_iteration_log.json` records `delight_moments[]` — the orchestrator MUST log at least N delight moments where N = `min(iteration_count + 1, 6)`.

### Examples of delight moments

- A 404 page with an animated mascot in the brand's style
- A footer Easter egg that activates on Konami code
- A hero CTA that subtly pulses with a heartbeat animation
- An empty search result that suggests a relevant page with humor
- A hover-tooltip that previews destination content
- A custom cursor that morphs near interactive elements
- A sound-effect (opt-in) on form success
- A printable thank-you page after donation

### Validator-lite (`validate-delight-moments.mjs`, info-mode)

Logs warnings when `_iteration_log.json[current].delight_moments.length < min(iteration_count + 1, 6)` — does NOT fail the build, just gates against complacency.

**Reference**: Brian directive (2026-05-10): "I want AI to be creative + love + stars and build upgrades + recommendations + boosts that impress + wow + amaze + inspire + good-good-good so that you incorporate all the best recommendations + tips + what I've said into the ultimate, ready-to-go, repeatable-build process that steadily improves the website each time you boost it."

## Every site (gamification layer)

***UNIVERSAL — BUILD-BREAKING — owner-visible meta-layer that compounds iteration loyalty***

### Concept

Every published `*.projectsites.dev` MUST ship a Clerk-gated owner-only meta-layer that turns the progressive-rebuild loop into a game.

- Public visitors see ZERO gamification chrome
- Only the owner (Clerk session matches `sites.owner_user_id`) sees the top-bar `<aside data-owner-only data-gamification-bar>`

### Twelve mechanics (all D1-tracked)

1. **XP = `sites.iteration_count`** with named levels:
   - L1 Seed → L3 Sprout (founder-profile unlocks per multimedia rule)
   - L5 Bloom → L10 Apex (full 20-entry goody queue applied)
   - L20 Legend
   - Level transitions trigger Resend congrats email + confetti micro-animation on next owner visit
2. **Owner top-bar** — fixed-bottom-right pill showing `LVL N · Next: <goody>` + "Rebuild" CTA + "Showcase rank #N"; respects prefers-reduced-motion + Esc-dismissable per session
3. **Achievement registry** — `D1.achievements (id, site_id, slug, earned_at)` with seed badges:
   - `first_build` (iteration 1)
   - `founder_mode` (iteration 3 + multimedia profile shipped)
   - `polished` (Lighthouse a11y+perf ≥95)
   - `cited` (every quantitative claim APA-sourced per `~/.claude/rules/citations.md`)
   - `federated` (ActivityPub actor live, goody 19)
   - `viral` (embeddable widget detected on 3rd-party site via referer log)
   - `beloved` (≥100 hearts)
   - `streaker` (4 consecutive weekly rebuilds)
   - `patron` (premium `/create` opt-in)
4. **Streak counter** — `sites.weekly_streak_count` increments when `last_rebuild_at - prev_rebuild_at <= 8 days`; resets to 0 on gap. 4-week streak → `builds.budget_remaining_cents += 2000` (auto-comp one premium multimedia goody next build)
5. **Public showcase leaderboard** — `projectsites.dev/showcase` (apex marketing site, NOT subdomain) ranks all sites by composite score `(iteration_count × 10) + (achievements.length × 5) + lighthouse_avg + engagement_signals_normalized`; pagination 24/page, filter by category. Top 10 weekly = "Site of the Week" badge + featured grid above leaderboard. Cron `0 9 * * 1` (Monday 9am UTC) recomputes scores + sends winners a Resend email
6. **Goody queue as unlock tree** — instead of strict 0→19 order, owners spend "build credits" (1 credit per achievement, 3 per level-up) to skip ahead or cherry-pick. `sites.build_credits` integer column. Premium `/create` = direct credit purchase ($5 = 5 credits)
7. **Referral loop** — every site emits a signed `?ref=<slug>` query-token in shared URLs; when a new owner signs up with `?ref=<slug>`, BOTH sites get `+1 build_credit` + `+1 budget_remaining_cents=500`. `D1.referrals (referrer_slug, referee_slug, created_at)` table
8. **Visitor heart button** — bottom-right corner of every published site (NOT owner-bar), Turnstile-protected + KV rate limited (1 heart per IP per 24h); increments `sites.heart_count`; ≥100 hearts mints `beloved` achievement
9. **Delight-moment voting** — each `_iteration_log.json[current].delight_moments[]` entry renders with a small thumbs-up button at component level (owner-toggle in dashboard); top-voted moments (>10 votes) get auto-promoted into the skill 15 reusable templates registry
10. **Weekly streak email** via Resend cron — Subject: "Your `<slug>.projectsites.dev` is N days since last rebuild — rebuild to unlock goody #X"; deep-links to `/dashboard?action=rebuild`
11. **Build-quality score** on owner dashboard — composite `(contrast_pass_pct × 25) + (a11y_score × 25) + (perf_score × 25) + (content_depth_score × 15) + (delight_moments_count × 10)`; renders as 0-100 gauge + drives leaderboard rank
12. **Premium tier as status** — `/create` opt-in mints public-visible `data-tier="patron"` attribute on `<html>` → unlocks Patron badge in showcase grid + 3× iteration rate (goodies 0,1,2 applied iteration 1; 3,4,5 iteration 2; etc.) + access to Sora/HeyGen/ElevenLabs voice clone goodies

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

- Assert every published site has `<aside data-gamification-bar data-owner-only hidden>` element in static HTML (Clerk session JS reveals it on owner match)
- Assert showcase route at `https://projectsites.dev/showcase` returns 200 + lists current site when `iteration_count ≥ 1`
- Assert achievements query for current site returns ≥1 row (first_build at minimum)

**Reference**: Brian directive (2026-05-10) "Tell us how we can gamify projectsites.dev."

## Every site (1337 LAYER #1 — Konami dev console)

***UNIVERSAL — BUILD-BREAKING — owner-flex pure-CSS+vanilla-JS***

### Concept

Every published site MUST ship the Konami-code dev console (↑↑↓↓←→←→BA) — a hidden owner-flex overlay that materializes a translucent terminal pinned bottom-left.

### Styling

```css
position: fixed;
backdrop-filter: blur(12px);
border: 1px solid var(--accent);
font-family: 'JetBrains Mono';
```

### Four read-only inspectors derived from runtime data

1. **`build_id`** from `<meta name="build-id">` injected at deploy time
2. **`iteration_count` + `applied_goodies[]`** from `<meta name="iteration-state" content='{...}'>` JSON
3. **`delight_moments[]` registry** from `<meta name="delight-moments" content='[...]'>`
4. **Live performance** — `performance.getEntriesByType('navigation')[0]` (TTFB, DCL, LCP), `performance.memory.usedJSHeapSize`, `navigator.connection.effectiveType`

### Render

- Monospace bordered table
- Closes on Esc OR clicking the `[×]` corner
- Respects `prefers-reduced-motion`

### Key sequence handler

- MUST debounce (window=2.5s rolling)
- Reset on wrong key
- Leak-free, never persistent listener bloat

### Template shipping

- Ships at `apps/project-sites/public/scripts/konami-console.js` (≤4KB gzipped, vanilla — NO framework)
- HTML stub auto-included in every generated template `<head>`:

  ```html
  <script defer src="/_assets/konami-console.js"></script>
  ```

- ARIA-live region for the toast that fires on activation: "🎮 dev console armed"

### Validator (`validate-konami-console.mjs`)

- Assert every dist HTML contains `script[src*="konami-console"]`
- AND `<meta name="build-id">` is present AND non-empty

**Reference**: Brian directive (2026-05-10) "Okay, implement all of your top recommendations" — #1 of 1337 brainstorm: pure dev-flex, cheap to ship, signals craftsmanship.

## Every site (1337 LAYER #2 — live SSE build stream)

***UNIVERSAL — BUILD-BREAKING — visitor-facing transparency***

### Endpoint

Every site MUST expose `/build/:slug/live` Server-Sent-Events endpoint streaming the in-flight build's progress events from D1 `audit_logs` table — one event per row `WHERE action LIKE 'build_%' AND site_id = :slug AND created_at >= sites.last_build_started_at`.

### SSE message shape

```
event: build_progress
data: {"phase": "research|asset|generation|inspection|quality|domain", "step": "...", "elapsed_ms": N, "percent": 0-100, "skill_id": "15-site-generation", "delight_count": N, "current_subagent": "...", "log_tail": "≤80 chars"}
```

### Worker route (`apps/project-sites/src/routes/live_stream.ts`) MUST

- Verify slug exists + build in transient state (status IN `building|generating|imaging|uploading|collecting`)
- Set headers: `c.header('Content-Type', 'text/event-stream'); c.header('Cache-Control', 'no-cache'); c.header('Connection', 'keep-alive')`
- Poll D1 every 750ms via `setInterval` inside `ReadableStream`
- Close on terminal status OR 10min hard cap (whichever first)
- Emit `event: build_complete\ndata: {"url": "https://<slug>.projectsites.dev", "iteration": N, "duration_ms": N, "achievements_minted": [...]}` on success
- OR `event: build_failed\ndata: {"reason": "...", "retry_url": "..."}` on failure

### Client integration

Owner dashboard + showcase listing card render `<live-build-stream slug="...">` web component that:

- EventSource-subscribes
- Animates progress bar
- Types log tail char-by-char (`@keyframes typewriter`)

Visitor-facing route `/build/:slug/live` (HTML wrapper around SSE) is the showcase-card detail page when a build is in flight — visitors watch sites being born in real-time.

### Validator (`validate-live-build-stream.mjs`)

Smoke test against running container that `curl https://api.projectsites.dev/build/<slug>/live -N` returns `event: build_progress` within 2s + closes cleanly on `build_complete`.

**Reference**: Brian 1337 brainstorm rec #2 — amplifies the immersive-experiences rule.

## Every site (1337 LAYER #3 — build-replay scrubber)

***UNIVERSAL — BUILD-BREAKING — historical iteration timeline***

### Trigger

Every site at `iteration_count >= 2`.

### Requirements

MUST ship a `/showcase/:slug/replay` route rendering a horizontal scrubber timeline that replays the visual evolution of the site across every iteration.

### Required data

- R2 stores per-iteration homepage screenshot at `sites/<slug>/iter-<N>/screenshot-1280.jpg` (1280×720 JPEG ≤180KB) captured at the end of each build via Playwright pre-deploy snapshot step
- D1 `iteration_snapshots (id, site_id, iteration, screenshot_r2_key, taken_at, lighthouse_perf, lighthouse_a11y, delight_count, applied_goodies_json)`

### UI

- Full-width `<input type="range" min="1" max="<iteration_count>" step="1">` styled with brand accent thumb + tick marks at each iteration
- Scrubbing updates `<img src="<r2-url>">` instantly (preload all snapshots ≤ N concurrently)
- Side panel shows iteration metadata (date, applied goodies, Lighthouse delta, delight moments minted)
- Bottom row: lighthouse-perf+a11y sparkline (Chart.js or vanilla SVG line — ≤2KB inline) showing trajectory across iterations
- Auto-play button (▶) cycles through snapshots @ 1.2s/frame for storytelling

### Validator (`validate-build-replay.mjs`)

When `iteration_count >= 2`, assert:

- `sites/<slug>/iter-<N>/screenshot-1280.jpg` exists in R2 for every N in [1..iteration_count]
- `/showcase/<slug>/replay` returns 200 + contains `<input type="range" data-replay-scrubber>` + ≥`iteration_count` `<img data-replay-frame>` preloaded

**Reference**: Brian 1337 brainstorm rec #11 — pure dev-flex, cheap (one Playwright snapshot per build, ~$0 cost).

## Every site (1337 LAYER #4 — AI-narrated changelog)

***UNIVERSAL — BUILD-BREAKING — iteration → audio storytelling***

### Trigger

Every build at `iteration_count >= 2`.

### Pipeline

**(a) Post-deploy step** diffs `_iteration_log.json[N-1]` vs `_iteration_log.json[N]` extracting:

- `applied_goodies` delta
- `delight_moments` delta
- Content depth delta
- Lighthouse delta

Into `_changelog_brief.json`.

**(b) Claude generates** a 60-90s second-person narration script ("This rebuild added a citation graph and a footer Easter egg. Performance improved 8 points...") with brand voice + Flesch ≥60 per `~/.claude/rules/copy-writing.md`.

**(c) ElevenLabs `text-to-speech` API** (voice="Adam" default, founder voice clone when iteration ≥5 + premium tier) renders MP3 ≤512KB.

**(d) Audio cached** at `sites/<slug>/iter-<N>/changelog.mp3` in R2 with `?v=<build_id>` cache buster.

**(e) Script text persisted** alongside at `sites/<slug>/iter-<N>/changelog.txt` for accessibility + AI search indexing.

### Owner dashboard

Renders compact audio player on the iteration card: `<audio controls preload="metadata">` + transcript expander.

### Public showcase replay scrubber

Optionally plays the changelog audio narrating each iteration as user scrubs.

### Cost

~$0.30/iteration (ElevenLabs `Eleven Multilingual v2` @ $0.30/1000 chars × ~1000 chars).

### Validator (`validate-changelog-audio.mjs`)

When `iteration_count >= 2`:

- Assert R2 contains `sites/<slug>/iter-<N>/changelog.mp3` + `changelog.txt`
- AND `<audio>` element renders on dashboard `/dashboard/<slug>` with `data-changelog-iter` attribute

**Reference**: Brian 1337 brainstorm rec #13.

## Every site (1337 LAYER #5 — diff-as-art generative artwork)

***UNIVERSAL — BUILD-BREAKING — AST diff → PWA wallpaper***

### Trigger

Every build at `iteration_count >= 2`.

### Pipeline

**(a)** Post-build step computes git-diff between iteration tags (`iter-<N-1>` ↔ `iter-<N>`) producing `_diff_stats.json = {files_changed, additions, deletions, churn_score, file_tree_diff[]}`.

**(b)** Deterministic generator (`generateDiffArt(stats, brand_colors)` in `apps/project-sites/src/services/diff_art.ts`) seeds a canvas at:

- 1080×1920 (portrait phone wallpaper aspect)
- 2400×1260 (desktop wallpaper)
- 1200×630 (OG card)

Using brand primary/secondary/accent — every additive line = bright stroke, every deletion = dark stroke, file tree branching maps to spiral geometry.

**(c)** Output saved at `sites/<slug>/iter-<N>/art-{phone,desktop,og}.png` in R2.

**(d)** `/showcase/:slug` page renders the diff-art as the dominant visual — collectable, downloadable, shareable via Web Share API.

**(e)** PWA `share_target` accepts incoming images so visitors can fork their own derivative pieces.

Each piece is uniquely seeded by `sha256(slug + iteration + brand_primary)` — deterministic + reproducible + iterable.

### Validator (`validate-diff-art.mjs`)

When `iteration_count >= 2`:

- Assert R2 contains all three art dimensions for every iteration
- AND `/showcase/<slug>` HTML contains `<img data-diff-art="phone|desktop|og">`
- AND a `<button data-share-art>` invokes `navigator.share()`

**Reference**: Brian 1337 brainstorm rec #15 — pure dev-flex collectable, zero per-build cost (canvas, no API).

## Every site (1337 LAYER #6 — hidden owner /_terminal)

***UNIVERSAL — BUILD-BREAKING — Clerk-gated WebContainer shell***

### Concept

Every site MUST expose a hidden, Clerk-gated `/_terminal` route that boots a WebContainer in-browser instance with the site's source tree mounted read-only.

### Access control

- Only the owner (Clerk session matches `sites.owner_user_id`) gets a 200
- All other visitors get 404 (NEVER 403 — leaks existence)

### UI

- Full-viewport dark xterm.js terminal
- Sidebar file tree (codemirror read-only for selected files)
- Bottom command palette (Cmd+K)

### Allowed in-shell commands (whitelist enforced server-side via `apps/project-sites/src/routes/terminal.ts`)

- `ls`, `cat`, `grep`, `wc`, `find`, `tree`
- `git log`, `git diff <iter-N>..<iter-M>`
- `npm run lighthouse <route>` (returns cached report from R2)
- `validate-route <path>` (runs validator subset on a route)
- `rebuild --goody <N>` (queues a partial rebuild applying ONLY goody N, decrements `build_credits`)
- `tail audit-log` (last 50 audit_log rows)

### Forbidden

Any `rm`/`mv`/`write`/`curl --data`/`fetch POST`/network egress beyond R2-read + D1-read.

### Implementation

- WebContainer API mounts a snapshot of build outputs from R2 (`sites/<slug>/iter-<N>/source-tree.tar`)
- Owner edits land in volatile memory only, never persisted
- Server route validates Clerk JWT + slug ownership + command whitelist before executing
- Audit-logs every command to `audit_logs (site_id, action='terminal:<cmd>', actor='owner', meta_json)`

### Validator (`validate-owner-terminal.mjs`)

- Assert `/_terminal` route returns 404 when unauthenticated
- Returns 200 with `<div id="xterm-container">` shell when Clerk session matches owner_user_id (use test fixture)

**Reference**: Brian 1337 brainstorm rec #37 — pure owner-flex, leverages WebContainer infra already in monorepo from bolt.diy main app.

## Every site (1337 LAYER #7 — Server-Timing per skill)

***UNIVERSAL — BUILD-BREAKING — observability flex***

### Requirements

Every Worker response from `apps/project-sites/src/` MUST emit `Server-Timing` HTTP headers breaking response composition down by skill/service unit so DevTools Network panel visualizes the stack.

### Format

`Server-Timing: <name>;dur=<ms>;desc="..."` with one entry per service called during the request.

### Required entries when applicable

Worker MUST track timings via Hono middleware that wraps `c.executionCtx.waitUntil` + the service helpers:

- `site_resolve;dur=...;desc="KV lookup + D1 fallback"`
- `r2_fetch;dur=...;desc="Static asset"`
- `template_render;dur=...;desc="..."`
- `ai_inference;dur=...;desc="<model>"`
- `validation;dur=...;desc="..."`
- `auth;dur=...;desc="Clerk verify"`
- `analytics;dur=...;desc="PostHog enqueue"`
- `total;dur=...;desc="Sum"`

### Implementation

- `apps/project-sites/src/middleware/server_timing.ts` exports `serverTimingMiddleware()` that exposes `c.set('timings', new Map())` for handlers
- Emits the header during `app.use('*', async (c, next) => { await next(); ... })` post-response
- Every service helper (`getSite`, `fetchR2`, `renderTemplate`, `callLLM`, `verifyTurnstile`, `checkRateLimit`) MUST call `c.get('timings').set(name, perf - start)` after its work
- Build pipeline workflow emits `Server-Timing` too via response headers from `/api/internal/build-status` so dashboards visualize per-phase + per-skill costs

### Validator (`validate-server-timing.mjs`)

Smoke test against deployed worker:

- Assert every API response has `Server-Timing` header with `total;dur=` entry
- AND ≥3 sub-entries
- AND no entry's `dur` is negative or NaN

**Reference**: Brian 1337 brainstorm rec #45 — pure observability flex, free per-request cost (microseconds).

## Every site (1337 LAYER #8 — audio-reactive hero)

***UNIVERSAL — BUILD-BREAKING — Web Audio analyser → hero shader***

### Trigger

Every site at `iteration_count >= 3` whose `_brand.json.has_founder_audio === true` (audio-brief from goody 4 OR audio changelog rule #4 OR Ask-the-Founder voice answers from immersive experience 4).

### Requirements

MUST ship an audio-reactive hero — a `<canvas>` hero background that responds to the founder's voice or site's audio brief in real-time via Web Audio analyser.

### UX

- Hero contains `<audio data-hero-audio src="..." preload="metadata">` with play button overlay
- On play, `AudioContext.createAnalyser()` taps the audio stream
- `getByteFrequencyData(buffer)` polled in `requestAnimationFrame` drives a brand-colored particle field OR waveform OR generative geometry on a `<canvas>` layered behind the hero text

### Renderer (`apps/project-sites/public/scripts/audio-hero.js` ≤6KB gzipped vanilla — NO framework, NO Three.js — pure 2D canvas + brand palette)

- Particle count scaled by mid-band amplitude
- Particle hue rotated by treble peak
- Particle gravity by bass peak

### Reduced motion

Respects `prefers-reduced-motion` (renders static brand-gradient instead).

### Persistence

Mute button persists in `localStorage` so revisits don't blast audio.

### Fallback

If AudioContext fails (Safari iOS strict autoplay), renders cached frequency snapshot (sampled at build time from the audio file) as static frequency bars — no autoplay.

### Validator (`validate-audio-reactive-hero.mjs`)

When `iteration_count >= 3` AND audio-brief OR audio-changelog exists:

- Assert hero section contains `<canvas data-audio-hero>` + `<audio data-hero-audio>` + `<script src*="audio-hero">`
- AND `prefers-reduced-motion` media query is honored (CSS rule present)

**Reference**: Brian 1337 brainstorm rec #46 — amplifies immersive-experiences rule, synced to Custom Audio Brief experience.

## Every site (founder personal-brand multimedia profile)

***UNIVERSAL — BUILD-BREAKING — when one founder dominates the source***

### Trigger

When source-site research resolves a single dominant founder/principal/director/lead researcher (founder name appears in `>50%` of source page bios/bylines/author lists OR is the org's sole named individual in `/about`/`/team`/`/leadership`).

### Requirements

The rebuild MUST upgrade `/about` from a generic org-about page into a full multimedia personal-brand profile.

### Required sections (in order)

**(a) Hero band** — founder portrait (square 1:1 from source, AI-upscaled to ≥1024×1024 if needed) + name + credentials row + 1-sentence positioning statement

**(b) CV timeline** — interactive vertical chronology pulling structured facts from `_pdf_facts.json` (when source linked CV/resume PDF) OR scraped from source `/about`/`/cv`/LinkedIn

**(c) Research focus** — 3-5 thematic clusters with iconography, each linking to relevant publications

**(d) Publications carousel** — top 6 publications by citation count or recency, each card per "Every publication card" enrichment rule

**(e) Speaking + media** — talks, interviews, podcast guest appearances aggregated via Exa search

**(f) Press kit downloads** — high-res headshot + bio (50w/150w/500w variants) + logo lockup

**(g) AI-augmented multimedia layer** (iteration ≥ 3):

- ElevenLabs-narrated "About Me in 90 seconds" audio player
- NotebookLM-generated podcast covering the founder's career arc
- HeyGen avatar video introducing the research mission
- Infographic summarizing impact stats

**(h) Contact + social** — direct email + ORCID + Google Scholar + LinkedIn + ResearchGate + Mastodon as icon row with brand-hex hover

### Validator (`validate-founder-multimedia-profile.mjs`)

When `_research.json.dominant_founder` resolved (single-founder ratio >0.5):

- Assert `/about` route renders `[data-section="founder-hero"]` + `[data-section="founder-timeline"]` + `[data-section="founder-publications"]`
- AND when `iteration_count >= 3`, assert `[data-multimedia="audio"]` + `[data-multimedia="video"]` OR `[data-multimedia="podcast"]` present

## Every site rebuild (TEMPLATE LEVERAGE #1 — mandatory clone-first)

***UNIVERSAL — BUILD-BREAKING — 10-min build target***

### Requirements

Every new build MUST begin by `git clone`-equivalent fetching the latest `template.projectsites.dev` build artifact bundle from R2 (`templates/projectsites/latest/`) into the container working directory BEFORE any AI generation step.

### Template ships full production-ready Astro/Vanilla shell with

- Routing skeleton
- Tailwind tokens parameterized by `--brand-primary`/`--brand-secondary`/`--brand-accent`/`--font-heading`/`--font-body`
- Components for hero/about/team/services/blog-grid/contact/footer
- Validators wired into the build
- SW+manifest stubs
- Analytics+Sentry+PostHog snippets
- Per-route metadata helper
- JSON-LD generators
- sitemap+robots+humans+well-known/security.txt
- Stripe-first donation widget stub
- Cal.com embed stub
- ElevenLabs audio brief stub
- NotebookLM podcast embed slot
- Konami console + audio-reactive hero scripts pre-bundled

### Generation reduces to

1. Brand-token swap
2. Content slot fill from `_research.json`
3. Per-route copy + JSON-LD synthesis
4. Media slot fill from Media Slot Manifest

### Compute-bound time floor

- Research (3min) + brand extraction (1min) + content synthesis (3min) + media fill (2min) + validators+deploy (1min) = ~10min

### Rule

NEVER scaffold from zero — that path is reserved for `template.projectsites.dev` itself (the canonical template MUST be hand-architected).

### Validator (`validate-template-leverage.mjs`)

- Assert `_build_metadata.json.template_version` matches the R2 manifest at `templates/projectsites/latest/manifest.json`
- AND build duration ≤ 15min (10min target, 15min hard cap including 1 retry)

**Reference**: Brian directive (2026-05-10) "leverage template.projectsites.dev to really be done in about 10 minutes".

## Every site rebuild (TEMPLATE LEVERAGE #2 — brand-token-first overlay)

***UNIVERSAL — BUILD-BREAKING***

### Requirements

After template clone, the FIRST generation step MUST emit `_brand_tokens.css` overlay file rewriting:

- `--brand-primary`/`--brand-secondary`/`--brand-accent`
- `--bg-primary`/`--bg-elevated`
- `--text-primary`/`--text-muted`
- `--font-heading`/`--font-body`
- `--radius-card`/`--shadow-elevation`

From extracted source brand + research findings.

### Rationale

This single 30-line CSS file controls 90% of visual brand transfer — generation tasks downstream NEVER hardcode hex/font-family values; they reference tokens only.

### Validator (`validate-brand-tokens-overlay.mjs`)

- Assert `dist/assets/brand-tokens.css` exists + contains every required CSS custom property
- AND `grep` of `dist/**/*.{html,css,js}` finds ZERO inline hex colors outside `brand-tokens.css` (whitelist: og-image PNG generators + branded SVG icons explicitly named in `_brand.json.brand_svg_inline_whitelist[]`)

**Reference**: prompt-improvements brainstorm rec #2 (2026-05-10) — token-first overlay collapses brand transfer to single-file generation, cuts brand-fidelity regression risk by ~80%.

## Every site rebuild (TEMPLATE LEVERAGE #3 — content-slot JSON only)

***UNIVERSAL — BUILD-BREAKING***

### Requirements

Content generation prompts MUST emit a single `_content_slots.json` document matching the template's slot manifest at `templates/projectsites/latest/_slot_schema.json` — never freeform HTML.

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

### Process

Template renderer ingests the JSON + brand-tokens + media manifest + research corpus → renders deterministic HTML.

This collapses "write me an entire site" into "fill these 60 slots" — parallelizable, idempotent, cacheable, type-safe.

### Validator (`validate-content-slots.mjs`)

Assert every slot defined in schema has a value (no nulls, no empty strings) OR is explicitly marked `optional: true` in schema.

**Reference**: prompt-improvements brainstorm rec #3 (2026-05-10) — slot-based content gen unlocks 4× parallelism across slot groups.

## Every site rebuild (TEMPLATE LEVERAGE #4 — diff-patch iteration)

***UNIVERSAL — BUILD-BREAKING — repeat builds patch, not regenerate***

### Requirements

Every rebuild at `iteration_count >= 2` MUST run in diff-patch mode:

1. Load `_content_slots.json` + `_brand_tokens.css` from previous iteration
2. Identify slots whose source data CHANGED (research delta, new publication, new team member) OR which a goody from the queue mutates (e.g. goody #5 = "add testimonials section" → patches `testimonials[]` slot)
3. Regenerate ONLY those slots, leave everything else identical

### Build duration

Iteration ≥2 = ~3-5min (vs 10min cold).

### Diff strategy

Computed by sha256-ing each slot's source-data lineage; unchanged hash = skip slot regeneration.

### Validator (`validate-diff-patch-iteration.mjs`)

When `iteration_count >= 2`:

- Assert `_iteration_log.json[current].slots_regenerated[]` is < 50% of total slot count
- AND `_iteration_log.json[current].slots_skipped_hash_match[]` is populated

**Reference**: prompt-improvements brainstorm rec #4 (2026-05-10) — incremental patch dramatically reduces both cost (no redundant LLM calls) and regression risk (untouched slots stay good).

## Every site rebuild (TEMPLATE LEVERAGE #5 — template-version pinning + changelog)

***UNIVERSAL — BUILD-BREAKING***

### Requirements

Every build's `_build_metadata.json` MUST include:

- `template_version: "<semver>"`
- `template_commit_sha: "<git>"`
- `template_changelog_since_last_build: [...]` (when iteration ≥ 2)

### Upgrade flow

- When `template.projectsites.dev` master advances, downstream sites do NOT auto-upgrade
- Owner must explicitly opt-in via dashboard "Upgrade to template v<X>" CTA (with diff preview)
- Prevents silent regressions across hundreds of sites when template ships a breaking change

### Cron

`0 12 * * 1` (Mondays noon UTC) emails owners a digest of new template features available + one-click upgrade link.

### Validator (`validate-template-version-pinning.mjs`)

- Assert `_build_metadata.json.template_version` matches a real entry in `templates/projectsites/versions/<v>/manifest.json` in R2
- Assert version is NOT silently bumped (current build's pinned version === previous build's pinned version unless `_iteration_log.json[current].template_upgrade_intentional === true`)

**Reference**: prompt-improvements brainstorm rec #5 (2026-05-10) — pin-then-opt-in upgrade flow protects production fleet from template regressions.

## Every site rebuild (TEMPLATE LEVERAGE #6 — slot-level prompt caching)

***UNIVERSAL — BUILD-BREAKING***

### Requirements

Every Claude/GPT call generating content for a content slot MUST send a cacheable system prefix containing:

1. The full slot schema
2. The brand voice + tone guide synthesized from research
3. The Mission Doctrine + Creativity Doctrine preambles

### Caching mechanics

Per Anthropic prompt caching (min 1024 tokens, 5min TTL, 90% savings on cache hits), this prefix is constant across all 60 slot calls in a single build → 59/60 calls hit cache.

`cache_control: { type: 'ephemeral' }` breakpoint set at end of system prefix per `~/.claude/rules/prompt-cache.md`.

### Cost reduction

~$0.40/build → ~$0.05/build for content generation.

### Validator (`validate-slot-prompt-caching.mjs`)

Assert build's PostHog/Sentry trace shows `cache_read_input_tokens` > `cache_creation_input_tokens` by ≥10× across slot generation calls.

**Reference**: prompt-improvements brainstorm rec #6 (2026-05-10) — slot-level caching is the single highest-ROI cost optimization.

## Every site rebuild (TEMPLATE LEVERAGE #7 — template-is-a-living-product)

***UNIVERSAL — BUILD-BREAKING — every build feeds template improvements upstream***

### Requirements

Every build whose post-deploy `delight_moments[]` registry contains a NEW moment (not previously registered in `templates/projectsites/delight_moments_catalog.json` in R2) MUST emit a PR-able patch proposal in `_template_improvement_proposal.json` describing how that moment would generalize as a reusable template component.

### Proposal schema

```ts
{ slug, source_site, description, generalization_pattern, suggested_template_file, snippet, evidence_screenshot_r2_key }
```

### Cron

`0 0 * * 1` (Mondays midnight UTC) aggregates the week's proposals, ranks by repeated occurrence (≥3 sites surfacing same pattern), and opens a GitHub Issue against `heymegabyte/template-projectsites` repo with the consolidated batch.

### Loop

Template maintainer (Brian) reviews, accepts batch via merge → next template version ships the new components → downstream sites get them on upgrade.

### Validator (`validate-template-improvement-pipeline.mjs`)

- Assert when `delight_moments[]` contains new entries vs prior iteration, `_template_improvement_proposal.json` exists with ≥1 proposal
- AND each proposal has `evidence_screenshot_r2_key` resolving to a real R2 object

**Reference**: prompt-improvements brainstorm rec #7 (2026-05-10) — closes the loop: every site improves the template that powers every other site.

## Every site rebuild (TEMPLATE LEVERAGE #8 — template pre-warm cache)

***UNIVERSAL — BUILD-BREAKING***

### Requirements

Container boot MUST pre-warm template assets (HTML shells, component partials, font files, image stubs, validator binaries) into in-memory cache during the `research` phase (the only IO-bound, LLM-bound phase where CPU is idle).

By the time generation phase fires, template is hot in memory + ready to render.

### Implementation

`template_prewarm.ts` background worker streams `templates/projectsites/latest/**` from R2 into `Map<string, Buffer>` in container memory during the first 60s of research.

### Savings

~45s on cold-start template fetch.

### Validator (`validate-template-prewarm.mjs`)

- Assert `_build_metadata.json.template_prewarm_duration_ms` exists + is < 90000
- AND research phase + template prewarm complete within the same wall-clock window (parallel, not sequential)

**Reference**: prompt-improvements brainstorm rec #8 (2026-05-10) — pre-warm collapses cold-start penalty.

## Every site rebuild (CINEMATIC FLOOR #1 — hero must be full-screen video or particle field)

***UNIVERSAL — BUILD-BREAKING — every site, no exceptions***

### Requirements

Every site hero (above-the-fold landing section) MUST be one of three cinematic treatments — flat-image heroes are BUILD FAIL.

### Allowed treatments

**(a) Full-screen video** — autoplay+muted+playsinline+loop H.264 MP4 ≤4MB OR HLS stream, with `<source type="video/webm">` fallback, 16:9 desktop / 9:16 mobile (sourced from GPT Image 1.5 Video v2 OR Sora OR HeyGen OR original site's video assets OR Pexels free 4K library)

**(b) WebGL/Canvas particle field** — Three.js OR vanilla WebGL shader running brand-colored particle system at 60fps, prefers-reduced-motion → static gradient fallback, GPU memory ≤256MB

**(c) Scroll-driven cinematic** — `scroll-timeline: --hero` CSS scroll-driven animation that transitions through 3-5 layered images with parallax + opacity easing

### Hero MUST also include

- Animated headline (typewriter OR fade-up-stagger OR text-mask reveal)
- Micro-interactive CTA (magnetic hover OR ripple-on-hover)
- Brand badge/logo lockup

### Validator (`validate-cinematic-hero.mjs`)

- Assert hero section contains EITHER `<video autoplay muted playsinline loop>` OR `<canvas data-particle-field>` OR `[style*="scroll-timeline"]`/`@scroll-timeline` CSS
- AND hero height ≥ 90vh on desktop

**Reference**: prompt-improvements brainstorm rec #29 (2026-05-10) + Mission Doctrine "cinematic_floor" mandate — every hero must out-flex flagship marketing sites.

## Every site (CINEMATIC FLOOR #2 — section transitions with scroll-driven animation)

***UNIVERSAL — BUILD-BREAKING***

### Requirements

Every section boundary MUST animate on scroll-into-view via `IntersectionObserver` OR native `animation-timeline: view()` (Chrome 115+).

### Allowed entrance treatments

- **Fade-up-stagger** (children fade up 12px with 80ms stagger)
- **Reveal-mask** (clip-path inset 0→0%)
- **Parallax-slide** (background-position translates against scroll)
- **Pin-and-reveal** (section pins while content animates)

### Forbidden

- **Pop-in** (instant appear)
- **Bounce** (childish)
- **Spin** (cliché)

### Duration

600ms cap per `~/.agentskills/11-motion-and-interaction-system/build-breaking-rules.md`.

### Validator (`validate-section-transitions.mjs`)

- Assert every `<section>` (excluding hero + footer) has either `data-animate-on-scroll` attribute OR matching `animation-timeline: view()` CSS rule
- AND no two adjacent sections share the same treatment (prevents repetition fatigue)

**Reference**: prompt-improvements brainstorm rec #30 (2026-05-10).

## Every site (CINEMATIC FLOOR #3 — typography must breathe)

***UNIVERSAL — BUILD-BREAKING***

### Requirements

Every site MUST honor cinematic typography rules:

- **H1 font-size** clamp `clamp(2.5rem, 6vw + 1rem, 7rem)` (massive on desktop, readable on mobile)
- **H1 line-height** ≤1.05
- **Body line-length** ≤75ch via container queries
- **Body line-height** 1.6-1.75
- **Vertical rhythm** via `:where(h1+*, h2+*, h3+*)` adjacent-sibling spacing
- **Text-wrap** balance on headings, pretty on body paragraphs
- **Font-feature-settings** `'ss01', 'cv11'` (or font-specific stylistic alternates) for variable fonts that expose them

### Validator (`validate-cinematic-typography.mjs`)

- Assert H1 computed font-size at 1920px ≥ 64px
- AND body computed line-height ∈ [1.5, 1.85]
- AND `text-wrap` rule is present in CSS for `h1, h2, h3` OR `p`

**Reference**: prompt-improvements brainstorm rec #31 (2026-05-10).

## Every site (CINEMATIC FLOOR #4 — color depth + gradient meshes)

***UNIVERSAL — BUILD-BREAKING***

### Requirements

Every site MUST include ≥1 multi-stop conic/radial gradient OR mesh-gradient (CSS `background: conic-gradient(...)` + `background-blend-mode: screen|overlay|multiply`) in the hero OR a feature section — flat single-color backgrounds across an entire site = BUILD FAIL.

### Encourage modern color tooling

- OKLCH/OKLab color space for perceptually uniform gradients
- `color-mix(in oklch, ...)` for derived shades
- `background-color: light-dark(...)` for theme-adaptive surfaces

### Validator (`validate-color-depth.mjs`)

- Assert `dist/**/*.css` contains ≥1 `conic-gradient` OR `radial-gradient` rule with ≥3 color stops OR ≥1 mesh-gradient SVG `<filter>`
- AND ≥1 `oklch(` OR `oklab(` OR `color-mix(` usage

**Reference**: prompt-improvements brainstorm rec #32 (2026-05-10).

## Every site (CINEMATIC FLOOR #5 — custom cursor + micro-cursors)

***UNIVERSAL — BUILD-BREAKING — desktop only***

### Requirements

Every site on `(pointer: fine)` desktop MUST ship a custom cursor layer:

- Small accent-colored dot follower + outer ring
- Scales 1.0→1.6 on hover over interactive elements
- Transforms to a contextual glyph (arrow on links, `+` on images, text-caret on text fields)

### Implementation

- Vanilla JS ≤2KB
- Single `<div data-cursor>` + `<div data-cursor-ring>` positioned `fixed`
- Driven by `requestAnimationFrame` on `mousemove`

### Constraints

- NEVER on touch devices (`@media (pointer: coarse)` disables)
- Respects `prefers-reduced-motion` (degrade to default OS cursor)

### Validator (`validate-custom-cursor.mjs`)

When `(pointer: fine)` media query matches:

- Assert `<div data-cursor>` + `<div data-cursor-ring>` in DOM + JS handler hooked
- AND CSS rule `@media (pointer: coarse) { [data-cursor], [data-cursor-ring] { display: none; } }` present

**Reference**: prompt-improvements brainstorm rec #33 (2026-05-10).

**NOTE**: This rule supersedes the older "click ripple only — no cursor follower" rule in `11-motion-and-interaction-system/build-breaking-rules.md` per the elevated cinematic floor — micro-cursors + ripple are NOT mutually exclusive when implemented well.

## Every site (CINEMATIC FLOOR #6 — sound design opt-in)

***UNIVERSAL — BUILD-BREAKING — single audible toggle, no autoplay***

### Requirements

Every site MUST ship optional sound design — UI clicks, hover chimes, success tones, scroll whooshes — gated behind a single header/footer 🔊 toggle defaulting OFF (autoplay forbidden).

### When enabled

Web Audio API plays per-event samples sourced from royalty-free libraries (Pixabay Sounds, freesound.org) bundled in R2 at `templates/projectsites/sound-kit/v1/{click,hover,success,scroll,reveal}.mp3` (each ≤8KB, MP3 32kbps mono).

### Persistence

- User preference persists in `localStorage`
- Respects `prefers-reduced-motion` → forces OFF

### Validator (`validate-sound-design.mjs`)

- Assert site has `<button data-sound-toggle aria-pressed="false">` in header/footer + `<audio>` preload of ≥3 sound effects
- AND `prefers-reduced-motion` media query overrides preference

**Reference**: prompt-improvements brainstorm rec #34 (2026-05-10).

## Every site (MISSION DOCTRINE — DELIGHT #1 — goody-queue delight floor per iteration)

***UNIVERSAL — BUILD-BREAKING***

### Requirements

Per `~/.claude/rules/creativity-doctrine.md`, every build's `_iteration_log.json[current].delight_moments[]` MUST contain ≥`min(iteration_count + 1, 6)` registered moments — but per Mission Doctrine, every iteration MUST also include ≥1 moment drawn from the next-up entry in the 20-entry goody queue persisted at `~/.claude/projects/-Users-apple-emdash-projects-projectsites-dev/memory/project_progressive_rebuild.md`.

### Goody queue behavior

- Cumulative delight track shared across all builds
- Iteration N MUST consume goody index `N % 20` and register its delight evidence
- If the goody is structurally infeasible for this build's site type (e.g. goody "podcast" on a single-page landing), skip + log reason in `_iteration_log.json[current].goody_skipped_reasons[]` + advance to next index

### Validator (`validate-goody-queue-consumption.mjs`)

- Assert `_iteration_log.json[current].delight_moments[]` length ≥ floor
- AND at least one moment's `source` field === `"goody_queue:<index>"`

**Reference**: prompt-improvements brainstorm rec #41 (2026-05-10).

## Every site (MISSION DOCTRINE — DELIGHT #2 — unexpected 404 + 500 experience)

***UNIVERSAL — BUILD-BREAKING***

### Requirements

Every site MUST ship a 404 page AND a 500 page that are themselves cinematic mini-experiences — animated brand mascot OR custom illustration OR per-site SVG illustration OR mini-game (Snake, Pong, brand-colored Tetris) — never the framework default "Page not found."

### 404 MUST include

- Large headline ("This page slipped through the cracks")
- Brand-styled illustration/animation
- Prominent "Back to home" CTA
- Search box (links to `/?q=<term>`)
- Suggested-pages list (3 random pages from sitemap)

### 500 MUST include

- Empathetic copy ("Something broke — we've been notified")
- Correlation ID display
- Status page link
- Retry CTA

### Validator (`validate-error-experience.mjs`)

- Assert 404 + 500 routes return non-default content
- Contain `[data-error-illustration]` OR `<svg data-error-art>` OR `<canvas data-error-mini-game>`
- AND CTA buttons present

**Reference**: prompt-improvements brainstorm rec #42 (2026-05-10).

## Every site (MISSION DOCTRINE — DELIGHT #3 — Konami easter egg escalation)

***UNIVERSAL — BUILD-BREAKING — iteration ≥ 5 unlocks more***

### Requirements

Every site at `iteration_count >= 5` MUST extend the Konami dev console (1337 Layer #1) with at least one site-specific Easter egg unlocked by additional gesture (e.g. `Shift+?` opens command palette, double-tap brand logo cycles a hidden theme, scrolling down 10× then up triggers confetti).

### Theming

Easter eggs are themed to the site's domain:

- Medical/non-profit: gentle whimsy
- Portfolio: dev-flex shortcuts
- Local business: brand mascot

Each egg registers as a `delight_moments[]` entry.

### Validator (`validate-easter-egg-escalation.mjs`)

When `iteration_count >= 5`:

- Assert ≥1 additional event listener registered in `<script>` tags beyond Konami code
- AND `_iteration_log.json[current].delight_moments[]` contains entry with `source === "easter_egg_escalation"`

**Reference**: prompt-improvements brainstorm rec #43 (2026-05-10).

## Every site (MISSION DOCTRINE — DELIGHT #4 — post-deploy evidence GIF)

***UNIVERSAL — BUILD-BREAKING***

### Requirements

Every successful build MUST generate a 1080×1920 (9:16 portrait) MP4 + GIF screen-recording walking through the homepage's hero → scroll → CTA → footer at 1.5× speed.

### Capture

Captured by Playwright `page.video()` with `viewport: { width: 1080, height: 1920 }` post-deploy.

### Output

- Saved to `sites/<slug>/iter-<N>/deploy-walkthrough.{mp4,gif}` in R2 (≤2MB each)
- Owner dashboard renders the walkthrough on the iteration card
- Showcase listing card uses the walkthrough as preview thumbnail (autoplay on hover)
- Cron-emailed weekly digest to owner includes the latest walkthrough as motivation to rebuild

### Validator (`validate-deploy-walkthrough.mjs`)

- Assert R2 contains both `.mp4` + `.gif`
- AND files are ≤2MB
- AND dashboard renders `<video data-walkthrough>` element

**Reference**: prompt-improvements brainstorm rec #44 (2026-05-10).

## Every site (MISSION DOCTRINE — DELIGHT #5 — personalized owner greeting)

***UNIVERSAL — BUILD-BREAKING — Clerk session-aware welcome***

### Requirements

Every site MUST detect when the owner (Clerk session matches `sites.owner_user_id`) is visiting and surface a personalized non-intrusive top-bar OR toast: "Welcome back, `<first_name>`. Site is on iteration `<N>`. `<X>` visitors since your last login. `<Y>` new hearts."

### Visibility

- Owner-only — public visitors never see it

### Implementation

- Server-side render decision in worker route based on Clerk session lookup
- Never client-only injection (avoid CLS + ensures SEO indexers see clean public HTML)

### Validator (`validate-owner-greeting.mjs`)

- Assert owner-visiting fixture sees `[data-owner-greeting]` element
- Non-owner fixture does NOT

**Reference**: prompt-improvements brainstorm rec #45 (2026-05-10).

## Every site (MISSION DOCTRINE — DELIGHT #6 — revisitor detection + subtle evolution)

***UNIVERSAL — BUILD-BREAKING***

### Requirements

Every site MUST detect returning visitors (via `localStorage.first_visit_at` + `last_visit_at`) and subtly evolve the experience on subsequent visits:

- Visit #2 shows a different hero variant
- OR adds a "Welcome back" badge
- OR reveals a previously-hidden section
- OR plays a different audio brief

### Implementation

- Site ships ≥2 hero variants (A/B)
- Non-destructive variant selector in `<head>` early-script that reads localStorage + sets `data-visitor-variant` on `<html>` before paint
- NEVER show "Welcome back" to first-time visitors

### Validator (`validate-revisitor-evolution.mjs`)

- Assert ≥2 `[data-hero-variant]` elements exist
- AND CSS selector `html[data-visitor-variant="returning"] [data-hero-variant="b"]` is defined

**Reference**: prompt-improvements brainstorm rec #46 (2026-05-10).

## Every prompt run (PROMPT MECHANICS #1 — concurrent tool calls default)

***UNIVERSAL — BUILD-BREAKING***

### Requirements

Every build orchestrator (Claude Code, GPT, container) running multi-step pipelines MUST batch independent tool calls into a single response wherever no data dependency exists.

### Default behavior

- Research subagents fan out 3-5 parallel
- Brand extraction + sitemap walk + asset audit run in parallel
- Per-route content generation calls fan out (1 per route, max 10 concurrent)
- Validators fan out (1 per concern)

Sequential is ONLY allowed when later step consumes earlier step's output.

### Validator (`validate-concurrent-tool-call-discipline.mjs`)

Parse build trace, assert:

- `max_concurrent_subagent_calls >= 3`
- AND `phases_with_serialized_independent_calls === 0`

**Reference**: prompt-improvements brainstorm rec #47 (2026-05-10) + `~/.claude/CLAUDE.md` "Parallelization" mandate.

## Every prompt run (PROMPT MECHANICS #2 — system-prefix cache breakpoints explicit)

***UNIVERSAL — BUILD-BREAKING***

### Requirements

Every Anthropic API call from the build pipeline MUST set explicit `cache_control: { type: 'ephemeral' }` breakpoints at natural prompt boundaries:

- End of doctrine preamble
- End of skill bundle
- End of research corpus injection
- End of slot schema

### Maximum

4 breakpoints per request (Anthropic limit).

### Validator (`validate-cache-breakpoints.mjs`)

Assert build trace shows:

- ≥3 distinct cache_control breakpoints used
- Average `cache_read_input_tokens / total_input_tokens` ratio ≥ 0.7 across slot generation calls

**Reference**: prompt-improvements brainstorm rec #48 (2026-05-10) + `~/.claude/rules/prompt-cache.md`.

## Every prompt run (PROMPT MECHANICS #3 — structured-output JSON schema enforcement)

***UNIVERSAL — BUILD-BREAKING***

### Requirements

Every content-generation LLM call MUST request structured JSON output via:

- `response_format: { type: 'json_schema', json_schema: { ... } }` (OpenAI)
- OR Anthropic tool-use forced response

Freeform-string generation is BUILD FAIL for any slot bound to typed data.

### Validation

Pre-validated by Zod schema before persisting to `_content_slots.json`.

### Validator (`validate-structured-outputs.mjs`)

- Assert every content-gen LLM call in trace has `response_format` OR `tools` block
- AND parsed response validates against Zod slot schema

**Reference**: prompt-improvements brainstorm rec #49 (2026-05-10).

## Every prompt run (PROMPT MECHANICS #4 — self-critique loop until convergence)

***UNIVERSAL — BUILD-BREAKING***

### Requirements

Every generated slot MUST pass a self-critique gate before persisting — second LLM call with the rubric:

"is this content slop? does it violate banned-words list? is Flesch ≥60? does it match brand voice? is it factually consistent with research corpus?"

Returning `{ accept: bool, score: 0-100, issues: [...] }`.

### Loop

Reject + regenerate up to 3× before falling back to human-review queue.

### Validator (`validate-self-critique-loop.mjs`)

Assert every persisted slot in `_content_slots.json` has accompanying `_content_slots_critique.json[slot_key].accept === true` + `score >= 75`.

**Reference**: prompt-improvements brainstorm rec #50 (2026-05-10) + Zero Recommendations gate.
