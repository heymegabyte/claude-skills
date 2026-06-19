---
name: "MCP Server Registry"
description: "Health monitoring + drift detection for Brian's 15+ MCP servers (CF, GitHub, Stripe, Bitwarden, Gmail, Slack, etc.). Registry JSON shape, daily healthcheck Worker, tool-list drift detection, Slack/email alert on degradation, secret rotation reminders."
updated: "2026-06-18"
always-load: false
---

# MCP Server Registry

Every MCP server is a dependency. Treat it like one: registry, healthchecks, drift detection, rotation schedule. A silently-broken MCP is worse than a missing one — Claude calls the tool and gets garbage instead of an error.

## Registry Schema

Canonical registry lives at `~/.claude/mcp-registry.json`. One object per server:

```jsonc
// ~/.claude/mcp-registry.json
{
  "servers": [
    {
      "id": "cloudflare",
      "name": "Cloudflare Developer Platform",
      "package": "@cloudflare/mcp-server-cloudflare",
      "transport": "stdio",
      "secret_keys": ["CLOUDFLARE_API_TOKEN"],
      "secret_rotation_days": 90,
      "tier": "load-bearing",          // load-bearing | supporting | experimental
      "healthcheck_url": null,          // null for stdio; URL for SSE/HTTP servers
      "known_tools": [                  // snapshot of advertised tools — drift-checked daily
        "d1_database_query", "kv_namespace_get", "workers_list",
        "r2_bucket_create", "search_cloudflare_documentation"
      ],
      "last_healthy": "2026-06-18T00:00:00Z",
      "last_checked": "2026-06-18T00:00:00Z",
      "status": "healthy",              // healthy | degraded | unreachable | unknown
      "notes": "CF API token scope: D1, KV, R2, Workers, SSL for SaaS"
    },
    {
      "id": "github",
      "name": "GitHub",
      "package": "@modelcontextprotocol/server-github",
      "transport": "stdio",
      "secret_keys": ["GITHUB_TOKEN"],
      "secret_rotation_days": 365,
      "tier": "load-bearing",
      "known_tools": [
        "create_pull_request", "get_file_contents", "push_files",
        "search_code", "list_commits", "create_issue", "merge_pull_request"
      ],
      "last_healthy": "2026-06-18T00:00:00Z",
      "last_checked": "2026-06-18T00:00:00Z",
      "status": "healthy"
    },
    {
      "id": "stripe",
      "name": "Stripe",
      "package": "stripe-mcp",
      "transport": "stdio",
      "secret_keys": ["STRIPE_API_KEY"],
      "secret_rotation_days": 180,
      "tier": "load-bearing",
      "known_tools": [
        "stripe_api_read", "stripe_api_write", "fetch_stripe_resources",
        "search_stripe_resources", "create_refund"
      ],
      "last_healthy": "2026-06-18T00:00:00Z",
      "last_checked": "2026-06-18T00:00:00Z",
      "status": "healthy"
    },
    {
      "id": "bitwarden",
      "name": "Bitwarden",
      "package": "@bitwarden/mcp-server",
      "transport": "stdio",
      "secret_keys": ["BW_CLIENTID", "BW_CLIENTSECRET", "BW_PASSWORD"],
      "secret_rotation_days": 180,
      "tier": "load-bearing",
      "known_tools": ["list", "get", "create_item", "edit_item", "generate", "status"],
      "last_healthy": "2026-06-18T00:00:00Z",
      "last_checked": "2026-06-18T00:00:00Z",
      "status": "healthy"
    },
    {
      "id": "gmail",
      "name": "Gmail",
      "package": "@modelcontextprotocol/server-gmail",
      "transport": "stdio",
      "secret_keys": ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN"],
      "secret_rotation_days": 60,      // OAuth refresh tokens expire; rotate aggressively
      "tier": "supporting",
      "known_tools": ["search_threads", "get_thread", "create_draft", "list_labels"],
      "last_healthy": "2026-06-18T00:00:00Z",
      "last_checked": "2026-06-18T00:00:00Z",
      "status": "healthy"
    },
    {
      "id": "slack",
      "name": "Slack",
      "package": "@modelcontextprotocol/server-slack",
      "transport": "stdio",
      "secret_keys": ["SLACK_BOT_TOKEN", "SLACK_TEAM_ID"],
      "secret_rotation_days": 365,
      "tier": "supporting",
      "known_tools": [
        "slack_send_message", "slack_read_channel", "slack_search_public",
        "slack_read_user_profile", "slack_search_channels"
      ],
      "last_healthy": "2026-06-18T00:00:00Z",
      "last_checked": "2026-06-18T00:00:00Z",
      "status": "healthy"
    },
    {
      "id": "posthog",
      "name": "PostHog",
      "package": "@posthog/mcp-server",
      "transport": "stdio",
      "secret_keys": ["POSTHOG_API_KEY"],
      "secret_rotation_days": 365,
      "tier": "supporting",
      "known_tools": ["exec", "query", "list_insights", "list_feature_flags"],
      "last_healthy": "2026-06-18T00:00:00Z",
      "last_checked": "2026-06-18T00:00:00Z",
      "status": "healthy"
    },
    {
      "id": "neon",
      "name": "Neon",
      "package": "@neondatabase/mcp-server-neon",
      "transport": "stdio",
      "secret_keys": ["NEON_API_KEY"],
      "secret_rotation_days": 365,
      "tier": "supporting",
      "known_tools": ["run_sql", "create_branch", "list_projects", "describe_table_schema"],
      "last_healthy": "2026-06-18T00:00:00Z",
      "last_checked": "2026-06-18T00:00:00Z",
      "status": "healthy"
    },
    {
      "id": "resend",
      "name": "Resend",
      "package": "@resend/mcp-server",
      "transport": "stdio",
      "secret_keys": ["RESEND_API_KEY"],
      "secret_rotation_days": 365,
      "tier": "supporting",
      "known_tools": ["send-email", "create-contact", "list-audiences", "get-domain"],
      "last_healthy": "2026-06-18T00:00:00Z",
      "last_checked": "2026-06-18T00:00:00Z",
      "status": "healthy"
    },
    {
      "id": "playwright",
      "name": "Playwright",
      "package": "@playwright/mcp",
      "transport": "stdio",
      "secret_keys": [],
      "secret_rotation_days": null,
      "tier": "load-bearing",
      "known_tools": [
        "browser_navigate", "browser_click", "browser_snapshot", "browser_take_screenshot",
        "browser_fill", "browser_evaluate", "browser_network_requests"
      ],
      "last_healthy": "2026-06-18T00:00:00Z",
      "last_checked": "2026-06-18T00:00:00Z",
      "status": "healthy"
    },
    {
      "id": "sentry",
      "name": "Sentry",
      "package": "@sentry/mcp-server",
      "transport": "stdio",
      "secret_keys": ["SENTRY_AUTH_TOKEN"],
      "secret_rotation_days": 180,
      "tier": "supporting",
      "known_tools": ["search_issues", "get_sentry_resource", "update_issue", "find_organizations"],
      "last_healthy": "2026-06-18T00:00:00Z",
      "last_checked": "2026-06-18T00:00:00Z",
      "status": "healthy"
    },
    {
      "id": "upstash",
      "name": "Upstash",
      "package": "@upstash/mcp-server",
      "transport": "stdio",
      "secret_keys": ["UPSTASH_EMAIL", "UPSTASH_API_KEY"],
      "secret_rotation_days": 365,
      "tier": "supporting",
      "known_tools": [
        "redis_database_run_redis_commands", "redis_database_list_databases",
        "qstash_publish_message", "qstash_schedules_list"
      ],
      "last_healthy": "2026-06-18T00:00:00Z",
      "last_checked": "2026-06-18T00:00:00Z",
      "status": "healthy"
    }
  ]
}
```

## Vendor Tiers

- **load-bearing** — Claude blocks on these for core dev tasks (CF, GitHub, Playwright, Stripe, Bitwarden). SLA: fix within 4h if broken. Never allow >1 load-bearing server degraded simultaneously.
- **supporting** — adds value but work continues without them (Slack, Gmail, PostHog, Neon, Resend). SLA: fix within 48h.
- **experimental** — new integrations under evaluation. No SLA.

## Daily Healthcheck Worker

Deploy at `workers.megabyte.space/mcp-healthcheck` — runs as a Cron Trigger at `0 7 * * *` (7am UTC):

```typescript
// workers/mcp-healthcheck/index.ts
import registry from '../../mcp-registry.json'

interface McpStatus { id: string; status: 'healthy' | 'degraded' | 'unreachable'; latency_ms: number; error?: string }

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runChecks(env))
  },
  async fetch(req: Request, env: Env) {
    // GET /status — returns last-known state from KV
    const state = await env.MCP_HEALTH_KV.get('state', 'json') as Record<string, McpStatus>
    return Response.json(state ?? {})
  }
}

async function runChecks(env: Env) {
  const results: McpStatus[] = await Promise.all(
    registry.servers.map(server => checkServer(server, env))
  )

  const state = Object.fromEntries(results.map(r => [r.id, r]))
  await env.MCP_HEALTH_KV.put('state', JSON.stringify(state))

  const degraded = results.filter(r => r.status !== 'healthy')
  if (degraded.length > 0) await sendAlerts(env, degraded)

  await logToR2(env, results)
}

async function checkServer(server: typeof registry.servers[0], env: Env): Promise<McpStatus> {
  const t0 = Date.now()
  try {
    if (server.healthcheck_url) {
      // HTTP/SSE transport — hit the health endpoint
      const res = await fetch(server.healthcheck_url, { signal: AbortSignal.timeout(5000) })
      return { id: server.id, status: res.ok ? 'healthy' : 'degraded', latency_ms: Date.now() - t0,
               error: res.ok ? undefined : `HTTP ${res.status}` }
    }
    // stdio transport — verify package exists in npm registry
    const res = await fetch(`https://registry.npmjs.org/${server.package}/latest`,
      { signal: AbortSignal.timeout(5000) })
    return { id: server.id, status: res.ok ? 'healthy' : 'degraded', latency_ms: Date.now() - t0,
             error: res.ok ? undefined : `npm registry: HTTP ${res.status}` }
  } catch (e) {
    return { id: server.id, status: 'unreachable', latency_ms: Date.now() - t0,
             error: String(e) }
  }
}
```

## Drift Detection

Drift = the set of tools a server advertises today differs from `known_tools` in the registry. New tools may unlock capability; removed tools will break prompts.

```typescript
// workers/mcp-healthcheck/drift.ts
// Run weekly via a separate Cron Trigger: "0 8 * * 1" (Monday 8am UTC)
export async function detectDrift(env: Env) {
  // Fetch live tool manifests by calling each server's list-tools endpoint
  // For npm-hosted servers: pull README + CHANGELOG from GitHub, parse tool names
  const drifts: DriftReport[] = []

  for (const server of registry.servers) {
    const liveTools = await fetchLiveToolList(server, env)
    if (!liveTools) continue

    const known = new Set(server.known_tools)
    const live = new Set(liveTools)
    const added = liveTools.filter(t => !known.has(t))
    const removed = server.known_tools.filter(t => !live.has(t))

    if (added.length > 0 || removed.length > 0) {
      drifts.push({ serverId: server.id, added, removed })
    }
  }

  if (drifts.length > 0) await sendDriftAlerts(env, drifts)
  return drifts
}

async function fetchLiveToolList(server: typeof registry.servers[0], env: Env): Promise<string[] | null> {
  // Heuristic: parse GitHub README for a tools table
  // Packages follow pattern: github.com/org/mcp-server-${name}
  try {
    const pkg = await fetch(`https://registry.npmjs.org/${server.package}/latest`).then(r => r.json<any>())
    const repoUrl = pkg.repository?.url?.replace(/^git\+/, '').replace(/\.git$/, '')
    if (!repoUrl) return null
    const [, owner, repo] = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/) ?? []
    if (!owner) return null
    const readme = await fetch(
      `https://raw.githubusercontent.com/${owner}/${repo}/main/README.md`
    ).then(r => r.text())
    // Extract tool names: lines containing backtick-wrapped identifiers in a tools table
    return [...readme.matchAll(/`([a-z][a-z0-9_]{2,50})`/g)]
      .map(m => m[1])
      .filter(t => !['bash', 'json', 'yaml', 'typescript'].includes(t))
  } catch { return null }
}
```

## Secret Rotation Reminders

Check rotation schedule daily; alert 14 days before expiry:

```typescript
// workers/mcp-healthcheck/rotation.ts
export async function checkRotationDue(env: Env) {
  const due: RotationAlert[] = []
  const now = Date.now()

  for (const server of registry.servers) {
    if (!server.secret_rotation_days || !server.last_healthy) continue
    const lastRotated = new Date(server.last_healthy).getTime() // proxy: use last_healthy
    const rotationDue = lastRotated + server.secret_rotation_days * 86_400_000
    const daysUntilDue = Math.floor((rotationDue - now) / 86_400_000)

    if (daysUntilDue <= 14) {
      due.push({
        serverId: server.id,
        secretKeys: server.secret_keys,
        daysUntilDue,
        tier: server.tier,
      })
    }
  }

  if (due.length > 0) await sendRotationReminders(env, due)
}
```

## Alert Delivery

```typescript
async function sendAlerts(env: Env, degraded: McpStatus[]) {
  const lines = degraded.map(s =>
    `• *${s.id}* (${registry.servers.find(r => r.id === s.id)?.tier}) — ${s.status}: ${s.error ?? 'no error'}`
  ).join('\n')

  // Slack
  await fetch(env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🔴 MCP Health Alert — ${degraded.length} server(s) degraded`,
      blocks: [
        { type: 'section', text: { type: 'mrkdwn', text: `*MCP Server Degradation*\n${lines}` } },
        { type: 'section', text: { type: 'mrkdwn', text: `Check: https://workers.megabyte.space/mcp-healthcheck/status` } },
      ],
    }),
  })

  // Email via Resend (load-bearing degradation only)
  const loadBearingDown = degraded.filter(s =>
    registry.servers.find(r => r.id === s.id)?.tier === 'load-bearing'
  )
  if (loadBearingDown.length > 0) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'alerts@megabyte.space',
        to: 'brian@megabyte.space',
        subject: `URGENT: Load-bearing MCP servers down (${loadBearingDown.map(s => s.id).join(', ')})`,
        html: `<pre>${lines}</pre>`,
      }),
    })
  }
}
```

## R2 Audit Log

```typescript
async function logToR2(env: Env, results: McpStatus[]) {
  const date = new Date().toISOString().slice(0, 10)
  await env.MCP_AUDIT_R2.put(
    `mcp-health/${date}.ndjson`,
    results.map(r => JSON.stringify({ ...r, ts: new Date().toISOString() })).join('\n'),
    { httpMetadata: { contentType: 'application/x-ndjson' } }
  )
}
```

## wrangler.toml for Healthcheck Worker

```toml
name = "mcp-healthcheck"
main = "workers/mcp-healthcheck/index.ts"
compatibility_date = "2025-03-01"

[[kv_namespaces]]
binding = "MCP_HEALTH_KV"
id = "YOUR_KV_ID"

[[r2_buckets]]
binding = "MCP_AUDIT_R2"
bucket_name = "mcp-audit-logs"

[vars]
SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/..."

[[triggers.crons]]
crons = ["0 7 * * *", "0 8 * * 1"]  # daily health, weekly drift
```

## Updating the Registry

When you add a new MCP server or a server's tool list changes:

1. Run `npx @modelcontextprotocol/inspector <server-cmd>` to get the live tool list.
2. Update `known_tools` in `mcp-registry.json`.
3. Bump `last_healthy` to today.
4. Commit — the registry is source-of-truth, not a generated artifact.

## See

- `secret-auto-provisioning` — `get-secret` + Bitwarden integration
- `secret-provisioning` — rotation cadence by secret class
- `drift-detection` — broader drift detection doctrine
- `cloudflare-lock-in-is-leverage` — why health Worker lives on CF
- `workers-tracing-otlp` — add OTLP traces to healthcheck runs
