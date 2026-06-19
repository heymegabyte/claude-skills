---
description: Healthcheck + drift detect + rotation-reminder across all MCP servers in ~/.claude/mcp-registry.json
argument-hint: [--id <server-id>] [--tier load-bearing|supporting|experimental] [--fix-registry]
---

<!-- <SUBAGENT-STOP>: skip this skill when running inside a subagent. Meta-skills must not leak into spawned subagent contexts. -->
<SUBAGENT-STOP/>

Run a full MCP fleet audit per [[mcp-server-registry]]. A silently-broken MCP is worse than a missing one — Claude calls the tool and gets garbage instead of an error.

**Purpose** — surface degraded, drifted, or rotation-due MCP servers before they silently fail during a session.

**When to use** — Monday morning before a heavy session; after adding a new MCP server; after updating an existing package; when a tool call returns unexpected errors; on demand.

**Inputs**

- `--id <server-id>` — audit only this server
- `--tier <tier>` — filter to `load-bearing`, `supporting`, or `experimental`
- `--fix-registry` — after drift detection, interactively update `known_tools` in the registry JSON for drifted servers (write back to `~/.claude/mcp-registry.json`)

---

## Step 1 — Load the registry

Read `~/.claude/mcp-registry.json`. If the file does not exist, emit:

```
No registry found at ~/.claude/mcp-registry.json
Create it following the schema in 13-observability-and-growth/mcp-server-registry.md
```

Exit 0 (no registry = no audit to run, not a failure).

Validate the registry JSON structure: each entry must have `id`, `package`, `transport`, `tier`, `known_tools[]`, `last_checked`. Any entry missing required fields is flagged as `schema_error` in the report.

Apply `--id` and `--tier` filters if provided.

---

## Step 2 — Per-server healthcheck

Run all checks in parallel (`Promise.all` equivalent — fire all fetches simultaneously, collect results).

**HTTP/SSE transport** (`healthcheck_url` is non-null):

- `GET {healthcheck_url}` with 5s timeout (`AbortSignal.timeout(5000)`)
- Status 2xx → `healthy`; 4xx/5xx → `degraded` with `HTTP {status}`; timeout/network error → `unreachable`
- Record `latency_ms`

**stdio transport** (`healthcheck_url` is null):

- `GET https://registry.npmjs.org/{package}/latest` with 5s timeout
- Package found + version returned → `healthy` (npm registry reachable, package published)
- 404 → `degraded` (package unpublished or renamed — needs immediate investigation)
- Network error → `unreachable`
- Record the current `version` from npm response for comparison with any locally installed version

For each server, update `last_checked` to `now()` in memory (write back only if `--fix-registry` is set).

---

## Step 3 — Tool-list drift detection (GitHub-source servers)

For each server where `package` follows the `@org/mcp-server-*` or `mcp-server-*` convention:

1. Fetch `https://registry.npmjs.org/{package}/latest` → extract `repository.url`
2. Derive GitHub raw README URL: `https://raw.githubusercontent.com/{owner}/{repo}/main/README.md`
3. Extract tool names from the README using the heuristic: backtick-wrapped `[a-z][a-z0-9_]{2,50}` identifiers that appear in a tools table or `## Tools` section. Exclude language keywords: `bash`, `json`, `yaml`, `typescript`, `javascript`, `python`, `node`.
4. Compare live tool list vs `known_tools[]` in registry:
   - `added[]` — tools in live list not in `known_tools` (new capability available — update registry)
   - `removed[]` — tools in `known_tools` not in live list (breaking — prompts referencing these will silently fail)

If the README fetch fails (404, network error), mark drift check as `skipped` with reason — do not fail the server's health status on this alone.

---

## Step 4 — Secret rotation check

For each server with `secret_rotation_days` set and `last_healthy` set:

- Compute `rotation_due_at = new Date(last_healthy).getTime() + secret_rotation_days * 86_400_000`
- Compute `days_until_due = Math.floor((rotation_due_at - Date.now()) / 86_400_000)`
- If `days_until_due <= 14` → flag `rotation_due` with urgency:
  - `days_until_due <= 0` → **OVERDUE** (rotate immediately)
  - `days_until_due <= 7` → **URGENT** (rotate this week)
  - `days_until_due <= 14` → **SOON** (schedule rotation)

List the `secret_keys[]` that need rotation for each flagged server. Do not display secret values — names only.

---

## Step 5 — Emit structured report

Format the full report:

```
MCP Fleet Audit — 2026-06-18T09:31:00Z
═══════════════════════════════════════

SUMMARY
  Total servers:    12
  Healthy:          10
  Degraded:          1  ← investigate
  Unreachable:       1  ← investigate
  Drift detected:    2  (1 added tools · 1 removed tools)
  Rotation due:      2  (1 OVERDUE · 1 SOON)

LOAD-BEARING (SLA: fix within 4h)
  ✓ cloudflare        healthy    42ms   (stdio/npm)
  ✓ github            healthy    38ms   (stdio/npm)
  ✗ stripe            degraded   —      npm registry: HTTP 503
  ✓ bitwarden         healthy    55ms   (stdio/npm)
  ✓ playwright        healthy    29ms   (stdio/npm)

SUPPORTING (SLA: fix within 48h)
  ✓ gmail             healthy    61ms   (stdio/npm)
  ~ slack             drift      healthy  +2 tools added: slack_canvas_create, slack_huddle_start
  ✓ posthog           healthy    44ms   (stdio/npm)
  ✓ neon              healthy    51ms   (stdio/npm)
  ✓ resend            healthy    33ms   (stdio/npm)
  ✗ sentry            unreachable —     timeout after 5000ms
  ✓ upstash           healthy    47ms   (stdio/npm)

DRIFT DETAILS
  slack — 2 tools added (update registry to unlock new capability):
    + slack_canvas_create
    + slack_huddle_start
  sentry — 1 tool removed (BREAKING — prompts will fail):
    - analyze_issue_with_seer   ← was in known_tools; no longer in README

ROTATION DUE
  gmail     OVERDUE  (secret_rotation_days:60 · 3 days overdue)
    Keys: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
  stripe    SOON     (secret_rotation_days:180 · 11 days until due)
    Keys: STRIPE_API_KEY

ALERT RECOMMENDATIONS
  [P1] stripe degraded (load-bearing) — npm registry 503; retry in 15m; if persistent, check https://status.npmjs.org
  [P1] sentry unreachable — tool removed from README is a breaking drift; verify package still published
  [P2] gmail rotation OVERDUE — OAuth refresh tokens may already be invalid; rotate immediately
  [P2] slack drift — 2 new tools available; run with --fix-registry to update known_tools
```

---

## Step 6 — Alert recommendation logic

Emit an alert recommendation for each of these conditions:

| Condition | Priority | Recommended action |
|---|---|---|
| load-bearing server degraded or unreachable | P1 | Fix within 4h; check npm status page |
| Any server has REMOVED tools (breaking drift) | P1 | Update prompts that reference the removed tool; update registry |
| Rotation OVERDUE on any server | P2 | Rotate immediately; check if current token still works |
| supporting server unreachable | P2 | Fix within 48h |
| New tools available (added drift) | P3 | Review and update registry; new capability may be useful |
| Rotation SOON | P3 | Schedule rotation this week |

---

## Step 7 — Registry write-back (--fix-registry only)

If `--fix-registry` is set and drift was detected:

- For each drifted server where the live tool list was successfully fetched, update `known_tools[]` in the in-memory registry to the live list
- Set `last_checked` to now for all checked servers
- Write the updated registry back to `~/.claude/mcp-registry.json`
- Emit: `Registry updated — {N} servers patched. Review the diff before committing.`

Never write back if the live tool list fetch failed — do not overwrite good data with missing data.

---

**Verification** — After the audit, spot-check one healthy server manually: `npm view {package} version` should return a version number. Confirm the reported latency is plausible (<200ms for npm registry).

**See**

- `13-observability-and-growth/mcp-server-registry.md` — full registry schema, healthcheck Worker code, drift detection, alert delivery
- `rules/secret-provisioning.md` — rotation cadence by secret class
- `rules/drift-detection.md` — broader drift doctrine
- `rules/vendor-risk-tiering.md` — load-bearing vs replaceable classification
