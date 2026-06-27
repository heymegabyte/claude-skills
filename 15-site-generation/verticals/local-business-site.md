---
name: local-business-site
description: Directive playbook for service-area local businesses — plumbers, HVAC, salons, dentists, attorneys, accountants, contractors.
when_to_use: When the business has a defined local service area (city/county) and ≤5 fixed locations — trades, professional services, personal services, repair, legal, medical, retail.
---

# Local Business Site Skill

## Goal
Convert local searchers into bookings and calls. The site competes against Yelp, Google Maps, and a dozen mediocre competitors — it must rank, answer fast, and make booking a 1-tap action.

## Above the fold (mandatory)
- Headline: `{service} in {city}` exactly (load-bearing for SEO)
- Subhead: one differentiator (years in business, license number, response-time guarantee, family-owned-since)
- Primary CTA: `Book Now` OR `Call Now` (whichever the trade actually closes on — emergency plumbers → call; salons → book)
- Status pill: `Available today` / `Booked through Friday` / `Open until 8pm`
- Hero: photo of the actual owner / shop / signage, NEVER stock

## Required pages
- `/` home
- `/services` index + `/services/{service-slug}` (one per service offered, minimum 8)
- `/about` + `/team` (with real headshots — never AI-generated)
- `/service-area` with shaded coverage map + `/c/{city}` page per city served
- `/pricing` (transparent ranges when possible; "free estimate" CTA otherwise)
- `/gallery` (before/after for trades, portfolio for visual services)
- `/reviews` (pulled from Google + Yelp + Facebook)
- `/booking` + provider-specific embed (Square / Calendly / Schedulista / Vagaro)
- `/faq` with 20+ real People-Also-Ask Q&A entries
- `/contact` with `tel:` + `mailto:` + `https://maps.app.goo.gl/…` directions
- `/insurance` + `/financing` when applicable
- `/blog/{post}` — 5+ evergreen posts (warning signs, how-to-prepare, what-to-expect)
- `/emergency` for trades that handle emergencies — hero is just the phone number, big

## Trust scaffolding (mandatory)
- State license number + link to the licensing board's lookup tool
- Insurance carrier name + COI available on request
- Years in business + state-registration confirmation
- BBB rating + link when A or better
- Real owner bio + headshot
- Equipment + brand names used (`We use Milwaukee tools, Rheem water heaters`)
- Trade association memberships (Chamber of Commerce, union, certifications)
- "What we can't fix" disclosure — paradoxically builds trust

## Local SEO (mandatory)
- `LocalBusiness` JSON-LD on home with full NAP + `geo` + `openingHoursSpecification`
- One `LocalBusiness` block per location if multi-location
- `Service` schema for every service
- `OfferCatalog` for service menu
- `FAQPage` with real Q&A (mined from People-Also-Ask via SerpAPI)
- `Review` + `AggregateRating` (real reviews only)
- `BreadcrumbList` on every nested route
- Google Business Profile link in footer
- City × service pSEO matrix: every {city} × every {service} = a route (cap 200/axis)

## Conversion rules
- `data-bcl-phone-click` attr on every `tel:` link (analytics fires)
- `data-bcl-booking-click` on every booking CTA
- `data-bcl-direction-click` on every map link
- Sticky `Call` button on mobile (always visible)
- Web form posts to `/api/contact-form/{slug}` with Turnstile invisible widget
- "Got a question?" chat widget bottom-right — answers basic FAQ, escalates to phone

## Anti-patterns
- Never invent customer testimonials — show "Reviews coming" + link to Google Business profile until real ones exist
- Never use AI-generated team headshots — solo operator = team page with one person
- Never claim credentials without state-board verification
- Never hide pricing entirely if the trade has transparent ranges
- Never list 24/7 emergency without an actual on-call rotation
- Never use the word "premier", "trusted", "leading", "best-in-class" — banned per copy-writing rule
