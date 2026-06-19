---
name: "Multi-Tenant Subdomain Provisioning"
description: "Custom-domain provisioning on Cloudflare Workers for multi-tenant SaaS: ACME via CF SSL for SaaS, Workers Custom Domains API, dispatch namespaces for tenant isolation, wildcard vs apex cert, DNS verification flow, billing per domain."
updated: "2026-06-18"
always-load: false
---

# Multi-Tenant Subdomain Provisioning

Two modes: managed subdomains (`tenant.app.megabyte.space`) and tenant-owned custom domains (`dashboard.acme.com`). Managed is free and instant. Custom domains need ACME + DNS verification and cost $0.10/month per hostname on CF SSL for SaaS.

## Architecture Decision

| Mode | When | Cost | Complexity |
|------|------|------|------------|
| Managed subdomain (`*.app.megabyte.space`) | Default for all tenants | Free | Low — wildcard cert, no DNS work |
| Custom apex (`acme.com`) | Enterprise, custom branding | $0.10/hostname/month | High — ACME, DNS TXT verify |
| Custom subdomain (`app.acme.com`) | Mid-market | $0.10/hostname/month | Medium — CNAME to CF |

Always provision managed subdomain first. Custom domain is an upgrade.

## Managed Subdomain (Wildcard — Zero Work)

One wildcard cert `*.app.megabyte.space` via CF dashboard. Workers route on `hostname`:

```typescript
// wrangler.toml
[[routes]]
pattern = "*.app.megabyte.space/*"
zone_name = "megabyte.space"

// worker/tenant-router.ts
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const host = new URL(req.url).hostname           // tenant-slug.app.megabyte.space
    const slug = host.split('.')[0]
    const tenant = await getTenantBySlug(env, slug)
    if (!tenant) return new Response('Not found', { status: 404 })
    return handleTenantRequest(req, env, tenant)
  }
}

async function getTenantBySlug(env: Env, slug: string) {
  return env.DB.prepare('SELECT * FROM tenants WHERE slug = ? LIMIT 1')
    .bind(slug).first<Tenant>()
}
```

No cert provisioning, no DNS API — just a D1 row. Provision time: <50ms.

## Custom Domain: CF SSL for SaaS

CF SSL for SaaS provisions TLS for tenant-owned hostnames served from YOUR zone. Docs: `developers.cloudflare.com/ssl/ssl-for-saas`.

### Prerequisites

1. Your apex zone (`app.megabyte.space`) must use CF nameservers.
2. Enable SSL for SaaS: CF Dashboard → SSL/TLS → Custom Hostnames → enable.
3. Fallback origin: your Worker's route (not a plain IP).

### Provisioning Flow (CF API)

```typescript
// worker/custom-domain-provisioning.ts
const CF_API = 'https://api.cloudflare.com/client/v4'
const headers = {
  'Authorization': `Bearer ${env.CF_API_TOKEN}`,
  'Content-Type': 'application/json',
}

export interface CustomHostnameProvision {
  tenantId: string
  hostname: string          // e.g. "dashboard.acme.com"
  verificationMethod: 'txt' | 'http' | 'email'
}

export async function provisionCustomHostname(
  env: Env,
  { tenantId, hostname, verificationMethod }: CustomHostnameProvision
): Promise<ProvisionResult> {
  // 1. Create custom hostname on CF
  const res = await fetch(
    `${CF_API}/zones/${env.CF_ZONE_ID}/custom_hostnames`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        hostname,
        ssl: {
          method: 'http',   // ACME HTTP-01 — no DNS access needed on tenant side
          type: 'dv',
          settings: {
            min_tls_version: '1.2',
            http2: 'on',
          },
        },
        custom_origin_server: env.WORKER_ORIGIN,  // your Workers route
      }),
    }
  )
  if (!res.ok) throw new Error(`CF API error: ${res.status} ${await res.text()}`)
  const { result } = await res.json<{ result: CFCustomHostname }>()

  // 2. Persist to D1 (pending_verification)
  await env.DB.prepare(`
    INSERT INTO tenant_custom_domains
      (tenant_id, hostname, cf_custom_hostname_id, status, verification_records, created_at)
    VALUES (?, ?, ?, 'pending_verification', ?, datetime('now'))
  `).bind(
    tenantId, hostname, result.id,
    JSON.stringify(result.ownership_verification ?? result.ssl.validation_records)
  ).run()

  return {
    cfId: result.id,
    status: result.status,
    verificationRecords: result.ssl.validation_records,
    ownershipVerification: result.ownership_verification,
  }
}
```

### DNS Verification Flow

ACME HTTP-01 is simplest: tenant just needs to CNAME their hostname to your fallback origin. Tenant never touches TXT records.

```
tenant's DNS:  CNAME  dashboard.acme.com → fallback.app.megabyte.space
your CF zone:  A      fallback.app.megabyte.space → Workers route
```

For apex domains (`acme.com`) where CNAME is illegal, use ANAME/ALIAS or CF nameserver delegation:

```typescript
// Return verification instructions based on hostname type
function dnsInstructions(hostname: string): DnsInstructions {
  const isApex = hostname.split('.').length === 2
  if (isApex) {
    return {
      type: 'NS',
      note: 'Apex domains require NS delegation or ANAME support.',
      records: [
        { type: 'ANAME', name: '@', value: 'fallback.app.megabyte.space' },
      ],
      alternative: 'Use a subdomain (e.g., app.acme.com) for simpler CNAME setup.',
    }
  }
  return {
    type: 'CNAME',
    records: [{ type: 'CNAME', name: hostname.split('.')[0], value: 'fallback.app.megabyte.space' }],
  }
}
```

### Status Polling (Workers Cron)

CF takes 1–15 min to issue a DV cert. Poll and update D1:

```typescript
// Cron: runs every 5 minutes
export async function pollPendingDomains(env: Env) {
  const pending = await env.DB.prepare(`
    SELECT * FROM tenant_custom_domains
    WHERE status IN ('pending_verification', 'pending_issuance')
    AND created_at > datetime('now', '-7 days')
  `).all<TenantCustomDomain>()

  await Promise.all(pending.results.map(async (row) => {
    const res = await fetch(
      `${CF_API}/zones/${env.CF_ZONE_ID}/custom_hostnames/${row.cf_custom_hostname_id}`,
      { headers }
    )
    const { result } = await res.json<{ result: CFCustomHostname }>()

    if (result.status === 'active') {
      await env.DB.prepare(
        `UPDATE tenant_custom_domains SET status = 'active', activated_at = datetime('now')
         WHERE id = ?`
      ).bind(row.id).run()
      await notifyTenantDomainActive(env, row.tenant_id, row.hostname)
    } else if (result.ssl.status === 'validation_timed_out') {
      await env.DB.prepare(
        `UPDATE tenant_custom_domains SET status = 'failed', error = ? WHERE id = ?`
      ).bind('SSL validation timed out — check DNS records', row.id).run()
    }
  }))
}
```

## Workers Dispatch Namespaces (Tenant Isolation at Code Level)

For tenants needing isolated Worker code (plugins, custom logic), use Workers for Platforms dispatch namespaces.

```bash
# One-time setup
wrangler dispatch-namespace create saas-tenants

# Deploy a tenant's custom script
wrangler dispatch-namespace put saas-tenants/tenant-${tenantId} --script ./tenant-bundle.js
```

```typescript
// wrangler.toml
[[dispatch_namespaces]]
binding = "TENANT_DISPATCHER"
namespace = "saas-tenants"

// worker/index.ts — route to tenant's custom Worker
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const tenant = await resolveTenant(req, env)
    if (tenant.has_custom_worker) {
      const tenantWorker = env.TENANT_DISPATCHER.get(
        `tenant-${tenant.id}`,
        {},
        { outbound: { worker: env.OUTBOUND_WORKER, params: { tenantId: tenant.id } } }
      )
      return tenantWorker.fetch(req)
    }
    return handleDefaultTenantRequest(req, env, tenant)
  }
}
```

Dispatch namespace billing: $0.02/million requests above free tier. Only use for true plugin-extensible SaaS.

## D1 Schema

```sql
CREATE TABLE IF NOT EXISTS tenants (
  id          TEXT PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,   -- managed subdomain handle
  name        TEXT NOT NULL,
  plan        TEXT NOT NULL DEFAULT 'free',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tenant_custom_domains (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id             TEXT NOT NULL REFERENCES tenants(id),
  hostname              TEXT UNIQUE NOT NULL,
  cf_custom_hostname_id TEXT UNIQUE NOT NULL,
  status                TEXT NOT NULL DEFAULT 'pending_verification',
  -- pending_verification | pending_issuance | active | failed | deleted
  verification_records  TEXT,   -- JSON array of DNS records to show tenant
  error                 TEXT,
  created_at            TEXT NOT NULL DEFAULT (datetime('now')),
  activated_at          TEXT
);

CREATE INDEX idx_tcd_tenant ON tenant_custom_domains(tenant_id);
CREATE INDEX idx_tcd_status ON tenant_custom_domains(status);
```

## Routing in the Main Worker

```typescript
// worker/tenant-router.ts — unified hostname → tenant resolver
export async function resolveTenant(req: Request, env: Env): Promise<Tenant | null> {
  const host = new URL(req.url).hostname

  // 1. Managed subdomain: slug.app.megabyte.space
  if (host.endsWith('.app.megabyte.space')) {
    const slug = host.replace('.app.megabyte.space', '')
    return env.DB.prepare('SELECT * FROM tenants WHERE slug = ?').bind(slug).first<Tenant>()
  }

  // 2. Custom domain — look up active entry
  const row = await env.DB.prepare(
    `SELECT t.* FROM tenants t
     JOIN tenant_custom_domains d ON d.tenant_id = t.id
     WHERE d.hostname = ? AND d.status = 'active'`
  ).bind(host).first<Tenant>()
  return row ?? null
}
```

## Billing Per Domain

Track in D1, bill monthly via Stripe metered billing:

```typescript
// Cron: 1st of month — count active custom domains, report to Stripe
export async function billCustomDomains(env: Env) {
  const { results } = await env.DB.prepare(`
    SELECT tenant_id, COUNT(*) as domain_count
    FROM tenant_custom_domains WHERE status = 'active'
    GROUP BY tenant_id
  `).all<{ tenant_id: string; domain_count: number }>()

  for (const { tenant_id, domain_count } of results) {
    const tenant = await getTenantById(env, tenant_id)
    if (!tenant.stripe_subscription_id) continue
    // Report metered usage: $0.15/domain/month (CF cost $0.10 + $0.05 margin)
    await stripe.subscriptionItems.createUsageRecord(tenant.stripe_usage_item_id, {
      quantity: domain_count,
      action: 'set',
    })
  }
}
```

## Security

- Validate `hostname` input: must be valid FQDN, max 253 chars, no wildcard (`*`), no internal hostnames.
- Rate limit provisioning API: max 5 custom domains per tenant on free, 50 on enterprise.
- On tenant account deletion: `DELETE /zones/${CF_ZONE_ID}/custom_hostnames/${cfId}` for each domain before deleting D1 rows.
- Log all CF API calls to R2 audit trail per `enterprise-multi-tenancy` pattern.

## Wrangler Commands Reference

```bash
# List custom hostnames (verify provisioning)
wrangler api /zones/${CF_ZONE_ID}/custom_hostnames | jq '.result[] | {hostname, status}'

# Force SSL recheck
wrangler api /zones/${CF_ZONE_ID}/custom_hostnames/${CF_HOSTNAME_ID} --method PATCH \
  --data '{"ssl":{"method":"http"}}'

# Delete a custom hostname (on tenant churn)
wrangler api /zones/${CF_ZONE_ID}/custom_hostnames/${CF_HOSTNAME_ID} --method DELETE
```

## See

- `enterprise-multi-tenancy` — D1-per-tenant isolation, RBAC, audit logging
- `cf-auto-provision` — Worker + D1 + KV auto-setup scripts
- `cloudflare-lock-in-is-leverage` — why CF primitives over portability layers
- `stripe-billing` — metered billing for custom domain count
- `secret-auto-provisioning` — `CF_API_TOKEN` retrieval via `get-secret`
