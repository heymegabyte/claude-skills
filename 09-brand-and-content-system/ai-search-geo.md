# AI Search / GEO — 2026 Practice

## Bots to Address Explicitly

`robots.txt` must take a position on every AI crawler. Default = unmanaged risk.

```
User-agent: GPTBot
Allow: /
User-agent: Claude-User
Allow: /
User-agent: Claude-SearchBot
Allow: /
User-agent: ClaudeBot
Disallow: /train
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: CCBot
Allow: /
User-agent: Bytespider
Disallow: /
```

### Three Anthropic bots exist — address each separately

- **ClaudeBot** — training (most blockable)
- **Claude-User** — user-initiated fetches (block at your peril; this is real users)
- **Claude-SearchBot** — search index population

### Top blocked agents by traffic (Cloudflare Radar via Calvano, 2025)

- GPTBot — 5.20%
- CCBot — 5.14%
- ClaudeBot — 4.59%
- Bytespider — 4.41%
- Google-Extended — 4.23%

## What AI Crawlers Actually See

- **ChatGPT / Claude on direct fetch** — do NOT parse JSON-LD. They see rendered HTML body text.
- **Google AI Overviews / Bing Copilot** — DO index JSON-LD via their existing crawl pipeline.
- **Perplexity** — pulls from indexed snippets; JSON-LD helps surface in those snippets.

**Conclusion:** keep JSON-LD (it boosts the SERP → AI pipeline), but the on-page HTML body MUST also contain the same structured facts as visible text + readable headings.

## Page Structure for AI Citation

1. **Lead paragraph answers the query in <40 words.** AI chatbots quote the first quotable paragraph.
2. **40-60 word quotable blocks** below each H2 — these are the citation magnets.
3. **5+ JSON-LD blocks per route** — WebSite + Organization + WebPage + BreadcrumbList + **FAQPage** (minimum). Add LocalBusiness / Product / BlogPosting / HowTo / Person by page type.
4. **Author schema** (`Person` with `sameAs`) + `dateModified` on every content page (EEAT).
5. **Claim citations** — `citation: CreativeWork[]` array on Article / BlogPosting / FAQPage JSON-LD.
6. **Concise H1** matches the user query.
7. **Internal links** to related pages (chains pages for AI to "follow up" topics).

## FAQPage Schema (Highest AI Citation Rate)

Mandate on every content / product / service page. Minimum 5 Q&A blocks. Each `answerCount` ≥1.

```jsonld
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is X?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "<40-60 word direct answer>"
      }
    }
  ]
}
```

## llms.txt

**Optional.** <0.3% adoption among top 1000 sites (Rankability, 2025). Server logs show major LLM crawlers (GPTBot, ClaudeBot, PerplexityBot) do NOT request it. Keep `llms.txt` for dev-tool DX (Cursor, Claude Code love it), but NOT a build-breaking gate.

If shipping `llms.txt` — `/llms.txt` summary index + `/llms-full.txt` long-form content.

## EEAT 2026

December 2025 Google core update rewarded sites with visible expertise. Required signals:

- **Author bio** with credentials + photo + `sameAs` links to LinkedIn / X / scholar profiles
- **Person schema** in JSON-LD with `jobTitle`, `worksFor`, `alumniOf`, `sameAs`
- **dateModified** prominent on every article (not just JSON-LD)
- **Ownership statement** (publisher / organization, address, contact) in footer + Organization schema
- **Citations** to peer-reviewed sources or primary data, not other AI summaries

## Quantitative Claims (Anti-Slop)

Every %, $, ratio, comparison cites APA 7th inline `(Author, Year)` + reference list entry. Build gate greps `\d+%|\$\d+[MBK]|\d+x` for missing cites. See `rules/citations.md`.

## Common Mistakes

- JSON-LD describing facts that aren't in the visible HTML — LLMs don't trust schemas they can't verify
- Generic FAQs ("What is your refund policy?") instead of topic-specific. Use queries real users ask.
- Author "Admin" or no author at all — destroys EEAT
- Stuffing all 5+ JSON-LD blocks into one giant `@graph` — Google handles it, but some validators reject
- Forgetting `inLanguage` + `isAccessibleForFree:true` on public content
