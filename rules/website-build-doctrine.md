---
name: "website-build-doctrine"
priority: 3
pack: "website-build"
triggers:
  - "build website"
  - "make a website"
  - "build site"
  - "rebuild"
  - "make site"
paths:
  - "org:website_build"
---

# Website Build Doctrine

Fires before, during, after every site build/rebuild. Anchors the rule + skill mesh.

## Phase -1 — Competitor Research (gate -1)

Full protocol: `competitor-research.md`.

- Identify top 5-10 audience-comparable sites (org-type aware: peer nonprofits in same NTEE for nonprofits, Google Maps + Yelp top-10 for local, SimilarWeb/G2 top-rated for SaaS, Awwwards for portfolio).
- Capture each: full route crawl, screenshots @ 1920×1080 + 390×844, copy via Browser Rendering REST, Wayback 1y + 3y ago.
- Score on 100-pt rubric (10 dims × 10pts: visual polish · IA · copy · conversion · SEO+AI-search · perf · a11y · trust · AI-native · distinctiveness).
- Persist `_competitors/{domain}/` + `_competitor_aggregate.json` (floor) + `_competitor_directives.md` + `_competitor_inspiration.md` + `_competitor_gaps.md`.
- **Phase 6 loop CANNOT exit** until OUR build outscores EVERY competitor on EVERY dim by ≥15% AND ships ≥3 entries from `_competitor_gaps.md`.
- Inputs feed Phase 0 (saturation), Phase 1 (clone), Phase 2 (replacements), Phase 3 (swap-out), Phase 4 (AI-native targets).
- Skipping = "shipped a guess" = build fail.

## Phase 0 — Context Saturation BEFORE Any Code

- NO code, NO clone, NO scaffold until every public source loaded into context.
- Build fails if Phase 0 skipped or partial.
- Fan out via parallel `Agent` spawns per `monitor-orchestration.md` (research agents don't block each other).

Sources to exhaust:

- **Owned** — official site (deep crawl per `source-site-enhancement.md` § Phase 1), subdomains, social profiles (X, IG, FB, LinkedIn, TikTok, YouTube), app stores, podcast feeds, RSS.
- **Search** — Google + Bing top-50 for `{name}`, `{name} + {city}`, `+ reviews`, `+ complaints`, `+ founder`, `+ history`, `+ lawsuit`, `+ press release`.
- **Archives** — Wayback (3+ snapshots), archive.today, archive.ph, Google `cache:`.
- **Registries** — Sec of State, BBB, Charity Navigator + Form 990 (nonprofit), GuideStar/Candid, FCC + SEC EDGAR (public co), Google Places + Yelp + Foursquare (local), Apple Maps + OSM.
- **Press** — Google News, local newspaper archives (Newspapers.com, NewsBank, Chronicling America pre-1963), trade pubs, podcast appearances, conference talks.
- **People** — founder LinkedIn + Twitter + GitHub + personal blog + podcast guesting + court records + Chamber of Commerce.
- **Reviews + sentiment** — Google + Yelp + Trustpilot + Reddit + HN + Indeed + Glassdoor; sentiment-score top 100 via Workers AI.
- **Visual** — every image scraped from source, every logo variant, brand colors AI-vision-extracted, Wayback gallery, signage photos.
- **Financial** — pricing pages, fee schedules, tiers, annual reports, 10-Ks, 990s.
- **Compliance** — state license registries, professional boards, OSHA records, health-dept inspections, court records.
- **Demographics** — ACS B16001 (auto-fire `i18n-by-demographics.md` if community share ≥10% non-English).

Persist: `_research.json` + `_brand.json` + `_assets.json` + `_confirmations.json` + `_citations.json` per `15-site-generation` research-pipeline. Conf<T> pattern per `citations.md`.

After all sources exhausted, scan brief for gaps. Material missing (bilingual-staff confirm, donor permission, NAP, license verify, dates/names/amounts) → `AskUserQuestion` BEFORE further work.

Skipping = thin content + AI slop + missed value = build fail per `thin-source-amplification.md`.

## Phase 1 — Template First, Template Always

- First build clones `github.com/HeyMegabyte/template.projectsites.dev` (NOT `saas-starter` — that's SaaS apps).
- Every subsequent build pushes reusable artifacts BACK SAME TURN.
- Template = compounding asset. Each push makes next site 30%+ faster.

Flow-back targets (any pattern useful in ≥2 future builds):

- Components → `src/components/sections/`
- Hooks → `src/hooks/`
- Schemas (Zod) → `src/schemas/`
- Utilities (image, color, OG, sitemap) → `src/lib/`
- CF Workflow v2 defs → `src/workflows/`
- Animation primitives (View Transition wrappers, scroll-driven, `@starting-style`) → `src/motion/`
- Build validators → `scripts/validators/`
- Prompts → `prompts/`
- Section catalogs → JSON specs droppable into any page

Side repos (template) → commit + push to main automatically per `brian-preferences.md` § Git policy. README documents EVERY contributed component with one-line example.

## Phase 2 — Maximalist Page Enrichment

- Keep adding sections until next would dilute. Stop criterion is "next hurts," never "we have enough."

Per-page catalog (mix-and-match by intent):

- Hero with kinetic typography + View Transitions entrance
- Quotable answer block (40-60 words, AI-search per `copy-writing.md` § GEO)
- 5+ FAQ accordion w/ FAQPage JSON-LD (real Q&A only)
- Trust strip (logos, awards, real licenses)
- Stats row w/ `<app-rolling-counter>` per `cinematic-ui-patterns.md`
- Bento feature comparison
- Before-after slider via `<app-before-after-slider>` (real data only)
- Testimonials w/ verified-via-LinkedIn badges
- Process / how-it-works 12-step
- Timeline (real photos only per `timeline-authenticity.md`)
- Pricing tier comparison
- **AI-generated podcast** ("Listen to the 3-min overview")
- **Veo-stitched video** ("60-sec narrative from 7×8s clips")
- **Interactive map** w/ AI-narrated POI annotations
- Live data widget (real API metric)
- Calculator / quote estimator
- Resource library (PDFs per `thin-source-amplification.md` § Phase 9)
- Blog teaser (3 latest)
- Multimodal connect form (text + voice + photo)
- Newsletter w/ Listmonk double opt-in
- Donor / partner wall
- Press strip
- "What we can't fix" disclosure
- Live status (uptime + recent activity)
- Local-business sticky bar (phone + directions + hours)

Each candidate: AI vision pre-score. Ship at ≥8/10, reject below.

## Phase 3 — Swap-Out Authority (delta > 20% → replace)

Replace wholesale when ANY: AI vision <8/10 · feels generic · competitor benchmark exposes >20% gap · "we needed to put something here" copy.

Replaced sections move to `template.projectsites.dev/sections/_archived/` with `# Why replaced` note for remix.

After every replacement, run `supreme-polish.md` 100-ideas audit on page.

## Phase 4 — AI-Native Spiral

"What's possible BECAUSE AI is programming?" Build it.

### Audio + voice

- AI 3-min podcast per page (OpenAI TTS / ElevenLabs / NotebookLM). "Listen to this page" widget.
- Voice tour — full-site narration with chapter markers
- Voice search — Whisper STT → semantic site search
- Phone voice agent — Twilio + ElevenLabs Conversational AI

### Video

- Veo-stitched narrative — 7-8× 8-sec Veo clips on 60-sec arc, cross-dissolves + AI VO into one cinematic intro
- Animated hero — Sora 8-sec loop per page, hero-region only, `<picture>` static fallback
- AI testimonial reads — real testimonials read by AI voices per author (consent in `_confirmations.json`)

### Maps + spatial

- Interactive map with GPT Image 2 vision POI stories per pin
- WebXR AR preview — 360 photos → AR overlay
- Time-travel slider — Wayback + Google Street View before/after

### Multimodal

- Multimodal forms — photo of "the problem" + voice description → AI extracts intent + autofills
- Chat-as-UI with CopilotKit tool-calls ("Schedule a tour for Tuesday at 3pm")
- Smart semantic search via `@cf/baai/bge-large-en-v1.5` → Vectorize

### Personalization

- Behavioral hero swap (referrer / time-of-day / locale)
- Returning visitor — D1 cookie → "Welcome back — last time you looked at donation page"
- Locale-aware copy per `i18n-by-demographics.md` auto-fire

### Generative

- Live blog autoposts — weekly Workflow generates from research seeds
- Auto-generated case studies from D1 events
- Per-visitor PDF builder with name + city + interests

### Perf + UX

- AI-narrated 404 — GPT Image 2 vision riffs → friendly redirect suggestions
- Smart redirects — Levenshtein + AI fuzzy-match for unknown URLs
- Predictive prefetch — tiny on-device model trained on session nav

### Witty + delightful

- Audio Easter eggs — hidden Konami → 30-sec AI brand theme
- Style remix mode — visitor asks "show me this site in style of Wes Anderson / Mondrian / Ghibli" → client-side CSS theme swap
- Confetti on donation goal hit — real-time D1 watch
- Holiday hero variants (Christ-like on Christian holidays, plus Diwali / Eid / Lunar NY / Pride)

Pick filter: each candidate through `extra-mile.md` § Self-critique. Ship "would Brian wish I had just done this"; rest in Recs.

## Phase 5 — Agent Swarm Parallelism

3-7 parallel `Agent` spawns per page in ONE multi-tool message per `monitor-orchestration.md`.

Canonical per-page fan-out:

- **Agent-A** content-writer → copy, FAQ, microcopy, alt
- **Agent-B** visual-qa → screenshot + AI vision score
- **Agent-C** seo-auditor → title/meta/JSON-LD/OG
- **Agent-D** accessibility-auditor → axe 6bp + WCAG 2.2 manual
- **Agent-E** performance-profiler → Lighthouse + bundle + LoAF INP
- **Agent-F** media-orchestrator → images (Sharp triplets), video (Veo/Sora), audio (TTS)
- **Agent-G** motion-choreographer → View Transitions + scroll-driven + `@starting-style`

Each: 100-300 word brief, ≤200 word summary back. Main thread does foreground edits (CHANGELOG, README, MEMORY, sitemap) while agents run.

Token efficiency: subagents have own context; main receives summaries only. Beyond 300 words = cloning context.

## Phase 6 — Continuous "What Else" Loop

After every:

- Section added → "One more section worth value?" If yes, add. If no, move on.
- Page complete → "What section type haven't we tried that fits?" Add.
- Site complete → "What feature would make best-in-class?" Add. Repeat until `supreme-polish.md` 100-ideas audit returns zero.
- Build complete → "What pattern can fold back into template?" Push to `template.projectsites.dev` THIS turn.

Loop terminates ONLY when ALL:

- (a) **Competitor-beat gate** — per-dim score ≥ `_competitor_aggregate.json` MAX + 15pts on EVERY of 10 dims. Re-score every iteration. Cannot exit while any competitor outscores us on any dim.
- (b) **Directives shipped** — every `_competitor_directives.md` entry has implementation cited in PR; ≥3 `_competitor_gaps.md` entries shipped.
- (c) **AI-vision head-to-head** — our build's screenshot outscores every competitor's same-route screenshot in pairwise comparison at 6 viewports.
- (d) `supreme-polish.md` 100-ideas audit returns zero implementable.
- (e) Self-critique filter rejects all remaining candidates.
- (f) Brian says "ship it".

(a)+(b)+(c) NON-NEGOTIABLE. (d)-(f) additional polish gates. Loop NOT allowed to terminate on time / token budget / "good enough" — only when competitor-beat gate satisfied. Capping prematurely = "shipped a guess" = build fail.

Per-iteration: write row to `_competitor_loop_log.ndjson` with per-dim scores for OUR build + competitor MAX per dim + gate verdict.

## Phase 7 — Token Discipline

- Skill load order deterministic per `prompt-cache.md` — never reorder mid-session.
- Subagent prompts 100-300 words MAX. Beyond = cloning context.
- `web_search_20260209` + `web_fetch_20260209` + `code_execution_20260120` sparingly. `code_execution` FREE when paired with web_search or web_fetch.
- First-pass content → Workers AI Llama 3.3 70B FP8 (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`, free + 2-3× faster).
- Opus 4.8 ONLY for: architecture, top-10 conversion-route polish per `i18n-by-demographics.md` § Translation, AI vision QA, completeness.
- Sonnet 4.6 for build, Haiku 4.5 for changelog/format/simple review per `model-routing.md`.
- Multi-faceted prompt fires Monitor per `monitor-orchestration.md`.
- Container build cost: ~$0.50-$2.00 per Claude Code prompt, ~$5-$15 per full build. Never speculative-build.

## Phase 8 — Christ-like Ethos

- Build for served population, not engineering aesthetic.
- Feature primarily serves engineer's curiosity → defer.
- Feature primarily serves visitor (especially underserved) → prioritize.
- Per `14-independent-idea-engine` higher pursuits: "employing disabled people, spiritual tech investigation, 99% wealth donation ethos".
- Accessibility, multilingual support per real demographics, dignity in content, no manipulation, no dark patterns.
- Reference: `always.md` § Ethics + pre-ship harm scan.

## Operational invocation

Website-build prompt → Monitor decomposes in ORDER, fans out parallel within each:

1. Phase 0 research (3-5 parallel agents)
2. Phase 1 template clone + augment (1 agent)
3. Phase 2-3 page enrichment + swap-out (5-7 agents per page)
4. Phase 4 AI-native (3-5 agents from spiral catalog)
5. Phase 5 verification (5+ audit agents per `verification-loop.md`)
6. Phase 6 improvement loop (until exhausted)
7. Phase 7-8 continuous overlays

Ship per `verification-loop.md` deploy + prod-E2E mandate.
