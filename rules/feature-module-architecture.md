# Feature Module Architecture

Every meaningful new product capability lands as a **feature module**. A scattered service file, a loose route handler, or a bare UI component without a flag is drift — and drift is a merge-blocker.

## Folder shape (`libs/features/<slug>/`)

```
libs/features/<slug>/
├── manifest.ts          # 7 required fields (see below)
├── schemas.ts           # Zod: request / response / config
├── service.ts           # business logic
├── handlers.ts          # Hono route handlers (mount via app.route())
├── README.md            # what it does, flag key, rollout defaults, safe disabled behavior
└── __tests__/           # Jest unit tests
```

E2E specs live separately at `e2e/<slug>/` (or `apps/<app>/e2e/<slug>/` in monorepos).

## 7 required manifest fields

Every `manifest.ts` exports a `FeatureManifest` object with ALL of:
- `slug` — snake_case ≤32 chars, matches D1 `feature_flags.key`
- `name` — human display name
- `description` — one-sentence explanation of what the feature does
- `flagKey` — the D1 feature flag key that gates it
- `owner` — email address of the team member responsible for promotion
- `stage` — `experimental | beta | stable | deprecated | killswitch`
- `createdAt` — ISO date string

Build gate: `npm run validate:features` rejects any module missing these fields.

## When to create a module (auto-fire)

Create a new `libs/features/<slug>/` module when the work:
- Adds a new user-visible capability (not a bug fix or internal refactor)
- Adds new API routes that didn't exist before
- Adds a new UI surface that a user can interact with
- Has a meaningful rollout risk (should ship behind a flag)

Extending an existing module: grep `libs/features/*/manifest.ts` first. Add to the colocated files rather than scatter.

## Feature flag requirement

Every module ships with `enabled=0, rollout_percent=0, stage='experimental'`. No exceptions.

- D1 migration seed row in `migrations/XXXX_feature_flags.sql`
- Server guard: `if (!await isFlagOn(env, slug, user, anonId)) return 404` — never 403
- UI guard: `if (!useFeatureFlag(slug)) return null`
- Auto-appears in `/admin/feature-flags` with zero extra code
- `risk_notes` field: one sentence describing what breaks when disabled

See `feature-flags` for full promotion lifecycle (experimental → beta → stable → deprecated → killswitch).

## Drift-detection script

```bash
npm run validate:features        # local
```

Runs in CI at `.github/workflows/feature-architecture.yml` on every push. Fails on:
- Module folder exists but `manifest.ts` is missing or has <7 fields
- API handler references a slug with no D1 seed row
- Feature flag in D1 seeds has no `e2e/<slug>/` directory
- Sentry/PostHog events fired without `featureSlug` tag
- Zod schemas duplicated outside the module's `schemas.ts`
- `e2e/FEATURES.md` row missing for any manifest

Fix drift before landing — never defer to a follow-up PR.

## Architecture scan (before every new feature)

1. `npm run validate:features` — confirm no existing drift
2. `grep -r "slug" libs/features/*/manifest.ts` — check if capability extends an existing module
3. Grep `src/routes/` for partial implementations that should be colocated
4. New module: `npm run gen:feature -- --slug <name>`
5. Register handlers in root `src/index.ts` via `app.route('/api/<slug>', module.handlers)`

## Cross-links

- `feature-flags` — D1 schema, KV cache, admin UI, promotion lifecycle, killswitch
- `verification-loop` — deploy + prod-E2E mandate applies to every feature module
- `e2e-tdd-organization` — `e2e/<slug>/` spec layout, hermetic contract, parallel runner
- `monitor-orchestration` — multi-feature briefs fan out one agent per module
- `auto-integrate-recs` — if a feature is identified, ship it in the same turn behind a flag
- `docs/architecture/feature-modules.md` — canonical reference for the full module spec
- `docs/architecture/feature-flags.md` — D1 + KV + admin UI implementation details
- `libs/features/donations_engine/` — canonical reference implementation

## See

- `~/.claude/CLAUDE.md` § Feature Flags (SUPREME) — the user-level policy this rule details
- `code-style` — TypeScript strict + Zod everywhere, both apply inside modules
- `always` — Hard Gates still apply post-feature-module (deploy, E2E, a11y, perf)
- `brian-preferences` — pick ONE, just do it; modules let us ship dark and promote with confidence
