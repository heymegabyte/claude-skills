# Website Build Doctrine (***SUPREME — every website build, every rebuild, every iteration***)

The complete AI-native website-build philosophy. Fires before, during, and after every site build/rebuild. Anchors the existing rule + skill mesh into a single executable doctrine.

## Phase -1 — Competitor Research (***SUPREME — gate -1, runs BEFORE Phase 0***)
- Full protocol: [[competitor-research]]
- Identify top 5–10 sites the audience would compare to OUR build (org-type aware: peer nonprofits in same NTEE code for nonprofits; Google Maps + Yelp top-10 for local; SimilarWeb/G2 top-rated for SaaS; Awwwards winners for portfolio; etc.)
- Capture each: full route crawl, screenshots @ 1920×1080 + 390×844, copy via Browser Rendering REST API, Wayback snapshots 1y + 3y ago
- Score each on a 100-point rubric (10 dimensions × 10pts): visual polish, IA, copy, conversion, SEO+AI-search, performance, a11y, trust, AI-native features, distinctiveness
- Persist `_competitors/{domain}/` + `_competitor_aggregate.json` (the floor) + `_competitor_directives.md` + `_competitor_inspiration.md` + `_competitor_gaps.md`
- **Loop termination** ([[website-build-doctrine]] Phase 6) CANNOT exit until OUR build outscores EVERY competitor on EVERY dimension by ≥15% AND ships ≥3 entries from `_competitor_gaps.md` (markets they ignored)
- Phase -1 outputs are mandatory input to Phase 0, Phase 1, Phase 2 (replacement candidates), Phase 3 (swap-out decisions), Phase 4 (AI-native feature targets)
- Skipping Phase -1 = "we shipped a guess" = build fail

## Phase 0 — Context Saturation BEFORE Any Code (***NON-NEGOTIABLE — gate 0***)
- NO code, NO template clone, NO scaffold until every known public source of information about the website's subject is loaded into context
- Build fails if Phase 0 was skipped or partial
- Fan out via parallel `Agent` spawns per [[monitor-orchestration]] § Decomposition (research agents do NOT block one another)
- Sources to exhaust:
  - **Owned surfaces** — official site (deep crawl every route via [[source-site-enhancement]] § Phase 1 sitemap+robots+Wayback+CMS-index BFS), linked subdomains, social profiles (X, IG, FB, LinkedIn, TikTok, YouTube), mobile app stores, podcast feeds, RSS
  - **Search engine sweep** — Google + Bing top 50 for `{name}`, `{name} + {city}`, `{name} + reviews`, `{name} + complaints`, `{name} + founder`, `{name} + history`, `{name} + lawsuit`, `{name} + press release`
  - **Archives** — Wayback Machine (3+ snapshots across time), archive.today, archive.ph, Google Cache via `cache:` operator
  - **Authoritative registries** — Secretary of State business registration, BBB profile, Charity Navigator + Form 990 (nonprofit), GuideStar / Candid, FCC + SEC EDGAR (public co), Google Places + Yelp + Foursquare (local), Apple Maps + OSM
  - **Press + media** — Google News, local newspaper archives (Newspapers.com, NewsBank, Chronicling America for pre-1963), trade publications, podcast appearances, conference talks
  - **People** — founder LinkedIn + Twitter + GitHub + personal blog + podcast guesting + court records + school-board minutes + Chamber of Commerce profile
  - **Reviews + sentiment** — Google Reviews + Yelp + Trustpilot + Reddit + Hacker News + Indeed (employee POV) + Glassdoor; sentiment-score the top 100 reviews via Workers AI
  - **Visual** — every image scraped from the source, every logo variant, brand-color swatches AI-vision-extracted from screenshots, full Wayback gallery, merchandise photos, signage photos
  - **Financial** — pricing pages, fee schedules, donation tiers, annual reports, 10-Ks, 990s
  - **Compliance** — state license registries, professional board lookups, OSHA records, health-department inspections, court records, FCC filings
  - **Demographics** — ACS B16001 for service area (auto-fire [[i18n-by-demographics]] if community share ≥10% non-English)
- Persist to `_research.json` + `_brand.json` + `_assets.json` + `_confirmations.json` + `_citations.json` per [[15-site-generation]] research-pipeline schema
- Each confidence-tracked field carries `apa_citation` + `source_url` per [[citations]] Conf<T> pattern
- After all sources exhausted, scan the brief for gaps. If anything material is missing (bilingual-staff confirmation, donor-list permission, exact NAP, license verification, specific dates / names / amounts), PROMPT the user with specific questions via `AskUserQuestion` BEFORE any further work
- Skipping Phase 0 = thin content + AI slop + missed value = build fail per [[thin-source-amplification]]

## Phase 1 — Template First, Template Always (***compounding asset***)
- First build: clone `https://github.com/HeyMegabyte/template.projectsites.dev` as the scaffold (NOT `saas-starter` — that's for SaaS apps; site builds use the dedicated template)
- Every subsequent build that produces a reusable artifact MUST push it back to `template.projectsites.dev` as optimized, plug-and-play code, the SAME turn it was authored
- Template = compounding asset. Every push makes the next site 30%+ faster
- What flows back (any pattern useful in ≥2 future builds):
  - **Components** — every `<Section*>`, `<Card*>`, `<Hero*>` that worked → `src/components/sections/`
  - **Hooks** — any custom React hook used twice → `src/hooks/`
  - **Schemas** — Zod schemas for forms / API contracts / JSON-LD generators → `src/schemas/`
  - **Utilities** — image helpers, color extract, OG-card renderer, sitemap builder → `src/lib/`
  - **Workflows** — CF Workflow v2 definitions for repeatable AI tasks → `src/workflows/`
  - **Animation primitives** — View Transition wrappers, scroll-driven choreography, `@starting-style` enter sets → `src/motion/`
  - **Build validators** — every `validate-X.mjs` worth running → `scripts/validators/`
  - **Prompts** — reusable `.prompt.md` files → `prompts/`
  - **Section catalogs** — section JSON specs that the orchestrator can drop into any page
- Side repos (template) → commit + push to main automatically per [[brian-preferences]] § Git policy ("Side repos → always commit + push to main/master automatically")
- The template README documents EVERY contributed component with a one-line example so future agents (and future-Brian) can discover them without re-reading source

## Phase 2 — Maximalist Page Enrichment (***keep going until dilution***)
- On every page, keep adding sections that bring value until the next section would dilute, not enrich
- Stop criterion is NEVER "we have enough" — it's "next section would hurt"
- Per-page section catalog (pick ones that fit the page intent, mix-and-match):
  - Hero with kinetic typography + View Transitions entrance
  - Quotable answer block (40-60 words, AI-search-optimized per [[copy-writing]] § GEO/AI search)
  - 5+ FAQ accordion w/ FAQPage JSON-LD (real Q&A only per [[always]])
  - Trust strip (logos, awards, accreditations, real licenses)
  - Stats row w/ `<app-rolling-counter>` per [[cinematic-ui-patterns]] (numbers ALWAYS animate)
  - Bento-grid feature comparison
  - Before-after slider via `<app-before-after-slider>` (real comparison data only)
  - Testimonials w/ verified-via-LinkedIn badges (NEVER fabricated per [[thin-source-amplification]])
  - Process / how-it-works 12-step
  - Timeline (real photos only per [[timeline-authenticity]])
  - Pricing tier comparison
  - **AI-generated podcast snippet** ("Listen to the 3-min overview")
  - **Veo-stitched video** ("60-sec narrative from 7×8s generative clips")
  - **Interactive map** w/ AI-narrated POI annotations
  - Live data widget (real metric from API)
  - Calculator / quote estimator
  - Resource library (downloadable PDFs per [[thin-source-amplification]] § Phase 9)
  - Blog teaser (3 latest posts)
  - Multimodal "connect" form (text + voice + photo upload)
  - Newsletter signup w/ Listmonk double opt-in
  - Donor / partner wall
  - Press mentions strip
  - "What we can't fix" disclosure (trust builder)
  - Live status (uptime + recent activity)
  - Local-business sticky bar (phone + directions + hours) for local sites
- For each candidate section: AI vision pre-score it. Ship at ≥8/10, reject below

## Phase 3 — Swap-Out Authority (***replace > polish when delta > 20%***)
- When reviewing a section, ask "should this be REPLACED" before "how to improve"
- Replace wholesale when ANY apply:
  - AI vision scores <8/10
  - Section feels generic (could appear on 100 other sites)
  - Competitor benchmark exposes >20% quality gap
  - Content reads as "we needed to put something here"
- Wholesale replacement preferred over incremental polish when delta > 20%
- Replaced sections are NOT lost — move to `template.projectsites.dev/sections/_archived/` with `# Why replaced` note for future remix
- After every replacement, run [[supreme-polish]] 100-ideas audit on the page

## Phase 4 — AI-Native Features (***the spiral — only possible because AI is programming***)
At every page, ask: "What's possible BECAUSE AI is programming this site, that no human team would have built?" Then build it. Examples (starting points, not closed list):

### Audio + voice
- **AI-generated podcast per page** — 3-min synthesized podcast of the page content via OpenAI TTS / ElevenLabs Studio / NotebookLM. "Listen to this page" widget with playback chip.
- **Voice tour** — full-site narration as a single track with chapter markers per page
- **Voice search** — Whisper STT → semantic site search → highlighted answer
- **Phone voice agent** — Twilio + ElevenLabs Conversational AI for after-hours callers (when Twilio is wired)

### Video
- **Veo-stitched narrative** — generate 7-8 individual 8-sec Veo clips on a 60-sec story arc, stitch with cross-dissolves + AI voiceover into one cinematic intro
- **Animated hero** — Sora 8-sec loop per page, hero-region only, with `<picture>` static fallback
- **AI-generated testimonial reads** — real testimonials read aloud by AI in different voices per author (consent documented in `_confirmations.json`)

### Maps + spatial
- **Interactive map with AI POI annotations** — Mapbox + GPT-4o-generated location stories per pin
- **WebXR AR preview** — 360 photos → AR overlay (when source has 360s)
- **Time-travel slider** — Wayback + Google Street View "before / after" for historical sites

### Multimodal interaction
- **Multimodal forms** — upload a photo of "the problem" + voice description → AI extracts intent + autofills form fields
- **Chat-as-UI** — CopilotKit chat with tool-calls for site actions ("Schedule a tour for Tuesday at 3pm")
- **Smart semantic search** — every query routed through `@cf/baai/bge-large-en-v1.5` embeddings → Vectorize semantic match
- **AI-augmented testimonials** — real text testimonials enriched with generated voice reads (consent required)

### Personalization
- **Behavioral hero swap** — based on referrer / time-of-day / locale, hero copy + image rotates
- **Returning visitor recognition** — D1 visitor cookie → "Welcome back — last time you looked at our donation page"
- **Locale-aware copy** — ACS-driven locale mirrors per [[i18n-by-demographics]] auto-fire

### Generative content
- **Live blog autoposts** — weekly Cloudflare Workflow generates a new post from research seeds, auto-publishes
- **Auto-generated case studies** — from D1 events + AI synthesis
- **Per-visitor PDF builder** — generate a custom brochure with the visitor's name + city + interests on download

### Performance + UX
- **AI-narrated 404** — GPT-4o riffs on the missing URL → friendly redirect suggestions
- **Smart redirects** — Levenshtein + AI fuzzy-match for unknown URLs → suggest closest real route
- **Predictive prefetch** — tiny on-device model trained on session navigation → prefetch likely-next route

### Witty + delightful
- **Audio Easter eggs** — hidden Konami-code chord plays 30-sec AI-generated brand theme music
- **Style remix mode** — visitor asks "show me this site in the style of Wes Anderson / Mondrian / Studio Ghibli" → site re-skins client-side via CSS-only theme swap
- **Confetti when donation goal hits** — real-time D1 watch → physics-based confetti
- **Holiday hero variants** — per real-date detection, key holidays get themed hero (Christ-like reverence on Christian holidays per [[brian-preferences]] § spiritual; Diwali, Eid, Lunar New Year, Pride for inclusive observance)

The pick filter: each candidate runs through the self-critique filter at [[extra-mile]] § Self-critique. Ship the ones scoring "would Brian wish I had just done this." Surface the rest in Recs.

## Phase 5 — Agent Swarm Parallelism (***fan-out by default, token-efficient***)
- Decompose every page build into 3-7 parallel `Agent` spawns in ONE multi-tool message per [[monitor-orchestration]] § Decomposition
- Canonical per-page fan-out:
  - **Agent-A** content-writer → copy, FAQ, microcopy, alt text
  - **Agent-B** visual-qa → screenshot + AI vision score
  - **Agent-C** seo-auditor → title / meta / JSON-LD / OG
  - **Agent-D** accessibility-auditor → axe at 6 breakpoints + WCAG 2.2 manual review
  - **Agent-E** performance-profiler → Lighthouse + bundle audit + LoAF INP debug
  - **Agent-F** media-orchestrator → images (Sharp triplets), video clips (Veo / Sora), audio (TTS)
  - **Agent-G** motion-choreographer → View Transitions + scroll-driven + `@starting-style` enter sets
- Each agent: 100-300 word brief, owns specific files, returns ≤200 word summary
- Main thread does foreground edits (CHANGELOG, README, MEMORY, sitemap) while agents run
- Token efficiency: subagents have their own context (no shared bloat); main thread receives summaries only
- Per [[full-autonomy]] § Sub-agent prompts: beyond 300 words = cloning context, not specializing

## Phase 6 — Continuous Self-Improvement Loop (***ask "what else" at every step***)
After every:
- **Section added** → "Is there one more section that would add value here?" If yes, add it. If no, move on.
- **Page complete** → "What section type haven't we tried that would fit?" Add it.
- **Site complete** → "What feature would make this best-in-class?" Add it. Repeat until [[supreme-polish]] 100-ideas audit returns zero implementable items.
- **Build complete** → "What pattern can be folded back into template?" Push it to `template.projectsites.dev` THIS turn.

Loop terminates ONLY when ALL of these are TRUE (the competitor-beat gate from [[competitor-research]] is the load-bearing condition):
- (a) **Competitor-beat gate** — OUR per-dimension rubric score ≥ `_competitor_aggregate.json` MAX + 15 points on EVERY of the 10 rubric dimensions (visual polish, IA, copy, conversion, SEO+AI-search, performance, a11y, trust, AI-native features, distinctiveness). Re-score on EVERY loop iteration; the loop is NOT allowed to exit while any competitor outscores us on any dimension
- (b) **Directives shipped** — every entry in `_competitor_directives.md` has a corresponding implementation cited in the PR/commit, AND ≥3 entries from `_competitor_gaps.md` are shipped (markets competitors ignored that we now own)
- (c) **AI-vision head-to-head** — our build's same-route screenshot outscores every competitor's same-route screenshot in pairwise AI-vision comparison at 6 viewports
- (d) [[supreme-polish]] 100-ideas audit returns zero implementable items
- (e) Self-critique filter rejects all remaining candidate ideas
- (f) Brian explicitly says "ship it"

(a)+(b)+(c) are NON-NEGOTIABLE — the loop CANNOT exit while any competitor still outranks us. (d)–(f) are additional polish gates. The loop is NOT allowed to terminate based on time, token budget, or "good enough" — only when the competitor-beat gate is satisfied. Anything less = the build was capped prematurely = "we shipped a guess" = build fail per [[competitor-research]] § Loop termination.

Per-iteration accounting goes to `_competitor_loop_log.ndjson` — every loop pass writes a row with the per-dimension scores for OUR build, the competitor MAX per dimension, and the gate-check verdict. Auditable history of why the loop ran N iterations.

## Phase 7 — Token Discipline (***fast completion, no waste***)
- Skill load order is deterministic per [[prompt-cache]] — never reorder mid-session (defeats prefix caching)
- Subagent prompts 100-300 words MAX — beyond that = cloning context, not specializing
- Use `web_search_20260209` + `web_fetch_20260209` + `code_execution_20260120` sparingly; the `code_execution` tool is FREE when paired with web_search or web_fetch (use that combo)
- Prefer Workers AI Llama 3.3 70B FP8 (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`, free + 2-3× faster) for first-pass content
- Reserve Claude Opus 4.7 for: architecture decisions, top-10 conversion-route copy polish per [[i18n-by-demographics]] § Translation quality, AI-vision QA scoring, completeness checks
- Sonnet 4.6 for standard implementation, Haiku 4.5 for changelog / formatting / simple review per [[model-routing]]
- Every multi-faceted prompt fires the Monitor pattern per [[monitor-orchestration]] (don't single-thread what can parallelize)
- Container build cost reference: ~$0.50-$2.00 per Claude Code prompt, ~$5-$15 per full build. Never speculative-build per `apps/project-sites/CLAUDE.md` § API Credit Discipline.

## Phase 8 — Christ-like Ethos (***the why behind the build***)
- Build for the served population, not for the engineering aesthetic
- When a feature primarily serves the engineer's curiosity but doesn't reach the visitor → defer
- When a feature primarily serves the donor / customer / visitor (especially underserved populations) → prioritize
- Per [[14-independent-idea-engine]] § higher pursuits: "employing disabled people, spiritual tech investigation, 99% wealth donation ethos"
- Accessibility, multilingual support per real demographics, dignity in content, no manipulation, no dark patterns — all flow from the ethos
- Reference: [[always]] § Ethics + pre-ship harm scan (Ethical OS 8 zones)

## Operational invocation
When a website-build prompt fires, the Monitor decomposes into these phases in ORDER, fanning out parallel agents within each phase:
1. Phase 0 research (3-5 agents in parallel)
2. Phase 1 template clone + augment (1 agent)
3. Phase 2-3 page enrichment + swap-out (5-7 agents per page)
4. Phase 4 AI-native features (3-5 agents picking from the spiral catalog)
5. Phase 5 verification (5+ audit agents per [[verification-loop]])
6. Phase 6 improvement loop (until exhausted)
7. Phase 7-8 are continuous overlays, not separate phases

Then ship per [[verification-loop]] deploy + prod-E2E mandate.

## Integration map (cross-links — load these alongside)
- [[monitor-orchestration]] — parallel agent fan-out is mandatory
- [[extra-mile]] — every fix paired with a value-add
- [[auto-integrate-recs]] — ship implementable Recs same-turn, never defer
- [[supreme-polish]] — 100-ideas audit per build
- [[proactive-improvements]] — just-feels-right additions at every step
- [[source-site-enhancement]] — when rebuilding an existing domain
- [[thin-source-amplification]] — when source is bare
- [[citations]] — every quantitative claim sourced
- [[i18n-by-demographics]] — locale auto-fire on multilingual service areas
- [[12-media-orchestration]] — AI-generated media pipeline (Sora, Veo, GPT Image, ElevenLabs, OpenAI TTS)
- [[14-independent-idea-engine]] — proactive feature ideation + self-critique
- [[15-site-generation]] — Bolt-style artifact emission + R2 upload
- [[16-cinematic-website-prime-directive]] — one-line site prompt = activate all 100 rules
- [[cinematic-ui-patterns]] — `<app-rolling-counter>` + `appReveal` + before-after slider primitives
- [[image-quality]] — hyper-real photo bar
- [[timeline-authenticity]] — real photos only on history sections
- [[copy-writing]] — anti-slop + GEO/AI search
- [[brian-preferences]] — pick ONE, never options, just do it
- [[full-autonomy]] — authorized to spawn agents, use tools, take creative paths
- [[prompt-cache]] — load order discipline for token efficiency
- [[model-routing]] — Opus 4.7 for architecture, Sonnet for build, Workers AI for content
- [[verification-loop]] — deploy + prod-E2E mandate

## Reference incident (***2026-05-26***)
Brian directive: "Make it so that when building websites, the first thing that must be done is that all known sources of information on the internet in regards to what the website is about must be loaded into the context... After the whole context is loaded, then on first run template.projectsites.dev should be used and continually improved... With the context fully loaded, you should, on every single page, add to it anything that might bring the page value (without being too long) and keep doing that until it does not make sense to keep creating sections on the page. When reviewing the site, you should not be shy of completely swapping out sections... Take full control, be creative, and always go down the spirals of amazing features that might only be possible because AI is doing the programming - use creative, witty ideas like leveraging integrated AI-generated podcasts, or Veo videos that stitch multiple 8s clips together to make something bigger, or interactive maps, or any idea you can think of to make the experience more cinematic, Christ-like, and fully AI augmented..."

THIS RULE captures that directive in full. Future website builds MUST execute Phase 0-8 in order, with parallel agent fan-out within each phase, until Phase 6 returns zero implementable improvements.
