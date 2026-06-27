---
name: nonprofit-site
description: Directive playbook for 501(c)(3) nonprofits, soup kitchens, shelters, churches, mission orgs.
when_to_use: When the business is a 501(c)(3), religious institution, NGO, community service org, or any tax-exempt mission-driven entity.
---

# Nonprofit Site Skill

## Goal
Drive recurring donations, volunteer sign-ups, and program awareness. Trust + transparency are the load-bearing values — every dollar claim must be cited; every photo must be real.

## Above the fold (mandatory)
- Mission statement in ONE sentence ("We serve hot meals to anyone hungry in Newark.")
- Primary CTA: `Donate` (largest, accent color)
- Secondary CTAs: `Volunteer` + `Get Help`
- Live impact counter: `<X> meals served this month` via `<app-rolling-counter>` per cinematic-ui-patterns rule
- Photo: real people the org serves, sourced from the org's own archives — never AI-generated, never stock

## Required pages (24-route nonprofit floor)
- `/` home
- `/about`, `/mission`, `/history`, `/team`, `/board`
- `/services` (programs the org runs)
- `/donate` + `/donate/{campaign}` + `/ways-to-give` + `/planned-giving`
- `/volunteer` + `/volunteer/{role}`
- `/financials` + `/annual-report` + `/transparency`
- `/news` + `/press` + `/blog`
- `/partners` + `/sponsors`
- `/contact` + `/locations`
- `/parish-toolkit` (church-affiliated only)
- `/get-help` + `/eligibility` + `/intake`

## Donation rules
- Square Web Payments SDK (NOT Stripe) per payments-routing rule
- Preset tiers: $10/$25/$50/$100/$250/$1000 + custom
- Toggle: `Make this monthly`
- Toggle: `In honor of` / `In memory of`
- Toggle: `Anonymous`
- Show `Your $25 covers <concrete-outcome>` next to each tier
- After donation: auto-email tax receipt + Resend drip (week 1: thank-you story; week 4: impact update; month 6: invite to next campaign)

## Trust scaffolding (mandatory)
- IRS Form 990 link (`/financials`) — real PDF, not "coming soon"
- Charity Navigator / GuideStar / Candid badges with link-back
- Board roster with photos + bios (real people only)
- Annual report PDF with audited financials
- Funding-source breakdown pie chart on `/financials`
- Year-over-year program impact numbers, each cited per APA per citations rule

## Schema (JSON-LD per route)
- `NGO` on home with `taxID` (EIN), `nonprofitStatus: Nonprofit501c3`
- `LocalBusiness` (parent) with full NAP
- `Organization` with `founder`, `foundingDate`, `numberOfEmployees`
- `Person` per board member with `jobTitle`, `sameAs` (LinkedIn)
- `DonateAction` on every donate route
- `Event` for every fundraiser
- `Article` + `NewsArticle` for blog posts

## Demographic i18n (auto-fire per i18n-by-demographics rule)
- Pull ACS B16001 against the service area
- Every language ≥10% community share gets a full `/{locale}/*` mirror
- Newark NJ → en+es+pt (36% Hispanic + 4th-largest Brazilian-American pop)
- Translation: Workers AI Llama 3.3 70B first pass + Claude Opus 4.7 polish on top-10 routes

## Anti-patterns
- Never fabricate impact numbers (e.g., "served 1M meals" without a 990 backup)
- Never AI-generate historical timeline photos (timeline-authenticity rule)
- Never use stock photo of "generic volunteer hands" — use the org's real volunteers
- Never gate the donate page behind a wall of text — donation MUST be 1 click from home
- Never list "tax-deductible" without showing the EIN
