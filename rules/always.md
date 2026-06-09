---
name: "always"
priority: 1
pack: "core"
triggers: []
paths:
  - "*"
---

# Always

> Numeric stats + first-load animation → `cinematic-ui-patterns.md` (`<app-rolling-counter>` + `appReveal` mandatory on every projectsites.dev surface).

## Every page

- Keyphrase FIRST
- Title 50-60 chars
- Meta desc 120-156 chars
- One H1 in HTML shell (prerender)
- Canonical
- JSON-LD per page only when accurate. WebPage is floor; add Organization/BreadcrumbList/FAQPage/Person/Product/Service ONLY when describing real entities. Never pad.
- FAQPage only when real Q&A exists. Don't fabricate.
- OG 1200×630 ≤100KB **branded card** (NOT scraped photo)
- 2+ internal links, 1+ outbound
- Yoast GREEN
- `<meta name="color-scheme">` present
- DNS-prefetch + preconnect for fonts/analytics
- Font woff2 preload for primary display + body
- Speculation Rules prerender when navigation dominant (multi-page funnels, doc sites). Skip on landing where analytics integrity matters — prerender double-counts GA4 pageviews + can fire conversions before user interaction
- `fetchpriority="high"` on LCP `<img>` AND its preload link

## Every site (REQUIRED)

- `site.webmanifest` w/ `screenshots[]` 3+ form_factor:"wide"|"narrow", `shortcuts[]`, `share_target`, `file_handlers`, `protocol_handlers` for store listings
- `robots.txt` — split AI crawlers by purpose, never blanket-block (blanket = removed from AI answers entirely):
  - **Allow (search/retrieval — keeps you cited in ChatGPT/Perplexity/AI Overviews)**: `OAI-SearchBot`, `Claude-SearchBot`, `Claude-User`, `PerplexityBot`
  - **Disallow (training-only — opt out of model training)**: `GPTBot`, `ClaudeBot`, `Google-Extended`, `Applebot-Extended`, `CCBot`, `Bytespider`
  - Explicit `Allow`/`Disallow` per UA — never default
- `humans.txt`
- `sitemap.xml` (every `<url>` has `<lastmod>`)
- `browserconfig.xml`
- `.well-known/security.txt`
- `favicon.ico` + `favicon-16x16.png` + `favicon-32x32.png`
- `apple-touch-icon.png` (180×180)
- OG image
- Kill-switch service worker (unregisters + clears caches)

### Optional

- `llms.txt` — <0.3% adoption, no major LLM crawler requests it. DX-only for Cursor/Claude Code, **not a build gate**

### Asset rules

- Every internal asset ref must resolve to real file in build (**asset existence gate**)
- PNG >200KB → re-encode AVIF primary (20-30% smaller than WebP, 94% browser support) + WebP fallback + JPEG legacy
- Drop JPEG XL (10% support, Chrome flag-only)
- JS chunks ≤250KB gzip via route code-splitting (React.lazy + manualChunks)

## Every site (interactive)

- Full-featured Lightbox component mounted in Layout
- ALL major image groups wrapped in `[data-gallery="<id>"]` (services/gallery/team/blog hero/testimonials/before-after)
- Bundle MUST contain `data-zoomable` AND `data-gallery` strings — verified by `build_validators.ts`
- Lightbox: Esc/←→/Home/End/Tab focus-trap, swipe (Pointer Events ≥40px), pinch-zoom, double-tap, neighbor preload via `<link rel="preload" as="image">`, role="dialog" + aria-modal + aria-label + aria-live counter, `prefers-reduced-motion`
- Custom hostname canonical when `primary_hostname` set (not default `*.projectsites.dev`)
- For local businesses: `tel:` link in nav

## Every clickable entity

### Build-break (must link)

- Email → `<a href="mailto:user@domain">`
- Phone → `<a href="tel:+1NNNNNNNNNN">` (E.164, strip formatting)
- URL → `<a href>` w/ `target="_blank" rel="noopener noreferrer"` for external
- Product/service/feature w/ dedicated route → `<Link>` to that route
- Unlinked email or phone in shipped HTML = build fail

### Warnings (visible in console, not build-failing)

- Street address → `<a href="https://www.google.com/maps/dir/?api=1&destination=<urlencoded>">`
- PO Box / no-direction-target → `<a href="https://www.google.com/maps/search/?api=1&query=<urlencoded>">`
- Named institution/org/journal/conference/publication mentioned in body → hyperlinked to canonical URL using institution name as anchor (never "click here" / "learn more")
- SKU/EIN/DOI/ISBN/arXiv-id → linked to authoritative registry

### Validator

- `validate-hyperlinks.mjs` greps dist/ HTML:
  - Build-fail on unlinked email regex `[\w.+-]+@[\w-]+\.[\w.-]+`
  - Build-fail on unlinked US phone `(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})`
  - Warn on unlinked address `(P\.?O\.? Box \d+|\d+ [A-Z][a-z]+ (Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr))`
  - Warn on unlinked named institutions in body copy

## Every form

- Turnstile (invisible, `data-appearance="interaction-only"`, NEVER visible widgets)
- Zod
- Resend — every send path passes the `email-deliverability.md` gate (SPF+DKIM+DMARC, RFC 8058 one-click unsub on marketing, spam <0.3%) or mail bounces at SMTP silently

## Every historical timeline (`timeline-authenticity.md`)

- Photos ONLY from Wikimedia Commons / Library of Congress / NPGallery / NPS / NYPL Digital / state historical societies / institution's archives / verified press wire
- NEVER DALL·E, GPT Image, Midjourney, Ideogram, Stable Diffusion, "evocative" stock next to dated event
- NEVER decorative gray boxes or placeholder silhouettes
- Blank entry > faked entry
- Build gate: `validate-timeline-photos.mjs` rejects `/dall-?e/i|/ai-bank/|/midjourney/i|/ideogram/i|/stable-?diffusion/i|stock-site domains` without primary-source whitelist
- Required per photo: `image` URL, `imageAlt` (factual, never inventing), `imageCredit` ("Author · Source institution · License · Year")
- Contextual photos (1860 Brady portrait next to 1846 event) MUST disclose rhyme in alt ("representative of the era")

## Every Cmd+K (UNIVERSAL)

- `Meta+K` / `Ctrl+K` opens AI chat or command palette AND immediately focuses text input — caret blinking, zero extra clicks
- React: `requestAnimationFrame(() => inputRef.current?.focus({preventScroll:true}))` after open-state flips
- HTML: `autofocus` + post-mount `.focus()`
- `prefers-reduced-motion` → skip enter animation but STILL focus
- If already open, Cmd+K re-focuses + selects existing text
- Esc closes → returns focus to trigger element (a11y)
- Build gate: Playwright presses `Meta+K`, asserts `document.activeElement` matches chat/palette input — failure = build fail

## Post-work

- Deploy + test + purge
- Update CLAUDE.md
- Remove dead code/comments/imports
- Stale docs = bugs

## Multi-faceted prompts

Triggers (any one fires Monitor pattern):

- ≥3 work units
- Numbered phases
- "Implement everything"
- Page-by-page lists
- ANY "rebuild|optimize|enhance|modernize X.com" website-rebuild prompt (multi-faceted by definition w/ ≥7 independent work units per `source-site-enhancement.md` § Parallel-agent playbook)

Behavior:

- MUST fire Monitor in **first tool-call message** — parallel `Agent` spawns for independent work, foreground edits in main thread, folded results, single deploy
- Splitting across follow-up prompts = failure mode this prevents
- Follow-up on same project = shortcoming signal → append to `monitor-orchestration.md` "Known shortcomings" BEFORE doing new work
- Full: `monitor-orchestration.md`
- Source-rebuild fan-out: `source-site-enhancement.md` + `i18n-by-demographics.md` + `15-site-generation/page-set-expansion.md`

## Ethics

Frameworks: IEEE EAD, ACM, W3C, UNESCO, EFF, Humane by Design, Ethical OS, Copenhagen Letter, Berkman Klein.

### Principles

- Well-being > engagement/revenue
- Never design for addiction, deception, or control
- **Data agency**: users own data, export/delete/port anytime, privacy by default, minimum collection, encrypt at rest
- **Transparency**: explain AI in plain language, open-source by default
- **Accessibility**: WCAG 2.2 AA non-negotiable
- **Disability-first design**
- **Proportionality**: don't use AI where simpler works
- **Accountability**: own mistakes publicly, audit trail
- **Interoperability**: open APIs, standard formats, no lock-in
- **Empowerment**: increase user capability + autonomy, finite experiences, protect vulnerable users

### ADA deadlines (DOJ Title II, extended Apr 2026 IFR)

- ≥50K pop → Apr 26 2027
- <50K / special districts → Apr 26 2028
- Standard = WCAG 2.1 AA
- HHS Section 504: May 2026 healthcare federal-fund

### EU — European Accessibility Act (EAA, enforcement live Jun 28 2025)

- Applies to private-sector e-commerce / banking / telecoms / media selling into the EU
- Standard = EN 301 549 (≈ WCAG 2.1 AA); micro-enterprises (<10 staff, <€2M rev) exempt
- Fines up to €3M or 4% of annual revenue per member state — gate any EU-facing build

### Pre-ship harm scan (Ethical OS 8 zones + OWASP 2025 + LLM Top 10)

- Disinformation
- Addiction
- Inequality
- Bias
- Surveillance
- Data exploitation
- Trust gaps
- Bad actors
- Supply chain (#3)
- Exceptional conditions (#10)
- Prompt injection / excessive agency (OWASP LLM Top 10 — any AI surface per `ai-agent-security.md`)

## End every response with this report

Render as markdown in chat, NOT via bash:

```
**⚡ {project}** · `{branch}` · {time}

**Changes:**
- {change 1}
- {change 2}
- ...

**Next:** → {step} — {url}

**Recs:**
- ◆ {rec 1}
- ◆ {rec 2}

**Config:** {list each ~/.agentskills/ and ~/.claude/ file edited + brief summary; "none" if nothing}
**Repos:** {list each non-current repo modified + brief summary; "none" if nothing}
**Links:** [Repo]({url}) · [CF]({url}) · [Skills](https://github.com/heymegabyte/claude-skills)
```

- Config/Repos lines ALWAYS present (print "none" if no changes)
- Every URL: FULL deeplinked
- Also run `source ~/.claude/hooks/prompt-report.sh && emdash_report` via Bash (bg)
