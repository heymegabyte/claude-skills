---
description: Run the drift-detection checklist (incl. agent-drift signals); report + fix in-turn
argument-hint: [scope, optional]
---

Run the drift-detection checklist per [[drift-detection]].

**Purpose** — surface and fix architecture/feature/agent drift before it compounds.

**When to use** — before adding a major feature; after a multi-agent run; on demand.

**Inputs** — `$ARGUMENTS` (optional scope); else the current project + last run.

Checklist:

- Feature drift — UI/route/handler without matching flag, manifest, or `e2e/<slug>/` per [[feature-module-architecture]].
- Schema drift — Zod schemas duplicated outside the module's `schemas.ts`.
- Observability drift — Sentry/PostHog events missing `featureSlug` tag.
- Agent drift — registered specialist bypassed by a generic worker; agent def stale vs taxonomy; brief output contract decayed (signals per [[agent-selection]]).
- Doc drift — CLAUDE.md / FEATURES.md out of sync with code.
- Run `npm run validate:features` when the project exposes it.

**Outputs** — drift report (item · severity · fix). Fix every in-scope item in-turn; do not defer.

**Verification** — re-run the failing validator/grep to confirm green; deploy-gate per [[verification-loop]] if code changed.

**Can update ~/.agentskills or ~/.claude?** Only if a drift RULE itself proved weak (e.g. a drift class it failed to catch) — then update [[drift-detection]] and commit+push. Otherwise NO.
