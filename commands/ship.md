# Ship — one-word deploy pipeline

Trigger: `/ship` or "ship it" or "deploy to production"

## Full reusable prompt

```
Run the full ship pipeline:

1. PRE-FLIGHT: npm run check (validate-links → validate:seo → validate:entities → validate:artifacts → tsc → vitest). Fix any failures.
2. BUILD: npm run build. Fix any failures.
3. DEPLOY: wrangler deploy. Confirm "Success".
4. PURGE: Purge Cloudflare cache for the production domain.
5. SMOKE TEST: curl every route changed this session. Assert 200.
6. PLAYWRIGHT E2E: npx playwright test --config=playwright.prod.config.ts. Fix any failures.
7. AI VISION: Screenshot homepage at 6 breakpoints. GPT-4o vision score ≥9/10.
8. AXE: npx axe-core dist/ — 0 violations.
9. LIGHTHOUSE: A11y ≥95, Perf ≥90, SEO ≥95.
10. REPORT: Summarize all results. All gates green → 🟢 SHIPPED.

SPAWN IN PARALLEL WHERE POSSIBLE:
- Wave 1 (serial): check → build → deploy (dependencies)
- Wave 2 (parallel): smoke tests + Playwright + AI vision + axe + Lighthouse (all independent)

If any gate fails, fix the issue and re-run from that gate forward. Do NOT skip gates.
```

## When to use

- After any feature implementation that touches production code
- When the user says "ship", "deploy", "publish", "release", or "push to production"
- After any bug fix that needs to reach users

## When NOT to use

- For local-only changes (use `npm test` + `npm run build` instead)
- For documentation-only changes (use `npm run build` only)

## Expected outputs

- Deploy confirmation with version ID
- All test results (check + Playwright + axe + Lighthouse)
- AI vision scores per breakpoint
- Final SHIPPED / BLOCKED status

## Verification checklist

- [ ] npm run check exits 0
- [ ] npm run build exits 0
- [ ] wrangler deploy "Success"
- [ ] All changed routes return HTTP 200
- [ ] Playwright E2E tests green
- [ ] AI vision ≥9/10
- [ ] axe-core 0 violations
- [ ] Lighthouse A11y ≥95, Perf ≥90, SEO ≥95

## Related skills

- 08-deploy-and-runtime-verification
- 07-quality-and-verification
- completeness-checker agent
- deploy-verifier agent

## Last updated

2026-07-15
