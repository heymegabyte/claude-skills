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

When source is informationally bare, manufacture useful, honest, search-worthy content from public data + industry knowledge + community context — without fabricating testimonials, employees, or customer quotes.

## Auto-fire triggers

- Source crawl <10 unique non-blog URLs, OR total source text <5,000 words
- No `/about`, `/team`, `/services`, `/blog`, `/testimonials` route exists
- Social-media-only presence, newly-formed business (<24 months per Sec of State), or solo operator

## Minimum-viable-content floor (HARD GATE — site does not ship below)

1. 30 unique pages (40+ nonprofit, 50+ local-business multi-service)
2. 2,000+ words per cornerstone (`/about`, `/services/{primary}`, `/contact`, `/process`)
3. 1 educational lead magnet (checklist PDF, annual schedule, warning-signs guide)
4. 1 founder/owner story page ≥800 words from owner interview or public records
5. 20+ FAQ entries w/ 60-100 word answers, sourced from "People Also Ask" + "Related Searches"
6. 5+ blog/resource posts at 1,200+ words each, evergreen + locally-flavored
7. 1 glossary w/ 30+ industry terms plain-language
8. 1 transparency page — licensing, insurance, years in business, service area map, equipment

Fire amplification phases in priority order until floor is cleared.

## Amplification phases

### Phase 1 — Industry-knowledge corpus injection

- Pull `_industry-evergreen-corpus.json` per org type from `~/.agentskills/15-site-generation/industry-corpora/`
- Frame as the business's official guidance (licensed practitioner stands behind it), not "we asked an expert"
- **Plumber** — pipe-burst triage, water-heater lifespans, hard-water symptoms, sewer warning signs, fixture lifecycle
- **HVAC** — annual tune-up schedule, refrigerant by year built, thermostat-by-sqft, indoor air quality
- **Restaurant** — allergen statements, sourcing, dietary accommodations, party-booking
- **Salon** — service menu glossary, prep instructions, aftercare, color-correction reality, pricing-factor breakdown
- **Nonprofit** — service-area maps, income-eligibility tables, intake process, partner agencies, volunteer pipeline
- **Medical** — insurance accepted, what-to-bring, first-visit expectations, billing transparency, patient rights
- **Legal** — practice areas explained, fee-structure types, consultation process, attorney-client privilege explainer
- **Moving labor** — pricing factors, day-of expectations, packing tips, insurance coverage, claims process

### Phase 2 — Geographic + community context

- Census ACS → demographics → "Why we serve {neighborhood}"
- NOAA climate → "Snow removal in Newark: what 32" snowfall looks like"
- OpenStreetMap + Maps → neighborhood boundaries, landmarks → service-area pages
- Local government open data → permits, code violations, zoning pages
- School districts + parishes + fire/police precincts → hyper-local SEO
- Output: `/c/{city}` + `/n/{neighborhood}` pages, one per coverage area

### Phase 3 — Adjacent-business mining

- Scrape top 5 competitors (Google Maps Places + Yelp + their sites)
- Write the business's own version of every common service page competitors have but source doesn't
- Never copy verbatim — extract topics, write fresh
- Never claim competitor credentials — topic list only, not proof

### Phase 4 — Public data enrichment

- State licensing boards — verify + display credential numbers, issue date, status
- Sec of State — year founded, entity type, registered agent
- BBB — accreditation, rating (if positive)
- OSHA + DOL — industry safety stats (educational)
- GuideStar / Charity Navigator / Form 990 — financials, exec comp, program ratios, audit history
- Wayback — every prior version → reclaim lost content

### Phase 5 — People-Also-Ask + Related-Searches mining

- Per service keyword, query Google PAA + Related Searches via SerpAPI / Bright Data
- Extract 20+ real questions; write 60-100 word answers from industry corpus + owner interview
- `/faq` + JSON-LD FAQPage

### Phase 6 — pSEO matrix (service × locale × intent × season)

- Build per `13-observability-and-growth/programmatic-seo`
- Axes: service × neighborhood × intent (price|how-to|diagnostic|emergency); service × season; service × building type
- Cap 200 pages/axis — Google demotes pSEO sprawl above ~500 generated pages without unique value
- Every pSEO page MUST have: unique H1, unique meta desc, 800+ unique words, 1 unique image, 3+ internal links, 1+ outbound citation

### Phase 7 — Owner-voice extraction

- Mine: YouTube, podcast, LinkedIn, IG captions, local-newspaper interview, Chamber profile, court testimony, school-board minutes
- Extract voice signature (sentence length, vocabulary, recurring phrases, values, stories)
- Apply across generated content; cite source for any direct quote

### Phase 8 — Trust scaffolding

- License + insurance verification + display (state board → photo of license)
- Years in business via state-registration
- Service-area map with shaded coverage zones
- "How we work" 12-step process
- Equipment + brands used ("We use Milwaukee tools, Rheem water heaters, Lennox HVAC")
- Industry associations (Chamber, BBB, trade unions, certifications)
- "What we can't fix" / "When to call someone else" disclosures

### Phase 9 — Educational lead magnets

- 1-2 page PDFs offered for email:
  - **Plumber** — "Monthly home plumbing checklist", "Pipe-burst emergency response card", "Water-heater replacement guide"
  - **HVAC** — "Annual maintenance schedule", "Symptoms-to-cause diagnostic flowchart"
  - **Restaurant** — "Party-booking planning timeline", "Allergen reference card"
  - **Nonprofit** — "How-to-apply-for-services flowchart", "Volunteer onboarding pack"
- Hosted via Resend double-opt-in; PDF delivered + drip campaign

### Phase 10 — Cross-channel content reuse

Every web page generates:

- Business card template (front + back, print-ready PDF)
- Social post template (1080×1080 + 1080×1920 story)
- Email signature (HTML + plain-text)
- Print flyer (8.5×11 single-sided with QR back to page)
- Door-hanger (standard 4.25×11)

## Honesty constraints (NON-NEGOTIABLE)

- Never fabricate customer testimonials. No reviews → "Reviews coming — we just launched" + Google Business profile link.
- Never invent employee names, faces, or bios. Stock-photo "team members" = build fail.
- Never invent credentials. License numbers must verify against state board API.
- Never invent press mentions. "Featured in Star-Ledger" requires real archived URL.
- Never invent partnerships, certifications, or awards.
- Industry-evergreen content is not fabrication — it is the business's official guidance under their name.
- AI-generated images: allowed decorative per `image-quality.md`; never historical timelines (`timeline-authenticity.md`), fake team members, or fake before/after projects.

## Owner-confirmation gate (soft)

- After amplification, generate `_owner-review.pdf` — every quantitative claim, credential, "we" statement, service-area, price range for owner sign-off
- Unverified pages render with `data-confidence="industry-default"` in admin/preview only; hidden on public
- After sign-off → `data-confidence="owner-verified"`
- Site ships with industry-default live; admin shows "verify these claims" checklist

## Content interlinking (minimum per page)

- ≥3 internal links to related pages
- ≥1 outbound authoritative source (`citations.md`)
- Every service page → city × service pSEO pages
- Every blog post → ≥2 service pages
- Every FAQ entry → ≥1 service page

## Schema density

- `LocalBusiness` w/ full NAP + opening hours + service area + price range
- `Service` per service; `OfferCatalog` for menu
- `FAQPage` (real Q&A from Phase 5); `BreadcrumbList` on nested routes; `WebPage` floor
- Skip `Person` if no real bio. Skip `Review`/`AggregateRating` until real reviews exist.

## Corpus to build

New vertical → seed in `industry-corpora/{org-type}/`:

- `topics.json` — 20+ evergreen topics
- `glossary.json` — 30+ terms + plain-language defs
- `faqs.json` — 30+ universal-but-true Q&A pairs
- `process.json` — 12-step "how we work"
- `equipment.json` — brand names + reasons-for-choosing
- `risks.json` — "what we can't fix" disclosures
- `lead-magnets.json` — checklist + schedule + warning-signs PDF outlines
