# Feature Flags (***SUPREME — every new feature, every major change***)

Every feature beyond a trivial one-file edit MUST ship behind a feature flag. Default state: `enabled=0`, `rollout_percent=0`, `stage='experimental'`. The admin promotes through stages (experimental → beta → stable) and dials rollout % from the admin UI. Nothing ships permanently-on at launch.

This rule fires on every "implement X feature" prompt. It complements (does not replace) `[[verification-loop]]` (test + deploy + verify) and `[[monitor-orchestration]]` (parallel agent fan-out for multi-faceted briefs).

## Why

- **Reversibility**: a regression-prone feature flips off via the admin UI in <60s — no redeploy, no rollback ceremony.
- **Gradual rollout**: 5% → 25% → 50% → 100% lets us watch error rates + conversion at each step.
- **Per-user QA**: pin a flag on for `brian@megabyte.space` while leaving it off for everyone else.
- **Compliance**: every mutation audited in `feature_flag_audit` table — SOC 2 + GDPR friendly.
- **Killswitch**: any flag can be set to `stage='killswitch'` for instant emergency disable across all users.

## Architecture (canonical — present in every emdash project starting with njsk.org Wave 6)

Three D1 tables:
- **`feature_flags`** — canonical state: `key`, `enabled` (0/1 global), `rollout_percent` (0-100), `stage`, `description` (full prose, see below), `e2e_tests` (JSON array of test file paths), `smoke_steps` (markdown manual-QA recipe), `owner_email`, `created_at`, `updated_at`.
- **`feature_flag_overrides`** — pin per `user` / `email` / `role` to override the rollout calc. Always wins.
- **`feature_flag_audit`** — every mutation logged: who, what, before/after JSON, when.

Worker module (`worker/feature-flags.ts`) exports:
- `isFlagOn(env, key, user, anonId)` — server-side guard for handlers
- `resolveAllFlags(env, user, anonId)` — full set for the calling user
- `handlePublicFlags(req, env, user)` — GET `/api/feature-flags` (returns only boolean per key)
- `handleAdminListFlags(req, env)` — admin GET (full state)
- `handleAdminUpdateFlag(req, env, key)` — admin POST (toggle/rollout/stage)
- `handleAdminAddOverride(req, env, key)` — admin POST (pin-on/pin-off scope)

KV cache layer: 60-second TTL on the full flag state under key `ff:state`. Admin mutations invalidate immediately. Public endpoint adds a 30s `cache-control: private, max-age=30` header.

React hook (`src/lib/use-feature-flag.ts`):
- `useFeatureFlag('key')` — single boolean, re-renders when flags arrive
- `useFeatureFlags()` — record of every flag for batch UI gating
- `resetFeatureFlagsCache()` — call after admin mutates

Admin UI (`src/pages/admin/feature-flags.tsx`):
- Stage filter pills (all / experimental / beta / stable / deprecated / killswitch)
- Search by key or description
- Per-flag card with on/off toggle + rollout slider + stage-promote button + killswitch button
- Per-scope overrides panel (expandable)
- Audit timestamp + owner attribution

## Mandate (***every NEW feature, no exceptions***)

1. **Reserve the flag key first** — add row to `feature_flags` migration with `enabled=0, rollout_percent=0, stage='experimental'`. Naming: lowercase + snake_case + ≤32 chars (e.g., `text_to_give`, `dafpay_chariot`, `wcag_22_manual_review`).
2. **Gate server handlers**: wrap with `isFlagOn(env, 'key', user, anonId)`; return 404 (not 403 — don't leak feature existence) when off.
3. **Gate UI components**: `if (!useFeatureFlag('key')) return null;` — never render gated UI for unflagged users.
4. **Wire the admin row** — every flag automatically appears in `/admin/feature-flags` via the seed migration; manual entry only for hot-patch flags created post-deploy.
5. **Document the owner** — `owner_email` column carries the team-member responsible for promotion decisions.
6. **Full description, not a tweet** — the `description` column is the operator's runbook entry, not a tagline. Required prose covers (a) what the feature does, (b) who sees it when enabled, (c) the surfaces it touches (routes, tables, UI), (d) failure mode when off, (e) one-line acceptance criterion. Minimum 240 chars; cap 1200.
7. **E2E coverage column** — `e2e_tests` is a JSON array of test file paths that exercise the feature against the prod URL per `[[e2e-tdd-organization]]`. Empty array = build fail. Every flag has at least one Playwright spec.
8. **Manual smoke-test column** — `smoke_steps` is a markdown ordered list a human can run in 2 minutes to verify the feature post-deploy. Example: `1. Visit /book?flag=on. 2. Click "Multi-stop journey" tab. 3. Add 2 stops. 4. Assert total + bundle discount appears. 5. Click book → land on Stripe Checkout.` Minimum 3 steps.

## Stages

| Stage | enabled default | rollout default | Audience | Promotion criterion |
|---|---|---|---|---|
| `experimental` | 0 | 0 | Devs + Brian (via override pin) | Code complete + unit tests pass |
| `beta` | 1 | 5-25% | Internal + selected admins | 1 week without P1 incident + axe-clean |
| `stable` | 1 | 100% | Everyone | 2 weeks at beta + Lighthouse ≥ 95 |
| `deprecated` | 1 | 100% | Everyone (UI shows EOL banner) | Replacement shipped, sunsetting in 30d |
| `killswitch` | 0 | n/a | Nobody | P1 incident; resolution before un-killing |

Promotion is a button in the admin UI (`Promote → beta`, etc.); the rule above is the policy, not the mechanism.

## Anti-patterns

- ❌ **Hardcoding feature on at launch** — every feature must be opt-in via flag.
- ❌ **Hiding feature behind ENV var** — env vars don't audit, don't roll out per user, don't surface to admin. ENV is for SECRETS, flags are for FEATURES.
- ❌ **Multiple flags for one feature** — a feature = one flag. Sub-toggles (e.g., "show this section but hide that button") live in flag overrides, not new flag keys.
- ❌ **Flag without admin entry** — if it's not in `/admin/feature-flags`, the team can't toggle it without a code change. That defeats the point.
- ❌ **Leaving deprecated flags in code** — when a feature has been at `stable, 100%` for 30+ days, remove the flag check (not the feature). Run quarterly flag-cleanup pass.
- ❌ **Tweet-length descriptions** — `'Mid-job NPS interception'` is not a description, it's a label. The operator who flips the flag needs the runbook in the row.
- ❌ **Empty `e2e_tests` array** — every flag is gated by at least one Playwright spec against the prod URL. No spec = no flag.
- ❌ **Missing `smoke_steps`** — every flag has a 2-minute manual recipe a human can run after promotion. The recipe is part of the row, not the PR.

## Schema example (column types)

```sql
CREATE TABLE IF NOT EXISTS feature_flags (
  key             TEXT PRIMARY KEY,
  enabled         INTEGER NOT NULL DEFAULT 0,
  rollout_percent INTEGER NOT NULL DEFAULT 0,
  stage           TEXT NOT NULL DEFAULT 'experimental',
  description     TEXT NOT NULL DEFAULT '',        -- 240-1200 chars prose runbook
  e2e_tests       TEXT NOT NULL DEFAULT '[]',      -- JSON array of test file paths
  smoke_steps     TEXT NOT NULL DEFAULT '',        -- markdown ordered list
  owner_email     TEXT NOT NULL DEFAULT '',
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
```

## Seed example (canonical)

```sql
INSERT INTO feature_flags (key, enabled, stage, description, e2e_tests, smoke_steps, owner_email) VALUES (
  'multi_stop_journey',
  0, 'experimental',
  'Customers plan 2-5 stops across NJ in a single day via a new tab on /book that swaps out the form. Backend computes per-stop pricing via shared/surge.ts then applies a 10% labor discount when stops>=3. A single crew is assigned across stops (Mapbox-routed in order); a single Stripe Checkout payment covers the journey. When OFF: tab is hidden, /api/multi-stop-journey/* returns 404, the single-stop form is the only option. Acceptance: a 3-stop journey on Saturday quotes at single-stop sum * 0.9 + surge, books, and reaches Stripe Checkout.',
  '["e2e/multi-stop-journey/quote.spec.ts", "e2e/multi-stop-journey/book.spec.ts", "e2e/multi-stop-journey/discount-floor.spec.ts"]',
  '1. Open /dashboard/feature-flags, search "multi_stop_journey", toggle ON (or pin override for brian@megabyte.space).
2. Visit /book in incognito; confirm a "Single Job | Multi-stop Journey" tab row appears in step=schedule.
3. Click "Multi-stop Journey", add 3 stops (Newark / JC / Hoboken) with services + duration.
4. Pick Saturday; confirm the total = sum-of-stops × 0.9 + surge and a "Bundle discount" line is visible.
5. Click "Book journey" → Stripe Checkout opens with the same total. Cancel.
6. Toggle flag OFF → reload /book → tab row is gone, original form renders.',
  'brian@megabyte.space'
);
```

## Reference incident (***2026-05-27 — njsk.org Wave 6***)

User issued: *"Implement it all and ensure that there is a gorgeous admin dashboard to accompany each feature and try to modularize all the features so if we want to roll one or two of the features out and perhaps leave most features in with feature flags and add this info to ~/.agentskills and ~/.claude to start leveraging feature flags for all of AI's major tasks."*

Triggered: feature-flags infrastructure shipped in njsk.org as migration `0023_feature_flags.sql` + `worker/feature-flags.ts` + `src/pages/admin/feature-flags.tsx` + `src/lib/use-feature-flag.ts`. Seeded with all 50 Wave-6 features at `experimental, 0%, enabled=0`. Every subsequent feature in every emdash project ships gated by this pattern.

## See

- [[verification-loop]] — every flag-promoted change still goes through deploy + prod-E2E mandate.
- [[monitor-orchestration]] — when implementing multiple features in parallel, each agent owns its own flag key.
- [[brian-preferences]] — pick ONE, just do it; flags let us pick one (or three) and ship the rest dark.
- [[website-build-doctrine]] § Phase 6 — continuous self-improvement loop iterates flags from experimental → stable.
