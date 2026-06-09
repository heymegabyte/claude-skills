---
name: "timeline-authenticity"
priority: 3
pack: "website-build"
triggers:
  - "timeline"
  - "history"
  - "founder"
paths:
  - "org:website_build"
---

# Timeline Photo Authenticity

## Mandate

- Historical timelines (about/history/founder pages, museum-style scroll narratives, year-by-year scrolls, "Our Story" components) MUST use real, primary-sourced photographs for every entry that gets imagery.
- NEVER AI-generated, symbolic, or "evocative" stand-in images on a historical timeline.
- Brian's rule, learned the hard way: a soup-kitchen audience trusts the institution's history; pasting DALL·E chapel candles next to "Bishop Bayley consecrated, 1853" reads as fabrication and shreds donor trust the moment a reader spots the AI seams.

## Allowed sources (priority order)

1. **Wikimedia Commons** — Public Domain, CC0, CC-BY, CC-BY-SA
2. **Government / institutional archives** — Library of Congress, National Archives, NPGallery (NRHP), Smithsonian Open Access, state historical societies (NJ Historical Society, NYPL Digital Collections)
3. **The institution's own archives** — parish records, in-repo `/public/images/blog/` Squarespace mirrors of real past events
4. **Verified press wire / news photo** — publisher permission documented in `_credits.json`
5. **Official portrait pages on the subject's Wikipedia article** — always trace back to Wikimedia Commons file page and capture author + license + URL

NEVER hot-link a JPG from a third-party site without the Commons/archive backstop.

## Banned sources

- DALL·E / GPT Image / Midjourney / Ideogram / Stable Diffusion / any AI image generator (reserved for marketing decoration — NEVER for "this is what happened")
- Generic stock photography (Unsplash, Pexels, Adobe Stock) representing historical events
- "Symbolic" or "evocative" imagery — a 2024 candle photo next to a 1828 cornerstone is a lie of composition
- Colorized period photos without provenance

## Research cadence

Run ≥3 web searches per timeline entry before giving up. If none surface a real photo, the entry gets NO photo. A blank entry beats a faked one.

Probe order:

1. Wikipedia article on the named person/event
2. Wikimedia Commons category for the institution
3. Library of Congress Chronicling America (period newspapers, 1789–1963)
4. Newark Public Library Charles F. Cummings NJ Information Center (or local equivalent)
5. Diocesan / archdiocesan archives
6. Academic JSTOR-indexed reproductions of period engravings
7. Contemporary book scans on Internet Archive (1909 parish histories, 1872 Newark histories — almost always have engravings)

## Required metadata per photo

- `image` — URL
- `imageAlt` — factual description of what's in the frame, never inventing details that aren't visible
- `imageCredit` — `author name · source institution · license name · year`

Example: `'Mathew Brady studio · Library of Congress LC-BH82-4318 · Public Domain · c. 1860'` — NOT `'AI illustration symbolic of consecration'`.

## Confidence labeling

- Every photo carries implicit confidence.
- If image only contextually rhymes with the entry (e.g., "a typical 1850s Catholic immigrant family on the dock" used next to "1846 Famine immigration transforms the parish"), the `imageAlt` MUST disclose the rhyme: `"Mathew Brady studio portrait of Irish-American family in NYC, c. 1860 — representative of the 1840s Famine cohort that swelled St. John's parish"`.
- NEVER let a contextual photo read as a literal record.

## Build gate

- `validate-timeline-photos.mjs` — **enforcement: BUILD-BREAK**
- Greps every `image:` field in timeline data
- Rejects any value matching `/dall-?e/i`, `/ai-bank/`, `/midjourney/i`, `/ideogram/i`, `/stable-?diffusion/i`, or stock-site domains without `_credits.json` override
- Build fails until removed or whitelisted with primary-source justification
- Rationale for build-break: ethics + donor trust — AI-generated images on historical timelines read as fabrication the moment a reader spots the seams; non-negotiable

## Visual hierarchy

- **Real photo found** — full prominence: 4:3 figure with caption + credit + license + outbound link to source page.
- **No real photo** — typographic year-card: year badge + title + body. No decorative gray box, no placeholder silhouette, no generic icon.
- Blank is more dignified than fake.

## Apply across

- Any `/about` history scroll
- Any `/founder` tribute page
- Any `/heritage` or `/our-story` route
- Any `/timeline` standalone
- Any blog post titled "On this day…" or "Looking back…"
- Any year-by-year financial trend graphic showing historical photography alongside numbers
- Any annual-report retrospective spread

The rule scales: if the surface claims to depict the past, the depiction must be real.
