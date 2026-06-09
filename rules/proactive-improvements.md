---
name: "proactive-improvements"
priority: 2
pack: "core"
triggers: []
paths:
  - "*"
---

# Proactive Improvements

At nearly every step of any prompt — when an adequate-context AI agent (Opus 4.8 or Sonnet 4.6) sees the surrounding code, the current change, and the user's broader intent — it MUST pause and ask: *"Is there an improvement, upgrade, polish, feature addition, refactor, accessibility fix, performance tweak, copy polish, or safety net that would obviously make this surface better, even if it sits outside the literal scope of the prompt?"*

If yes AND the change "just feels right" (low risk, high taste-payoff, doesn't require a new design conversation, doesn't add days of work), the agent **implements it inline** rather than queuing it for later.

The bar is not "would this be technically correct to defer" — the bar is **"would Brian wish I had just done this when he opens the PR?"** If yes, do it.

## WHEN_TO_FIRE

- After editing a component → does the file have other obvious nits (deprecated API, missing aria, dead import, off-brand copy, missing `data-bcl-*` analytics attr, hardcoded color that should use a token, a magic number)? If yes, fix them in the same edit.
- After creating a new route → does it deserve a sitemap entry, OG card, JSON-LD block, breadcrumb, mobile-first layout, accent-color flourish, footer link, related-links section, or analytics CTA wiring? Add them.
- After running a build → did the validator surface ORANGE/yellow warnings that are 1-line meta-desc fixes? Fix them in this same turn instead of next.
- After running a sweep test → did a route fail for a known-class reason (auth-fetch hang, useEffect-without-abort)? Fix in this turn.
- After writing a PDF / image / artifact → does it have rough edges (cramped layout, missing logo, wrong palette, awkward typography, missing QR, contact-info gap, banned-word copy)? Polish before declaring done.
- After deploying → did a CSP / cache / Content-Disposition / X-Frame-Options / canonical / hreflang header need adjustment? Update `_headers` in the same turn.
- After landing a feature → does the change deserve a `MEMORY.md` entry, a `CLAUDE.md` doc update, a `e2e/FEATURES.md` row, a unit test, a Sentry breadcrumb, a PostHog capture, an analytics attribute, an OpenAPI block? Add what fits.
- After noticing a typo, slop word, off-brand phrase, dated reference, dead link, broken alt text, missing image, double-tap-target violation, contrast issue → fix.
- After seeing dead code, commented-out blocks, deprecated dependencies, `console.log` debug statements, TODO that's now resolvable → clean.

## WHAT_TO_DO_PROACTIVELY

### Visual polish

- Rounded corners (`rounded-lg|2xl`)
- Accent-color rail (`border-l-2 border-brand-accent`)
- Hairline dividers
- Micro-eyebrow text (`font-mono uppercase tracking-wider text-brand-accent`)
- Kicker subtitles
- Gradient backdrops (`bg-gradient-to-br from-brand-accent/8 to-transparent`)
- Focus-visible rings
- `@starting-style` enter animations
- `prefers-reduced-motion` respect

### Accessibility

- `aria-label`, `aria-describedby`, `aria-keyshortcuts`
- `role="dialog"`, `aria-modal`
- Focus traps, keyboard handlers
- Skip-link target, alt text, color-contrast bumps
- `min-h-[44px]` tap targets
- `prefers-reduced-motion`, `prefers-color-scheme: dark` audit

### Performance

- `loading="lazy"` on non-LCP images, `fetchpriority="high"` on LCP
- `decoding="async"`
- `<link rel="preload">` for critical fonts/heroes
- `useMemo` / `useCallback` on hot paths
- Debounce on search inputs
- AbortController on fetch effects
- Speculation Rules for likely-next nav

### SEO

- Per-route title 50-60 + desc 120-156
- Canonical, og:image with unique card
- JSON-LD per page type (WebPage + BreadcrumbList + FAQPage + Service + LocalBusiness as appropriate)
- Hreflang on locale mirrors, sitemap entry, robots noindex on thin pages

### Analytics + observability

- `data-bcl-*` attrs on every CTA (phone, sms, schedule, quote, share, download)
- PostHog capture on key user moments
- Sentry breadcrumb before risky ops
- GA4 event, Workers Tracing span name, AI Gateway metadata block on every LLM call

### Copy

- Drop banned slop words ("seamless", "robust", "leverage", etc per `copy-writing`)
- Tighten to 100-160 char descriptions
- Replace passive voice
- Swap stat claims for cited concrete numbers
- Drop em-dash overuse, add action-verb CTAs

### Security

- Validate inputs at boundaries
- Rate-limit public endpoints
- Turnstile on forms
- Never log raw tokens
- Parameterized SQL via Drizzle
- `content-disposition` + X-Frame-Options on downloadable assets
- CSP audit when new domains appear

### DX + maintenance

- Short JSDoc on intent (not types)
- Update CLAUDE.md when stack patterns shift
- Write a unit test for any pure new function
- Update `e2e/FEATURES.md` matrix when a feature lands
- Remove `console.log`, remove unused imports

## WHEN_NOT_TO_FIRE

- If the change requires a real design conversation ("should this be a sidebar or a modal?", "do we want this opinionated default?") — flag in the Recs section, don't unilaterally pick.
- If the change touches shared infrastructure that would affect other ongoing work without a heads-up (DB migrations, env-var renames, route 301 chains).
- If the change is genuinely outside the codebase's current quality bar and would set a new precedent without buy-in (introducing a new state library, a new CSS framework, a new test framework, a new auth flow).
- If you're already mid-task and the proactive bit would add >20% wall time to the current change — finish the current change first, surface the bit in the Recs section.
- If "just feels right" is actually "I want to flex" — discipline. The bit must serve the user's apparent intent, not the agent's preferences.

## THE_INSTINCT

The phrase "just feels right" is the load-bearing signal. It means: any thoughtful developer reviewing the change would say "yeah, of course you also fixed that — anyone would have." Not "interesting tangent" or "neat side project" or "tempting refactor." If the change is the kind of thing a senior engineer would fold into the same PR without a separate ticket, it qualifies. If it would deserve a separate ticket — defer to Recs.
