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

## Allowed sources (priority order)

1. **Wikimedia Commons** — Public Domain, CC0, CC-BY, CC-BY-SA
2. **Government / institutional archives** — Library of Congress, National Archives, NPGallery (NRHP), Smithsonian Open Access, state historical societies (NJ Historical Society, NYPL Digital Collections)
3. **The institution's own archives** — parish records, in-repo `/public/images/blog/` Squarespace mirrors of real past events
4. **Verified press wire / news photo** — publisher permission documented in `_credits.json`
5. **Official portrait pages on the subject's Wikipedia article** — trace back to Wikimedia Commons file page and capture author + license + URL

NEVER hot-link a JPG from a third-party site without the Commons/archive backstop.

## Banned sources

- DALL·E / GPT Image / Midjourney / Ideogram / Stable Diffusion / any AI image generator
- Generic stock photography (Unsplash, Pexels, Adobe Stock) representing historical events
- "Symbolic" or "evocative" imagery — a 2024 candle photo next to an 1828 cornerstone is a lie of composition
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
7. Contemporary book scans on Internet Archive (1909 parish histories, 1872 Newark histories)

## Required metadata per photo

- `image` — URL
- `imageAlt` — factual description of what's in the frame, never inventing details not visible
- `imageCredit` — `author name · source institution · license name · year`

Example: `'Mathew Brady studio · Library of Congress LC-BH82-4318 · Public Domain · c. 1860'`

## Confidence labeling

- If image only contextually rhymes with the entry, `imageAlt` MUST disclose the rhyme: `"Mathew Brady studio portrait of Irish-American family in NYC, c. 1860 — representative of the 1840s Famine cohort that swelled St. John's parish"`.
- NEVER let a contextual photo read as a literal record.

## Build gate

- `validate-timeline-photos.mjs` — **BUILD-BREAK**
- Greps every `image:` field in timeline data
- Rejects any value matching `/dall-?e/i`, `/ai-bank/`, `/midjourney/i`, `/ideogram/i`, `/stable-?diffusion/i`, or stock-site domains without `_credits.json` override

## Visual hierarchy

- **Real photo found** — 4:3 figure with caption + credit + license + outbound link to source page
- **No real photo** — typographic year-card: year badge + title + body. No decorative gray box, no placeholder silhouette, no generic icon.

## Apply across

- `/about` history scroll
- `/founder` tribute page
- `/heritage` or `/our-story` route
- `/timeline` standalone
- Any blog post titled "On this day…" or "Looking back…"
- Any year-by-year financial trend graphic showing historical photography alongside numbers
- Any annual-report retrospective spread
