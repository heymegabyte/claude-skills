---
name: "research-pipeline"
description: "API-driven business research: Google Places, website scraping, social verification, brand extraction, confidence scoring. All research runs on Worker before container."
updated: "2026-04-24"
---

# Research Pipeline

All research runs on the Worker (not in the container). Results are written as `_` prefixed JSON files into the build directory. Claude Code reads these — never calls APIs for research.

## Phase 0a: Business Profile (Google Places API)

Query: `GOOGLE_PLACES_API_KEY` → `findplacefromtext` with business name + address. Then `place/details` for: name, formatted_address, formatted_phone_number, opening_hours, website, rating, user_ratings_total, reviews (top 3), photos (download to R2), geometry (lat/lng), types, price_level, business_status. Confidence: google_places source at 80-95 depending on field.

Fallback chain: 1. Yelp Fusion API (`YELP_API_KEY`) — business match by name+location, returns reviews/photos/hours/categories (confidence 60-80). 2. Facebook Graph API — page search by business name, returns about/hours/phone/address (confidence 55-70). 3. BBB API/scrape — search by business name, returns rating/accreditation/complaints (confidence 70-85, trust signal). 4. Workers AI (Llama 3.3 70b) research prompt — synthesize from web search results (confidence 50-70, LAST RESORT).

**Competitor analysis (auto, no extra API cost):** Google Places `nearbysearch` with same `type` within 5mi radius. Top 5 competitors: extract names, ratings, review counts, websites. Used in build prompt for differentiation ("You have 4.8 stars vs competitors averaging 4.2 — emphasize this").

## Phase 0b: Website Scraping (Deep Crawl)

If business has existing website: crawl up to 50 pages (was 20 — content-rich sites need full migration). For each: extract title, headings, body text, images (download to R2), nav structure, footer content, meta tags, schema.org data. Store as `_scraped_content.json` keyed by URL path. Extract: all text content for reuse, all image URLs for download, sitemap structure for page recreation, blog posts for content migration.

**Sitemap fetch (***CRITICAL FOR URL PRESERVATION***):** Before crawling, fetch `/sitemap.xml` and `/sitemap_index.xml`. Parse all `<loc>` URLs into `_scraped_content.json.sitemap_urls[]`. These become the canonical list of URLs that must resolve (200 or 301) on the new site. If no sitemap exists, build the URL list from crawled pages + any links discovered. Store as `_original_urls: string[]` in `_scraped_content.json`.

Tools: `fetch()` with CF Workers (no Puppeteer needed for static sites). For JS-rendered: use `@cloudflare/puppeteer` or skip with graceful degradation. Parse HTML with regex patterns (no DOM parser in Worker).

## Phase 0c: Social Media Verification

For each platform (Facebook, Instagram, Twitter/X, LinkedIn, YouTube, TikTok, Pinterest, Yelp, Google Business): construct candidate URL from business name → HEAD request → verify 200 status. Only include URLs at 90%+ confidence. Dead links: exclude entirely.

## Phase 0d: Brand Extraction (***PRIMARY COLOR RETRIEVAL***)

Priority order for primary color: logo dominant color → header/nav background → CTA button color → accent borders → hero overlay. Extract via: 1. Brandfetch API (`BRANDFETCH_API_KEY`) — returns full brand kit (colors, fonts, logos) at 90% confidence. 2. Logo.dev API (`LOGODEV_TOKEN`) — logo image → GPT-4o vision extracts dominant colors. 3. GPT-4o vision on screenshot of existing site. 4. Color extraction from downloaded images in assets/ (look for signage, storefront, uniforms).

**Output to `_brand.json`:**
```json
{
  "colors": {
    "primary": { "value": "#8B1A2B", "source": "extracted_from_logo", "confidence": 0.92 },
    "secondary": { "value": "#1A1A2E", "source": "extracted_from_website", "confidence": 0.85 },
    "accent": { "value": "#E8B931", "source": "extracted_from_website", "confidence": 0.80 },
    "background": { "value": "#0D0D1A", "source": "derived_from_primary", "confidence": 0.88 },
    "foreground": { "value": "#F5F5F5", "source": "contrast_calculated", "confidence": 0.95 }
  },
  "fonts": { "heading": "Playfair Display", "body": "Inter", "source": "extracted_from_website" },
  "personality": "professional",
  "logo_url": "assets/logo.svg"
}
```

**Color source tracking (***CRITICAL***):** Every color must have `color_source`: extracted_from_logo|extracted_from_website|extracted_from_assets|derived_from_primary|contrast_calculated|generated. NEVER guess colors from business category. The njsk.org burgundy incident: system guessed "warm soup kitchen colors" instead of extracting their actual burgundy brand. `background` is derived by darkening primary by 80-90% lightness in OKLCH. `foreground` is calculated for WCAG AA contrast against background.

**New business fallback (no web presence):** If business has no website, no logo, and no social media: 1. Google Places photos → extract dominant color from storefront/signage images. 2. Google Street View screenshot → extract from building facade, awning, signage. 3. Industry-neutral defaults as LAST RESORT: primary=#2563EB (accessible blue), secondary=#1E293B (slate), accent=#F59E0B (amber). Mark `color_source: "fallback_default"` with confidence 0.40. Flag in `_brand.json.warnings[]`: "No brand assets found — using neutral defaults. Business owner should provide logo/colors." NEVER skip to category-based guessing.

## Phase 0e: Confidence Scoring

Every data point gets `Conf<T>`: `{ value: T, confidence: number (0-1), sources: Source[], apa_citation: string, source_url: string, refId: string }`. Source types: google_places, llm_inference, user_provided, web_scrape, social_verify, peer_reviewed, gov_edu, primary_data, industry_research. Merge rule: higher confidence wins, corroboration boosts +0.1 (capped at 0.99). UI policy: prominent >=0.85, standard 0.70-0.84, deemphasize 0.50-0.69, hide <0.50.

**APA citation requirement (***NON-NEGOTIABLE — see rules/citations.md***):** every quantitative field (%, N, $, ratio, comparison, year-claim) MUST carry `apa_citation` (APA 7th ed) and `source_url`. Examples: `apa_citation: "U.S. Bureau of Labor Statistics. (2024). Occupational employment statistics: Restaurant industry. https://www.bls.gov/oes/"` or `apa_citation: "Brewer, S. (2024). AI search citation rates. Journal of Search Engine Optimization, 15(2), 88-104. https://doi.org/10.xxxx/xxxxx"`. Confidence>=0.85 requires 2+ corroborating cites; single source=0.70; unsourced=rejected.

Warnings generated for missing: phone (<0.5), email (<0.5), geo (<0.3), booking_url (<0.5), reviews (<0.3), apa_citation on any quantitative claim (auto-fail).

## Phase 0g: Citation Aggregation (`_citations.json`)

Sibling file to `_research.json`. APA 7th ed bibliography keyed by `refId`. Schema:
```json
{
  "ref-1": {
    "type": "journal|web|government|industry|primary",
    "authors": ["Brewer, S.", "Lee, M."],
    "year": 2024,
    "title": "AI search citation rates with structured data",
    "publication": "Journal of Search Engine Optimization",
    "volume": "15(2)",
    "pages": "88-104",
    "doi": "10.xxxx/xxxxx",
    "url": "https://...",
    "accessed": "2026-04-25",
    "apa_formatted": "Brewer, S., & Lee, M. (2024). AI search citation rates with structured data. Journal of Search Engine Optimization, 15(2), 88-104. https://doi.org/10.xxxx/xxxxx"
  }
}
```
Container script `~/format-citations.js` (citation-js npm) converts BibTeX/RIS/CSL-JSON → APA 7th. Write `_citations.json` during research phase. Components reference by `refId`. Build gate `validate-citations.js` ensures every numeric claim in dist/ HTML resolves to a `refId` entry.

## Phase 0e2: Publication Deeplink Resolver (***FOR SITES WITH RESEARCH/PUBLICATION TILES — NEVER DUPLICATE-CONTENT STUB***)
For every publication/paper/article/case-study item discovered in source crawl (academic CVs, faculty pages, "Selected Publications", `/portfolio` indexes, journal pages, ResearchGate scrapes), resolve a canonical external `deeplink_url` BEFORE rendering tile. Internal `/portfolio/<slug>` stub pages that just re-display the citation block are a duplicate-content failure (lonemountainglobal.com 2026-05-01 incident: 12 publication tiles all linked to internal stubs that contained nothing but the same citation re-rendered, when the actual academic article URLs existed and were valuable). Build gate `validate-publication-deeplinks.mjs` (skill 15 quality-gates.md) fails on any publication tile without `deeplink_url` OR with `deeplink_url` pointing to internal route.
Discovery chain (try in order, stop on first 200-OK match): (1) Source-site PDF/citation block — pdftotext + LLM JSON extraction of `{title, authors, journal, year, doi?, pmid?, arxiv_id?}`; (2) Crossref API `https://api.crossref.org/works?query.bibliographic=<title>&query.author=<first-author>&rows=5` then match by year+author similarity → returns DOI → `https://doi.org/<doi>`; (3) PubMed E-utilities `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=<title>+AND+<author>[author]` → returns PMID → `https://pubmed.ncbi.nlm.nih.gov/<pmid>`; (4) arXiv API `http://export.arxiv.org/api/query?search_query=ti:<title>+AND+au:<author>` → returns arXiv ID → `https://arxiv.org/abs/<id>`; (5) Google Scholar via Serper `https://serper.dev/search?q=<title>+filetype:pdf` (rate-limit 1/sec) → top result if domain ∈ {jstor.org|sciencedirect.com|tandfonline.com|wiley.com|springer.com|nature.com|science.org|nih.gov|bmj.com|jamanetwork.com|nejm.org|pubs.acs.org|pubs.rsc.org|cambridge.org|oup.com|sage.com|elsevier.com|university journal hostnames}; (6) Tavily/Perplexity research API `<title> <author> <year>` → first authoritative URL; (7) Journal homepage search if journal known.
Persist to `_research.json.publications[]` with `{ title, authors[], journal, year, doi?, pmid?, arxiv_id?, deeplink_url, deeplink_source, paraphrased_summary, image_url?, citation_apa }`. `deeplink_source` ∈ `crossref|pubmed|arxiv|scholar|tavily|journal_search`. Confidence: ≥0.85 on doi/pmid/arxiv hit, 0.70 on scholar/tavily, 0.50 on journal_search fallback. NEVER mark `deeplink_url=null` and ship — fail build instead.
Render: tile wrapper `<a href={deeplink_url} target="_blank" rel="noopener noreferrer" data-card="publication">` with entire surface clickable; inner action button "Read Full Paper →" points to SAME `deeplink_url` (validator compares card-wrapper href vs button href, fail on mismatch); journal/conference name in tile body hyperlinked to journal homepage (institution-name anchor, NEVER "click here"). Internal stub routes `/portfolio/<slug>` are FORBIDDEN for publication-typed cards — `_redirects` MUST emit `/portfolio/<slug> 301 <deeplink_url> 301` for any source URLs that previously pointed at internal stubs (URL preservation gate per always.md full-corpus mandate).

## Phase 0e3: PDF Deep Crawl + Web-Research Enrichment (***CV/RESUME/BROCHURE/REPORT — STRUCTURED FACTS PIPELINE***)
Every linked PDF in source (CV, resume, brochure, menu, whitepaper, annual report, fact sheet) MUST be crawled before Phase 1 build, NOT treated as a generic asset (always.md "Every linked PDF" rule). pdftotext → LLM-with-strict-JSON-schema extraction → `_pdf_facts.json` keyed by URL.
JSON schema per CV/resume PDF: `{ source_url, person: { name, title, email?, phone?, address?, photo_url? }, education: [{ degree, institution, year, location?, thesis?, advisors?[] }], positions: [{ title, organization, start_year, end_year?, location, description, achievements?[] }], publications: [{ title, authors, journal, year, doi?, pmid?, citation_apa, deeplink_url }] (run through Phase 0e2 resolver), grants: [{ title, funding_org, amount?, year, role, project }], awards: [{ name, awarder, year, citation? }], teaching: [{ course, institution, years, level }], service: [{ role, organization, years }], professional_memberships: [{ org, role?, years }], languages?: [], skills?: [] }`. Other PDF types: brochure → `{ services[], pricing?[], contact_block }`; menu → `{ sections[]: { name, items[]: { name, description, price? } } }`; annual report → `{ year, executive_summary, financials?, programs[], impact_metrics[] }`.
Web-research enrichment per timeline node (CVs especially): for every `position`/`education`/`grant`/`publication`/`award`, run Tavily/Exa search `<institution> <year> <person-name>` → enrich with: institution canonical URL, news/press mentions, related papers, grant agency project page, award announcement. Persist back into the timeline node as `enrichment: { institution_url, related_papers[], news_mentions[], canonical_event_url? }`. Hyperlink all of it in render.
CV render = interactive Timeline component on `/about` (or dedicated `/cv` route when CV is a primary credential): vertical chronology with year markers (left rail) + expandable role/event cards (right) + in-viewport `animate__fadeInUp` per node + ≥7:1 contrast for supplementary metadata text + hyperlinked institution names + hyperlinked publication titles (DOI deeplink) + grant agency links + award organization links + headshot from `person.photo_url` (also pulled into team grid). Cards expand on click/Enter to reveal full description + enrichment links. Mobile: collapsed accordion per year. The lonemountainglobal.com Dr. Taryn Vian CV (2026-05-01 incident) needs all 30+ years of positions, 165+ publications (each deeplinked via Phase 0e2 resolver), all grants, all awards rendered into the timeline — not a one-paragraph bio summary.
Per-prompt context injection: `_pdf_facts.json` is loaded into EVERY downstream content prompt (about-page, team-page, services-page, blog-post-generation, JSON-LD personSchema, FAQ generation) so the CV's structured facts back every assertion the rebuild makes about the person/org. Without this, the LLM hallucinates dates/positions and the fact-checker (skill 09 grammar-audit) flags inconsistencies. Validator `validate-pdf-facts.mjs` asserts every linked PDF in source has corresponding `_pdf_facts.json` entry before container build can start.

## Phase 0f: Enrichment Sources

| API | Key | Data | Confidence |
|-----|-----|------|------------|
| Google Places | GOOGLE_PLACES_API_KEY | Profile, hours, reviews, photos, rating | 80-95 |
| Yelp Fusion | YELP_API_KEY | Reviews, photos, rating, categories | 60-80 |
| Foursquare | FOURSQUARE_API_KEY | Venue photos, tips, hours | 65-75 |
| Google CSE | GOOGLE_CSE_KEY + CX | Business-specific web images | 40-70 |
| Logo.dev | LOGODEV_TOKEN | Logo image URL | 85 |
| Brandfetch | BRANDFETCH_API_KEY | Full brand kit (logo, colors, fonts) | 90 |

## Output Format

`_research.json`:
```json
{
  "identity": { "name": Conf, "tagline": Conf, "category": Conf, "schema_org_type": Conf },
  "operations": { "phone": Conf, "email": Conf, "address": Conf, "hours": Conf, "geo": Conf },
  "offerings": { "services": Conf[], "menu": Conf[], "pricing": Conf },
  "trust": { "rating": Conf, "review_count": Conf, "reviews": Conf[], "years_in_business": Conf },
  "brand": { "colors": Conf, "fonts": Conf, "personality": Conf, "logo_url": Conf },
  "marketing": { "selling_points": Conf[], "hero_slogans": Conf[], "benefit_bullets": Conf[] },
  "media": { "images": Conf[], "videos": Conf[], "placeholder_strategy": "css_gradient" },
  "seo": { "primary_keyword": Conf, "secondary_keywords": Conf[], "faq": Conf[] },
  "provenance": { "overallConfidence": number, "sectionConfidence": {}, "warnings": [], "version": "v3" }
}
```

## Research for Different Site Types

**SaaS sites:** Skip Google Places. Research: competitor features (web search), pricing benchmarks, integration ecosystems, trust signals (G2/Capterra ratings), tech stack indicators. Scrape: landing pages, pricing pages, docs, changelog.

**Portfolio sites:** Minimal API research. Focus on: scraping all project/work pages, extracting case study content, downloading project images, identifying skills/tech mentioned. Client list from testimonials.

**Non-profit:** Google Places + IRS 990 data (if available). Research: mission statement, impact metrics, volunteer programs, donation platforms, event calendars, partner organizations. Scrape all pages — non-profits often have 20+ pages of valuable content to reorganize.

**Government/institutional:** Deep scrape required (often 100+ pages). Organize by user intent not org structure. Extract: services offered, contact directories, document libraries, news/press releases, policy documents.
