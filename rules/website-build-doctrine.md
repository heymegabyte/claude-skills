---
name: "website-build-doctrine"
priority: 2
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

Execute the mandatory Phase -1→Phase 8 build sequence: competitor research → context saturation → build → enrichment → AI-native spiral → ship; skipping any phase is a build fail.

> **Acceptance index**: `[[website-build-manifest]]` is the single checklist of every technical gate a finished site must clear (per-page, per-site, cinematic, architecture, quality). Consult it as the spine; load each detail rule on demand. This doctrine is the *sequence*, the manifest is the *gate list*.

## Phase -1 — Competitor Research (gate -1)

Full protocol: `competitor-research.md`.

- Identify top 5-10 audience-comparable sites (peer nonprofits same NTEE / Google Maps+Yelp top-10 local / SimilarWeb+G2 SaaS / Awwwards portfolio).
- Capture: full route crawl, screenshots @ 1920×1080 + 390×844, copy via Browser Rendering REST, Wayback 1y + 3y.
- Score on 100-pt rubric: 10 dims × 10pts (visual polish · IA · copy · conversion · SEO+AI-search · perf · a11y · trust · AI-native · distinctiveness).
- Persist `_competitors/{domain}/` + `_competitor_aggregate.json` + `_competitor_directives.md` + `_competitor_inspiration.md` + `_competitor_gaps.md`.
- **Phase 6 loop CANNOT exit** until OUR build outscores EVERY competitor on EVERY dim by ≥15% AND ships ≥3 entries from `_competitor_gaps.md`.
- Skipping = build fail.

## Phase 0 — Context Saturation BEFORE Any Code

NO code/clone/scaffold until every public source is loaded. Fan out via parallel `Agent` spawns per `monitor-orchestration.md`. Skipping = build fail per `thin-source-amplification.md`.

- **Owned** — official site (deep crawl per `source-site-enhancement.md` § Phase 1), subdomains, X/IG/FB/LinkedIn/TikTok/YouTube, app stores, podcasts, RSS.
- **Search** — Google + Bing top-50 for `{name}`, `{name}+{city}`, `+reviews`, `+complaints`, `+founder`, `+history`, `+lawsuit`, `+press release`.
- **Archives** — Wayback (3+ snapshots), archive.today, archive.ph, Google `cache:`.
- **Registries** — Sec of State, BBB, Charity Navigator + Form 990, GuideStar/Candid, FCC + SEC EDGAR, Google Places + Yelp + Foursquare, Apple Maps + OSM.
- **Press** — Google News, local newspaper archives (Newspapers.com, NewsBank, Chronicling America pre-1963), trade pubs, podcast appearances.
- **People** — founder LinkedIn + Twitter + GitHub + personal blog + podcast guesting + court records + Chamber of Commerce.
- **Reviews** — Google + Yelp + Trustpilot + Reddit + HN + Indeed + Glassdoor; sentiment-score top 100 via Workers AI.
- **Visual** — every image scraped, all logo variants, brand colors AI-vision-extracted, Wayback gallery, signage photos.
- **Financial** — pricing pages, fee schedules, tiers, annual reports, 10-Ks, 990s.
- **Compliance** — state license registries, professional boards, OSHA records, health-dept inspections, court records.
- **Demographics** — ACS B16001; auto-fire `i18n-by-demographics.md` if community share ≥10% non-English.

Persist: `_research.json` + `_brand.json` + `_assets.json` + `_confirmations.json` + `_citations.json` per `15-site-generation` pipeline. Conf<T> per `citations.md`. Material gaps (bilingual-staff, donor permission, NAP, license, dates/names/amounts) → `AskUserQuestion` BEFORE further work.

## Phase 1 — Template First, Template Always

- Clone `github.com/HeyMegabyte/template.projectsites.dev` (NOT `saas-starter`).
- Push reusable artifacts BACK SAME TURN on every build. Each push makes next site 30%+ faster.

Flow-back targets (useful in ≥2 future builds): Components → `src/components/sections/` · Hooks → `src/hooks/` · Schemas → `src/schemas/` · Utilities → `src/lib/` · CF Workflow v2 defs → `src/workflows/` · Animation primitives → `src/motion/` · Build validators → `scripts/validators/` · Prompts → `prompts/` · Section catalogs → JSON specs.

Commit + push to main automatically per `brian-preferences.md` § Git policy. README documents every contributed component with one-line example.

## Phase 2 — Maximalist Page Enrichment

Add sections until the next would dilute. Stop only when "next hurts," never at "enough." Each candidate: AI vision pre-score; ship ≥8/10, reject below.

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
- AI-generated podcast ("Listen to the 3-min overview")
- Veo-stitched video ("60-sec narrative from 7×8s clips")
- Interactive map w/ AI-narrated POI annotations
- Live data widget (real API metric)
- Calculator / quote estimator
- Resource library (PDFs per `thin-source-amplification.md` § Phase 9)
- Blog teaser (3 latest)
- Multimodal connect form (text + voice + photo)
- Newsletter w/ Listmonk double opt-in
- Donor / partner wall · Press strip · "What we can't fix" disclosure
- Live status (uptime + recent activity)
- Local-business sticky bar (phone + directions + hours)

## Phase 3 — Swap-Out Authority (delta > 20% → replace)

Replace wholesale when ANY: AI vision <8/10 · generic feel · competitor benchmark >20% gap · filler copy.

- Replaced sections → `template.projectsites.dev/sections/_archived/` with `# Why replaced` note.
- After every replacement, run `supreme-polish.md` 100-ideas audit.

## Phase 4 — AI-Native Spiral

### Audio + voice

- AI 3-min podcast per page (OpenAI TTS / ElevenLabs / NotebookLM) — "Listen to this page."
- Voice tour — full-site narration with chapter markers.
- Voice search — Whisper STT → semantic site search.
- Phone voice agent — Twilio + ElevenLabs Conversational AI.

### Video

- Veo narrative — 7-8× 8-sec clips on 60-sec arc, cross-dissolves + AI VO.
- Animated hero — Sora 8-sec loop, `<picture>` static fallback.
- AI testimonial reads — real testimonials by AI voices (consent in `_confirmations.json`).

### Maps + spatial

- Interactive map: GPT Image 2 vision POI stories per pin.
- WebXR AR preview — 360 photos → AR overlay.
- Time-travel slider — Wayback + Google Street View before/after.

### Multimodal

- Multimodal forms — photo + voice → AI extracts intent + autofills.
- Chat-as-UI with CopilotKit tool-calls.
- Smart semantic search via `@cf/baai/bge-large-en-v1.5` → Vectorize.

### Personalization

- Behavioral hero swap (referrer / time-of-day / locale).
- Returning visitor — D1 cookie → "Welcome back — last time you looked at donation page."
- Locale-aware copy per `i18n-by-demographics.md` auto-fire.

### Generative

- Live blog autoposts — weekly Workflow from research seeds.
- Auto-generated case studies from D1 events.
- Per-visitor PDF builder (name + city + interests).

### Perf + UX

- AI-narrated 404 — GPT Image 2 riffs → friendly redirect suggestions.
- Smart redirects — Levenshtein + AI fuzzy-match for unknown URLs.
- Predictive prefetch — tiny on-device model trained on session nav.

### Delightful

- Audio Easter eggs — Konami → 30-sec AI brand theme.
- Style remix mode — visitor requests Wes Anderson / Mondrian / Ghibli → CSS theme swap.
- Confetti on donation goal hit — real-time D1 watch.
- Holiday hero variants (Christian holidays + Diwali / Eid / Lunar NY / Pride).

Each candidate through `extra-mile.md` § Self-critique.

## Phase 5 — Agent Swarm Parallelism

3-7 parallel `Agent` spawns per page in ONE multi-tool message per `monitor-orchestration.md`. Each: 100-300 word brief, ≤200 word summary back.

- **Agent-A** content-writer → copy, FAQ, microcopy, alt
- **Agent-B** visual-qa → screenshot + AI vision score
- **Agent-C** seo-auditor → title/meta/JSON-LD/OG
- **Agent-D** accessibility-auditor → axe 6bp + WCAG 2.2 manual
- **Agent-E** performance-profiler → Lighthouse + bundle + LoAF INP
- **Agent-F** media-orchestrator → images (Sharp triplets), video (Veo/Sora), audio (TTS)
- **Agent-G** motion-choreographer → View Transitions + scroll-driven + `@starting-style`

## Phase 6 — Continuous "What Else" Loop

- After each section/page/site/build: add next section, push template patterns, re-score competitors.
- Loop terminates ONLY when ALL of:
  - **(a) Competitor-beat gate** — per-dim score ≥ `_competitor_aggregate.json` MAX + 15pts on ALL 10 dims. Re-score every iteration.
  - **(b) Directives shipped** — every `_competitor_directives.md` entry implemented; ≥3 `_competitor_gaps.md` entries shipped.
  - **(c) AI-vision head-to-head** — our screenshot outscores every competitor same-route at 6 viewports.
  - **(d)** `supreme-polish.md` 100-ideas audit returns zero implementable.
  - **(e)** Self-critique rejects all remaining candidates.
  - **(f)** Brian says "ship it."
- (a)+(b)+(c) NON-NEGOTIABLE. Premature termination = build fail.
- Write row to `_competitor_loop_log.ndjson` each iteration: per-dim scores (OUR build + competitor MAX) + gate verdict.

## Phase 7 — Token Discipline

- Skill load order deterministic per `prompt-cache.md` — never reorder mid-session.
- Subagent prompts 100-300 words MAX.
- First-pass content → Workers AI Llama 3.3 70B FP8 (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`, free, 2-3× faster).
- Opus 4.8 ONLY for: architecture, top-10 conversion-route polish, AI vision QA, completeness.
- Sonnet 4.6 for build; Haiku 4.5 for changelog/format/simple review per `model-routing.md`.
- Build cost: ~$0.50-$2.00 per Claude Code prompt, ~$5-$15 per full build. No speculative builds.

## Phase 8 — Christ-like Ethos

- Build for served population, not engineering aesthetic.
- Feature serving engineer's curiosity → defer; serving visitors (especially underserved) → prioritize.
- Per `14-independent-idea-engine`: "employing disabled people, spiritual tech investigation, 99% wealth donation ethos."
- Accessibility, multilingual per real demographics, dignity in content, no dark patterns.
- Reference: `always.md` § Ethics + pre-ship harm scan.

## Operational Invocation

Monitor decomposes in order, fans out parallel within each:

1. Phase 0 research (3-5 parallel agents)
2. Phase 1 template clone + augment (1 agent)
3. Phase 2-3 page enrichment + swap-out (5-7 agents per page)
4. Phase 4 AI-native (3-5 agents from spiral catalog)
5. Phase 5 verification (5+ audit agents per `verification-loop.md`)
6. Phase 6 improvement loop (until exhausted)
7. Phase 7-8 continuous overlays

Ship per `verification-loop.md` deploy + prod-E2E mandate.
