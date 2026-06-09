---
name: "thin-source-amplification"
priority: 3
pack: "website-build"
triggers:
  - "thin"
  - "no content"
  - "stub"
paths:
  - "org:website_build"
---

# Thin-Source Content Amplification

When source is informationally bare (4 pages, no blog/team/testimonials/press), manufacture useful, honest, search-worthy content from public data + industry knowledge + community context — without fabricating testimonials, employees, or customer quotes.

## Auto-fire triggers

- Source crawl <10 unique non-blog URLs
- Total source text <5,000 words
- No `/about`, `/team`, `/services`, `/blog`, `/testimonials` route exists
- Social-media-only presence (FB page, 4-page Squarespace)
- Newly-formed business (state reg <24 months per Sec of State)
- Solo operator with no public bio

## Minimum-viable-content floor (HARD GATE — site does not ship below)

1. 30 unique pages (40+ nonprofit, 50+ local-business multi-service)
2. 2,000+ words per cornerstone (`/about`, `/services/{primary}`, `/contact`, `/process`)
3. 1 educational lead magnet (checklist PDF, annual schedule, warning-signs guide)
4. 1 founder/owner story page ≥800 words from owner interview or public records
5. 20+ FAQ entries w/ 60-100 word answers, sourced from "People Also Ask" + "Related Searches"
6. 5+ blog/resource posts at 1,200+ words each, evergreen + locally-flavored
7. 1 glossary w/ 30+ industry terms plain-language
8. 1 transparency page — licensing, insurance, years in business, service area map, equipment

Below floor → fire amplification phases in priority order until cleared.

## Amplification phases (priority — highest content yield first)

### Phase 1 — Industry-knowledge corpus injection

- Pull `_industry-evergreen-corpus.json` per org type from `~/.agentskills/15-site-generation/industry-corpora/`
- Universal-but-true content: a Newark plumber's "What to do during a pipe burst" is accurate whether they wrote it. Honesty: this is the BUSINESS's official guidance (licensed practitioner stands behind it), not "we asked an expert".
- Topics per org type:
  - **Plumber** — pipe-burst triage, water-heater lifespans, hard-water symptoms, sewer warning signs, fixture lifecycle
  - **HVAC** — annual tune-up schedule, refrigerant by year built, thermostat-by-sqft, indoor air quality
  - **Restaurant** — allergen statements, sourcing, dietary accommodations, party-booking
  - **Salon** — service menu glossary, prep instructions, aftercare, color-correction reality, pricing-factor breakdown
  - **Nonprofit** — service-area maps, income-eligibility tables, intake process, partner agencies, volunteer pipeline
  - **Medical** — insurance accepted, what-to-bring, first-visit expectations, billing transparency, patient rights
  - **Legal** — practice areas explained, fee-structure types, consultation process, attorney-client privilege explainer
  - **Moving labor** — pricing factors, day-of expectations, packing tips, insurance coverage, claims process

### Phase 2 — Geographic + community context

- APIs: Census ACS (demographics → "Why we serve {neighborhood}"); NOAA climate (seasonal → "Snow removal in Newark: what 32" snowfall looks like"); OpenStreetMap + Maps (neighborhood boundaries, landmarks → service-area pages); local government open data (permits, code violations, zoning → "Renovating in Newark: what permits you need"); school districts + parishes + fire/police precincts (hyper-local SEO).
- Output: `/c/{city}` + `/n/{neighborhood}` pages, one per coverage area, locale-flavored.

### Phase 3 — Adjacent-business mining

- Scrape top 5 competitors (Google Maps Places + Yelp + their sites)
- Extract: services offered, price-range patterns, FAQs, service-area boundaries, hours, accreditations
- Write business's own version of every common service page competitors cover but source doesn't
- NEVER copy verbatim — extract topics, write fresh
- NEVER claim competitor credentials — pull only topic list, not proof

### Phase 4 — Public data enrichment

- State licensing boards — verify + display credential numbers, issue date, status (NJ Division of Consumer Affairs, CA Contractors State License Board, etc.)
- Sec of State business reg — year founded, entity type, registered agent
- BBB — accreditation, rating (if positive)
- OSHA + DOL — industry safety stats (educational)
- BLS wages + employment — "moving labor in Newark: median rates, conditions"
- GuideStar / Charity Navigator / Form 990 — financials, exec comp, program ratios, audit history
- SEC EDGAR — link filings if subsidiary/contractor of public co
- Wayback — every prior version → reclaim lost content

### Phase 5 — People-Also-Ask + Related-Searches mining (real FAQ source)

- Per service keyword, query Google PAA + Related Searches via SerpAPI / Bright Data
- Extract 20+ real questions
- Write 60-100 word answers each, sourced from industry corpus + owner interview
- `/faq` + JSON-LD FAQPage

### Phase 6 — pSEO matrix (service × locale × intent × season)

- Build per `13-observability-and-growth/programmatic-seo`:
  - Service × neighborhood × intent (price | how-to | diagnostic | emergency)
  - Service × season (snow removal winter, AC spring, gutter cleaning fall)
  - Service × building type (brownstone vs single-family vs apartment)
- Cap 200 pages/axis to avoid thin-content (Google demotes pSEO sprawl above ~500 generated pages without unique value)
- Every pSEO page MUST have: unique H1, unique meta desc, 800+ unique words, 1 unique image, 3+ unique internal links, 1+ outbound citation

### Phase 7 — Owner-voice extraction

- Even without website, owner may have: YouTube, podcast appearance, LinkedIn posts, IG captions, local-newspaper interview, Chamber of Commerce profile, court testimony, school-board minutes
- Transcribe + extract voice signature (sentence length, vocabulary, recurring phrases, values, stories)
- Apply across generated content
- Cite source for any direct quote (`"As I told the Star-Ledger in 2023..."`)

### Phase 8 — Trust scaffolding (substitute for missing testimonials)

- License + insurance verification + display (state board → photo of license)
- Years in business via state-registration
- Service-area map with shaded coverage zones
- "How we work" 12-step process
- Equipment + brands used ("We use Milwaukee tools, Rheem water heaters, Lennox HVAC")
- Industry associations (Chamber of Commerce, BBB, trade unions, certifications)
- "Featured in" (any public mention — local paper, podcast, Yelp top-10 list)
- Risk disclosures — "What we can't fix" / "When to call someone else" (paradoxically builds trust)

### Phase 9 — Educational lead magnets

- 1-2 page PDFs offered for email:
  - Plumber — "Monthly home plumbing checklist", "Pipe-burst emergency response card", "Water-heater age + replacement guide"
  - HVAC — "Annual HVAC maintenance schedule", "Symptoms-to-cause diagnostic flowchart"
  - Restaurant — "Party-booking planning timeline", "Allergen reference card"
  - Nonprofit — "How-to-apply-for-services flowchart", "Volunteer onboarding pack"
- Hosted via Resend double-opt-in; PDF delivered + drip campaign

### Phase 10 — Cross-channel content reuse

Every web page generates downstream:

- Business card template (front + back, print-ready PDF)
- Social post template (1080×1080 + 1080×1920 story)
- Email signature (HTML + plain-text)
- Print flyer (8.5×11 single-sided with QR back to page)
- Door-hanger (standard 4.25×11)

## Honesty constraints (fabrication is the line — NON-NEGOTIABLE)

- NEVER fabricate customer testimonials. No reviews → show "Reviews coming — we just launched / we're new" + link to Google Business profile.
- NEVER invent employee names, faces, or bios. One owner → team page shows one person. Stock-photo "team members" = build fail.
- NEVER invent credentials. License numbers must verify against state board API.
- NEVER invent press mentions. "Featured in Star-Ledger" requires real archived URL.
- NEVER invent partnerships, certifications, awards. All third-party verifiable.
- Industry-evergreen content is not fabrication — business's official guidance under their name, licensed practitioner stands behind it.
- AI-generated images allowed for decorative/illustrative per `image-quality.md`, but NEVER historical timelines (`timeline-authenticity.md`), NEVER fake team members, NEVER fake before/after customer projects.

## Owner-confirmation gate (soft — content ships flagged)

- After amplification, generate `_owner-review.pdf` — every quantitative claim, credential, "we" statement, service-area, price range for owner green-pen sign-off
- Pages built on unverified industry-evergreen render with `data-confidence="industry-default"` — visible only in admin/preview, hidden on public
- After sign-off, flips to `data-confidence="owner-verified"`
- Soft gate: site ships with industry-default live, but admin dashboard shows "verify these claims" checklist

## Content interlinking (minimum density per page)

- ≥3 related-page links on same site (internal pagerank)
- ≥1 outbound authoritative source (`citations.md`)
- Every service page → corresponding city × service pSEO pages
- Every blog post → ≥2 service pages
- Every FAQ entry → ≥1 service page

## Schema density (per `always.md` post-cut policy)

Warranted because they describe real entities:

- `LocalBusiness` w/ full NAP + opening hours + service area + price range
- `Service` for each service
- `OfferCatalog` for menu
- `FAQPage` (real Q&A from Phase 5)
- `BreadcrumbList` on nested routes
- `WebPage` floor

Skip `Person` if no real bio. Skip `Review`/`AggregateRating` until real reviews exist.

## Add as you go — corpora to build

`industry-corpora/` holds reusable JSON per org type. New vertical → seed:

- `{org-type}/topics.json` — 20+ evergreen topics
- `{org-type}/glossary.json` — 30+ industry terms + plain-language defs
- `{org-type}/faqs.json` — 30+ universal-but-true Q&A pairs
- `{org-type}/process.json` — 12-step "how we work"
- `{org-type}/equipment.json` — brand names + reasons-for-choosing
- `{org-type}/risks.json` — "what we can't fix" disclosures
- `{org-type}/lead-magnets.json` — checklist + schedule + warning-signs PDF outlines

Corpus = durable asset; every new {org-type} site reuses + adds.
