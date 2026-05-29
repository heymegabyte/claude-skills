# Thin-Source Content Amplification (***UNIVERSAL — fires on every site build where the source is informationally bare***)

The rebuild problem isn't "this site has too much" — it's "this site has 4 pages, no blog, no team bio, no testimonials, no press, no story." Default behavior of generating a faithful clone produces a 4-page site. This rule forces the pipeline to MANUFACTURE useful, honest, search-worthy content from public data + industry knowledge + community context — without fabricating testimonials, employees, or customer quotes.

## Auto-fire triggers
Fires when ANY of:
- Source crawl yields <10 unique non-blog URLs
- Total source text <5,000 words
- No `/about`, `/team`, `/services`, `/blog`, or `/testimonials` route exists
- Social-media-only presence (Facebook page, no website OR Squarespace 4-page template)
- Newly-formed business (state registration <24 months old per Secretary of State lookup)
- Solo operator with no public bio

## Minimum-viable-content floor (***HARD GATE — site does not ship below this floor***)
Every shipped site must have at minimum:
1. **30 unique pages** of real, useful content (40+ for nonprofits, 50+ for local-business multi-service)
2. **2,000+ words per cornerstone page** (`/about`, `/services/{primary}`, `/contact`, `/process`)
3. **1 educational lead magnet** (checklist PDF, annual schedule, warning-signs guide)
4. **1 founder/owner story page** ≥800 words sourced from owner interview or public records
5. **20+ FAQ entries** with 60-100 word answers, sourced from real "People Also Ask" + "Related Searches" data
6. **5+ blog/resource posts** at 1,200+ words each, evergreen + locally-flavored
7. **1 glossary page** with 30+ industry terms defined plain-language
8. **1 transparency page** — licensing, insurance, years in business, service area map, equipment used

If floor not met → fire amplification phases in priority order below until floor cleared.

## Amplification phases (in priority order — highest content yield first)

### Phase 1 — Industry-knowledge corpus injection
- Pull `_industry-evergreen-corpus.json` per org type from `~/.agentskills/15-site-generation/industry-corpora/` (build this if missing — see "Add as you go")
- Universal-but-true content: a Newark plumber's "What to do during a pipe burst" page is accurate whether they wrote it or not
- Honesty: this content is the BUSINESS's official guidance, not "we asked an expert" — the business stands behind it because they're licensed in the trade
- Topics per org type:
  - **Plumber** — pipe-burst triage, water-heater lifespans, hard-water symptoms, sewer-line warning signs, fixture lifecycle
  - **HVAC** — annual tune-up schedule, refrigerant by year built, thermostat-by-square-footage, indoor air quality
  - **Restaurant** — allergen statements, sourcing, dietary accommodations, party-booking process
  - **Salon** — service menu glossary, prep instructions, aftercare, color-correction reality, pricing-factor breakdown
  - **Nonprofit** — service-area maps, income-eligibility tables, intake process, partner agencies, volunteer pipeline
  - **Medical** — insurance accepted, what-to-bring, first-visit expectations, billing transparency, patient rights
  - **Legal** — practice areas explained, fee-structure types, consultation process, attorney-client privilege explainer
  - **Moving labor** — pricing factors, what to expect on day-of, packing tips, insurance coverage, claims process

### Phase 2 — Geographic + community context
- Pull from APIs and write per-locale content:
  - **Census ACS** — neighborhood demographics → "Why we serve {neighborhood}"
  - **NOAA climate** — seasonal weather → "Snow removal in Newark: what 32" snowfall looks like"
  - **OpenStreetMap + Maps API** — neighborhood boundaries, landmarks → service-area pages
  - **Local government open data** — building permits, code violations, zoning → "Renovating in Newark: what permits you need"
  - **School districts + parishes + fire/police precincts** — micro-community context for hyper-local SEO
- Output: `/c/{city}` + `/n/{neighborhood}` pages, one per coverage area, with locale-flavored copy

### Phase 3 — Adjacent-business mining
- Scrape top 5 competitors in same metro (via Google Maps Places API + Yelp + their own websites)
- Extract: services offered, price-range patterns, FAQs answered, service-area boundaries, hours, accreditations
- Write the business's own version of every common service page that competitors cover but source doesn't
- **NEVER copy competitor copy verbatim** — extract topics, write fresh
- **NEVER claim competitor credentials** — pull only the topic list, not the proof

### Phase 4 — Public data enrichment
- **State licensing boards** — verify and display credential numbers, issue date, status (NJ Division of Consumer Affairs, CA Contractors State License Board, etc.)
- **Secretary of State business registration** — year founded, business entity type, registered agent
- **Better Business Bureau** — accreditation status, rating (if positive)
- **OSHA + DOL** — industry safety stats for the trade (educational content)
- **BLS wages + employment** — "moving labor in Newark: median rates, working conditions"
- **GuideStar / Charity Navigator / Form 990** (nonprofits) — financials, executive comp, program ratios, audit history
- **SEC EDGAR** — if business is a subsidiary/contractor of a public co, link the filing
- **Wayback Machine** — every prior version of any related online presence → reclaim lost content

### Phase 5 — People-Also-Ask + Related-Searches mining (real FAQ source)
- For every service keyword, query Google's "People Also Ask" + "Related Searches" via SerpAPI or Bright Data
- Extract 20+ real questions people actually search
- Write 60-100 word answers each, sourced from industry-knowledge corpus + owner interview
- Output to `/faq` + JSON-LD FAQPage (real Q&A now, per `[[always]]` Cut 2)

### Phase 6 — pSEO matrix (service × locale × intent × season)
- Build the matrix automatically per `[[13-observability-and-growth/programmatic-seo]]`:
  - **Service** × **neighborhood** × **intent** (price | how-to | diagnostic | emergency)
  - **Service** × **season** (snow removal in winter, AC tune-up in spring, gutter cleaning in fall)
  - **Service** × **building type** (brownstone vs single-family vs apartment)
- Cap at 200 pages per axis to avoid thin-content flag (Google demotes pSEO sprawl above ~500 generated pages without unique value)
- Every pSEO page MUST have: unique H1, unique meta desc, 800+ unique words, 1 unique image, 3+ unique internal links, 1+ outbound citation

### Phase 7 — Owner-voice extraction
- Even if business has no website, owner may have: YouTube channel, podcast appearance, LinkedIn posts, Instagram captions, local-newspaper interview, Chamber of Commerce profile, court testimony, school-board minutes
- Transcribe + extract voice signature (sentence length, vocabulary, recurring phrases, values, stories)
- Apply voice across generated content so it sounds like the owner, not a template
- **Cite source for any direct quote** (`"As I told the Star-Ledger in 2023..."`)

### Phase 8 — Trust scaffolding (substitute for missing testimonials)
- License + insurance verification + display (state board lookup → photo of license)
- Years in business via state-registration record
- Service-area map with shaded coverage zones
- "How we work" 12-step process page (universally useful, builds trust)
- Equipment + brands used (builds confidence: "We use Milwaukee tools, Rheem water heaters, Lennox HVAC")
- Industry associations + memberships (Chamber of Commerce, BBB, trade unions, certifications)
- "Featured in" / "Mentioned by" (any public mention counts — local paper, podcast, Yelp top-10 list)
- Risk disclosures — "What we can't fix" / "When to call someone else" (paradoxically increases trust)

### Phase 9 — Educational lead magnets
- 1-2 page PDFs offered in exchange for email:
  - **Plumber** — "Monthly home plumbing checklist", "Pipe-burst emergency response card", "Water-heater age + replacement guide"
  - **HVAC** — "Annual HVAC maintenance schedule", "Symptoms-to-cause diagnostic flowchart"
  - **Restaurant** — "Party-booking planning timeline", "Allergen reference card"
  - **Nonprofit** — "How-to-apply-for-services flowchart", "Volunteer onboarding pack"
- Hosted via Resend double-opt-in; PDF delivered + drip campaign starts

### Phase 10 — Cross-channel content reuse
- Every web page generates downstream artifacts:
  - Business card template (front + back, print-ready PDF)
  - Social post template (1080×1080 + 1080×1920 story format)
  - Email signature block (HTML + plain-text)
  - Print flyer (8.5×11, single-sided, with QR back to the page)
  - Door-hanger template (standard 4.25×11)
- Content goes further than the site

## Honesty constraints (***NON-NEGOTIABLE — fabrication is the line***)
- **Never fabricate customer testimonials.** If no real reviews exist, show "Reviews coming — we just launched / we're new" + link to Google Business profile where reviews are collected.
- **Never invent employee names, faces, or bios.** If only one owner exists, the team page shows one person. Stock-photo faces of fake "team members" is a build-fail.
- **Never invent credentials.** License numbers must verify against the state board API. If verification fails, the credential is not shown.
- **Never invent press mentions.** "Featured in The Star-Ledger" requires a real archived URL.
- **Never invent partnerships, certifications, or awards.** All must be third-party verifiable.
- **Industry-evergreen content** is not fabrication — it's the business's official guidance, posted under their name, and they stand behind it as a licensed practitioner of that trade.
- **AI-generated images** are allowed for decorative/illustrative use per `[[image-quality]]`, but never for historical timelines (`[[timeline-authenticity]]`), never for fake "team members", never for fake "before/after customer projects".

## Owner-confirmation gate (***soft gate — content ships flagged for review***)
- After amplification, generate `_owner-review.pdf` — every quantitative claim, every credential, every "we" statement, every service-area boundary, every price range listed for the owner to verify with a green-pen sign-off
- Pages built on unverified industry-evergreen content render with a `data-confidence="industry-default"` attribute → visible only in admin/preview, hidden on public render
- After owner sign-off, attribute flips to `data-confidence="owner-verified"`
- Soft gate: site ships with industry-default content live, but admin dashboard shows a "verify these claims" checklist

## Content interlinking (***minimum density per page***)
- Every page links to ≥3 related pages on the same site (internal pagerank)
- Every page links to ≥1 outbound authoritative source (citation per `[[citations]]`)
- Every service page links to its corresponding city × service pSEO pages
- Every blog post links to ≥2 service pages
- Every FAQ entry links to ≥1 service page

## Schema density (per `[[always]]` post-cut policy)
Even with thin source, these schemas are warranted because they describe real entities:
- `LocalBusiness` with full NAP + opening hours + service area + price range
- `Service` for each service offered
- `OfferCatalog` for service menu
- `FAQPage` (real Q&A from Phase 5)
- `BreadcrumbList` on nested routes
- `WebPage` floor
Skip `Person` schema if no real bio exists. Skip `Review`/`AggregateRating` until real reviews exist.

## Add as you go — corpora to build over time
The `industry-corpora/` directory holds reusable JSON files per org type. When a new vertical is encountered, the build prompts the corpus author to seed:
- `industry-corpora/{org-type}/topics.json` — 20+ evergreen content topics
- `industry-corpora/{org-type}/glossary.json` — 30+ industry terms + plain-language definitions
- `industry-corpora/{org-type}/faqs.json` — 30+ universal-but-true Q&A pairs
- `industry-corpora/{org-type}/process.json` — 12-step "how we work" workflow
- `industry-corpora/{org-type}/equipment.json` — brand names + reasons-for-choosing
- `industry-corpora/{org-type}/risks.json` — "what we can't fix" disclosures
- `industry-corpora/{org-type}/lead-magnets.json` — checklist + schedule + warning-signs PDF outlines
This corpus is the durable asset — every new {org-type} site reuses + adds to it.

## Reference patterns
- **Soup kitchen with 8-page Squarespace** → expand to 24-route nonprofit standard set per `[[source-site-enhancement]]` + 10 jewels + 5 evergreen blog posts on hunger statistics + glossary of food-security terms + 1 lead magnet ("How to refer someone to free meals in Newark")
- **Plumber with Facebook-only presence** → 50-page site: home + about + 12 service pages + 30 neighborhood pSEO pages + FAQ + blog (5 posts) + glossary + emergency-response landing + 2 lead magnets
- **Solo lawyer with bare-bones site** → 35-page site: home + about + 8 practice-area pages + fee-structure explainer + 12 FAQ + 5 evergreen posts + glossary + "what to bring to your consultation" + lead magnet
- **New restaurant with Instagram-only** → 25-page site: home + menu (real photos) + party-booking + allergens + sourcing + neighborhood pages × 3 + chef-bio + 5 evergreen posts on cuisine + reservation system

## What this rule does NOT do
- Doesn't waive the format/quality bar from `[[copy-writing]]`, `[[image-quality]]`, `[[citations]]`, `[[always]]`
- Doesn't force generation when source is rich (auto-fire triggers ensure it only fires when needed)
- Doesn't fabricate — the line between manufactured useful content and slop fabrication is verifiability + honesty
- Doesn't replace owner involvement — the owner-confirmation gate keeps the owner in the loop

## Cross-links
- `[[source-site-enhancement]]` (the full-page-set + jewel expansion engine — Phase 1 of this rule augments it)
- `[[09-brand-and-content-system]]` (real-brand extraction; thin-source amplification supplements when extraction yields little)
- `[[15-site-generation]]` (the build pipeline; Phase 2-10 hook into the bolt-artifact emission)
- `[[13-observability-and-growth/programmatic-seo]]` (pSEO matrix — Phase 6)
- `[[copy-writing]]` (banned slop words, anti-AI tone — applies to all generated content)
- `[[image-quality]]` (no AI fake team photos, real photos when possible)
- `[[timeline-authenticity]]` (no AI historical photos)
- `[[citations]]` (every quantitative claim cited per route policy)
- `[[always]]` (Hard Gates still apply post-amplification)
- `[[i18n-by-demographics]]` (locale mirrors apply on top of amplification when triggers met)
- `[[full-autonomy]]` (parallel-agent fan-out for the 10 amplification phases per `[[monitor-orchestration]]`)
