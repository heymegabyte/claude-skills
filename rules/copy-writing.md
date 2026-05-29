# Copy Rules

## Voice
- Sharp. Punchy. Irreverent. No bullshit.
- Flesch >= 60. Active voice. Action-verb CTAs.
- Servant framing. Cut 50% before presenting.
- No "Welcome to / Discover / Unleash / leverage".

## Length limits
- **Hero** — 4–8 words
- **Taglines** — 3–5 words
- **Description** — 100–160 chars (HARD LIMIT)
- **Sentences** — 15–20 words
- **Paragraphs** — 2 max
- Numbers: specific.

## Banned words (grep before ship, replace with concrete)
```
limitless, revolutionize, game-changing, cutting-edge, next-generation,
world-class, best-in-class, turnkey, synergy, disrupt, seamless,
robust, scalable, leverage, utilize, facilitate, innovative, state-of-the-art,
paradigm, holistic, harness, foster, bolster, spearhead, delve, tapestry,
landscape, ecosystem, streamline, cornerstone, pivotal, myriad,
plethora, supercharge, unleash, boundless
```

- The verbs `transform | unlock | empower | redefine | reimagine | elevate | transcend` are allowed when literally accurate to what the product does. Banned only as filler hype.

## Banned unsourced authority signals
Replace with cited concrete number `(Author, Year)` OR delete. See [[citations]].
```
studies show, research suggests, most users, industry-leading, trusted by,
proven, widely-recognized, leading provider, cutting-edge research,
recent studies, experts agree, countless, numerous, many, some, often,
typically, generally
```

## Microcopy
- **Errors** — helpful + specific. "Email already registered. Sign in?" not "Error 409".
- **Empty states** — actionable. "No projects yet. Create your first →".
- **Loading** — contextual. "Analyzing 47 records..." not "Loading...".
- **Success** — brief + next. "Saved. View dashboard →".

## pSEO copy
- 5 page types: integration | comparison | use-case | template | location.
- Each gets unique H1 + meta desc + 2 paragraphs.
- Never templatize verbatim — vary sentence structure, swap synonyms, reorder points.

## GEO / AI search
- Quotable answer blocks 40–60 words (LLMs cite these).
- **FAQPage schema** has highest AI-citation rate (ChatGPT / Perplexity / Google AI Overviews) — mandate on every content page.
- JSON-LD facts MUST also appear as visible HTML body text (ChatGPT/Claude don't fetch JSON-LD on direct read).
- Lead paragraphs answer the query directly in <40 words.
- **EEAT signals** — author bio + `Person` schema with `sameAs` + dated revision + ownership statement outweigh keyword density (Dec 2025 core update favored visible expertise).

## Anti-slop
- Before finalizing, grep for banned words.
- Replace with specific, concrete language.
- "Our innovative platform" → "Ship SaaS in 4 weeks."

## Sourced facts (tiered by surface)
- **Long-form content** (blog posts, research pages, `/about`, `/financials`, `/annual-report`, `/press`) — every quantitative claim MUST cite APA 7th inline `(Author, Year)` + reference list entry. Build gate applies.
- **Marketing surfaces** (hero, CTA, landing page H1/H2, feature cards, pricing tiles — route patterns: `/`, `/pricing`, `/features`, `/services/*`, `/c/*`, `/products/*`) — claims must be true but inline APA destroys punch. Link to a `/sources` or `/about` page that backs the claim. Build gate exempts these surfaces.
- **Banned-phrase replacement** ("studies show", "industry-leading", etc.) applies everywhere — cut the slop, but don't force APA inline on hero copy.
- See [[citations]] for full mandate + build gate.

## Contact
- `hey@megabyte.space`
- Footer CTA: "Let's Talk." See 09-brand skill for examples.

## Historical timeline imagery (***NON-NEGOTIABLE***)
- Real, primary-sourced photographs only.
- NEVER DALL·E / GPT Image / Midjourney / Ideogram / Stable Diffusion / generic stock next to dated events.
- Source from Wikimedia Commons, Library of Congress, NPGallery, NPS, NYPL Digital, state historical societies, institution archives, or in-repo Squarespace mirrors.
- After ≥3 deep searches (Wikipedia article → Commons category → LoC Chronicling America → diocesan archives → period book scans on Internet Archive), if no real image exists: NO photo — typographic year-card only.
- Blank > fake. Full rule: [[timeline-authenticity]].

## Production-review copy gate (***NON-NEGOTIABLE — pre-ship sweep***)
Grep the shipped DIST (not source) — ANY match = build fail:
- `\[[A-Z][A-Za-z ]{2,40}\]` bracket placeholders ("[Executive Director Name]", "[Insert Title]", "[Your Name]")
- `TODO` / `FIXME` / `XXX` / `PLACEHOLDER` / `TBD` in user-visible strings
- `Lorem ipsum`
- "John Doe" / "Jane Doe"
- "company.com" / "example.com"
- Any `\$\d{4,}` figure flagged PLACEHOLDER in source comments but rendered as real
- Fabricated person names where source had `// TODO: confirm with X`
- "[date]" / "[YYYY]" / "[month]" tokens
- Any `???` / `xxx` / `tk` (journalism "to come")

Build validator: `validate-production-copy.mjs` greps `dist/**/*.{html,js,css}` and lists each violation with `file:line:context`.

### Per-figure rule
Financial numbers carry `_status: 'audited' | 'estimated' | 'placeholder'` tag in their data source.
- `audited` ships to public pages
- `estimated` ships with visible "estimate pending audit" pill in UI
- `placeholder` blocks the build

### Person names
Only ship names confirmed against:
1. A public LinkedIn
2. An institutional staff page
3. A press release
4. Explicit parish/institution confirmation logged in `_confirmations.json`

Otherwise the slot stays blank ("Executive Director" with no name) or is omitted entirely. Blank > faked.
