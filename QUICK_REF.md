# Quick Reference

## Deploy
```
npx wrangler deploy && curl -sX POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" -H "Authorization: Bearer ${CF_API_TOKEN}" -H "Content-Type: application/json" -d '{"purge_everything":true}'
```

## Test
```
PROD_URL=https://domain.com npx playwright test
npx tsc --noEmit && npx @biomejs/biome check --write src/
```

## Secrets
```
get-secret SECRET_NAME
```

## Media Generation
Logo: Ideogram v3 (`IDEOGRAM_API_KEY`). Images: GPT Image 1.5 (`OPENAI_API_KEY`). Video: Sora 2 (`scripts/sora.py`).

## Analytics
GA4/GTM: `~/.config/emdash/gcp-service-account.json`. PostHog: posthog.megabyte.space. Sentry: sentry.megabyte.space.

## Stack
CF Workers + Hono | Angular 19 + Ionic | D1/Neon | Clerk | Stripe | Resend | Zod | Playwright + Vitest

## Colors/Fonts
#060610 black | #00E5FF cyan | #50AAE3 blue. Sora | Space Grotesk | JetBrains Mono

## Quality Bar
E2E 0 failures | WCAG AA | CSP | Flesch >=60 | Yoast pass | Images <200KB WebP | No placeholders | No dead forms

## Decision Shortcuts
New project → all 14 loaded, ref 05/coolify, 06/domain-provisioning. Bug → 07+08 (08/gh-fix-ci). Design → 10+11. "What else?" → 14 Idea Engine.

## Domain Due Diligence
Payments: PCI (Stripe Checkout), tax, fees, refunds. Health: HIPAA, encryption. Education: COPPA/FERPA. PII: GDPR/CCPA, deletion endpoint. Marketplace: Stripe Connect, disputes. Nonprofit: 501c3, donation receipts.

## Common Mistakes
Forget CF cache purge | innerHTML (XSS) | Skip Turnstile (spam) | Miss d1 migrations apply | sleep in Playwright

## Emergency
Site down → `wrangler deployments list` → rollback. D1 corrupt → export. Secret leaked → rotate via `wrangler secret put`. CI stuck → `gh run cancel`. Cache poisoned → purge all.

## Report Template
```
## What was done  ## What was deployed (URL, status)
## Skill updates needed  ## Next steps
```
