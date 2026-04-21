---
name: "Analytics Configuration"
description: "Canonical owner of GA4 setup (14-step automation), GTM container configuration, PostHog SDK integration, feature flags, A/B tests, event taxonomy, funnel definitions, session recording config, and scroll/engagement tracking. The intelligence layer that powers data-driven decisions."
always-load: false---

# Analytics Configuration

## Stack
| Layer | Tool | Self-Hosted |
|-------|------|-------------|
| Tag Management | GTM | No (Google) |
| Web Analytics | GA4 | No (Google) |
| Product Analytics | PostHog | Yes (posthog.megabyte.space) |
| Feature Flags | PostHog | Yes |
| A/B Testing | PostHog Experiments | Yes |
| Session Recording | PostHog (mask inputs) | Yes |
| Error Tracking | Sentry | Yes (sentry.megabyte.space) |

## Event Naming: `object_action` (snake_case, past tense)
`page_viewed`, `cta_clicked`, `form_submitted`, `signup_completed`, `subscription_started`, `error_displayed`

## Standard Events
| Event | Properties | Trigger |
|-------|-----------|---------|
| page_viewed | path, title, referrer | Every page |
| scroll_depth_reached | percent (25/50/75/100) | Scroll milestones |
| cta_clicked | cta_text, cta_location, destination | CTA click |
| form_submitted | form_name, success, error_type | Form submit |
| signup_completed | method, plan | Account created |
| purchase_completed | amount, currency, plan | Checkout success |
| feature_activated | feature_name, context | First use |
| search_performed | query, results_count | Site search |
| error_displayed | error_type, page, message | Error shown |

## Rules
1. GTM is ONLY script loader (except Sentry early init)
2. Never hardcode GA4/PostHog in HTML — load via GTM
3. Self-hosted PostHog preferred (no cookies, no GDPR banner)
4. Every action: GA4 event + PostHog event + Sentry breadcrumb
5. Feature flags BEFORE building feature. Ship behind flag. Remove after 100% rollout.
6. A/B tests require hypothesis + min sample size + defined success metric
7. Session recording masks all inputs by default. PII never recorded.
8. DataLayer pushes happen before action completes (optimistic)
9. No double-counting events across tools
10. Scroll depth: 25/50/75/100% milestones only

## GTM Snippet
```html
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- noscript iframe after <body> -->
```

## PostHog Init
```typescript
posthog.init('phc_PROJECT_KEY', {
  api_host: 'https://posthog.megabyte.space',
  capture_pageview: true, capture_pageleave: true, autocapture: true,
  session_recording: { maskAllInputs: true, maskTextSelector: '.sensitive' },
  persistence: 'memory', // No cookies
  loaded: (ph) => { if (import.meta.env.DEV) ph.opt_out_capturing(); },
});
```

## Feature Flags
```typescript
function isFeatureEnabled(flag: string, defaultValue = false): boolean {
  return posthog?.isFeatureEnabled(flag) ?? defaultValue;
}
// With payload: posthog.getFeatureFlagPayload('hero-experiment')
```

## A/B Testing
Define: name, hypothesis, variants, successMetric, minimumSampleSize, duration.
`const variant = posthog.getFeatureFlag('pricing-page-layout');`
Track conversion with experiment + variant properties.

## Scroll Depth
Track 25/50/75/100% milestones. Push to dataLayer + posthog.capture. Use passive scroll listener.

## DataLayer Pattern
```typescript
function trackEvent(event: string, props: Record<string, unknown> = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...props });
  posthog.capture(event, props);
}
```

## Funnels
```typescript
const FUNNELS = {
  signupToActivation: { steps: ['page_viewed /signup', 'signup_completed', 'feature_activated'], window: '7d' },
  visitToPurchase: { steps: ['page_viewed /', 'cta_clicked pricing', 'purchase_completed'], window: '30d' },
};
```

## CSP for Analytics
```
script-src: https://www.googletagmanager.com https://www.google-analytics.com https://*.posthog.com
connect-src: https://www.google-analytics.com https://analytics.google.com https://*.posthog.com https://*.sentry.io
```

## Verification Checklist
GTM loads, GA4 fires (DebugView), PostHog captures pageviews (Live Events), custom events fire on interactions, feature flags resolve, session recording captures, no duplicate events, CSP allows all domains, scroll depth fires at milestones, no cookies set (self-hosted PostHog).

## Ownership
**Owns:** GA4 config, GTM setup, PostHog SDK, feature flags, A/B tests, event taxonomy, funnels, session recording, scroll tracking, dataLayer architecture, cookie-free analytics, verification.
**Never owns:** Error tracking config (->13 Sentry), payments (->18), email marketing (->13 Listmonk), growth strategy (->13), deployment (->08), SEO (->28).
