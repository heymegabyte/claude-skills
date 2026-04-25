---
name: "research-pipeline"
description: "API-driven business research: Google Places, website scraping, social verification, brand extraction, confidence scoring. All research runs on Worker before container."
updated: "2026-04-24"
---

# Research Pipeline

All research runs on the Worker (not in the container). Results are written as `_` prefixed JSON files into the build directory. Claude Code reads these — never calls APIs for research.

## Phase 0a: Business Profile (Google Places API)

Query: `GOOGLE_PLACES_API_KEY` → `findplacefromtext` with business name + address. Then `place/details` for: name, formatted_address, formatted_phone_number, opening_hours, website, rating, user_ratings_total, reviews (top 3), photos (download to R2), geometry (lat/lng), types, price_level, business_status. Confidence: google_places source at 80-95 depending on field.

Fallback: Workers AI (Llama 3.1 70b) research prompt if no Places result. Lower confidence (50-70).

## Phase 0b: Website Scraping (Deep Crawl)

If business has existing website: crawl up to 20 pages. For each: extract title, headings, body text, images (download to R2), nav structure, footer content, meta tags, schema.org data. Store as `_scraped_content.json` keyed by URL path. Extract: all text content for reuse, all image URLs for download, sitemap structure for page recreation, blog posts for content migration.

Tools: `fetch()` with CF Workers (no Puppeteer needed for static sites). For JS-rendered: use `@cloudflare/puppeteer` or skip with graceful degradation. Parse HTML with regex patterns (no DOM parser in Worker).

## Phase 0c: Social Media Verification

For each platform (Facebook, Instagram, Twitter/X, LinkedIn, YouTube, TikTok, Pinterest, Yelp, Google Business): construct candidate URL from business name → HEAD request → verify 200 status. Only include URLs at 90%+ confidence. Dead links: exclude entirely.

## Phase 0d: Brand Extraction

Priority order for colors: logo dominant color → header/nav background → CTA button color → accent borders → body background. Extract via: GPT-4o vision on screenshot of existing site (if available), or Brandfetch API, or Logo.dev API. Return: primary, secondary, accent colors + font family + brand personality (modern/classic/playful/professional).

**Color source tracking (***CRITICAL***):** Every color must have `color_source`: extracted_from_logo|extracted_from_website|extracted_from_assets|generated. NEVER guess colors from business category. The njsk.org burgundy incident: system guessed "warm soup kitchen colors" instead of extracting their actual burgundy brand.

## Phase 0e: Confidence Scoring

Every data point gets `Conf<T>`: `{ value: T, confidence: number (0-1), sources: Source[] }`. Source types: google_places, llm_inference, user_provided, web_scrape, social_verify. Merge rule: higher confidence wins, corroboration boosts +0.1 (capped at 0.99). UI policy: prominent >=0.85, standard 0.70-0.84, deemphasize 0.50-0.69, hide <0.50.

Warnings generated for missing: phone (<0.5), email (<0.5), geo (<0.3), booking_url (<0.5), reviews (<0.3).

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
