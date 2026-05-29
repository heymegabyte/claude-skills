# Always

> Numeric stats + first-load animation → see [[cinematic-ui-patterns]] (`<app-rolling-counter>` + `appReveal` mandatory on every projectsites.dev surface).

## Every page
- Keyphrase FIRST
- Title 50-60 chars
- Meta desc 120-156 chars
- One H1 in HTML shell (prerender)
- Canonical
- JSON-LD per page only when accurate; never pad. WebPage is the floor; add Organization/BreadcrumbList/FAQPage/Person/Product/Service ONLY when they describe real entities on the page
- FAQPage only when real Q&A exists on the page. Don't fabricate Q&A to add the schema
- OG 1200x630 ≤100KB **branded card** (NOT scraped photo)
- 2+ internal links, 1+ outbound
- Yoast GREEN
- `<meta name="color-scheme">` present
- DNS-prefetch + preconnect for fonts/analytics
- Font woff2 preload for primary display + body
- Speculation Rules prerender when navigation is the dominant interaction (multi-page funnels, doc sites). Skip on landing pages where analytics integrity matters — prerender double-counts GA4 page-views and can fire conversions before user interaction
- `fetchpriority="high"` on LCP `<img>` AND its preload link

## Every site (REQUIRED)
- `site.webmanifest` with `screenshots[]` 3+ form_factor:"wide"|"narrow", `shortcuts[]`, `share_target`, `file_handlers`, `protocol_handlers` for store listings
- `robots.txt` with explicit Allow/Disallow per AI crawler: GPTBot, ClaudeBot, Claude-User, Claude-SearchBot, PerplexityBot, Google-Extended, CCBot, Bytespider — never default
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
- Every internal asset ref must resolve to a real file in build output (**asset existence gate**)
- PNG >200KB → re-encode AVIF primary (20-30% smaller than WebP, 94% browser support) + WebP fallback + JPEG legacy
- Drop JPEG XL (10% support, Chrome flag-only)
- JS chunks ≤250KB gzip via route code-splitting (React.lazy + manualChunks)

## Every site (interactive)
- Full-featured Lightbox component mounted in Layout
- ALL major image groups wrapped in `[data-gallery="<id>"]` (services/gallery/team/blog hero/testimonials/before-after)
- Bundle MUST contain `data-zoomable` AND `data-gallery` strings — verified by `build_validators.ts`
- Lightbox: Esc/←→/Home/End/Tab focus-trap, swipe (Pointer Events ≥40px), pinch-zoom, double-tap, neighbor preload via `<link rel="preload" as="image">`, role="dialog" + aria-modal + aria-label + aria-live counter, prefers-reduced-motion
- Custom hostname canonical when `primary_hostname` set (not the default `*.projectsites.dev`)
- For local businesses: `tel:` link in nav

## Every clickable entity

### Build-break (must link)
- Every email → `<a href="mailto:user@domain">`
- Every phone → `<a href="tel:+1NNNNNNNNNN">` (E.164, strip formatting)
- Every URL → `<a href>` with `target="_blank" rel="noopener noreferrer"` for external
- Every product/service/feature with a dedicated route → `<Link>` to that route
- Unlinked email or phone in shipped HTML = build fail

### Warnings (visible in console, not build-failing)
- Street address → `<a href="https://www.google.com/maps/dir/?api=1&destination=<urlencoded>">`
- PO Box / no-direction-target → `<a href="https://www.google.com/maps/search/?api=1&query=<urlencoded>">`
- Named institution/org/journal/conference/publication mentioned in body → hyperlinked to canonical URL using the institution name as anchor (never bare "click here" / "learn more")
- Every SKU/EIN/DOI/ISBN/arXiv-id → linked to authoritative registry

### Validator
- `validate-hyperlinks.mjs` greps dist/ HTML:
  - Build-fail on unlinked email regex `[\w.+-]+@[\w-]+\.[\w.-]+`
  - Build-fail on unlinked US phone `(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})`
  - Warn on unlinked address `(P\.?O\.? Box \d+|\d+ [A-Z][a-z]+ (Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr))`
  - Warn on unlinked named institutions in body copy

## Every form
- Turnstile (invisible, `data-appearance="interaction-only"`, NEVER visible widgets)
- Zod
- Resend

## Every historical timeline (***NON-NEGOTIABLE — see [[timeline-authenticity]]***)
- Photos sourced ONLY from Wikimedia Commons / Library of Congress / NPGallery / NPS / NYPL Digital / state historical societies / institution's own archives / verified press wire
- **NEVER** DALL·E, GPT Image, Midjourney, Ideogram, Stable Diffusion, or "evocative" stock photography next to a dated event
- **NEVER** decorative gray boxes or placeholder silhouettes
- Blank entry > faked entry
- Build gate: `validate-timeline-photos.mjs` greps timeline data, rejects `/dall-?e/i|/ai-bank/|/midjourney/i|/ideogram/i|/stable-?diffusion/i|stock-site domains` without a primary-source whitelist
- Required per photo: `image` URL, `imageAlt` (factual, never inventing), `imageCredit` ("Author · Source institution · License · Year")
- Contextual photos (1860 Brady portrait next to 1846 event) MUST disclose the rhyme in alt text ("representative of the era"), never read as literal record

## Every Cmd+K (***UNIVERSAL — NO EXCEPTIONS***)
- Pressing `Meta+K` / `Ctrl+K` opens the AI chat or command palette AND immediately focuses the text input — caret blinking, ready to type, zero extra clicks
- React: `requestAnimationFrame(()=>inputRef.current?.focus({preventScroll:true}))` after open-state flips
- HTML: `autofocus` + post-mount `.focus()`
- When `prefers-reduced-motion`, skip enter animation but STILL focus
- If chat is already open, Cmd+K re-focuses + selects existing text (toggle-friendly)
- Closing via Esc returns focus to the trigger element (a11y)
- Build gate: Playwright test presses `Meta+K`, asserts `document.activeElement` matches the chat/palette input selector — failure = build fail
- Applies to every AI chat overlay, command palette, search modal, and inline composer in every project

## Post-work
- Deploy + test + purge
- Update CLAUDE.md
- Remove dead code/comments/imports
- Stale docs = bugs

## Multi-faceted prompts
Triggers (any one fires the Monitor pattern):
- ≥3 work units
- Numbered phases
- "Implement everything"
- Page-by-page lists
- ANY "rebuild|optimize|enhance|modernize X.com" website-rebuild prompt (multi-faceted by definition with ≥7 independent work units per `[[source-site-enhancement]]` § Parallel-agent playbook)

Behavior:
- MUST fire the Monitor pattern in the **first tool-call message** — parallel `Agent` spawns for independent work, foreground edits in main thread, folded results, single deploy
- Splitting across follow-up prompts is the failure mode the rule exists to prevent
- Follow-up prompt on same project = shortcoming signal → append to `[[monitor-orchestration]]` "Known shortcomings" BEFORE doing the new work
- Full protocol: [[monitor-orchestration]]
- Source-rebuild fan-out: [[source-site-enhancement]] + [[i18n-by-demographics]] + [[15-site-generation/page-set-expansion]]

## Ethics
Frameworks: IEEE EAD, ACM, W3C, UNESCO, EFF, Humane by Design, Ethical OS, Copenhagen Letter, Berkman Klein.

### Principles
- Well-being > engagement/revenue
- Never design for addiction, deception, or control
- **Data agency**: users own data, export/delete/port anytime, privacy by default, minimum collection, encrypt at rest
- **Transparency**: explain AI in plain language, open-source by default
- **Accessibility**: WCAG 2.2 AA non-negotiable (9 new criteria incl. dragging alternatives, focus appearance, consistent help)
- **Disability-first design**
- **Proportionality**: don't use AI where simpler works
- **Accountability**: own mistakes publicly, audit trail
- **Interoperability**: open APIs, standard formats, no lock-in
- **Empowerment**: increase user capability + autonomy, finite experiences, protect vulnerable users

### ADA deadlines (DOJ Title II web rule, extended by Apr 2026 IFR)
- ≥50K pop → **Apr 26 2027**
- <50K / special districts → **Apr 26 2028**
- Technical standard = WCAG 2.1 AA
- Separate HHS Section 504 deadline: **May 2026** for healthcare federal-fund recipients

### Pre-ship harm scan (Ethical OS 8 zones + OWASP 2025)
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

## End Every Response With This Report
Render as markdown in chat, NOT via bash. After EVERY response, render directly in text output as styled markdown:

```
---
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
