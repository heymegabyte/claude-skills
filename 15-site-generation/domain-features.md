---
name: "domain-features"
description: "Category-specific feature requirements for 15+ business types. Loaded by build prompt to add domain-appropriate sections, schema, and functionality."
updated: "2026-04-24"
---

# Domain Features

Each business category gets specific sections, schema types, and interactive elements beyond the base template. Features loaded from D1 `domain_features` table or hardcoded fallback below.

## Category→Feature Map

**Restaurant/Cafe:** Menu with categories+prices+dietary icons (V/VG/GF/DF) | OpenTable/Resy reservation widget or built-in form | Hours with holiday exceptions | Photo gallery (food-first, min 8 dishes) | Chef/team bios | Catering inquiry form | JSON-LD: Restaurant+Menu+FAQPage | Special: daily specials section, happy hour callout

**Salon/Spa:** Service menu with duration+price+description | Online booking CTA (link to existing system or built-in form) | Before/after gallery (side-by-side layout) | Stylist/therapist profiles with specialties | Product recommendations section | Gift card CTA | JSON-LD: HealthAndBeautyBusiness+PriceSpecification | Special: loyalty program highlight

**Medical/Dental:** Provider profiles with credentials+headshots | Insurance accepted list (searchable) | Patient portal link | Conditions treated (expandable accordion) | Telehealth availability badge | HIPAA notice in footer | Appointment request form (NOT booking — requires human confirmation) | JSON-LD: MedicalBusiness+Physician | Special: emergency contact prominent, ADA compliance critical

**Legal:** Practice areas with detailed descriptions | Attorney profiles with bar admissions+education | Case results/verdicts (anonymized) | Free consultation CTA (prominent, every page) | Blog/legal updates section | FAQ per practice area | JSON-LD: LegalService+Attorney | Special: disclaimer footer, no guarantees language

**Fitness/Gym:** Class schedule (weekly grid, filterable) | Membership tiers (comparison table) | Trainer profiles with certifications | Virtual tour / facility gallery | Free trial CTA | Transformation stories (before/after with consent) | JSON-LD: SportsActivityLocation | Special: mobile-first schedule view

**Automotive:** Services list with price ranges | Online appointment scheduling | Vehicle makes/models served | Coupons/specials section | Customer reviews prominent | ASE certification badges | JSON-LD: AutoRepair | Special: emergency/towing number prominent

**Construction/Contractor:** Project portfolio (masonry grid with filters: residential/commercial/type) | License+insurance+bonding badges | Service area map | Free estimate CTA | Process timeline (step-by-step) | Testimonials with project photos | JSON-LD: HomeAndConstructionBusiness | Special: license number in footer

**Photography:** Portfolio gallery (masonry, lightbox, categories) | Pricing packages (session types) | Booking calendar or inquiry form | Client access portal link | Blog with recent shoots | Instagram feed integration | JSON-LD: ProfessionalService | Special: image-heavy, minimal text, full-bleed hero

**Real Estate:** Property listings (grid+map view) | Agent profiles | Market reports/blog | Neighborhood guides | Mortgage calculator widget | Virtual tour embeds | Home valuation CTA | JSON-LD: RealEstateAgent | Special: IDX integration link, MLS disclaimer

**Education:** Programs/courses list with details | Faculty directory | Admissions process timeline | Campus gallery/virtual tour | Events calendar | Student resources links | Apply now CTA | JSON-LD: EducationalOrganization+Course | Special: accreditation badges

**Financial/Accounting:** Services matrix (tax/audit/advisory/bookkeeping) | Team credentials (CPA, EA, CFP) | Client portal link | Tax deadline calendar | Resource library (downloadable guides) | Free consultation CTA | JSON-LD: FinancialService+AccountingService | Special: regulatory disclaimers

**Retail:** Product highlights (featured, not full catalog) | Store locator if multi-location | Brand story section | Loyalty program CTA | Instagram/social shop link | Events/workshops calendar | JSON-LD: Store+Product | Special: link to existing ecommerce, don't rebuild catalog

**Non-Profit:** Donation CTA (prominent, 3+ placements, suggested amounts) | Impact metrics (animated counters) | Programs/services list | Volunteer signup form | Events calendar | Newsletter signup | Partner/sponsor logos | Annual report highlights | JSON-LD: NGO+DonateAction | Special: mission statement hero, 501(c)(3) EIN in footer

**Government/Institutional:** Service finder (search/filter) | Department directory | Document library (PDFs, organized by category) | News/press releases | Meeting calendar with agendas | Multi-language toggle | Accessibility statement page | JSON-LD: GovernmentOrganization | Special: WCAG AAA target, plain language

**SaaS/Tech:** Feature comparison table (3-tier) | Interactive demo/video hero | Pricing toggle (monthly/annual) | Integration logos grid | API documentation link | Changelog/status page link | Trust badges (SOC2/GDPR/HIPAA) | Free trial CTA with email capture | JSON-LD: SoftwareApplication+Product | Special: dark theme default, code snippets section

## Schema Priority

Every site gets: LocalBusiness (or subtype), FAQPage, BreadcrumbList, WebSite with SearchAction. Category-specific schema layered on top. All schema validated against Google Rich Results Test before deploy.

## Feature Loading

Build prompt checks `_form_data.json.category` → loads matching feature set → injects into build instructions. Unknown categories default to generic LocalBusiness with: about, services, gallery, testimonials, contact, FAQ.
