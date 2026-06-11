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

The verbs `transform | unlock | empower | redefine | reimagine | elevate | transcend` allowed when literally accurate. Banned only as filler hype.

## Banned unsourced authority signals

Replace w/ cited concrete number `(Author, Year)` OR delete. See `citations.md`.

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
- Each gets unique H1 + meta desc + 2 paragraphs
- Never templatize verbatim — vary sentence structure, swap synonyms, reorder points

## GEO / AI search

- Quotable answer blocks 40-60 words (LLMs cite these)
- **FAQPage schema** has highest AI-citation rate (ChatGPT / Perplexity / Google AI Overviews) — mandate on every content page
- JSON-LD facts MUST also appear as visible HTML body text (ChatGPT/Claude don't fetch JSON-LD on direct read)
- Lead paragraphs answer query directly in <40 words
- **EEAT signals** — author bio + `Person` schema w/ `sameAs` + dated revision + ownership statement outweigh keyword density (Dec 2025 core update favored visible expertise)

## Anti-slop

- Grep for banned words before finalizing
- Replace w/ specific, concrete language
- "Our innovative platform" → "Ship SaaS in 4 weeks."

## Sourced facts (tiered by surface)

- **Long-form** (blog, research, `/about`, `/financials`, `/annual-report`, `/press`) — every quantitative claim MUST cite APA 7th inline `(Author, Year)` + reference list. Build gate applies.
- **Marketing** (hero, CTA, landing H1/H2, feature cards, pricing tiles — routes: `/`, `/pricing`, `/features`, `/services/*`, `/c/*`, `/products/*`) — claims must be true but inline APA destroys punch. Link to `/sources` or `/about` instead. Build gate exempts these surfaces.
- **Banned-phrase replacement** ("studies show", "industry-leading") applies everywhere
- See `citations.md` for full mandate + build gate.

## Contact

- `hey@megabyte.space`
- Footer CTA: "Let's Talk." See 09-brand skill.

## Historical timeline imagery

- Real, primary-sourced photographs only.
- NEVER DALL·E / GPT Image / Midjourney / Ideogram / Stable Diffusion / generic stock next to dated events.
- Source from Wikimedia Commons, Library of Congress, NPGallery, NPS, NYPL Digital, state historical societies, institution archives, or in-repo Squarespace mirrors.
- After ≥3 deep searches, if no real image exists: NO photo — typographic year-card only.
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

- `audited` ships to public pages
- `estimated` ships w/ visible "estimate pending audit" pill
- `placeholder` blocks build

### Person names

Only ship names confirmed against:

1. A public LinkedIn
2. An institutional staff page
3. A press release
4. Explicit parish/institution confirmation logged in `_confirmations.json`

Otherwise slot stays blank ("Executive Director" w/ no name) or omitted. Blank > faked.

### Fabricated-people build gate (DETERMINISTIC — ship in every people-bearing site)

- The "Blank > faked" rule is unenforced prose unless a gate checks it. Invented testimonials ship silently — they look plausible and pass every other validator. Ship a `validate-no-fabricated-people.mjs` gate wired into `check` + `build`.
- **Detects:** a person-like `name: '<literal>'` (`First L.` / `First Last` / `Rev. James O.`, plus org-endorser tokens `Bank|Corp|Inc|LLC|Foundation|Company|University|Reserve|Group|Partners`) paired in the SAME object window with a TESTIMONIAL signal — `quote:` / `reviewBody:` / `testimonial:`, OR `body:` alongside `role:`/`years:` (the alumni-card shape) — UNLESS the name is in `_confirmations.json` `confirmed_voices`.
- **Precise by design:** staff directories (name + role, NO quote), citation authors, and blog posts (no name+role+body trio) are NOT flagged. Dynamic `name: t.name` (no string literal) is NOT matched — only hard-coded personas.
- **`_confirmations.json`** is the allowlist: `{ "confirmed_voices": [] }`. A name enters ONLY when the testimonial is collected with permission AND verified (signed release / public LinkedIn / staff page / press release). Empty is the correct default.
- **Partnerships are different from quotes.** A named org tied to a REAL primary source (e.g. the kitchen's own blog post documenting a volunteer day, slug-checked by `validate-links`) is honest provenance — NOT a fabrication. The gate targets attributed first-person QUOTES, not sourced org mentions. Don't gut a sourced partner list.
- **Reference incident (njsk.org, 2026-06):** invented testimonials shipped to prod across 3 surfaces (`/alumni`, `/testimonials`, AND `/home` — the last only caught when the gate ran). All used `First L.` personas + first-person quotes + even `Person`/`Review` JSON-LD, zero provenance. The gate caught the 3rd site on its first run. Fix = remove the people + reframe to cited general patterns / honest invitations. Reference impl: `scripts/validate-no-fabricated-people.mjs` + `_confirmations.json`.
