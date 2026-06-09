---
name: "feature-flags"
priority: 2
pack: "core"
triggers:
  - "feature flag"
  - "rollout"
paths:
  - "*"
---

# Feature Flags

Every feature beyond a trivial one-file edit ships behind a flag. Default: `enabled=0, rollout_percent=0, stage='experimental'`. Admin promotes through stages + dials rollout % from `/admin/feature-flags`. Nothing ships permanently-on at launch.

## Architecture (canonical — every emdash project starting w/ njsk.org Wave 6)

Three D1 tables:

- **`feature_flags`** — `key`, `enabled` (0/1), `rollout_percent` (0-100), `stage`, `description` (full prose), `e2e_tests` (JSON paths), `smoke_steps` (markdown recipe), `owner_email`, `created_at`, `updated_at`.
- **`feature_flag_overrides`** — pin per `user` / `email` / `role`. Always wins.
- **`feature_flag_audit`** — every mutation logged: who, what, before/after JSON, when.

Worker module (`worker/feature-flags.ts`):

- `isFlagOn(env, key, user, anonId)` — server-side guard
- `resolveAllFlags(env, user, anonId)` — full set for caller
- `handlePublicFlags(req, env, user)` — GET `/api/feature-flags` (boolean per key only)
- `handleAdminListFlags(req, env)` — admin GET (full state)
- `handleAdminUpdateFlag(req, env, key)` — admin POST (toggle/rollout/stage)
- `handleAdminAddOverride(req, env, key)` — admin POST (pin-on/pin-off scope)

KV cache: 60s TTL on full flag state under `ff:state`. Admin mutations invalidate immediately. Public endpoint adds 30s `cache-control: private, max-age=30`.

React hook (`src/lib/use-feature-flag.ts`):

- `useFeatureFlag('key')` — single boolean, re-renders when flags arrive
- `useFeatureFlags()` — record of every flag for batch UI gating
- `resetFeatureFlagsCache()` — call after admin mutates

Admin UI (`src/pages/admin/feature-flags.tsx`):

- Stage filter pills (all / experimental / beta / stable / deprecated / killswitch)
- Search by key or description
- Per-flag card: on/off toggle + rollout slider + stage-promote button + killswitch button
- Per-scope overrides panel (expandable)
- Audit timestamp + owner attribution

## Mandate (every NEW feature, no exceptions)

1. **Reserve flag key first** — add row to `feature_flags` migration w/ `enabled=0, rollout_percent=0, stage='experimental'`. Naming: lowercase + snake_case + ≤32 chars (`text_to_give`, `dafpay_chariot`, `wcag_22_manual_review`).
2. **Gate server handlers**: wrap w/ `isFlagOn(env, 'key', user, anonId)`; return 404 (not 403 — don't leak existence) when off.
3. **Gate UI components**: `if (!useFeatureFlag('key')) return null;` — never render gated UI for unflagged users.
4. **Wire admin row** — every flag auto-appears in `/admin/feature-flags` via seed migration; manual entry only for hot-patch flags post-deploy.
5. **Document owner** — `owner_email` column = team-member responsible for promotion.
6. **Full description, not a tweet** — `description` is operator's runbook entry, not tagline. Covers (a) what feature does, (b) who sees when enabled, (c) surfaces touched (routes, tables, UI), (d) failure mode when off, (e) one-line acceptance. Minimum 240 chars; cap 1200.
7. **E2E coverage column** — `e2e_tests` JSON array of spec paths exercising feature against prod URL per `e2e-tdd-organization.md`. Empty array = build fail. Every flag has at least one Playwright spec.
8. **Manual smoke-test column** — `smoke_steps` markdown ordered list a human runs in 2 min post-deploy. Example: `1. Visit /book?flag=on. 2. Click "Multi-stop journey" tab. 3. Add 2 stops. 4. Assert total + bundle discount appears. 5. Click book → land on Stripe Checkout.` Minimum 3 steps.

## Stages

| Stage | enabled | rollout | Audience | Promotion criterion |
|---|---|---|---|---|
| `experimental` | 0 | 0 | Devs + Brian (override pin) | Code complete + unit tests pass |
| `beta` | 1 | 5-25% | Internal + selected admins | 1 week without P1 + axe-clean |
| `stable` | 1 | 100% | Everyone | 2 weeks at beta + Lighthouse ≥95 |
| `deprecated` | 1 | 100% | Everyone (UI shows EOL banner) | Replacement shipped, sunsetting 30d |
| `killswitch` | 0 | n/a | Nobody | P1 incident; resolution before un-killing |

Promotion = button in admin UI (`Promote → beta`); rule is policy, not mechanism.

## Anti-patterns

- ❌ Hardcoding feature on at launch
- ❌ Hiding feature behind ENV var (env vars don't audit, don't roll out per user, don't surface to admin. ENV is for SECRETS, flags for FEATURES)
- ❌ Multiple flags for one feature (sub-toggles via overrides, not new keys)
- ❌ Flag without admin entry
- ❌ Leaving deprecated flags in code (when feature at `stable, 100%` 30+ days, remove flag check — not feature. Quarterly cleanup)
- ❌ Tweet-length descriptions
- ❌ Empty `e2e_tests` array
- ❌ Missing `smoke_steps`

## Schema example

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
