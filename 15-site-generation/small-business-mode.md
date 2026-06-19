---
name: "small-business-mode"
description: "Mode-inference defaults for small-business rebuilds (restaurant, salon, medical, legal, retail, contractor). Google Places NAP authority, Stripe-first donation/booking, simplified copy, owner-friendly admin. Optimizes for non-technical owners."
updated: "2026-05-10"
---

# Small-Business Mode

When mode-inference routes a prompt to `local-business`, build priority order differs from `saas` and `portfolio`:

1. Conversion
2. NAP correctness
3. Trust signals
4. Owner-editable content
5. SEO
6. Polish

Every choice optimizes for "phone calls / bookings / orders" — not "GitHub stars / launch traffic."

## Trigger Phrases

Mode resolves to `local-business` when prompt contains:

- **Food** — restaurant, cafe, bakery, pizza, sushi, deli
- **Personal care** — salon, barber, spa, nails, massage, hair
- **Medical** — medical, dental, chiropractor, physio, orthodontist, dermatology, optometry, veterinarian, clinic
- **Legal** — legal, law firm, attorney, lawyer, paralegal
- **Retail** — retail, boutique, store, shop (without "online store" qualifier — that routes to `saas`)
- **Trade** — contractor, plumber, electrician, hvac, roofing, landscaping, cleaning, moving
- **Fitness** — gym, fitness, yoga, crossfit, martial arts
- **Auto** — auto, mechanic, body shop, detailing
- **Pet** — pet, grooming, kennel, training

Also fires on bare-domain prompts where `_research.json` Google Places type returns any LocalBusiness subtypes per Schema.org.

## Required Pre-Research (Phase 0a, see research-pipeline.md)

Google Places API is **non-negotiable**. Without `GOOGLE_PLACES_API_KEY` + `GOOGLE_MAPS_API_KEY` (api-key-gate enforces), refuse to proceed.

`_research.json` MUST contain:

- `business.name` / `formatted_address` / `formatted_phone_number`
- `business.opening_hours.weekday_text[]`
- `business.google_maps_url` / `google_place_id` / `coordinates{lat,lng}`
- `business.rating` / `user_ratings_total` / `reviews_top3[]`
- `business.photos_r2_urls[]` / `primary_type` / `types[]` / `business_status`

Confidence ≥0.85 on every field or block the build.

**Competitor pull** (free with Places): `nearbysearch` within 5mi same-type, top 5 by rating. Used in copy and pricing (3+ competitors publish prices → we should too).

## Mandatory Page Inventory

Twelve routes minimum:

- `/` — home with primary CTA above-fold
- `/about` — owner story, years in business, credentials
- `/services` — or `/menu` for restaurants
- `/services/{slug}` — per service (pSEO — at least 4)
- `/team` — when ≥2 staff
- `/pricing` — when transparency is competitive advantage
- `/contact` — form + map widget + hours block
- `/locations` — per physical address
- `/reviews` — synced from Google Places + first-party testimonials
- `/faq` — 10+ Q&A from Google Places "People also ask" + service-specific objections
- `/gallery` — Google Places photos R2-mirrored + owner uploads
- `/blog` — ONLY when `_research.json.has_existing_blog === true`

**Service detail pages** are the core pSEO play. Each one:

- H1 = `{Service} in {City}, {State}` · 800+ words
- 1 hero photo (skill 12 image-relevance ≥8/10 to that specific service)
- 3-5 FAQs (FAQPage JSON-LD) · Pricing range
- Before/after gallery when applicable
- "Book Now" / "Call Now" / "Get Quote" CTAs above-fold AND in body AND sticky on mobile

## NAP Authority (***NON-NEGOTIABLE***)

Name + Address + Phone must match Google Business Profile EXACTLY across every page.

- Build gate `validate-nap-consistency.mjs` greps every dist HTML page for the canonical NAP triplet from `_research.json.business`.
- Fails on any deviation (truncated address, formatted phone variations like `(555) 123-4567` vs `555-123-4567`, different suite numbers).
- One inconsistency torpedoes local SEO ranking — Google penalizes inconsistent NAP across listings.

### Hyperlinks

- Every street address → `<a href="https://www.google.com/maps/search/?api=1&query={url-encoded-address}">{address}</a>`
- Every phone → `<a href="tel:+1{e164-digits}">{display-format}</a>` with PostHog `phone_click` + GA4 `generate_lead` onclick
- Every email → `<a href="mailto:{email}">` with `contact_email_click` event

## Conversion Surfaces

### Above-fold primary CTA on `/`

ONE action, owner-chosen:

- **Restaurants** → "Order Online" (Toast/Square deep link) OR "Reserve a Table" (OpenTable/Resy/Tock)
- **Salons** → "Book Now" (Vagaro/Square Appointments/Booksy/Cal.com)
- **Medical/dental** → "Request Appointment" (Tebra/Phreesia/Cal.com webhook)
- **Legal** → "Free Consultation" (Cal.com 30min slot)
- **Contractors** → "Get Free Quote" (form → Inngest → Resend to owner + auto-reply)

NEVER multiple equal-weight CTAs above fold — one primary + "Call Now" `tel:` as universal secondary.

### Sticky mobile bottom bar

"Call" + "Directions" + primary CTA on every page below 768px viewport.

### Conversion tracking (skill 13)

`phone_click` | `direction_click` | `form_submit` | `booking_click` | `order_click` — all into PostHog + GA4 with `value` populated where Stripe price is known.

### Map widget

Full-width Google Maps Embed on `/contact` and footer.

- `<iframe loading="lazy" referrerpolicy="no-referrer-when-downgrade">`
- URL: `https://www.google.com/maps/embed/v1/place?key={GOOGLE_MAPS_API_KEY}&q={encoded-address}&zoom=15`

## Trust Stack (***RANK ABOVE PRETTY***)

Required surfaces in priority order:

1. **Google reviews** — embed top 3 on `/`, full sync on `/reviews`, AggregateRating + Review JSON-LD. `validate-reviews-jsonld.mjs` verifies count + ratings match Google Places source.
2. **Years in business** — heritage timeline on `/about` when `business.founded_year ≥ current_year - 5`; "Family-owned since {year}" badge in header when applicable.
3. **Licenses + certifications** — visible on every service page: Medical (state license #, board cert) · Legal (bar admission, Avvo rating) · Contractor (state license #, insurance carrier, BBB rating).
4. **Local press mentions** — `_research.json.press_mentions[]`; logos row "As featured in {publication}".
5. **Photos of actual owner + actual staff + actual location** — never stock. `validate-photo-authenticity.mjs` blocks stock-looking images on team/about/gallery pages.

## Copy Voice

Sharp voice from `rules/copy-writing.md` applies but dialed down for local-business — repeat customers + word-of-mouth reputation; edgy copy feels off-brand.

- Works: "We've cut hair in this town for 22 years." / "12-minute oil changes. We know you're busy."
- Banned: "We disrupt traditional plumbing." / "Revolutionary new haircut experience."

**Microcopy on forms** — specific beats generic: "We'll text you confirmation within 5 minutes" beats "Submit."

## Stripe-First Booking/Donation

When `local-business` AND business takes deposits/prepayments: default booking flow is Stripe Checkout — NOT a third-party booking platform (2.9%+30¢ vs platform 5-15% take-rate, 2-day payout, no monthly subscription).

**Pattern**:

1. Owner books slot via Cal.com (free tier, 1 calendar)
2. Cal.com webhook → Worker creates Stripe Checkout session for deposit
3. Email magic link to customer
4. On payment success, Stripe webhook → Worker confirms booking + Inngest schedules reminder emails 24h+1h before

**Non-profits within local-business**: Stripe Donation forms beat GiveDirectly/PayPal Giving. `<a href="https://buy.stripe.com/{donation-link-id}">Donate</a>` — accepts Apple Pay/Google Pay/cards/Klarna, direct payout.

## Owner-Editable Content

Two paths in priority order:

1. **Google Business Profile is the CMS** — Hours, photos, services, FAQs, posts edited in Google's UI; build pulls from Places API every 6 hours via Cron Trigger; site re-renders affected pages.
2. **Markdown files in a private R2-mirrored repo** — about story, blog posts, custom descriptions, team bios. Owner emails/texts changes to `brian@megabyte.space`, AI commits + redeploys (~10s turnaround).

Scaffold `/admin` (Clerk magic-link, TipTap or Editor.js) only when owner asks — most don't, email path covers 80%.

## Performance Budget (relaxed for local)

Older customer demographics + slower mobile networks — tighten image budgets:

- Largest hero ≤120KB (vs 200KB default)
- Total page ≤350KB (vs 500KB)
- JS ≤120KB gz (vs 200KB)

Phone+address+hours visible without JS (server-rendered in HTML shell). Lighthouse Mobile Performance ≥85 (raised from default 75).

## Local SEO Stack

### Per-route metadata

Every service-detail title: `{Service} in {City}, {State}` — geo-relevant H1s drive 30%+ ranking gain.

### Schema.org

`LocalBusiness` (or subtype: `Restaurant`, `Dentist`, `LegalService`, `HairSalon`, `MedicalClinic`, `AutoRepair`, `HomeAndConstructionBusiness`) with:

- `@id` · `address` (PostalAddress) · `geo` (GeoCoordinates) · `openingHoursSpecification[]`
- `telephone` · `priceRange` · `aggregateRating` (synced Google Places) · `review[]` top 5

`validate-jsonld-schema.mjs` requires this on every page.

### Other files

- `humans.txt` includes owner name + nearest cross-streets (E-E-A-T humanizing signal)
- `robots.txt` allows everything
- `sitemap.xml` `<priority>`: home 1.0 · services index 0.9 · individual services 0.8 · contact/about 0.7 · blog 0.5

## Acceptance Gate (this mode only)

Build cannot ship until:

1. Google Places fields all populated at confidence ≥0.85
2. NAP consistency gate passes
3. Primary CTA functional end-to-end (form lands in Resend inbox / booking opens correct calendar / `tel:` dials)
4. Map widget renders (no API key error)
5. Reviews JSON-LD validates against schema.org
6. Mobile sticky CTA bar visible at 375px
7. Lighthouse Mobile ≥85
8. Source-fidelity loop passes when source domain exists
