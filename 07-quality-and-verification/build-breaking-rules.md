---
name: "07 build-breaking validators"
description: "Universal verification gates for hyperlinks, internal/external link resolution, image existence, JSX-entity hygiene, and address linking. Each rule = build-breaking validator. Migrated verbatim from rules/always.md 2026-05-03 to keep universal layer lean (only loads when 07 activates)."
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

# 07 — Build-Breaking Verification Rules

> **Model migration note (pass-79, 2026-06-09)**: `DALL-E` → **GPT Image 1.5** + `GPT-4o` → **GPT Image 2 vision**. Per `platform.openai.com/docs/deprecations`.

Every rule below is a HARD build-gate. Failure of any validator blocks deploy. Migrated verbatim from `~/.claude/rules/always.md` 2026-05-03 to keep the universal layer lean (skill activates only when 07 is in scope, see `rules/prompt-cache.md`).

## Every clickable entity (***UNIVERSAL — NO EXCEPTIONS — supersedes prior partial rules***)

### Linking rules

- Every email → `<a href="mailto:user@domain">`
- Every phone → `<a href="tel:+1NNNNNNNNNN">` (E.164, strip all formatting from href, render formatted as text)
- Every URL → `<a href>` with `target="_blank" rel="noopener noreferrer"` for external
- Every named institution/org/journal/conference/publication mentioned in body → linked to canonical URL using institution name as anchor (NEVER "click here" / "learn more")
- Every product/service/feature with a dedicated route → `<Link>` to route
- Every SKU/EIN/DOI/ISBN/arXiv-id → linked to registry
- Every social handle → profile URL

If a string CAN be linked AND linking aids the reader, IT MUST BE LINKED. Plain-text contact info = build fail.

### Validator (`validate-hyperlinks.mjs`)

Greps `dist/` HTML for unlinked:

- Email regex `[\w.+-]+@[\w-]+\.[\w.-]+`
- US phone `(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})`
- Address `(P\.?O\.? Box \d+|\d+ [A-Z][a-z]+ (Street|St|Avenue|Ave|Road|Rd|Blvd|Lane|Ln|Drive|Dr))`

Any match outside an `<a>` ancestor = fail.

### Render

Helper components `<MailLink>`, `<TelLink>`, `<AddressBlock>` ship in template — never hand-code `<a href="mailto:...">` ad-hoc.

## Every address (***UNIVERSAL***)

- Every street address rendered (footer / contact / header / business cards / all) wrapped in `<a href="https://www.google.com/maps/dir/?api=1&destination=<urlencoded>" rel="noopener">`
- No exceptions
- PO Box / no-direction-target uses `…/maps/search/?api=1&query=<urlencoded>`

## Every outbound link (***HEAD-200 VALIDATION GATE — UNIVERSAL — BUILD-BREAKING***)

Every external `<a href>` (target!=internal route, host!=primary site host) MUST be HEAD-200 verified pre-deploy.

### Build gate (`validate-outbound-links.mjs`)

- Post-build, parse all dist HTML for external `<a href>`
- Run HEAD request with realistic UA (per `rules/fetch-defaults.md`)
- Follow redirects up to 5
- Accept 200 / 206 / 301 / 302 / 303 / 307 / 308
- FAIL on 404 / 410 / 451 / 5xx
- Allow GET fallback when HEAD returns 405
- Cache results in `.link-cache.json` (24h TTL) to avoid hammering external hosts on rebuilds

When a link 404s, the skill 15 research pipeline MUST find the canonical replacement URL via web research (Exa / Tavily / Perplexity search by article title + author + year) BEFORE marking build done — never ship a known-404 outbound link.

**Reference incident:** lone-mountain-global-3 (2026-05-01) WHO factsheet `https://www.who.int/news-room/fact-sheets/detail/corruption-in-the-health-sector` 404 (factsheet renamed/moved) drove this rule.

## Every internal link (***ZERO BROKEN INTERNAL LINKS — UNIVERSAL — BUILD-BREAKING***)

Every `<Link to="/...">`, `href="/..."`, and string-literal route reference MUST point to a real route or — for SPA detail routes (`/blog/<slug>`, `/team/<slug>`, `/projects/<slug>`) — a real corpus entry.

### Rules

- Hardcoded preview tiles (homepage feature blocks, related-posts, sidebars) MUST derive from the actual data file (`corpus.slice(0,N).map(...)`) — never hand-author slug strings that can drift
- SPA routes that 200 with a "post not found" component still count as broken

### Build gate (`validate-links.mjs`)

- Walks all `.ts` / `.tsx` source
- Extracts every `/blog/<slug>`, every `to="/route"`, every `/images/...|/videos/...` string literal
- Asserts each against corpus data + known-routes set + `public/` filesystem
- Wired into `package.json` build script as a pre-tsc gate

The validator's `KNOWN_ROUTES` set MUST be auto-derived from `src/app.tsx` AST (every `<Route path>` AND every `<Redirect>` legacy preservation route) via `scripts/generate-known-routes.mjs` — hand-maintained allowlists go stale silently, and `<Redirect>` routes 200 OK with client redirect so internal Link refs to legacy CMS URLs ARE valid.

**Reference incident:** njsk.org 2026-05-02 — homepage `/blog/thanksgiving-2024` + `/blog/pseg` were hand-authored slugs that never existed in the corpus (real slugs `thanksgiving-at-st-johns` + `pseg-volunteers`); same day, validator's `KNOWN_ROUTES` lacked the 10 Squarespace `<Redirect>` paths so `/mass-schedule` + `/our-mission` + `/the-mens-dining-hall-1` etc. failed false-positive — shipped twice before fix landed.

**Repeat-incident class:** ANY hand-authored ID/slug/route reference that depends on matching a separate data file is forbidden — derive from the data or fail the build.

## Every image (***ZERO BROKEN IMAGES — UNIVERSAL***)

- Every `<img src>`, every CSS `background-image`, every `<source srcset>` MUST resolve to a 200-OK file in build output OR a whitelisted external host (`cdn.*` | `images.pexels.com` | `logo.dev` | `wikipedia.org`)
- Absolute `https://your-site.com/foo.jpg` refs included
- Build gate: post-build crawl every page, fetch every image URL — any 404 = fail with diagnostic showing source HTML location

**Reference incident:** lone-mountain-global-3 `/taryn-albania.jpg` 404 (2026-05-01) — referenced in JSX but never downloaded — drove this rule.

**Companion:** media acquisition walker MUST capture hero backgrounds on /contact + /about + /team + /services CSS `background-image` + section-bg + slider-bg, NOT just inline `<img>` tags. Slide groups preserved with order.

## Every JSX text + data-array (***NO HTML ENTITIES — UNIVERSAL — BUILD-BREAKING***)

Never write `&apos;` / `&middot;` / `&amp;` / `&ldquo;` / `&rdquo;` / `&hellip;` / `&ndash;` / `&mdash;` / `&nbsp;` / `&quot;` / `&#\d+;` in `.tsx` / `.jsx` / `.ts` source.

### Why

JSX entity decoding fires ONLY for JSX text children (`<p>foo&apos;s bar</p>`), NEVER for JS string literals passed through `{variable}` interpolation or stored in data arrays. So `const tips = [{ text: "person&apos;s gift" }]; return <p>{tips[0].text}</p>` renders the literal `person&apos;s` to the user, NOT `person's`.

### Use raw Unicode everywhere

- `'` (U+2019 right single quote / apostrophe)
- `·` (U+00B7 middle dot)
- `&` (ampersand)
- `"` `"` (U+201C/U+201D curly quotes)
- `…` (U+2026 ellipsis)
- `–` `—` (U+2013 en dash / U+2014 em dash)
- ` ` (U+00A0 nbsp)

Build prompts emit raw Unicode in data arrays + page copy, never HTML-entity escapes.

### Validator (`validate-html-entities.mjs`)

Grep `src/**/*.{ts,tsx,jsx}` AND `dist/**/*.html` for entity literals outside `<code>` / `<pre>` ancestors AND outside `@example` JSDoc; FAIL on any match.

**Reference incident:** njsk.org 2026-05-02 — `we-need.tsx` data array had `text: "person&apos;s gift"` strings that rendered as `person&apos;s` in production for several deploys until grep-and-replace pass.

## Every page (***SINGLE VISIBLE H1 — UNIVERSAL — BUILD-BREAKING***)

- Every route MUST contain EXACTLY ONE `<h1>` element
- AND that h1 MUST be visibly rendered (not `class="sr-only"`, not `display:none`, not `visibility:hidden`, not `opacity:0`, not positioned off-screen via `position:absolute;left:-9999px`)

### Why visible-H1

An h1 hidden behind sr-only fails Yoast, fails GPT Image 2 vision audit, and gets penalized by Google as cloaking.

### Validator (`validate-h1.mjs`)

- Post-build, parse each dist HTML
- Count `<h1>`
- Check class/style for `sr-only` / `display:none` / `visibility:hidden` / `opacity:0` / `clip:rect(0,0,0,0)` / `left:-9999px`
- Zero h1 = fail | >1 h1 = fail | hidden h1 = fail

**Reference incident:** lonemountainglobal.projectsites.dev 2026-05-07 — homepage rendered headline as h1 with `sr-only` to "preserve visual hierarchy" while the visible "tagline" was h2; Yoast scored 38/100, audit cited `html.h1_visible`.

## Every page (***SEMANTIC LANDMARKS — UNIVERSAL — BUILD-BREAKING***)

Every route MUST emit:

- `<header>` (site brand + nav)
- `<nav aria-label="Primary">` (or inside header)
- `<main id="main" tabIndex={-1}>` (skip-link target)
- `<footer>` (site footer)

### Rules

- Each landmark appears EXACTLY ONCE per page (multiple `<nav>` elements OK only if each carries unique `aria-label`)
- Layout component MUST own these wrappers — pages render only `<main>` children

### Validator (`validate-landmarks.mjs`)

- Parse dist HTML, assert `header, nav, main[id=main], footer` all present
- Count main + header + footer
- If header+footer >1 or main missing or main lacks `id="main"` = fail

**Reference incident:** lonemountainglobal — main landmark missing `id="main"` so SkipLink target `href="#main"` was broken; remediated at template level via `Layout.tsx`.

## Every page (***SKIP-LINK TARGET — UNIVERSAL — BUILD-BREAKING***)

- Every route MUST contain a skip-to-content `<a href="#main">` as the FIRST focusable element
- AND the page MUST contain exactly one element matching `#main` (typically `<main id="main" tabIndex={-1}>`)
- The skip link MAY be visually hidden (sr-only) but MUST become visible on `:focus`

### Validator (`validate-skiplink.mjs`)

- Parse dist HTML
- Assert first focusable in body is `<a href="#main">`
- Assert `[id="main"]` exists exactly once
- Missing target = fail | wrong order = fail

## Every page rendering NAP (***ADDRESS-TAG REQUIRED — UNIVERSAL — BUILD-BREAKING***)

- Every visible street-address render MUST be wrapped in semantic `<address>` AND linked per the address rule above (Google Maps `dir/?api=1&destination=` for street addresses, `search/?api=1&query=` for PO Box)
- Plain `<p>` or `<li>` containing recognizable address pattern outside an `<address>` ancestor = fail

### Validator (`validate-address-tag.mjs`)

Regex `(P\.?O\.? Box \d+|\d+ [A-Z][a-z]+ (Street|St|Avenue|Ave|Road|Rd|Blvd|Lane|Ln|Drive|Dr))` — match outside `<address>` ancestor = fail.

## Every site (***INTERNAL LINK MINIMUM — UNIVERSAL — BUILD-BREAKING***)

- Homepage MUST contain ≥5 unique internal links (excluding header/footer nav — links inside body / main content)
- Internal link = `href` starting with `/` not pointing to `/static/`, `/images/`, `/videos/`, `/api/`, `/assets/`

### Validator (`validate-internal-links.mjs`)

- Parse dist `index.html`
- Collect all `<a href>` inside `<main>`
- Dedupe, count, fail if <5

**Reason:** orphaned content + flat-link sites under-perform in Google ranking; AI search citation requires linked context.

**Reference:** lonemountainglobal homepage had only header nav + 1 CTA = 5 total internal links across whole page (header + CTA only); audit scored 4/10 on internal linking.

## Every JSON-LD render (***XSS ESCAPE — UNIVERSAL — BUILD-BREAKING — SECURITY***)

Every JSON-LD `<script type="application/ld+json">` payload MUST escape `<`, `>`, `&`, ` `, ` `, and `</script>` per OWASP.

### Why

Raw `JSON.stringify(data)` inside `dangerouslySetInnerHTML` is a stored-XSS sink — attacker-controlled fields (testimonials, reviews, comments, business name from CMS, scraped source content) can break out of the script tag.

### Required escape

```
.replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026').replace(/ /g,'\\u2028').replace(/ /g,'\\u2029')
```

### Pattern

Template ships `<JsonLd>` component with the escape baked in — never write `dangerouslySetInnerHTML={{ __html: JSON.stringify(...) }}` ad-hoc.

### Validator (`validate-jsonld-escape.mjs`)

Grep `src/**/*.{ts,tsx}` for `dangerouslySetInnerHTML.*JSON\.stringify` outside the canonical `<JsonLd>` component = fail.

**Reference:** pre-2026-05-07 template `JsonLd.tsx` had unescaped `JSON.stringify` — every generated site shipped the vulnerability.

## Every page depth>1 (***BREADCRUMBS + JSON-LD — UNIVERSAL — BUILD-BREAKING***)

- Every route at depth>1 (path segment count ≥2, e.g. `/blog/<slug>`, `/team/<slug>`, `/services/seo-audit`) MUST render a visible `<nav aria-label="Breadcrumb"><ol>`
- AND emit a corresponding `BreadcrumbList` JSON-LD entry with positions matching the visible crumb labels
- Top-level routes (`/`, `/about`, `/contact`) skip breadcrumbs (depth=1)

### Validator (`validate-breadcrumbs.mjs`)

For each dist HTML at depth>1, assert:

- `nav[aria-label="Breadcrumb"]` exists
- AND a `<script type="application/ld+json">` block of `@type=BreadcrumbList` exists with `itemListElement.length === visibleCrumbs.length`
- Mismatch = fail

## Every rendered text element (***WCAG-AA AGAINST ACTUALLY-RENDERED BACKGROUND — DOM WALKER, NOT DESIGN-TOKEN CHECK — UNIVERSAL — BUILD-BREAKING***)

Design-token contrast checks (compare `--text-primary` against `--bg-primary` in CSS) are NOT enough — they pass the static palette but miss the real failure mode: text on a section, card, callout, or footer whose computed background is white when token says dark (or vice versa) because a parent override, gradient bleed-through, or unintended `background: var(--bg-secondary)` flips the effective bg.

### Validator (`validate-rendered-contrast.mjs`)

- Walks the actual rendered DOM via Playwright at 6 breakpoints (375/390/768/1024/1280/1920)
- For every text node compute the EFFECTIVE background by ancestry traversal: `getComputedStyle(el).backgroundColor` falling back through parent chain until a non-`rgba(0,0,0,0)` opaque color or `<body>` is found, accounting for `background-image` gradients (use computed gradient mid-stop when present), opacity stacking, and `backdrop-filter`
- Then compute WCAG 2.x relative-luminance ratio between resolved text color (also walking ancestry for `color` inheritance) and resolved background

### Fail conditions

**FAIL on any text element with ratio <4.5:1 (normal text) OR <3:1 (large text ≥18pt or ≥14pt-bold).**

### Special cases

- Skip `[aria-hidden="true"]` decorative text
- Skip `position: absolute; clip-path` sr-only nodes
- Skip elements with `pointer-events: none` AND `visibility: hidden`
- Treat `<a>` text the same as body text (no link-color exemption)
- Gradient backgrounds tested at both endpoints AND midpoint — failing any endpoint = fail

### Report format

Must include `{selector, text_preview, computed_text_color, computed_bg_color, ratio, threshold, breakpoint, ancestry_path}` so the auto-fixer agent can locate the failing rule and patch CSS.

**Reference incident:** lonemountainglobal.projectsites.dev (2026-05-10) shipped white-on-white footer text — design tokens passed because `--text-primary: #fff` against `--bg-footer: #0a0a1a` looked correct in palette docs, but actual footer rendered with a section-level `background: #fff` override from a stale CTA-section style bleeding into siblings.

**Brian directive:** *"At the bottom, there is white text on white background — this is an absolute no. We must always show content in proper contrast. Super massage this into ~/.agentskills."* — drove this rule.

**Companion:** the design-token check (`validate-contrast.mjs`) stays as a fast pre-flight, but the DOM walker is the authoritative gate.

## Every build (***CONVERGENCE LOOP #1 — ZERO-RECOMMENDATIONS GATE IS BUILD-BREAKING — UNIVERSAL — BUILD-BREAKING***)

- Final iteration of every build MUST exit with `_recommendations.json.length === 0`
- Non-zero recommendations array = build FAIL, NOT ship-with-warnings

### The Zero Recommendations Gate

The convergence proof: idea engine (skill 14) keeps surfacing aligned upgrades until exhausted; build is DONE when nothing improvable remains within budget/scope.

### Pipeline

1. Each iteration runs recommendations sweep
2. Auto-implements ≥0.8 confidence + low-risk
3. Proposes 0.5-0.8
4. Rejects <0.5
5. Re-runs sweep
6. Exits when empty OR `iteration_count >= MAX_ITER`

### Validator (`validate-zero-recommendations.mjs`)

Assert final `_recommendations.json` is `[]` OR `iteration_count >= MAX_ITER` AND remaining recommendations carry `deferred_reason: "budget_exhausted"|"scope_out"`.

**Reference:** prompt-improvements brainstorm rec #13 (2026-05-10) — see also `~/.claude/CLAUDE.md` "Self-Improvement: After every implementation: 'What else?' If anything → do it → ask again → loop until zero."

## Every build (***CONVERGENCE LOOP #2 — DELTA-DRIVEN ITERATION (no full rebuild from scratch) — UNIVERSAL — BUILD-BREAKING***)

- Every iteration ≥2 of repeatable-build flow MUST apply DELTA to prior dist — NEVER rebuild from scratch
- Total iteration ≥2 cost SHOULD be ≤15% of iteration 1 cost (LLM tokens + R2 PUTs + GPT Image 1.5 calls + CDN purges)

### Pipeline

- `_diff.json` = (prior_dist, this_iteration_recommendations[])
- Patches applied in-place
- Only changed files regenerated
- R2 upload only delta files
- D1 `sites.iteration_count++`

### Validator (`validate-delta-iteration.mjs`)

For iteration ≥2, assert `_diff.json.changed_files.length` < 50% of `dist/**/*` total AND build duration ≤15min (vs iter-1 ~35min).

**Reference:** prompt-improvements brainstorm rec #14 (2026-05-10) — convergence requires cheap iterations.

## Every build (***CONVERGENCE LOOP #3 — SELF-CRITIQUE PASS BEFORE DECLARING DONE — UNIVERSAL — BUILD-BREAKING***)

Before any build marks `status='published'`, orchestrator MUST run a self-critique pass that simulates 3 distinct skeptical reviewers and produces `_critique.json`:

### Three reviewers

1. **Brand-fidelity reviewer** — "does this look like the source site or a generic template?"
2. **Accessibility auditor** — "WCAG 2.2 AA actual failures, not just axe-core report"
3. **Brian-voice reviewer** — "is this anti-slop sharp + punchy or did it drift into 'leverage seamless innovative'?"

Each reviewer scores 0-10 + lists ≥3 specific failures.

### Gate

Build cannot ship unless ALL three score ≥8.

### Validator (`validate-self-critique.mjs`)

Assert `_critique.json` exists + 3 reviewer entries + all scores ≥8 OR failures list addressed in subsequent recommendations.

**Reference:** prompt-improvements brainstorm rec #15 (2026-05-10) — see also `~/.claude/CLAUDE.md` "Self-Argue: before major decisions, generate strongest counterargument."

## Every build (***CONVERGENCE LOOP #4 — BUILD-QUALITY-SCORE PROGRESSION GATE — UNIVERSAL — BUILD-BREAKING***)

- Every iteration ≥2 MUST produce a build-quality-score strictly greater than the prior iteration
- Non-improvement = wasted iteration = build FAIL

### Score formula (0-100)

```
0.30 * lighthouse_perf
+ 0.20 * lighthouse_a11y
+ 0.15 * lighthouse_seo
+ 0.10 * visual_qa_score
+ 0.10 * brand_fidelity_score
+ 0.10 * delight_moments_count_normalized
+ 0.05 * voice_cosine
```

Stored as `sites.build_quality_score` in D1.

### Validator (`validate-score-progression.mjs`)

For iteration ≥2, assert `sites.build_quality_score[current] > sites.build_quality_score[prior]` AND each iteration's score change documented in `_iteration_log.json[current].score_delta`.

**Reference:** prompt-improvements brainstorm rec #16 (2026-05-10) — Mission Doctrine AI boost loop = each iteration measurably better.

## Every UI surface (***DUAL-VISION-SCORED — UNIVERSAL — BUILD-BREAKING — see ~/.claude/rules/visual-inspection.md***)

Every UI surface (slice / section / route / iteration) MUST produce a visual receipt and pass dual-vision before "done".

### Tier 1 (FREE)

Playwright a11y tree 6bp + axe-core scan + DOM-walker contrast (computed-bg ancestry).

### Tier 2 (FREE on Max 20x)

Claude Vision (Sonnet 4.6 via OAuth) scores 0-10 with mandatory evidence field per claim.

### Tier 3 (METERED, $0.50/build cap)

GPT Image 2 vision judge fires on:

- Hero / ATF + brand-fidelity vs source
- Final pre-publish 6bp homepage
- Arbitration when Claude<8 OR Claude+a11y disagree

### Consensus

- Both ≥8/10 → ship
- One <8 → remediate via fix-then-rescore loop max 3 rounds
- Code-only review with no visual receipt = build FAIL

### Logging

- Per-build GPT Image 2 vision spend logged to `_iteration_log.json[current].vision_spend_cents`
- D1 `audit_logs(vision_provider, auth_mode, cost_cents, route, breakpoint)`
- Claude Vision `auth_mode` MUST equal `max-oauth` (NEVER `api-key` on macOS dev — see `~/.claude/rules/auth-spawned-claude.md`); api-key fallback alerts

### Validator (`validate-dual-vision.mjs`)

Post-build, asserts:

- `_iteration_log.json[current].dual_vision_scores[]` has entries for every public route at 6bp with `claude_vision.score >= 8`
- Homepage entry has `gpt4o.score >= 8`
- `vision_spend_cents <= 50`

## Every form (***UNIVERSAL — HEAVY/PERFECT VALIDATORS — BUILD-BREAKING***)

Every `<form>` on a generated site MUST enforce strict per-field validation BEFORE network submit. No field is allowed to be loose-typed / empty / unsanitized / out-of-range.

### On submit attempt

1. Compile a `validationErrors[]` array `{ fieldId, fieldLabel, message, kind:'missing'|'format'|'range'|'business' }`
2. If non-empty:
   - Smooth-scroll to the first invalid field (`element.scrollIntoView({behavior:'smooth', block:'center'})`)
   - Focus it, set `aria-invalid="true"`, render an inline error under the input
   - AND render a summary block ABOVE the submit button with an AI-crafted humanized message (Workers AI Llama 3.1 8B with `temperature:0.4, max_tokens:80` summarizing the top 3 errors as one sharp sentence — never a bulleted enumeration; fallback to template `"{N} fields need a fix — start with {firstLabel}: {firstMessage}"` if AI fails)
   - The summary block uses `role="alert" aria-live="assertive"` and is BUILD-BREAKING if missing

### On submit SUCCESS

- Smooth-scroll to the top of the form section (`form.getBoundingClientRect().top + window.scrollY - 80`) with `scrollIntoView({behavior:'smooth', block:'start'})`
- AND a fade / slide entrance animation on the success state

### Validators required per field type

- **email** — RFC 5322 + DNS-shaped check
- **phone** — E.164 + region detection
- **URL** — `new URL()` constructor
- **date** — ISO 8601 + future-only when business requires
- **money** — positive + decimal-place capped
- **postal-code** — regex per region
- **string** — length min + max
- **enum** — membership
- **number** — radix-10 parse + range gate
- **file** — MIME + size + extension allowlist
- **rich-text** — DOMPurify before render

Zero `(value.length === 0)`-only checks.

### Validator (`validate-form-validation.mjs`)

- Grep every `onSubmit=` handler for a `validate*()` or `safeParse()` call returning typed errors
- Grep every form for a `[role='alert']` summary node
- Warn on any `<input>` without a paired error region

**Reference:** brickcitylabor.com booking-form upgrade (2026-05-12) — Brian: *"there should be form validation that scrolls to which one is not filled out … strict, perfect validation on all fields … eloquently leverages a short AI-crafted message about the totality of the validation errors."*
