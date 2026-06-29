---
name: "emdash-fleet"
priority: 1
pack: "core"
triggers:
  - "emdash"
  - "fleetview"
  - "fleet"
  - "worktree"
  - "parallel agents"
  - "run_in_background"
  - "isolation worktree"
paths:
  - "*"
last_reviewed: 2026-06-28
superseded_by: null
---

# Emdash Fleet

How to run this config optimally under Emdash — the worktree-isolated parallel Claude Code fleet (FleetView UI, `worktree.baseRef: "fresh"`). Tunes context economy, model routing, CF defaults, and verification for many agents working at once.
Cross-links: `[[parallel-subagent-economy]]` `[[delegate-when-saturated]]` `[[opus-quota-fallback]]` `[[cloudflare-lock-in-is-leverage]]` `[[prompt-cache]]` `[[main-only-branch]]` `[[verification-loop]]`

## Worktree isolation

- **Mutating parallel agents → `isolation: "worktree"`** — agents that Edit/Write in parallel get a fresh worktree so they never clobber each other. `baseRef: "fresh"` branches from a clean tree.
- **Read-only / research agents → NO worktree** — isolation costs ~200-500ms + disk; skip it for Explore/audit/search agents.
- Worktrees auto-clean if unchanged. One coherent slice per worktree, merged when green.
- Hooks + scripts are worktree-safe: they reference `$HOME/.claude/...` (absolute) and `getcwd()` (the agent's own worktree). Never hard-code the main checkout path.

## Context economy (every fleet agent re-pays it)

- The always-load set loads in EVERY worktree agent — minimize it. The router caps loaded context at ~40K tokens and ranks per prompt; `paths: ["*"]` only sets *eligibility*, not forced load.
- **Reserve `paths: ["*"]` for genuinely universal rules.** A domain rule (CF-only, Angular-only, payments-only) with specific `triggers:` should scope `paths` to `concern:*`/dir globs so it competes for budget only when relevant. Audit with `bin/audit-path-scope.mjs`.
- Deterministic skill load order (01→19 + tier-1 rules, per `[[prompt-cache]]`) keeps the fleet's prompt prefix cache-warm — never reorder per-agent.
- Compression gains are gate-locked by `bin/check-compression-regression.mjs` (gate 17) — re-bloat fails CI.

## Model routing per fleet agent

- Cheap tier (haiku) for mechanical agents: changelog, content, seo, cost, accessibility.
- Sonnet for build/test/migrate/deploy agents.
- Opus ONLY for architecture, completeness, security, visual-qa, meta-orchestration — and these carry `model_fallback: claude-sonnet-4-6` per `[[opus-quota-fallback]]`.
- Pass `effort` low for mechanical stages; reserve high/xhigh for verify/judge.

## Cloudflare-first defaults (the architecture)

- Default stack: **CF Workers + Hono + D1 (Sessions API) + R2 + KV + Durable Objects + Queues/Workflows**, per `[[cloudflare-lock-in-is-leverage]]` + `[[projectsites-cloudflare-first]]`.
- Deep CF lock-in is the feature — reach for CF primitives directly, no portability layer.
- Rollback via `wrangler rollback` + D1 Time Travel + R2 versioning (no staging, per `[[no-staging-doctrine]]`).
- Prod is standing-authorized for Brian's repos — green slice → `wrangler deploy` → prod-E2E, never hold dark.

## Verification + merge in a fleet

- Each worktree agent runs `npm run lint` (17 gates + the advisory `audit-all` dashboard) before its slice merges.
- Diffs clearing all gates auto-merge to `main` (`[[solo-builder-doctrine]]`, `[[main-only-branch]]`) — no PR ritual.
- Safety hooks fire in every worktree: `secret-scan-prewrite` (Write/Edit) + `destructive-bash-guard` (Bash), logged to `~/.claude/hooks/.hook-execution.log`.
- Post-deploy: prod-E2E per `[[verification-loop]]` from each merged slice.

## See

- `docs/ARCHITECTURE.md` — auto-generated plugin map (regenerate via `bin/gen-architecture-map.mjs`)
- `mcp-servers/_registry.json` — MCP fleet source of truth
- `[[monitor-orchestration]]` — when to fan out vs run serial
