---
name: "non-technical-owner-onboarding"
description: "Zero-code onboarding for projectsites.dev. Owner enters business name + domain, AI builds entire site in one shot. No git, no terminal, no editor. Self-service updates via email/SMS, magic-link admin. Ultimate UX for small-business owners."
updated: "2026-05-10"
---

# Non-Technical Owner Onboarding

**Product promise**: paste a business name (or domain), choose a starting style, click ONE button. Twenty minutes later, an email arrives with a live URL + admin link.

## Onboarding Flow (***THREE SCREENS, ZERO JARGON***)

### Screen 1 — Tell us about your business (`/start`)

- Single input: "Business name or website" (placeholder: "Mario's Pizza" or "mariospizza.com")
- On blur: Worker fires Google Places `findplacefromtext` → returns business preview card (photo, name, address, phone, hours, rating)
- Single button: "Yes, that's us → Continue"; wrong match reveals 3 alternates
- **NO** field-by-field form, multi-step wizard, or password creation

### Screen 2 — Pick a starting style (`/start/style`)

- Three side-by-side 1280×720 previews pre-rendered from THEIR data (photos, colors, copy):
  - **Classic** — warm photo hero, serif headlines, light theme
  - **Bold** — dark theme, bold sans, motion-forward
  - **Minimal** — white space, editorial photography, no animation
- **NO** color picker, font picker, or theme builder

### Screen 3 — Where should we send your site? (`/start/finish`)

- Single email field → Inngest job fires → skill 15 pipeline starts
- Owner sees confetti + "We're building. We'll email you in ~20 minutes."
- Inngest emits 4 progress emails (5%, 25%, 60%, 100%) each with screenshot preview
- Email at 100%: live URL + magic-link admin + "Reply to this email anytime to update copy/photos/hours"

## What's Assumed Without Asking

Owner is NEVER asked:

- **Domain** — free `{slug}.projectsites.dev` default + optional $12/yr via Cloudflare Registrar
- **Hosting/CMS choice**
- **Analytics** — PostHog + GA4 + Sentry wired by default
- **Email** — Resend by default
- **Payments** — Stripe Standard, KYC only when owner activates booking/donation
- **Logo** — Ideogram generates from name + business type; owner replaces later
- **Colors** — extracted from primary photo via GPT Image 2 vision
- **Fonts** — Classic = Playfair Display + Source Sans 3 | Bold = Sora + Inter | Minimal = DM Serif Display + DM Sans
- **Content** — from Google Places photos + reviews + competitor analysis; every claim cites per `rules/citations.md`
- **SEO** — per-route metadata + JSON-LD baked in by validators
- **Accessibility** — WCAG 2.2 AA enforced by skill 07 axe-core gate
- **Legal pages** — Privacy/Terms/Accessibility auto-scaffolded; review prompted in admin within 7 days

**Only owner-supplied**: business name, email, style choice, OPTIONAL custom domain.

## Magic-Link Admin (`/admin`)

Owner clicks admin link → Clerk magic-link validates → `/admin` SPA. Four cards:

### Card 1: Update business info

- Pre-filled from Google Places (read-only) + "Edit on Google Business Profile →" link
- Owner controls: tagline, about-us paragraph (TipTap), team bios, custom service descriptions
- Save → Inngest re-deploys affected pages within 60 seconds

### Card 2: Photos

- Drag-drop uploader (Uppy) → R2; GPT Image 2 vision tags + scores relevance per skill 12 gate
- Rejected: "this looks more like a sunset than your restaurant — try another?"
- Owner can star Google Places photos to feature

### Card 3: Bookings & payments

- ONE-CLICK Stripe Express onboarding (embedded, no manual KYC form)
- Cal.com OAuth (one click) → booking widget on site
- "Receive payments" toggle + "Receive bookings" toggle; **NO** API key paste or webhook URL config

### Card 4: Get help

- "Email Brian" (`mailto:hey@megabyte.space`) | "Schedule 15min call" (Cal.com) | "Live status of my site" (last deploy, last analytics ping, last cron success)
- FAQ: 10 most-common questions

**NO** code editor, file tree, or terminal. Blog posts via email: `/blog new` subject → AI extracts title from body, owner replies with content, AI commits + redeploys.

## Reply-by-Email Editing (***DEFAULT INTERFACE***)

- **Inbound mailbox**: `edits@projectsites.dev` (Resend inbound webhook → Inngest job)
- AI parses request, identifies affected files, makes change, runs validators, deploys to staging, runs source-fidelity loop, deploys to production, replies with screenshot diff + "live now"

### Examples that work end-to-end

- "change our hours — Sunday 11-7 not closed" → updates `_research.json.business.opening_hours` + Places API patch + redeploys
- "make the headline say 'Family-owned for 22 years'" → updates home H1, runs source-fidelity loop, redeploys
- "add a blog post titled 'How we make our marinara' — [content]" → creates post, generates image via skill 12, redeploys
- "the photo of my husband is wrong — use this one [attached]" → uploads to R2, swaps team-page image
- "we're now offering catering, add a page" → creates `/services/catering` per pSEO scaffold, redeploys

### Examples that escalate to operator review

- Pricing changes — owner confirmation via reply-yes required
- New payment processor — Stripe onboarding required
- Domain change — Cloudflare Registrar transfer process
- Legal page edits — lawyer review recommended
- Design overhauls ("make it look totally different") — escalate to 15-min call

## Default Key Bundle (Pre-Provisioned)

Owner never sees an API key. Platform-level keys for all owner sites:

- `OPENAI_API_KEY` — image gen, vision, embeddings (billed to platform, included in plan)
- `ANTHROPIC_API_KEY` — build pipeline
- `GOOGLE_PLACES_API_KEY` + `GOOGLE_MAPS_API_KEY` — domain-restricted to `*.projectsites.dev` + verified custom domains
- `RESEND_API_KEY` — `noreply@projectsites.dev`, reply-to set to owner email
- `IDEOGRAM_API_KEY` — logo gen
- `CLOUDFLARE_*` — deploy + DNS
- `STRIPE_*` — owner connects their own Stripe Standard at admin time; never asked at onboarding

## What Owner Pays

Three plans, shown after Screen 3 (non-blocking; 14-day trial, then free tier keeps site live but freezes content updates):

- **Free trial (14 days)** — full feature, `{slug}.projectsites.dev`, projectsites.dev footer credit
- **Local ($19/mo)** — custom domain, no footer credit, unlimited replies, Stripe payouts, Google Places sync, monthly Lighthouse + axe report email
- **Premium ($49/mo)** — everything in Local + multi-location (≥2 NAP triplets) + monthly content review by Brian + priority email (≤2hr business hours)

Stripe Checkout (redirect to Stripe-hosted page; no card-field embed). 14-day trial extension via email reply.

## Failure Modes Owner Should Never See

- **Build errors** — Worker retries 3×, then escalates to `brian@megabyte.space` with `_audit_log.json`; owner gets "We're polishing — give us a few more minutes"; Brian fixes within 1hr business hours per `rules/failed-pipeline-protocol.md`
- **API quota exceeded** — platform monitoring (skill 13) alerts ops; owner gets retry email with no jargon
- **Domain DNS misconfiguration** — admin shows "Domain status: setting up" with copy-paste CNAME records + "Need help? Reply to this email." Owner never logs into registrar without guided walkthrough
- **Stripe KYC required** — admin shows "Almost there — Stripe needs one more thing: [link to embedded Stripe form]." No raw Stripe error codes

## Discovery Surface

- **Direct** — `projectsites.dev` → "Build your site" CTA → `/start`
- **pSEO landing pages** — `projectsites.dev/website-for-pizza-restaurants`, `/website-for-dentists`, `/website-for-plumbers`; pre-fill business type
- **Local-business referral pSEO** — `projectsites.dev/{city}/{business-type}`; geo pre-fills location signals
- **Cal.com booking** — 15-min "is projectsites.dev right for me?" call → onboard live during call
- **Email forwarding from existing owners** — referral-attribution credit ($10 off first month for both)

## Acceptance Test

A friend's parent (60+, has used Gmail and Google Maps but not GitHub) opens projectsites.dev on a phone, completes onboarding without help, gets a working site, and updates hours via email reply within the first week.

- Any step requiring explanation gets simplified or removed
- Tested quarterly with rotating non-technical reviewers
