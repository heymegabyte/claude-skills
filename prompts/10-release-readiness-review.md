# Release Readiness Review

## Trigger phrases

- "is this ready to ship"
- "release readiness"
- "pre-launch review"
- "go/no-go check"
- "check if we can release"

## When to use

- Before any production release
- Before merging a feature branch that changes user-facing behavior
- When a stakeholder asks "can we ship this?"
- At the end of a sprint or milestone

## When not to use

- For internal-only changes with zero user impact (config refactors, internal tooling)
- When the release is explicitly a "known-broken" experimental deploy
- For CI-only changes (new lint rule, test infrastructure)

## Full reusable prompt

```
Run a structured release readiness review. Answer each check with PASS, FAIL, or N/A. Any FAIL is a blocker.

## 1. Testing

- [ ] `npm test` passes (unit + integration)
- [ ] `npx playwright test` passes (E2E), or E2E not applicable
- [ ] New features have corresponding tests
- [ ] Console error-free in all target browsers (run Playwright with `--project=chromium --project=firefox --project=webkit`)
- [ ] Axe accessibility scan passes (WCAG 2.2 AA, zero violations)
- [ ] Visual regression check passes (if applicable)

## 2. Build

- [ ] Build succeeds (no TypeScript errors, no build warnings that are new)
- [ ] Bundle size within budget (no unexpected increases >10%)
- [ ] Tree-shaking verified (no dead code in production bundle)
- [ ] Source maps configured correctly (or disabled for prod)
- [ ] Docker image builds successfully (if applicable)

## 3. Deploy

- [ ] Deploy script tested against target environment
- [ ] Rollback plan exists and was tested (wrangler rollback, git revert, etc.)
- [ ] Feature flags: new features are behind flags with `enabled=0` as default
- [ ] Feature flags: admin UI for toggling exists (if user-facing feature)
- [ ] No hardcoded secrets in source code (all secrets via env/provider)

## 4. Observability

- [ ] PostHog or equivalent analytics events for key user actions
- [ ] Error tracking configured (Sentry, Workers Tracing, or equivalent)
- [ ] Health endpoint (`/health` or similar) returns 200
- [ ] Logging added for critical paths (auth, payments, data writes)
- [ ] Performance budget: LCP ≤2.5s, CLS ≤0.1, INP ≤200ms (or known regression documented)

## 5. SEO & Content

- [ ] JSON-LD structured data present per route (if public-facing)
- [ ] OG images 1200x630 for social sharing (if public-facing)
- [ ] Meta descriptions, titles per route (if public-facing)
- [ ] Sitemap updated (if public-facing)
- [ ] `robots.txt` correct (no accidental noindex)

## 6. Security

- [ ] CSP headers configured (strict-dynamic + nonce)
- [ ] Auth verification on all protected routes
- [ ] Input validation (Zod schemas) on all API endpoints
- [ ] Rate limiting configured (Turnstile or Workers Rate Limiting)
- [ ] No sensitive data in client-side bundle

## 7. Legal

- [ ] Privacy policy covers any new data collection
- [ ] Terms of service updated for new functionality
- [ ] Cookie consent mechanism in place (if EU visitors)
- [ ] Accessibility statement in place or deferred

## Output

```

## Release Readiness: <release name/version>

### Blockers (FAIL — do not release)

- [ ] Testing: E2E for checkout flow fails — issue #142

### Passed (all checks green for these categories)

- [x] Build
- [x] SEO & Content

### N/A

- Legal (not applicable — no user data collected)

### Verdict: NOT READY — 1 blocker remaining

```
```

## Expected outputs

- Per-category pass/fail checklist results
- Clear list of blockers (FAIL items)
- Verdict: READY, NOT READY, or READY WITH CAVEATS
- If NOT READY: specific action items to resolve before re-review

## Verification checklist

- [ ] Every applicable check answered PASS, FAIL, or N/A (none skipped)
- [ ] Every FAIL item has a specific reference (file, test name, issue number)
- [ ] Verdict is clearly stated and actionable
- [ ] Blocker count is visible (e.g., "3 blockers remaining")
- [ ] If READY WITH CAVEATS, caveats are documented with acceptance criteria

## Related skills

- `final-review`
- `deploy-forged-mcp`
- `07-quality-and-verification`
- `session-recap`

## Last updated

2026-06-30
