---
name: "citations"
priority: 3
pack: "content"
triggers:
  - "cite"
  - "citation"
  - "apa"
paths:
  - "org:website_build"
---

# Citations & Sources

## Mandate (tiered by surface)

- **Long-form** (blog posts, research pages, `/about`, `/financials`, `/annual-report`, `/press`) — every %, N, $, ratio, comparison, time-claim, "X% of users" MUST cite source inline `(Author, Year)` + entry in `references` array (APA 7th). Build gate applies.
- **Marketing surfaces** (hero, CTA, landing H1/H2, feature cards, pricing tiles — routes `/`, `/pricing`, `/features`, `/services/*`, `/c/*`, `/products/*`) — quantitative claims must be true but inline APA destroys punch. Link to `/sources` or `/about` instead. Build gate exempts.
- Unsourced numbers in long-form = AI slop = rejected at build.

## Banned phrases (replace w/ cited fact OR delete)

```
studies show, research suggests, most users, industry-leading, trusted by,
proven, widely-recognized, leading provider, cutting-edge research,
recent studies, experts agree, countless, numerous, many, some, often,
typically, generally
```

## Source hierarchy (use highest available)

1. Peer-reviewed (Nature, JAMA, ACM, IEEE)
2. `.gov` / `.edu` (CDC, BLS, NIST, NIH)
3. Primary data (10-K filings, company reports, official APIs)
4. Established industry research (Gartner, Forrester, Pew, Statista)
5. Wikipedia — ONLY to find primary source it cites

## Forbidden sources

- AI-summary articles (LLM cannot cite itself)
- Content farms
- Blog regurgitations
- "According to a study" without naming study
- Social media posts
- Undated sources

## APA 7th — inline

- `(Smith, 2024)`
- `Smith (2024)`
- `(Smith & Lee, 2024)`
- `(Smith et al., 2024)` — 3+ authors
- `(World Health Organization, 2023)` — org author
- `(Smith, 2024, p. 47)` — page-specific

## APA 7th — reference list

- **Journal** — `Smith, J. (2024). Title in sentence case. Journal Name, 12(3), 45-67. https://doi.org/10.xxxx/xxxxx`
- **Web** — `Author, A. (Year, Month Day). Title. Site Name. URL`
- **Org** — `Org Name. (Year). Report title. URL`

## Confidence rule

- **2+ corroborating cites** — high (≥0.85)
- **Single source** — medium (0.70)
- **Self-cite / anecdote** — low (<0.50, flag in `_brand.json.warnings[]`)

## Build gate (BUILD-BREAKING — long-form only)

- Grep `dist/` HTML for: `\d+%`, `\$\d+[MBK]`, `\d+x (faster|more|times)`, `\d+ users`, `\d+ customers`, `since \d{4}`
- Any unsourced match on long-form routes = fail
- **Exempt** (marketing): `/`, `/pricing`, `/features`, `/services/*`, `/c/*`, `/products/*`
- **Gated** (long-form): `/blog/*`, `/research/*`, `/about`, `/financials`, `/annual-report`, `/press`, `/sources`
- Implement in `validate-citations.js` alongside `validate-urls.js`

## Schema.org

- `Article` / `BlogPosting` / `FAQPage` / `Claim` JSON-LD MUST include `citation: CreativeWork[]` array per source
- The "16%→54% AI-citation boost" is actually GPT-4 response accuracy w/ structured content, not direct citation rate (Digidop, 2026)
- FAQPage + Claim + citation arrays measurably increase AI-search inclusion

## Anthropic Citations API

- **GA** (not beta) across all active models except Haiku 3
- Enable per document w/ `citations: {enabled: true}`
- `cited_text` is free (doesn't count toward output tokens)
- Incompatible with Structured Outputs beta — pick one per request

## Render

- `<Citation refId="ref-1">claim text</Citation>` → superscript link to footer `<ReferencesList />`
- Mandatory on every page w/ quantitative content
- APA bibliography hanging indent

## Citation visual styling

- Inline markers + reference list entries: `font-size: clamp(0.7rem, 0.72vw + 0.6rem, 0.8125rem)` (≈11-13px, never > 0.8125rem)
- `line-height: 1.45`, `color: color-mix(in oklch, currentColor 65%, transparent)`
- Inline markers sit on SAME baseline as number/figure/icon they qualify — wrap with `display: inline-flex; align-items: baseline; gap: 0.25em;` so citation `<sup>` flows beside value, never wraps below
- Stat/figure blocks w/ leading icon: wrap w/ `display: inline-flex; align-items: baseline; gap: 0.4em;` so `<icon> <value> <citation>` share one baseline
- Reference list footer: same small clamp + `hanging-indent` per APA, w/ citation number/superscript inline w/ first line
- `<sup>` markers MUST NOT increase line-height — set `position: relative; top: -0.4em; font-size: 0.65em; line-height: 0;`
- Build validator `validate-citation-render.spec.ts` Playwright-asserts every `[data-citation]` bounding-box top aligns within 2px of preceding figure/value baseline. Failure = warning only (alignment regressions log to console + CI, do not fail build)

## Conf<T> pattern (skill 15)

- Every confidence-tracked field gets `apa_citation: string` + `source_url: string`
- `_citations.json` accompanies `_research.json` w/ full reference list per `refId`

## Idea-engine (skill 14)

- `_evidence.json` accompanies every proposed idea
- Confidence ≥0.8 requires 2+ APA-cited sources
- Unsourced ideas auto-rejected by self-critique filter

## Copy-writing exception

- Brand voice claims ("Sharp. Punchy.") don't need cites — only quantitative/comparative claims do
- Hero headlines stay sharp; bibliography lives in body + footer
