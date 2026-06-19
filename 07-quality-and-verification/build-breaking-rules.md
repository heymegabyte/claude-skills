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

Every rule is a HARD build-gate. Failure blocks deploy.

## Every clickable entity (***UNIVERSAL — NO EXCEPTIONS — supersedes prior partial rules***)

### Linking rules

- Every email → `<a href="mailto:user@domain">`
- Every phone → `<a href="tel:+1NNNNNNNNNN">` (E.164, strip formatting from href, render formatted as text)
- Every external URL → `<a href>` with `target="_blank" rel="noopener noreferrer"`
- Every named institution/org/journal/conference/publication → linked to canonical URL, institution name as anchor (NEVER "click here" / "learn more")
- Every product/service/feature with a dedicated route → `<Link>` to route
- Every SKU/EIN/DOI/ISBN/arXiv-id → linked to registry
- Every social handle → profile URL
- Plain-text contact info = build fail

### Validator (`validate-hyperlinks.mjs`)

Greps `dist/` HTML for unlinked:

- Email regex `[\w.+-]+@[\w-]+\.[\w.-]+`
- US phone `(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})`
- Address `(P\.?O\.? Box \d+|\d+ [A-Z][a-z]+ (Street|St|Avenue|Ave|Road|Rd|Blvd|Lane|Ln|Drive|Dr))`

Any match outside an `<a>` ancestor = fail.

### Render

Use helper components `<MailLink>`, `<TelLink>`, `<AddressBlock>` from template — never hand-code `<a href="mailto:...">` ad-hoc.

## Every address (***UNIVERSAL***)

- Every street address wrapped in `<a href="https://www.google.com/maps/dir/?api=1&destination=<urlencoded>" rel="noopener">`
- PO Box / no-direction-target uses `…/maps/search/?api=1&query=<urlencoded>`
- No exceptions

## Every outbound link (***HEAD-200 VALIDATION GATE — UNIVERSAL — BUILD-BREAKING***)

Every external `<a href>` MUST be HEAD-200 verified pre-deploy.

### Build gate (`validate-outbound-links.mjs`)

- Post-build, parse all dist HTML for external `<a href>`
- Run HEAD request with realistic UA (per `rules/fetch-defaults.md`); follow redirects ≤5
- Accept 200 / 206 / 301 / 302 / 303 / 307 / 308; FAIL on 404 / 410 / 451 / 5xx
- Allow GET fallback when HEAD returns 405
- Cache results in `.link-cache.json` (24h TTL)
- 404 link → research pipeline finds canonical replacement (Exa / Tavily / Perplexity) BEFORE marking done; never ship a known-404 outbound link

**Reference incident:** lone-mountain-global-3 (2026-05-01) WHO factsheet 404 drove this rule.

## Every internal link (***ZERO BROKEN INTERNAL LINKS — UNIVERSAL — BUILD-BREAKING***)

Every `<Link to="/...">`, `href="/..."`, and string-literal route reference MUST point to a real route or real corpus entry.

### Rules

- Hardcoded preview tiles MUST derive from actual data file (`corpus.slice(0,N).map(...)`) — never hand-author slug strings
- SPA routes that 200 with a "post not found" component still count as broken

### Build gate (`validate-links.mjs`)

- Walks all `.ts` / `.tsx` source; extracts every `/blog/<slug>`, `to="/route"`, `/images/...` string literal
- Asserts each against corpus data + known-routes set + `public/` filesystem
- Wired into `package.json` build script as a pre-tsc gate
- `KNOWN_ROUTES` MUST be auto-derived from `src/app.tsx` AST (every `<Route path>` AND every `<Redirect>`) via `scripts/generate-known-routes.mjs` — hand-maintained allowlists go stale silently
- Any hand-authored ID/slug/route reference that depends on matching a separate data file is forbidden — derive from the data or fail the build

**Reference incident:** njsk.org 2026-05-02 — hand-authored slugs never existed in corpus; `KNOWN_ROUTES` lacked 10 Squarespace `<Redirect>` paths causing false-positives.

## Every image (***ZERO BROKEN IMAGES — UNIVERSAL***)

- Every `<img src>`, CSS `background-image`, `<source srcset>` MUST resolve to a 200-OK file in build output OR a whitelisted external host (`cdn.*` | `images.pexels.com` | `logo.dev` | `wikipedia.org`)
- Absolute `https://your-site.com/foo.jpg` refs included
- Build gate: post-build crawl every page, fetch every image URL — any 404 = fail with diagnostic showing source HTML location
- Media acquisition walker MUST capture hero backgrounds on /contact + /about + /team + /services CSS `background-image` + section-bg + slider-bg, not just inline `<img>` tags

**Reference incident:** lone-mountain-global-3 `/taryn-albania.jpg` 404 (2026-05-01) drove this rule.

## Every JSX text + data-array (***NO HTML ENTITIES — UNIVERSAL — BUILD-BREAKING***)

Never write `&apos;` / `&middot;` / `&amp;` / `&ldquo;` / `&rdquo;` / `&hellip;` / `&ndash;` / `&mdash;` / `&nbsp;` / `&quot;` / `&#\d+;` in `.tsx` / `.jsx` / `.ts` source. JSX entity decoding fires ONLY for JSX text children, NEVER for JS string literals in `{variable}` interpolation or data arrays — misuse renders literal entity strings.

### Use raw Unicode everywhere

- `'` (U+2019 right single quote)
- `·` (U+00B7 middle dot)
- `&` (ampersand)
- `"` `"` (U+201C/U+201D curly quotes)
- `…` (U+2026 ellipsis)
- `–` `—` (U+2013 en dash / U+2014 em dash)
- ` ` (U+00A0 nbsp)

### Validator (`validate-html-entities.mjs`)

Grep `src/**/*.{ts,tsx,jsx}` AND `dist/**/*.html` for entity literals outside `<code>` / `<pre>` ancestors AND outside `@example` JSDoc; FAIL on any match.

**Reference incident:** njsk.org 2026-05-02 — `we-need.tsx` data array had `text: "person&apos;s gift"` rendering as literal entity in production.

## Every page (***SINGLE VISIBLE H1 — UNIVERSAL — BUILD-BREAKING***)

- Every route MUST contain EXACTLY ONE `<h1>` element that is visibly rendered
- Hidden h1 (`class="sr-only"`, `display:none`, `visibility:hidden`, `opacity:0`, `position:absolute;left:-9999px`) = fail

### Validator (`validate-h1.mjs`)

- Post-build, parse each dist HTML; count `<h1>`; check class/style for hiding patterns
- Zero h1 = fail | >1 h1 = fail | hidden h1 = fail

**Reference incident:** lonemountainglobal.projectsites.dev 2026-05-07 — sr-only h1 caused Yoast 38/100.

## Every page (***SEMANTIC LANDMARKS — UNIVERSAL — BUILD-BREAKING***)

Every route MUST emit exactly once: `<header>`, `<nav aria-label="Primary">`, `<main id="main" tabIndex={-1}>`, `<footer>`. Multiple `<nav>` OK only if each has unique `aria-label`. Layout component owns these wrappers.

### Validator (`validate-landmarks.mjs`)

Parse dist HTML; assert `header, nav, main[id=main], footer` present; header + footer count >1 OR missing/unlabeled main = fail.

**Reference incident:** lonemountainglobal — `main` missing `id="main"` broke SkipLink target.

## Every page (***SKIP-LINK TARGET — UNIVERSAL — BUILD-BREAKING***)

- Every route MUST have `<a href="#main">` as the FIRST focusable element; MUST be visible on `:focus` (sr-only at rest is OK)
- Page MUST contain exactly one `[id="main"]`

### Validator (`validate-skiplink.mjs`)

Assert first focusable is `<a href="#main">` AND `[id="main"]` exists exactly once; missing target or wrong order = fail.

## Every page rendering NAP (***ADDRESS-TAG REQUIRED — UNIVERSAL — BUILD-BREAKING***)

Every visible street address MUST be wrapped in semantic `<address>` AND linked per the address rule above. Plain `<p>` or `<li>` with recognizable address outside `<address>` = fail.

### Validator (`validate-address-tag.mjs`)

Regex `(P\.?O\.? Box \d+|\d+ [A-Z][a-z]+ (Street|St|Avenue|Ave|Road|Rd|Blvd|Lane|Ln|Drive|Dr))` — match outside `<address>` ancestor = fail.

## Every site (***INTERNAL LINK MINIMUM — UNIVERSAL — BUILD-BREAKING***)

Homepage MUST contain ≥5 unique internal links inside `<main>` (excluding header/footer nav; excludes `/static/`, `/images/`, `/videos/`, `/api/`, `/assets/`).

### Validator (`validate-internal-links.mjs`)

Parse dist `index.html`; collect `<a href>` inside `<main>`; dedupe, count, fail if <5.

**Reference incident:** lonemountainglobal homepage had only header nav + 1 CTA; audit scored 4/10 on internal linking.

## Every JSON-LD render (***XSS ESCAPE — UNIVERSAL — BUILD-BREAKING — SECURITY***)

Every `<script type="application/ld+json">` payload MUST escape `<`, `>`, `&`, ` `, ` `, and `</script>` per OWASP. Raw `JSON.stringify(data)` in `dangerouslySetInnerHTML` is a stored-XSS sink.

### Required escape

```
.replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026').replace(/ /g,'\\u2028').replace(/ /g,'\\u2029')
```

Use template `<JsonLd>` component with escape baked in — never write `dangerouslySetInnerHTML={{ __html: JSON.stringify(...) }}` ad-hoc.

### Validator (`validate-jsonld-escape.mjs`)

Grep `src/**/*.{ts,tsx}` for `dangerouslySetInnerHTML.*JSON\.stringify` outside canonical `<JsonLd>` component = fail.

## Every page depth>1 (***BREADCRUMBS + JSON-LD — UNIVERSAL — BUILD-BREAKING***)

- Every route at depth>1 (`/blog/<slug>`, `/team/<slug>`, `/services/seo-audit`) MUST render a visible `<nav aria-label="Breadcrumb"><ol>` AND a `BreadcrumbList` JSON-LD with positions matching visible crumb labels
- Top-level routes (`/`, `/about`, `/contact`) skip breadcrumbs

### Validator (`validate-breadcrumbs.mjs`)

For each dist HTML at depth>1, assert `nav[aria-label="Breadcrumb"]` exists AND `@type=BreadcrumbList` JSON-LD exists with `itemListElement.length === visibleCrumbs.length`; mismatch = fail.

## Every rendered text element (***WCAG-AA AGAINST ACTUALLY-RENDERED BACKGROUND — DOM WALKER — UNIVERSAL — BUILD-BREAKING***)

Design-token contrast checks are NOT sufficient — they miss computed-background overrides. The DOM walker is the authoritative gate.

### Validator (`validate-rendered-contrast.mjs`)

- Walks actual rendered DOM via Playwright at 6 breakpoints (375/390/768/1024/1280/1920)
- For every text node computes EFFECTIVE background by ancestry traversal (`getComputedStyle(el).backgroundColor` falling back through parent chain), accounting for gradient mid-stops, opacity stacking, `backdrop-filter`
- Computes WCAG 2.x relative-luminance ratio between resolved text color and resolved background

### Fail conditions

**FAIL on ratio <4.5:1 (normal text) OR <3:1 (large text ≥18pt or ≥14pt bold).**

- Skip `[aria-hidden="true"]` decorative text; skip `clip-path` sr-only nodes; skip `pointer-events:none AND visibility:hidden`
- `<a>` text same as body text — no link-color exemption
- Gradient backgrounds tested at both endpoints AND midpoint — any endpoint fail = fail

### Report format

Must include `{selector, text_preview, computed_text_color, computed_bg_color, ratio, threshold, breakpoint, ancestry_path}`.

**Reference incident:** lonemountainglobal.projectsites.dev (2026-05-10) — white-on-white footer text; tokens passed but a section-level `background:#fff` override caused failure.

Companion: `validate-contrast.mjs` (token check) stays as fast pre-flight; DOM walker is authoritative gate.

## Every build (***CONVERGENCE LOOP #1 — ZERO-RECOMMENDATIONS GATE — UNIVERSAL — BUILD-BREAKING***)

Final iteration MUST exit with `_recommendations.json.length === 0`; non-zero = build FAIL.

### Pipeline

1. Recommendations sweep → auto-implement ≥0.8 confidence + low-risk → propose 0.5-0.8 → reject <0.5 → re-sweep → exit when empty OR `iteration_count >= MAX_ITER`

### Validator (`validate-zero-recommendations.mjs`)

Assert final `_recommendations.json` is `[]` OR `iteration_count >= MAX_ITER` AND remaining items carry `deferred_reason: "budget_exhausted"|"scope_out"`.

## Every build (***CONVERGENCE LOOP #2 — DELTA-DRIVEN ITERATION — UNIVERSAL — BUILD-BREAKING***)

- Every iteration ≥2 MUST apply delta to prior dist — NEVER rebuild from scratch
- Iteration ≥2 cost SHOULD be ≤15% of iteration 1 cost (LLM tokens + R2 PUTs + GPT Image 1.5 calls + CDN purges)
- `_diff.json` = (prior_dist, this_iteration_recommendations[]); only changed files regenerated + uploaded to R2; D1 `sites.iteration_count++`

### Validator (`validate-delta-iteration.mjs`)

For iteration ≥2, assert `_diff.json.changed_files.length` < 50% of `dist/**/*` total AND build duration ≤15min (vs iter-1 ~35min).

## Every build (***CONVERGENCE LOOP #3 — SELF-CRITIQUE PASS BEFORE DECLARING DONE — UNIVERSAL — BUILD-BREAKING***)

Before `status='published'`, orchestrator MUST run self-critique with 3 distinct skeptical reviewers producing `_critique.json`:

1. **Brand-fidelity reviewer** — source site vs generic template
2. **Accessibility auditor** — WCAG 2.2 AA actual failures, not just axe-core
3. **Brian-voice reviewer** — anti-slop sharpness vs corporate drift

Each reviewer: score 0-10 + ≥3 specific failures. All three MUST score ≥8 to ship.

### Validator (`validate-self-critique.mjs`)

Assert `_critique.json` exists + 3 reviewer entries + all scores ≥8 OR failures addressed in subsequent recommendations.

## Every build (***CONVERGENCE LOOP #4 — BUILD-QUALITY-SCORE PROGRESSION — UNIVERSAL — BUILD-BREAKING***)

Every iteration ≥2 MUST produce a build-quality-score strictly greater than the prior iteration; non-improvement = wasted iteration = build FAIL.

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

For iteration ≥2, assert `sites.build_quality_score[current] > sites.build_quality_score[prior]` AND score delta documented in `_iteration_log.json[current].score_delta`.

## Every UI surface (***DUAL-VISION-SCORED — UNIVERSAL — BUILD-BREAKING***)

Every UI surface (slice / section / route / iteration) MUST produce a visual receipt and pass dual-vision before "done".

### Tier 1 (FREE)

Playwright a11y tree 6bp + axe-core scan + DOM-walker contrast.

### Tier 2 (FREE on Max 20x)

Claude Vision (Sonnet 4.6 via OAuth) scores 0-10 with mandatory evidence field per claim.

### Tier 3 (METERED, $0.50/build cap)

GPT Image 2 vision fires on: hero/ATF + brand-fidelity vs source; final pre-publish 6bp homepage; arbitration when Claude <8 OR Claude+a11y disagree.

### Consensus

- Both ≥8/10 → ship; one <8 → remediate via fix-then-rescore loop max 3 rounds
- Code-only review with no visual receipt = build FAIL

### Logging

- GPT Image 2 spend logged to `_iteration_log.json[current].vision_spend_cents`
- D1 `audit_logs(vision_provider, auth_mode, cost_cents, route, breakpoint)`
- Claude Vision `auth_mode` MUST equal `max-oauth` (NEVER `api-key` on macOS dev — see `~/.claude/rules/auth-spawned-claude.md`); api-key fallback alerts

### Validator (`validate-dual-vision.mjs`)

Assert `_iteration_log.json[current].dual_vision_scores[]` has entries for every public route at 6bp with `claude_vision.score >= 8`; homepage entry has `gpt4o.score >= 8`; `vision_spend_cents <= 50`.

## Every form (***UNIVERSAL — HEAVY/PERFECT VALIDATORS — BUILD-BREAKING***)

Every `<form>` MUST enforce strict per-field validation BEFORE network submit.

### On submit attempt

1. Compile `validationErrors[]` array `{ fieldId, fieldLabel, message, kind:'missing'|'format'|'range'|'business' }`
2. If non-empty: smooth-scroll to first invalid field (`element.scrollIntoView({behavior:'smooth', block:'center'})`); focus it; set `aria-invalid="true"`; render inline error under input
3. AND render a summary block ABOVE submit button with AI-crafted message (Workers AI Llama 3.1 8B, `temperature:0.4, max_tokens:80`, summarizing top 3 errors as one sharp sentence — not bulleted; fallback: `"{N} fields need a fix — start with {firstLabel}: {firstMessage}"`)
4. Summary block MUST use `role="alert" aria-live="assertive"` — absence = BUILD-BREAKING

### On submit SUCCESS

Smooth-scroll to top of form section + fade/slide entrance animation on success state.

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

- Grep every `onSubmit=` handler for `validate*()` or `safeParse()` call returning typed errors
- Grep every form for `[role='alert']` summary node
- Warn on any `<input>` without a paired error region

**Reference:** brickcitylabor.com booking-form upgrade (2026-05-12) — strict, perfect validation on all fields with AI-crafted error summary.
