---
last_reviewed: 2026-06-29
superseded_by: null
name: "error-budget"
priority: 2
pack: "core"
triggers:
  - "SLO"
  - "SLA"
  - "error budget"
  - "burn rate"
  - "reliability"
  - "availability"
  - "uptime"
  - "99.9"
  - "99.5"
  - "ship stop"
  - "feature freeze"
paths:
  - "src/worker/**"
  - "workers/**"
  - "wrangler.toml"
  - "wrangler.jsonc"
---

# Error Budget

SRE-style error budgets for solo builders. Every Worker route declares a per-SLO availability
target. When the 30-day burn rate exceeds the budget, feature shipping **stops** — only
error-reduction work merges to main. Being solo doesn't excuse skipping this; it means you
are both the SRE and the developer.

## SLO selection table

Assign each route a tier at design time. Record it in the route module's `manifest.ts`.

| Route type | Default SLO | Max monthly downtime | Rationale |
|---|---|---|---|
| Donation / checkout (`/donate`, `/api/checkout`) | 99.9% | 43 min | Revenue-critical; donor trust is fragile |
| Auth (`/api/auth/**`, Clerk webhooks) | 99.9% | 43 min | Locked-out users = 0% conversion |
| Admin / internal (`/admin/**`) | 99.5% | 3.6 hr | Brian can absorb brief outage; not user-facing |
| Marketing / static (`/`, `/about`, `/pricing`) | 99.5% | 3.6 hr | CF edge CDN already ≥99.99%; app failures are only source |
| Background / async (cron, queue consumers) | 99.0% | 7.3 hr | Retryable; eventual delivery acceptable |

Override in `manifest.ts` when a route punches above its class (e.g., a `/health` endpoint
used by uptime monitors → 99.9%).

## Burn rate alerting

A burn rate of 1× means you consume your entire error budget in exactly 30 days.
2× = exhausted in 15 days; 14.4× = exhausted in 50 hours (fast burn).

| Burn rate | Urgency | Action |
|---|---|---|
| ≥ 2× | Warning | Investigate in current sprint; no ship-stop |
| ≥ 5× | High | Investigate immediately; hold new features for this service |
| ≥ 14.4× (fast burn) | Critical | **Ship-stop trigger** — see below |

See `reference/error-budget.md` for the full TypeScript implementation, PostHog HogQL query, ship-stop guard, and manifest.ts shape.

## Ship-stop trigger

When ANY route's 30-day burn rate hits **14.4×** OR the rolling 1-hour burn rate hits **14.4×**:

1. Toggle `feature_flags` `stage = 'killswitch'` for every in-flight feature touching that route.
2. Set `SHIP_STOP=true` in D1 `system_flags` table.
3. Open a D1-backed incident record (table: `incidents`, cols: `route`, `burn_rate`, `slo_percent`, `triggered_at`, `resolved_at`).
4. Only error-reduction commits merge to main until burn rate drops below 1× AND holds for 24 hours.
5. Close the incident record; reset `SHIP_STOP=false`.

Call `enforceShipStop` in CI pre-deploy step. If true, exit 1 and surface the ship-stop message.

## Automatic killswitch via feature flags

When a feature's error rate spikes post-launch, auto-kill it without a redeploy by checking
the killswitch-promoted flag at request time. This is `[[feature-flags]]` § killswitch in
practice — error budget exhaustion automatically promotes the most risky in-flight flag to
killswitch stage.

## Anti-patterns

- "We're solo — SLOs are overkill." Solo means 0 redundancy. Every outage hits 100% of users.
- Treating all routes the same (99.9% for a cron worker = wasted toil).
- Setting SLOs without instrumenting them — a budget without a meter is fiction.
- Ship-stop becoming permanent — if budget is chronically exhausted, raise the SLO tier or invest in reliability.
- Skipping incident records — without them, you repeat the same outage.

## Reference

Google SRE Workbook ch. 2: "Error Budgets". Practical SRE, Treynor Sloss et al. (2018).
Core insight: "The error budget is the permissible rate of unreliability."

## Cross-links

- `[[production-observability-default-on]]` — structured logs + OTLP spans provide the burn-rate signal
- `[[no-staging-doctrine]]` — prod-only deployment makes burn rate the only reliability signal
- `[[fail-fast-build-fail-soft-prod]]` — fail soft keeps availability high; errors should degrade, not 500
- `[[feature-flags]]` — killswitch stage is the automated blast valve when burn rate spikes
- `[[cost-per-request-accountability]]` — error budget and cost budget are both per-request accountability loops
