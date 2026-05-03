---
name: "brand-and-content-system"
description: "Extract real brands (Wayback for rebuilds). Copy system, headline/CTA rules, trust surfaces, legal pages, SEO+structured data, anti-AI-slop, microcopy, DESIGN.md, W3C DTCG tokens, pSEO 5 types, GEO/AI search."
metadata:
  version: "2.1.0"
  updated: "2026-04-23"
license: "Rutgers"
compatibility:
  claude-code: ">=2.0.0"
  agentskills: ">=1.0.0"
submodules:
  - email-templates.md
  - social-automation.md
  - seo-and-keywords.md
  - documentation-and-codebase-hygiene.md
  - per-route-metadata.md
  - grammar-audit.md
  - build-breaking-rules.md
---

# 09 — Brand and Content System

Submodules: email-templates (branded HTML via Resend), social-automation (Postiz on Coolify), seo-and-keywords (per-page targeting, Yoast, schema), documentation-and-codebase-hygiene (README/CLAUDE.md/JSDoc sync), per-route-metadata (RouteMetadata interface, hydrated head template, per-route Satori OG cards, generous internal linking ≥5/page, publication-item schema), grammar-audit (final GPT-4o-mini corrective pass — typos/agreement/Oxford comma without rewriting voice).

## Brian's Brand Voice
Slogans: "Open-Source Wizardry. 100% Wizardry. 0% Robes." / "Often imitated, never duplicated." Newsletter: "Lab Insights Journal". Handle: @HeyMegabyte. Email: hey@megabyte.space / brian@megabyte.space. Tone: professional but irreverent, "Hey" not "Hi", first-person Megabyte Labs. Always "cross-platform"+"open-source". Install Doctor: "single command"/"one-liner". Hero: "[Topic] **Innovation**". Footer CTA: "Let's Talk". Rates: $140/hr ($70 nonprofit), $100/mo WordPress. Social: all platforms, "Megabyte Minis" YouTube, Dev.to, Patreon.

Psychology: reciprocity (teach), social proof near CTAs, authority (depth/numbers), unity ("we/us"), Peak-End Rule.

## Brand Extraction (Rebuilds)

1. Screenshot existing (Wayback if down). Extract logo/colors/fonts/tone. Never discard equity.
2. **Color extraction (NON-NEGOTIABLE):** Screenshot with Playwright, GPT-4o extracts hex (logo priority), cross-ref logo, build palette, validate WCAG AA. NEVER invent, NEVER use Emdash defaults for clients, NEVER infer from category.

2b. **Color extraction second-pass verification (***UNIVERSAL — BUILD-BREAKING — pre-deploy***):** GPT-4o vision color extraction is NOT trusted blind. After GPT-4o returns `{primary, secondary, accent}` hex, run deterministic verification: (a) load logo PNG via sharp, sample dominant chroma via k-means k=5 ignoring transparent + near-white/near-black pixels (returns top-3 cluster centroids in HSL), (b) for EACH returned color, compute minimum HSL hue-distance to any of top-3 logo chromas — if `min_hue_distance > 30°` AND saturation>0.2, FAIL with diagnostic showing claimed hex vs logo dominant trio, (c) re-run GPT-4o with corrective prompt naming the specific top-3 logo chromas and demanding `primary` be derived from one of them. Validator (`validate-color-from-logo.mjs`): runs in `build_validators.ts` between brand-research and template-pick. Reference incident: lone-mountain-global-3 (2026-05-02) shipped green primary that was absent from the burgundy/navy/cream logo — GPT-4o hallucinated a "fresh nonprofit" palette instead of reading pixels. NEVER ship a primary color that fails hue-distance check.
3. **Logo-luminance + source-theme drives theme (NON-NEGOTIABLE — gates template selection):** Two-signal rule. Signal A = logo dominant-color luminance (WCAG formula). Signal B = source-site dominant background luminance (Playwright screenshot of `body` background — average pixel luminance). Decision: if BOTH signals agree (logo dark + source bg light → `theme="light"`; logo light + source bg dark → `theme="dark"`), match them. If they disagree, source-site theme wins UNLESS source design score <7/10 (then logo wins). When source site is high-quality (visual quality ≥7/10 via GPT-4o detail:low review of homepage screenshot), ***match the source theme verbatim*** — "their original is already great" trumps "we default to dark". Set theme BEFORE template selection. Reject any palette where logo-on-background contrast <4.5:1 (WCAG AA). Logo legibility outranks aesthetic preference. CLAUDE.md "Dark-first" applies to accent-rich Emdash/SaaS brands, NOT to (a) logo-driven non-profit/serif clients (njsk.org 2026-04-30 — dark burgundy wordmark invisible on dark BG), (b) high-quality light-themed source brands (lonemountainglobal.com 2026-04-30 — original is a polished light-theme design with mountain splash + serif logo; rebuild MUST stay light to preserve brand integrity). Confidence 0.97.

3b. **Logo-vs-container contrast (***UNIVERSAL — BUILD-BREAKING — header AND footer + every render***):** Every logo render (header, footer, hero, modal, splash, mobile menu, sidebar) MUST contrast its container background by ≥4.5:1 measured on the logo's dominant chroma (NOT transparent pixels). Forbidden pairings: white-text-logo on white/cream bg|dark-text-logo on dark/navy bg|low-saturation-logo on same-hue bg. Resolution: header AND footer themes CHOSEN AFTER logo luminance scan. When dual-theme site (light header + dark footer or vice versa) needs the SAME logo, ship TWO files (`brand-mark-light.svg` for dark bg, `brand-mark-dark.svg` for light bg) and CSS `<picture><source media>` swaps based on container — automate via skill 12 logo-variant-generator (Real-ESRGAN inversion or `magick -channel RGB -negate` for monochrome marks; for color logos with embedded text, generate inverted via DALL-E with prompt "same logo on transparent bg with text inverted to <opposite-luminance>"). Validator (`validate-logo-contrast.mjs` — runs in build_validators.ts): GPT-4o samples logo bbox + container computed bg at 6bp via Playwright screenshot+pixel sampling, fails if contrast<4.5:1. The lone-mountain-global-3 (2026-05-01) header rendered white-text-logo on white bg (invisible) AND footer rendered dark-text-logo on dark bg (invisible) — both invisible — drove this rule. Cross-ref always.md "Every logo render" + skill 10 hero-scrim mandate.

3a. **Brand-element extraction (***LOGO IS A GOLD MINE — extract its DNA, don't just copy the file***):** When source logo is found, single GPT-4o vision call returns `{font_family_guess, suggested_heading_font, suggested_body_font, font_weight, letterspacing, has_icon_mark, icon_mark_description, icon_mark_dominant_color, decorative_motif_description, motif_extractable (bool)}`. Apply: (i) matched Google Font becomes `--font-heading` site-wide — same hand drew the logo and the headlines; (ii) when `motif_extractable=true` (mountain silhouette, wave, leaf, geometric mark embedded in logo), crop the icon-only region (`magick logo.png -alpha extract -trim +repage`), upscale 2-4x via Real-ESRGAN/DALL-E variation, save as `assets/brand-splash.png` (full-bleed hero background) + `assets/brand-mark.png` (favicon icon source). The lonemountainglobal.com `mountain-background-splash.png` extracted from the wordmark logo is the canonical example — combined with the matched logo font, the hero feels designed by the same studio. See skill 12/15 media-acquisition.md "Background-asset-from-logo extraction".

3c. **Logo singularity (***UNIVERSAL — BUILD-BREAKING — exactly ONE logo file rendered per container***):** Every logo container (header, footer, hero, modal, splash, mobile menu, sidebar) renders EXACTLY ONE logo asset — never composite two logo sources side-by-side, never stack icon-mark + wordmark as separate `<img>` tags, never render `apple-touch-icon.png` next to `logo.svg` in the same container. When the source logo is "icon-mark + wordmark" combined, ship ONE pre-composited file (`brand-logo-horizontal.svg` for header, `brand-logo-stacked.svg` for footer/mobile if needed) — composition happens at asset-prep time via `magick logo-mark.png logo-wordmark.png +append`, NOT at render time via two adjacent DOM nodes. Validator (`validate-logo-singularity.mjs`): parses dist/ HTML, for every element matching `[data-logo], header [class*=logo], footer [class*=logo]`, counts descendant `<img>` + inline `<svg>` nodes — if count>1 in the same logo container, FAIL with diagnostic showing both source URLs. Reference incident: lone-mountain-global-3 (2026-05-02) header rendered the icon-mark PNG AND the wordmark PNG as two adjacent `<img>` tags — the result looked like two separate logos stacked next to each other instead of one cohesive brand. NEVER let the orchestrator render multiple logo sources in the same container.
4. **Logo (NON-NEGOTIABLE):** Every project needs premium logo. See Skill 12 for full process.
5. Audit: logo found+rated>=7/10+works 16-512px, colors EXTRACTED, palette WCAG AA, typography+tone+messages identified.

## Brand Extraction from Physical Assets (***LOCAL BUSINESS — NO WEBSITE***)

Most local businesses have no website or a terrible one. Brand identity lives in the physical world — signage, storefront, business cards, uniforms, vehicle wraps. Extract from these:

**Signage/Storefront (Google Street View + Places Photos):**
1. Google Street View Static API (`GOOGLE_MAPS_API_KEY`): `https://maps.googleapis.com/maps/api/streetview?size=1200x800&location={lat},{lng}&source=outdoor` — captures storefront/signage
2. Google Places photos: filter for `types: ["exterior", "storefront"]` — business owner uploads often show signage
3. GPT-4o vision on storefront photo: extract sign text (business name font), sign colors (exact hex), logo if visible, building color scheme, awning/accent colors
4. Prompt: "Extract brand identity from this business storefront photo. Return JSON: {sign_text, sign_font_style (serif/sans/script/decorative/hand-lettered), primary_color (hex), secondary_color (hex), accent_color (hex), logo_description, overall_aesthetic (modern/classic/rustic/industrial/cozy/clinical/upscale), confidence (0-1)}"

**Business Cards/Collateral (user uploads via form):**
GPT-4o vision extracts: logo (crop region), colors (exact hex from printed colors), font identification, tagline, phone/email/address for NAP verification.

**Vehicle Wraps/Uniforms (Google Places photos):**
Often the most brand-consistent asset. Extract colors and logo from team/vehicle photos in Places gallery.

**Color extraction priority for local businesses:** signage → logo → storefront awning/trim → interior decor → vehicle wrap → business card → category default (LAST RESORT). Each color tagged with `color_source` for provenance.

**Font matching from signage:** GPT-4o identifies font style → map to closest Google Font: script→Dancing Script, serif→Playfair Display, modern sans→Inter, hand-lettered→Caveat, decorative→varies. Never use exact proprietary fonts — find the spirit, not the letter.

## Brand Inference (New Products)
Dev tool: technical/dark/monospace. SaaS: professional/clean/cards. Agency: confident/bold. E-commerce: friendly/product-focused. Nonprofit: warm/impact imagery. API: technical/docs-forward.

Emdash defaults (NOT for clients): #00E5FF, #50AAE3, #060610. Sora/Space Grotesk/JetBrains Mono.

## Anti-AI-Slop Detection (MANDATORY SCAN)
**Banned copy words:** delve|leverage|unleash|revolutionize|best-in-class|cutting-edge|discover|innovative|seamless|robust|synergy|elevate|empower|transformative. **Banned patterns:** "Welcome to"|"Discover [product]"|vague aspirational headlines ("Build the future of work")|hedging ("may help you," "can potentially")|generic superlatives. **Banned design tells:** Inter as sole font|purple-blue gradients|uniform 16px border-radius everywhere|centered everything|Hero/Lucide as sole icon set|abstract 3D blobs|uniform fade-in on all elements|plastic AI stock photos. **Fix:** Ask "Would the founder actually say this?" If no → rewrite. Color signals function, not decoration. Motion must serve one of three purposes.

## Copy System
Headlines: benefit-first, specific, numbers, max 8 words. Subheadings: expand promise, 15-25 words. Body: one idea/paragraph, 2-4 sentences, active, concrete, benefit-oriented. CTAs: specific action verb first, gradient primary+ghost secondary, above fold+page end. Never: "Click here"|"Submit"|"Learn more".

## Brand Voice Enforcement
Personality trait mapping: Expert→precise industry terms (not vague metaphors)|Direct→short declarative sentences (not passive)|Pragmatic→outcomes/implementation (not theory). Vocabulary lists: always-use/never-use/prefer-over. Max sentence length: 25 words. Banned structures: passive voice, hedging, em dashes mid-sentence. Monthly drift audit: check copy against vocabulary lists and structural rules.

## Microcopy System
**Error messages:** [What happened] + [What to do]. Tone: empathetic, solution-oriented. "Payment failed. Try a different card or contact support." Never: "Error 500", technical jargon, user blame. Flesch 70+. **CTAs:** action verb first, max 3 words preferred. "Start building"|"Ship today"|"Get access". **Empty states:** acknowledge absence + suggest action. "No projects yet. Create your first one." Never just "No results". **Toasts:** past tense for success ("Project created"), present for in-progress ("Saving…"), plain-language for errors. **Form labels:** noun phrases, sentence case. Helper text: one line, 10 words max.

## Machine-Readable Brand Documentation
**DESIGN.md** (6 sections): Visual Theme → Color Palette (hex+role) → Typography (family+scale+weight) → Spacing & Layout (grid+max-width+gaps) → Components (button/card/input specs) → Elevation (shadow system). Acts as AI design contract — LLMs parse it instead of Figma. **W3C DTCG tokens (2025.10 spec):** `.tokens.json` (MIME: `application/design-tokens+json`). Structure: `{"token": {"$type": "color", "$value": {...}, "$description": "..."}}`. Aliasing via `{base.color}`. Composite types: shadow|border|typography|transition. Tooling: Style Dictionary, Tokens Studio, Supernova. Export both `DESIGN.md` + `tokens.json` for every project.

## Trust Surfaces
Named testimonials > logos > stats > awards > media > ratings > GitHub stars. Every commercial page: security badge, compliance, real contact, team photos, case studies.

## Legal: Privacy Policy, Terms, Cookie Policy (EU), AUP (SaaS), Accessibility Statement. Plain language, dark theme.

**Legal/policy page consistency (***UNIVERSAL — BUILD-BREAKING — every legal route uses the SAME shared layout***):** All legal/policy/governance pages — `/privacy`, `/terms`, `/cookies`, `/aup`, `/accessibility`, `/dmca`, `/refund`, `/disclaimer`, `/code-of-conduct` — render through ONE shared `<LegalLayout>` template with identical visual structure: bordered+rounded `.legal-content > .legal-section` cards, same heading scale (h1 hero + h2 section titles), same inter-section spacing, same last-updated date strip, same TOC sidebar (sticky on desktop), same back-to-top affordance. NEVER let `/accessibility` render as plain stacked paragraphs while `/privacy` renders as boxed sections — visual inconsistency on legal pages signals carelessness about compliance. Validator (`validate-legal-page-consistency.mjs`): for every route in the legal-page allowlist, screenshot at 1280×1920, compute structural-similarity index (SSIM) of section-card geometry against `/privacy` reference — if SSIM<0.7 OR `.legal-section` count differs by >50%, FAIL. Reference incident: lone-mountain-global-3 (2026-05-02) `/accessibility` rendered flat paragraph stack while `/privacy` and `/terms` rendered boxed sections — drove this rule. Template ships ONE component, every legal route consumes it.

## IA: Hero, social proof, features (3-4), how it works (3 steps), testimonials, pricing, FAQ (4-6), final CTA, footer. Content density: hero 20-30, features 15-25, testimonials 20-40, FAQ 30-60, body 50-100.

## SEO
Per-page: title 50-60 (keyword+brand), meta 120-156, one H1, canonical, OG+Twitter, JSON-LD (Organization, WebSite+SearchAction, WebPage, FAQPage, Product, BreadcrumbList, SoftwareApplication). robots.txt, sitemap.xml, internal linking, alt text. **See per-route-metadata.md for full RouteMetadata interface + per-route Satori OG generation.**

Keywords: primary in title/H1/first paragraph/meta. Longtails in H2s (1-2/page). Density 1-2%. Lengths: homepage 500+, feature 600+, pricing 400+, blog 1000+, about 300+. **Internal links ≥5 per page** (body-copy contextual, descriptive anchor text, varied phrasing — see per-route-metadata.md "Generous Internal Linking"). **Publication/portfolio/press listings:** every item card MUST include (a) ~40-word paraphrased summary (NEVER quoted abstract — copyright + duplicate-content), (b) deep-link to original (`target="_blank" rel="noopener"`), (c) hyperlinked source name → its homepage/DOI. Universities/journals/conferences mentioned in body MUST link to their official site. See per-route-metadata.md "Publication Item Schema".

## Programmatic SEO Page Types
1. **Integration pages:** "[Tool A] + [Tool B] integration" — Zapier model (1.3M keywords). Template: shared data points, step-by-step setup, real use cases.
2. **Comparison/alternative pages:** "[Competitor] alternatives" — feature matrix, honest differentiators, social proof.
3. **Use-case/industry pages:** "[Product] for [vertical]" — Atlassian model. Vertical-specific pain points + screenshots.
4. **Template/resource libraries:** Downloadable assets gating signups. Each template = indexable URL.
5. **Location/segment pages:** Geographic or persona variations. Quality floor: 300+ unique words + page-specific data, 30-40% content differentiation.

## GEO — AI Search Optimization
Lead with 40-60 word quotable summary (LLMs excerpt this). Explicit entity definitions. FAQ sections for AI extraction. Statistics with clear sources. Comparison tables with structured data. ChatGPT favors Wikipedia/G2 citations; Perplexity favors Reddit/YouTube; Google AI Overviews favor traditionally ranked pages. JSON-LD FAQ+HowTo+Article on every content page.

## Readability (Flesch >=60 NON-NEGOTIABLE)
Sentences 15-20 avg (never >25). Paragraphs 2-4. Common words. Active voice. Contractions. Front-load. Hero 80+, body 55-65, CTAs 80+, FAQ 60+, errors 70+, legal 50+.

## Brian's Copy Voice
Sharp. Punchy. Irreverent. Love-forward. Nonprofit: warm, never preachy. SaaS: technical, zero fluff. Hero: bold, benefit-first. Errors: human, helpful.

Examples: "The same technology reshaping Wall Street, pointed at a soup kitchen." Anti-patterns: "Welcome to...", "Discover...", "Unleash...", "Click here", "Submit", corporate slop.

Conversion: headlines+numbers +36%, benefit>feature +28%, proof near CTAs +15-20%. Servant framing: "Start helping today" > "Sign up now". Truth: "127 donors" not "hundreds".

## Document Generation
PDF: reportlab, pdftoppm verify, brand colors. DOCX: python-docx, LibreOffice verify.

## Web Property Consistency
OG brand colors/fonts. Manifest matches voice. humans.txt current. Emdash sites cross-link (alternate, sameAs). browserconfig tile=#060610.
