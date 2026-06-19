---
name: "copy-writing"
priority: 2
pack: "content"
triggers:
  - "copy"
  - "headline"
  - "cta"
  - "anti-slop"
paths:
  - "*"
---

# Copy Rules

## Voice

- Sharp. Punchy. Irreverent. No bullshit.
- Flesch ≥60. Active voice. Action-verb CTAs.
- Servant framing. Cut 50% before presenting.
- No "Welcome to / Discover / Unleash / leverage".

## Length limits

- **Hero** — 4-8 words
- **Taglines** — 3-5 words
- **Description** — 100-160 chars (HARD LIMIT)
- **Sentences** — 15-20 words
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

- `transform | unlock | empower | redefine | reimagine | elevate | transcend` — allowed only when literally accurate; banned as filler hype.

## Banned unsourced authority signals

- Replace with cited concrete number `(Author, Year)` OR delete. See `citations.md`.

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

- 5 page types: integration | comparison | use-case | template | location
- Each gets unique H1 + meta desc + 2 paragraphs.
- Never templatize verbatim — vary sentence structure, swap synonyms, reorder points.

## GEO / AI search

- Quotable answer blocks 40-60 words (LLMs cite these).
- **FAQPage schema** has highest AI-citation rate — mandate on every content page.
- JSON-LD facts MUST also appear as visible HTML body text (ChatGPT/Claude don't fetch JSON-LD on direct read).
- Lead paragraphs answer query directly in <40 words.
- **EEAT signals** — author bio + `Person` schema w/ `sameAs` + dated revision + ownership statement outweigh keyword density.

## Anti-slop

- Grep for banned words before finalizing.
- Replace with specific, concrete language.
- "Our innovative platform" → "Ship SaaS in 4 weeks."

## Sourced facts (tiered by surface)

- **Long-form** (blog, research, `/about`, `/financials`, `/annual-report`, `/press`) — every quantitative claim MUST cite APA 7th inline `(Author, Year)` + reference list. Build gate applies.
- **Marketing** (hero, CTA, landing H1/H2, feature cards, pricing tiles — routes: `/`, `/pricing`, `/features`, `/services/*`, `/c/*`, `/products/*`) — claims must be true; link to `/sources` or `/about` instead of inline APA. Build gate exempts these surfaces.
- Banned-phrase replacement applies everywhere.
- See `citations.md` for full mandate + build gate.

## Contact

- `hey@megabyte.space`
- Footer CTA: "Let's Talk." See 09-brand skill.

## Historical timeline imagery

- Real, primary-sourced photographs only.
- NEVER DALL·E / GPT Image / Midjourney / Ideogram / Stable Diffusion / generic stock next to dated events.
- Source from Wikimedia Commons, Library of Congress, NPGallery, NPS, NYPL Digital, state historical societies, institution archives, or in-repo Squarespace mirrors.
- After ≥3 deep searches with no real image: NO photo — typographic year-card only.
- Blank > fake. Full: `timeline-authenticity.md`.

## Production-review copy gate (pre-ship sweep)

Grep shipped DIST (not source) — ANY match = build fail:

- `\[[A-Z][A-Za-z ]{2,40}\]` bracket placeholders ("[Executive Director Name]", "[Insert Title]", "[Your Name]")
- `TODO` / `FIXME` / `XXX` / `PLACEHOLDER` / `TBD` in user-visible strings
- `Lorem ipsum`
- "John Doe" / "Jane Doe"
- "company.com" / "example.com"
- Any `\$\d{4,}` figure flagged PLACEHOLDER in source comments but rendered as real
- Fabricated person names where source had `// TODO: confirm w/ X`
- "[date]" / "[YYYY]" / "[month]" tokens
- Any `???` / `xxx` / `tk` (journalism "to come")

Validator: `validate-production-copy.mjs` greps `dist/**/*.{html,js,css}` and lists each violation with `file:line:context`.

### Per-figure rule

Financial numbers carry `_status: 'audited' | 'estimated' | 'placeholder'` tag in source.

- `audited` — ships to public pages.
- `estimated` — ships with visible "estimate pending audit" pill.
- `placeholder` — blocks build.

### Person names

Only ship names confirmed against one of:

1. A public LinkedIn
2. An institutional staff page
3. A press release
4. Explicit parish/institution confirmation logged in `_confirmations.json`

Otherwise slot stays blank ("Executive Director" w/ no name) or omitted. Blank > faked.

### Fabricated-people build gate (DETERMINISTIC — ship in every people-bearing site)

- Ship `validate-no-fabricated-people.mjs` wired into `check` + `build` — the "Blank > faked" rule is unenforceable without it.
- **Detects TWO shapes:**
  - (1) Person-like `name: '<literal>'` (`First L.` / `First Last` / `Rev. James O.`, plus org-endorser tokens `Bank|Corp|Inc|LLC|Foundation|Company|University|Reserve|Group|Partners`) paired in the same object window with `quote:` / `reviewBody:` / `testimonial:`, OR `body:` alongside `role:`/`years:`.
  - (2) Object-KEY attribution — a person-like quoted KEY mapped to a quote-like value (`'Barbara Cary': 'a sentence they never said.'`).
- **NOT flagged:** staff directories (name + role, no quote), citation authors, blog posts (no name+role+body trio), dynamic `name: t.name` (no string literal).
- **`_confirmations.json`** is the allowlist: `{ "confirmed_voices": [] }`. A name enters only when the testimonial is collected with permission AND verified (signed release / public LinkedIn / staff page / press release).
- Partnerships tied to a real primary source are NOT fabrications — the gate targets attributed first-person quotes, not sourced org mentions.
- **Reference incident (njsk.org, 2026-06):** invented testimonials shipped to prod across 3 surfaces. All used `First L.` personas + first-person quotes + `Person`/`Review` JSON-LD. Fix = remove people, reframe to cited patterns. Reference impl: `scripts/validate-no-fabricated-people.mjs` + `_confirmations.json`.
