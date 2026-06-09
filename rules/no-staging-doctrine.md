---
name: "no-staging-doctrine"
priority: 1
pack: "core"
triggers: []
paths:
  - "*"
---

# No Staging Doctrine

Prod is the only real environment. Staging is calendarized denial — environments diverge, traffic shapes differ, integrations behave differently, and the "staging caught it" stories don't survive honest accounting. The solo + AI shop replaces staging with instant-rollback muscle: every primitive in the stack supports point-in-time recovery, and every deploy carries the receipts to reverse it in seconds.

## The doctrine

- **One environment: production.** No staging cluster, no preview environment beyond the per-PR sandbox per `sandbox-execution`, no "QA env" with a separate DB.
- **Per-PR previews are sandboxes**, not staging. They render the change; they don't claim representative traffic.
- **Friday afternoon deploys are normal.** A deploy that can't tolerate Friday at 5pm is the bug — fix the deploy, don't add a freeze.
- **No code freezes**, ever. No release branches. No mobile-team-cutting-a-release-branch ceremony.
- **No QA team, no QA tickets.** Playwright @ 6bp × 3 browsers per `e2e-tdd-organization` + axe-core per `verification-loop` + visual-qa + completeness-checker + AI vision rubric per `e2e-visual-inspection` IS the QA layer, running on every commit at higher throughput than humans could match.

## Instant-rollback muscle (what makes this safe)

- **Workers**: `wrangler rollback <version-id>` rolls a Worker in <30s, no redeploy
- **D1**: 30-day point-in-time Time Travel — `wrangler d1 time-travel restore` against any timestamp
- **R2**: bucket versioning — assets revert by object version
- **CHANGELOG-on-deploy**: every deploy logs `{commit, version_id, timestamp}` to D1 + posts to a dedicated channel; rollback target is always one query away
- **Auto-rollback at gradual deploys**: 1% → 10% → 100% ramp with error-rate + LCP-regression watchers per `verification-loop`
- **Per-feature flags** per `feature-flags` kill the feature without a redeploy when the rollback target spans more code than just the bad feature

## What survives this doctrine

- **`verification-loop` deploy + prod-E2E mandate** still fires — the discipline is unchanged, the staging step never existed to begin with.
- **`autonomous-engineering` approval-required gates** still apply to destructive prod changes (DB drops, bulk customer mutation, billing). The doctrine kills RITUAL gates (staging promotion, freeze windows), not SAFETY gates (destructive-action approval).
- **`sandbox-execution`** still owns the build → preview → promote pipeline. Sandboxes are CI artifacts, not a staging environment.
