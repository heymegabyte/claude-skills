---
name: "page-set-expansion"
description: "Full standard page sets per org type — drives one-line-prompt completeness. Encodes the jewel pages (/parish-toolkit, /planned-giving, /financials, /annual-report, /transcript, /alumni, /press, /testimonials, /partners, /ways-to-give, /donate/refurbish) that every best-in-class instance of an org type ships but most sources omit. Source-site rebuilds = union(source, standard-set, jewels) per [[source-site-enhancement]]."
updated: "2026-05-21"
---

# Page-Set Expansion — One Prompt → Complete Site

Every rebuild/optimization prompt ships the org-type-canonical page set MINIMUM, not the source-page-set floor.

- Source omissions = build opportunities, never excuses
- "Optimized version of X" means X-plus-everything-X-should-have-had, never X-as-is
- See [[source-site-enhancement]] for trigger conditions

## Org-Type Standard Page Sets (***FLOOR — every rebuild SHIPS THESE***)

### Nonprofit (501c3 / charity / NGO / mission-driven)

**Standard set (14 — every rebuild)**:

- `/` — mission hero + impact line + 3-CTA donate-volunteer-learn
- `/about` — story + founding year + EIN + IRS determination letter PDF
- `/team` — board + staff + advisory council with photos+bios+LinkedIn
- `/services` (programs index) + `/services/{program-slug}` per program
- `/blog` + `/blog/{slug}` — every imported post + new content
- `/donate` — full DonationForm (see domain-features.md nonprofit row)
- `/volunteer` — signup form + role descriptions + scheduling
- `/we-need` — current in-kind needs list
- `/contact` — NAP + map + form + hours
- `/faq` — 16+ Q&A FAQPage JSON-LD
- `/mass-schedule` (religious orgs only) OR `/events` (calendar)
- `/privacy` — CCPA/GDPR + analytics disclosure
- `/accessibility` — WCAG 2.2 AA statement + contact for issues
- `/terms` — donation T&Cs + photo release

**Jewel set (10 — adds 'best-in-class' differentiation, AI-generated when source lacks)**:

- `/annual-report` — last-year-in-review + financial summary + photo essay + board-chair letter; pull from Form 990 + Candid + GuideStar
- `/financials` — Form 990 PDF + Charity Navigator badge + GuideStar Platinum badge + program/admin/fundraising 4-bar breakdown with citations
- `/planned-giving` — bequest language + IRA charitable rollover + DAF grant + stock transfer instructions + planned-giving officer contact
- `/ways-to-give` — taxonomy: one-time | recurring | major-gift | planned | in-kind | stock | crypto | vehicle | employer-match | tribute (one card per path linking to dedicated flow)
- `/donate/{campaign-slug}` — capital campaigns (`/donate/refurbish` consolidates scattered blog "convent repairs" / "clinic wall" / "stainless steel cabinets" into single fundraising target with thermometer + named gift opportunities)
- `/partners` — corporate sponsors + church partners + grant funders + government contracts logos with grayscale→color hover
- `/press` — news mentions + media kit + press contact + downloadable logos+headshots+brand guide
- `/testimonials` — guest stories + volunteer stories + donor stories with consent + photos + first names only for guests
- `/alumni` — past volunteers/employees/board members who still give back — community fabric proof
- `/transcript` — audio sermon / video event transcripts for a11y + SEO + AI search — every audio/video asset has paired transcript page
- `/parish-toolkit` — downloadable resources for partner churches/synagogues/community groups (bulletin inserts, donation drive guides, sermon outlines, social-share kits, fundraiser templates)

**Nonprofit reference incident (***njsk.org 2026-05-21***)**:

- Source ships 8 unique non-blog routes
- `njsk-org.manhattan.workers.dev` ships 8 keep + 14 standard + 10 jewels + 2 locales (`/es/*` + `/pt/*` per [[i18n-by-demographics]]) + 129 normalized blog slugs = ~210 routes from a single prompt
- One-line prompt floor for nonprofit = NEVER less than the 14+10 standard+jewels above, regardless of source size

### SaaS / API / Platform / Dev-Tool

**Standard set (10)**:

- `/` — hero + product demo + social proof + pricing teaser
- `/pricing` — 3-tier comparison + monthly/annual toggle + FAQ
- `/features` — every capability with screenshot+30-word explanation
- `/integrations` — logos grid + per-integration `/integrations/{slug}` deep page
- `/docs` — API reference + quickstart + tutorials + SDK pages
- `/blog` + `/blog/{slug}`
- `/about` — team + funding + investors + thesis
- `/contact` — sales + support + partnership routes
- `/privacy` + `/terms` + `/dpa` (data processing addendum for B2B)
- `/cookies` — per-jurisdiction consent disclosure

**Jewel set (8)**:

- `/changelog` — versioned releases + RSS + per-release pages
- `/security` — SOC2 / GDPR / HIPAA / pen-test summary + responsible-disclosure policy
- `/status` — uptime + incidents (link external Statuspage / self-host Uptime Kuma)
- `/customers` — case studies + named logos + AggregateRating schema
- `/roadmap` — public quarterly with vote/upvote
- `/api` — OpenAPI explorer + interactive console
- `/sdk` — per-language client lib pages (`/sdk/typescript|/sdk/python|/sdk/go|/sdk/ruby|/sdk/rust|/sdk/php|/sdk/java|/sdk/swift|/sdk/kotlin`)
- `/compare/{competitor}` — pSEO competitive landing per [[15-site-generation/local-seo]] templates

### Local Business (restaurant / salon / medical / legal / fitness / retail / contractor)

**Standard set (12)**:

- `/` — NAP-prominent hero + hours + 3-CTA call-book-directions
- `/about` — story + owner bio + license number when regulated
- `/services` index + `/services/{service-slug}` per offering
- `/team` — staff bios + certifications + headshots
- `/gallery` — real photos (never stock for trade-licensed business)
- `/reviews` — Google embed + featured testimonials + Yelp link
- `/contact` — NAP + map + form + hours + parking notes
- `/faq` — 12+ Q&A
- `/specials` — current promos + holiday hours + happy hour
- `/locations` — multi-loc only (one page per location)
- `/privacy` + `/accessibility`

**Jewel set (8)**:

- `/insurance` — accepted providers (medical/dental/optical/legal/auto)
- `/financing` — payment plans / CareCredit / Affirm / Klarna
- `/before-after` — visual proof (salon/dental/contractor/fitness)
- `/blog` — local-SEO content, recipe blog for restaurants, education for medical/legal
- `/menu` — restaurant; full menu with allergens
- `/booking` — cal.diy / Cal.com / Calendly / OpenTable / Resy embed dedicated route
- `/emergency` — after-hours contact for medical/dental/plumber/HVAC/legal
- `/service-area` — pSEO city pages per neighborhood/town served

### Portfolio / Personal / Founder

**Standard set (5)**:

- `/` — name + role + 1-line bio + flagship project + CTA
- `/about` — long bio + skills + timeline + contact
- `/work` — project grid + per-project case study `/work/{slug}`
- `/blog` — optional but recommended
- `/contact` — form + email + social

**Jewel set (6)**:

- `/now` — Derek Sivers /now convention (current focus)
- `/uses` — gear/stack/tools page
- `/colophon` — site stack + design credits + build process
- `/reading-list` — current/recent reading + RSS
- `/talks` — speaking + slides + video embeds
- `/press` — interviews + features + mentions

### Church / Religious Org

**Standard set (10)**:

- `/` + `/about` — theology + history
- `/leadership` — pastor + staff + elders/deacons
- `/services` — Mass/service times + livestream
- `/sermons` — audio/video archive with transcripts
- `/events` — calendar
- `/groups` — small groups directory
- `/give` — Stripe-first donations
- `/visit` — newcomer welcome + parking + childcare + dress code
- `/contact`

**Jewel set (6)**:

- `/baptism|/sacraments|/lifecycle-events` — per-tradition
- `/prayer-requests` — form + privacy
- `/missions` — outreach + global partnerships
- `/transcript` — every sermon transcribed
- `/library` — book recommendations + study guides
- `/multilingual` — locale routes per [[i18n-by-demographics]] when congregation is mixed

### Government / Institutional / Civic

**Standard set (12)**:

- `/` + `/about` — mission + history + organizational structure
- `/services` — service finder with search + filters
- `/departments` — each with deep page
- `/leadership` — org chart + bios
- `/meetings` — calendar + agendas + minutes archive
- `/documents` — organized library
- `/news` + `/press`
- `/contact` — per-department
- `/accessibility` — WCAG 2.2 AA + ADA Title II compliance statement + accommodation request form
- `/privacy` + `/foia` (records request) + `/transparency` (budget + audits + salaries)

**Jewel set (5)**:

- `/feedback` — resident input form
- `/jobs` — open positions
- `/emergency` — preparedness + alerts signup
- `/translate` — locale selector (WCAG 2.1 AA mandate per ADA Title II)
- `/data` — open-data portal links

### Education (K-12 / higher-ed / nonprofit-edu)

**Standard set (12)**:

- `/` + `/about` — mission + accreditation badges
- `/academics` — programs index + per-program pages
- `/faculty`
- `/admissions` — process timeline + apply CTA
- `/calendar`
- `/news`
- `/athletics` (K-12+college)
- `/student-life`
- `/parents` (K-12) OR `/alumni` (college)
- `/give`
- `/contact`

**Jewel set (6)**:

- `/tuition` — fee schedule + financial aid + scholarships
- `/visit` — campus tour + open house
- `/library`
- `/handbook` — student/parent handbook PDF + searchable
- `/board` — trustees + meetings
- `/transcript-request` — records

### Healthcare (clinic / hospital / private practice)

**Standard set (12)**:

- `/` + `/about`
- `/providers` — each provider with credentials + bio + headshot
- `/services` — treatments index + per-service deep pages
- `/insurance` — accepted plans
- `/patient-portal` — link to MyChart/Athena/etc.
- `/appointments` — request form (NOT booking, requires human confirmation)
- `/locations`
- `/contact`
- `/privacy` — HIPAA notice
- `/accessibility` — HHS Section 504 compliance
- `/faq`

**Jewel set (6)**:

- `/billing` — financial assistance + payment plans + Good Faith Estimate per No Surprises Act
- `/forms` — downloadable new-patient + consent + auth-to-disclose
- `/conditions` — encyclopedia per condition treated (pSEO multiplier)
- `/telehealth`
- `/emergency` — after-hours instructions
- `/blog` — patient education

### Legal (law firm / solo practice)

**Standard set (10)**:

- `/` + `/about` — firm history
- `/attorneys` — per-attorney pages with bar admissions + JD school + clerkships + practice areas
- `/practice-areas` — index + per-area deep page
- `/results` — verdicts + settlements, anonymized
- `/contact` — free-consultation CTA + intake form
- `/blog` — legal updates
- `/faq`
- `/privacy` + `/disclaimer` (no-attorney-client until engagement letter)

**Jewel set (6)**:

- `/fees` — transparent pricing/retainer structure when ethically permissible
- `/client-portal` — MyCase/Clio link
- `/community` — pro bono + bar association leadership
- `/press` — media mentions
- `/multilingual` — locale routes per service area demographics
- `/emergency` — after-hours criminal defense / DUI / family violence

## Discovery Rule (***org-type ambiguous? default UP, not down***)

- Infer via skill 02 + `_research.json.category` + domain TLD heuristics (`.church|.org|.foundation`→nonprofit, `.app|.io|.dev`→saas, `.law`→legal, `.health`→healthcare)
- When still ambiguous, default to the LARGER standard+jewel set rather than the smaller one
- Over-shipping pages is cheap; under-shipping requires manual follow-up prompts

## Cross-Multiply with i18n (***page-set × locales = total route count***)

Every page in (standard ∪ jewels) ships per locale per [[i18n-by-demographics]].

- Newark-NJ nonprofit shipping ES+PT: `(8_keep + 14_standard + 10_jewels) × 3_locales + 129_blog_posts × 3_locales = ~474 routes minimum`
- **Hard gate**: deployed route count < expected = build fail with `_route_inventory_gap.json` diagnostic listing every missing route

## Content Authority per Page (***never stub, never lorem***)

- Every standard + jewel page ships REAL CONTENT generated from researched sources
- Every quantitative claim cited per [[citations]] APA 7th ed inline + reference list
- Every contact entity hyperlinked per [[always]] universal hyperlink mandate
- AI-generated narrative runs through anti-slop grep per [[copy-writing]] banned word list before deploy

## Jewel Content Authoring Playbook (***per-page data source → typed-block content***)

Each jewel page gets a dedicated `Agent` spawn per `[[source-site-enhancement]]` § Parallel-agent playbook (Agent-F..K). Each agent receives:

`{jewel_slug, org_type, _research.json, _brand.json, _scraped_content.json, target_word_count, citation_mandate}`

And emits typed-block JSON:

`{ blocks: [{type:"hero"|"lead"|"heading"|"paragraph"|"stat"|"quote"|"callout"|"faq"|"cta"|"table"|"timeline", ...}], jsonLd: [...], citations: [...] }`

### Nonprofit Jewel → Source Map

- **`/financials`**
  - Sources: Candid API Form 990 (free tier: `/v3/api/organizations/{ein}`) + Charity Navigator API badge + GuideStar Platinum + state AG charity registration
  - Content: Hero stat ("92% to programs"), 4-bar breakdown chart with `<CountUp>` animation, last-3-years revenue/expense table, Form 990 PDF download, accreditation badge row, donor protection statement
  - JSON-LD: Organization+NGO+FinancialProduct

- **`/annual-report`**
  - Sources: Prior-year 990 + Wayback past-year blog scrape + impact metric aggregation across blog corpus + board-chair photo+letter
  - Content: Cover image (hero), board-chair letter, 6-stat impact grid via `<CountUp>`, photo essay (4-8 images), donor honor roll, program highlights, financial summary card, downloadable PDF link
  - JSON-LD: Organization+Report

- **`/planned-giving`**
  - Sources: CFR §1.170A-7 (bequest language) + IRA-QCD rules ($105K limit 2025) + DAF transfer instructions + stock-transfer DTC + life insurance + charitable gift annuity + charitable remainder trust
  - Content: 5 jewel-card grid (one per giving vehicle) + sample bequest language code-block + tax-benefit table + planned-giving officer `<MailLink>`+`<TelLink>` + downloadable estate-planning brochure PDF
  - JSON-LD: Organization+DonateAction

- **`/ways-to-give`**
  - Sources: Internal taxonomy of all giving paths
  - Content: Card grid (one per path): one-time / monthly / major-gift / planned / in-kind / stock / crypto / vehicle / employer-match / tribute — each card has icon + 2-sentence description + CTA to dedicated route
  - JSON-LD: Organization+DonateAction (one per path)

- **`/donate/{campaign-slug}`**
  - Sources: Consolidate scattered blog campaign mentions (e.g. njsk.org "convent repairs" + "clinic wall" + "stainless steel cabinets" → `/donate/refurbish`)
  - Content: Capital campaign hero with thermometer (raised/goal) + photo gallery + named gift opportunities table + match-grant callout + Stripe checkout embed + donor honor wall
  - JSON-LD: Organization+DonateAction+FundraisingEvent

- **`/parish-toolkit`** (religious-affiliated)
  - Sources: Downloadable PDFs generated via Anthropic API + PDF-Kit
  - Content: 4-section card grid (bulletin inserts | donation drive guides | sermon outlines | social-share kits | fundraiser templates) — each card lists 3-5 downloadable PDFs + preview thumbnail + last-updated date
  - JSON-LD: Organization+CreativeWork (per PDF)

- **`/partners`**
  - Sources: Partner-org logo extraction via Clearbit Logo API + verified relationship descriptions from scraped blog mentions
  - Content: Logo wall (grayscale → color on hover) grouped by partner-type (corporate sponsors | church partners | grant funders | govt contracts) + 1-sentence relationship description per logo
  - JSON-LD: Organization+OrganizationRole

- **`/press`**
  - Sources: Newspapers.com scrape + Wayback news section + Google News API + press contact + downloadable media kit
  - Content: Article list (outlet logo + headline + date + 40-word paraphrase + outbound link) + press-kit downloadables (logos in 4 formats + headshots + brand guide PDF + key facts one-pager) + press contact `<MailLink>`
  - JSON-LD: NewsMediaOrganization+NewsArticle (per mention)

- **`/testimonials`**
  - Sources: Aggregate from blog corpus + donor letters + volunteer feedback
  - Content: Carousel of 8-12 testimonials (guest stories with first name only + photo with consent + 80-120 word quote + role: "guest" / "volunteer" / "donor" / "partner") + consent statement footer
  - JSON-LD: Organization+Review+Person

- **`/transcript`**
  - Sources: Whisper API on every audio/video asset extracted by Agent-D media-walker + structured chapter markers
  - Content: Per-asset transcript page with original audio/video embed (with captions) + structured transcript blocks (timestamp + speaker + text) + auto-generated chapters + download VTT/SRT links
  - JSON-LD: CreativeWork+AudioObject/VideoObject+Transcript

- **`/alumni`**
  - Sources: Past staff/board LinkedIn scrape (with consent gate) + named volunteer stories from blog corpus + community giving stories
  - Content: 12-24 person grid (headshot + role-then + role-now + 60-word "still gives back via..." story) + community-fabric statement + alumni reunion CTA
  - JSON-LD: Organization+Person (per alum)

### SaaS Jewel → Source Map (abbreviated)

- `/changelog` ← GitHub releases API + git tags + per-release pages
- `/security` ← SOC2/ISO/HIPAA badges + pen-test summary + `security.txt` + responsible-disclosure
- `/status` ← Statuspage.io API embed + 90-day uptime chart + incident archive
- `/customers` ← case study writeups + named logos + AggregateRating
- `/roadmap` ← public Github Projects board + vote/upvote integration
- `/api` ← OpenAPI schema → interactive Swagger/Scalar UI
- `/sdk/{lang}` ← per-language quickstarts auto-generated from `openapi.yaml`

### Local-Business Jewel → Source Map (abbreviated)

- `/insurance` ← scraped accepted-provider list + state-DOI verification
- `/financing` ← Affirm/Klarna/CareCredit/in-house plan terms
- `/before-after` ← consent-tagged paired images via clip-path slider
- `/menu` (restaurant) ← OCR scanned menu + allergen tags + dietary icons
- `/booking` ← cal.diy/Cal.com/Calendly/OpenTable/Resy embed
- `/emergency` ← 24/7 contact + service-area map

### Citation + Anti-Slop Gate

Every jewel agent's output runs through:

1. **`validate-citations.mjs`** — every quantitative claim has APA inline cite + `_citations.json` ref entry
2. **`validate-banned-slop.mjs`** — zero hits on banned-word list from `[[copy-writing]]`
3. **`validate-hyperlinks.mjs`** — every email/phone/address/named-org is `<a>`-wrapped

Failures bounce back to the spawning agent for regeneration (max 2 retries) before manual escalation.

## See Also

- [[source-site-enhancement]] — the trigger rule
- [[i18n-by-demographics]] — locale multiplier
- [[15-site-generation/SKILL]] §URL preservation
- [[15-site-generation/source-fidelity-loop]] — visual brand match
- [[15-site-generation/local-seo]] — pSEO templates for service-area × locale multiplication
- [[09-brand-and-content-system/per-route-metadata]] — per-route unique title/desc/keyphrase
- [[citations]] — every quantitative claim cited
- [[copy-writing]] — anti-slop grep
- [[always]] — hyperlink + JSON-LD + FAQ + WCAG mandates
