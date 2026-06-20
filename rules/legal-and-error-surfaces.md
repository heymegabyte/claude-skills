---
name: "legal-and-error-surfaces"
priority: 2
pack: "website-build"
triggers:
  - "privacy policy"
  - "cookie consent"
  - "consent banner"
  - "accessibility statement"
  - "terms of service"
  - "404 page"
paths:
  - "org:website_build"
---

# Legal & Error Surfaces (Every Site)

A site is NOT shippable without its legal + error surfaces. The build doctrine mandates analytics (`[[production-observability-default-on]]`) and forms collect PII, so consent + privacy are effectively ALWAYS required — not optional polish. This rule details what each surface must contain and when it is mandatory; loads on website prompts only.

## Error pages (every site, always)

- **Branded 404** — site nav + search + top links + on-brand copy + working "go home" CTA; never the framework default. Served with a real `404` HTTP status (Worker/SSG), not a 200 SPA fallback.
- **Branded 500 / error boundary** — on-brand, NO stack trace or internal detail to the user, retry + contact CTA. React error boundary + Worker catch.
- Both server-rendered with the correct status code — a client-only 404 returns 200 to crawlers and pollutes the index.

## Privacy Policy (mandatory with ANY analytics, form, or non-essential cookie)

- Dedicated `/privacy` page: what's collected (analytics events, form fields, IP), why, retention, the exact third parties used (PostHog, Resend, Cloudflare, Turnstile, Square/Stripe), and user rights (access / delete / port / opt-out).
- Footer link on EVERY page · effective/updated date · contact channel for data requests.

## Cookie / tracking consent (GDPR + ePrivacy + CCPA/CPRA)

- Required when non-essential cookies or analytics load AND EU/UK/CA traffic is possible — assume YES for any public site.
- **Consent-gate analytics**: PostHog / GA fire ONLY after opt-in; GA via Consent Mode v2 (default-denied). Turnstile + strictly-essential cookies are exempt.
- Banner offers accept / reject / preferences — reject as easy as accept (no dark pattern, per `[[always]]` § Ethics). Persist the choice; re-prompt on policy change.

## Accessibility Statement (ADA Title II / EAA)

- Dedicated `/accessibility` page: conformance target (WCAG 2.2 AA), known limitations, feedback contact, last-assessed date. Footer-linked.
- Required for gov/edu (ADA Title II, Apr-2026) and EU commerce (EAA, live Jun-28-2025); ship it by default — it is cheap and signals trust.

## Terms of Service (when accounts / payments / UGC)

- Required once the site has login, takes payment, or hosts user content. Footer link + updated date. Skip for a pure brochure site with no accounts/commerce.

## Gate

- Footer links Privacy + Accessibility Statement on every page (+ Terms when accounts/payments/UGC exist).
- **Build-fail**: analytics present but no consent gate · a PII-collecting form but no `/privacy` · a custom-domain site serving the framework-default 404.

## Cross-links

- `[[production-observability-default-on]]` — the analytics that triggers the consent requirement
- `[[data-residency-by-default]]` · `[[pii-handling-discipline]]` — backend data-handling this surfaces to users
- `[[email-deliverability]]` · `[[feature-flags]]` · `[[always]]` (§ Every site, § Ethics)
