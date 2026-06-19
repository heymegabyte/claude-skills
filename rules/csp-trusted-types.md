---
name: "csp-trusted-types"
priority: 2
pack: "security"
triggers:
  - "csp"
  - "trusted types"
  - "content security policy"
  - "nonce"
  - "strict-dynamic"
paths:
  - "concern:cloudflare-workers"
  - "concern:hono-stack"
  - "src/worker/**"
  - "src/web/**"
---

# CSP Level 3 + Trusted Types — Full Implementation

`[[always]]` and `[[quality-metrics]]` mandate CSP Level 3 strict-dynamic + Trusted Types on every project. This rule covers the Worker middleware, nonce plumbing, policy creation, violation ingestion, and triage workflow.

## When this fires

- Every CF Workers project serving HTML (Hono + HTMLRewriter or vite-ssg)
- Any project where `[[supreme-polish]]` Agent-H runs
- Whenever a third-party script (PostHog, GA4, Intercom, Stripe.js) is added

## Browser support matrix (2026)

| Feature | Chrome | Firefox | Safari | Edge |
|---|---|---|---|---|
| CSP Level 3 `strict-dynamic` | 52+ | 93+ | 15.4+ | 79+ |
| `report-to` (Reporting API v1) | 90+ | 144+ (partial) | 18.4+ | 90+ |
| Trusted Types (full) | 83+ | 144+ (partial) | 18.4+ | 83+ |
| `require-trusted-types-for 'script'` | 83+ | 144+ | 18.4+ | 83+ |

- Safari 18.4+ (March 2025) closes the gap — ship Trusted Types enforced now.
- Firefox partial: violations fire and `trustedTypes.createPolicy` / `require-trusted-types-for` are supported; wrap in feature-detect (see § Feature detection).

## Nonce generation in Workers (Web Crypto)

Generate a fresh 128-bit nonce per response — NEVER cache, NEVER reuse across requests.

```ts
// src/worker/middleware/csp.ts
import type { Context, Next } from 'hono'

export function generateNonce(): string {
  const bytes = new Uint8Array(16) // 128 bits
  crypto.getRandomValues(bytes)
  // base64url: URL-safe, no padding needed in the header value
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}
```

## CSP header construction

Build as a typed object, join at the end. Use `strict-dynamic` so the nonce propagates to dynamically-loaded scripts without whitelisting CDN URLs (URL whitelists are bypassed by data-URI payloads on older browsers).

```ts
// src/worker/middleware/csp.ts  (continued)

interface CspDirectives {
  'script-src': string[]
  'style-src': string[]
  'img-src': string[]
  'connect-src': string[]
  'font-src': string[]
  'frame-src': string[]
  'object-src': string[]
  'base-uri': string[]
  'form-action': string[]
  'frame-ancestors': string[]
  'upgrade-insecure-requests': boolean
  'require-trusted-types-for': string[]
  'trusted-types': string[]
  'report-to': string
  'report-uri': string
}

export function buildCsp(nonce: string, env: Env): string {
  const reportUri = `https://${env.HOSTNAME}/csp-report`

  const directives: Partial<CspDirectives> & Record<string, string[] | boolean | string> = {
    'script-src': [
      `'nonce-${nonce}'`,
      `'strict-dynamic'`,
      // strict-dynamic IGNORES any URL whitelist in modern browsers —
      // the legacy fallbacks below are for CSP2 UAs only
      `'unsafe-inline'`,     // CSP2 fallback (ignored by CSP3 when nonce present)
      `https:`,              // CSP2 fallback
      `http:`,               // CSP2 fallback dev-only — strip in prod gate below
    ],
    'style-src': [`'nonce-${nonce}'`, `'unsafe-inline'`], // TT doesn't cover style yet
    'img-src': [`'self'`, `data:`, `https:`],
    'connect-src': [
      `'self'`,
      `https://us.posthog.com`, // PostHog
      `https://*.sentry.io`,    // Sentry
      `https://cloudflareinsights.com`,
    ],
    'font-src': [`'self'`, `https://fonts.gstatic.com`],
    'frame-src': [`'none'`],
    'object-src': [`'none'`],
    'base-uri': [`'self'`],
    'form-action': [`'self'`],
    'frame-ancestors': [`'none'`],
    'upgrade-insecure-requests': true,
    'require-trusted-types-for': [`'script'`],
    'trusted-types': [`app-policy`, `lit-html`, `default`],
    'report-to': `csp-endpoint`,
    'report-uri': reportUri, // legacy; keep until Reporting API v1 is universal
  }

  // Strip http: fallback in production
  if (env.ENVIRONMENT === 'production') {
    directives['script-src'] = (directives['script-src'] as string[])
      .filter(v => v !== 'http:')
  }

  return Object.entries(directives)
    .map(([key, val]) => {
      if (val === true) return key
      if (Array.isArray(val)) return `${key} ${val.join(' ')}`
      return `${key} ${val}`
    })
    .join('; ')
}
```

## Hono middleware — nonce injection

Wire as the FIRST middleware in the chain (before CORS, before auth). The nonce must be in `c.var` before any HTMLRewriter pass or SSR template runs.

```ts
// src/worker/middleware/csp.ts  (continued)

export const cspMiddleware = async (c: Context<{ Bindings: Env }>, next: Next) => {
  const nonce = generateNonce()
  c.set('nonce', nonce) // typed via HonoEnv Variables

  // Reporting API v1 endpoint group
  c.header('Report-To', JSON.stringify({
    group: 'csp-endpoint',
    max_age: 86400,
    endpoints: [{ url: `https://${c.env.HOSTNAME}/csp-report` }],
    include_subdomains: true,
  }))

  c.header(
    'Content-Security-Policy',
    buildCsp(nonce, c.env),
  )

  // Permissions-Policy companion — ship alongside CSP always
  c.header('Permissions-Policy', [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=(self)',
    'usb=()',
    'interest-cohort=()',
  ].join(', '))

  // Isolation headers (COOP/COEP/CORP for SharedArrayBuffer + isolation)
  c.header('Cross-Origin-Opener-Policy', 'same-origin')
  c.header('Cross-Origin-Embedder-Policy', 'require-corp')
  c.header('Cross-Origin-Resource-Policy', 'same-site')

  await next()
}

// app.ts
import { cspMiddleware } from './middleware/csp'
app.use('*', cspMiddleware)
```

## HTMLRewriter — nonce propagation to inline scripts

Every `<script>` and `<style>` without a `src` must carry the nonce. The Vite build emits inline bootstrap chunks that are blocked without it.

```ts
// src/worker/index.ts
async function serveAsset(c: Context, asset: Response): Promise<Response> {
  const nonce = c.get('nonce') as string
  return new HTMLRewriter()
    .on('script:not([src])', {
      element(el) { el.setAttribute('nonce', nonce) },
    })
    .on('script[src]', {
      element(el) { el.setAttribute('nonce', nonce) },
    })
    .on('style', {
      element(el) { el.setAttribute('nonce', nonce) },
    })
    .on('link[rel="stylesheet"]', {
      element(el) { el.setAttribute('nonce', nonce) },
    })
    // Inject TT bootstrap before any script runs
    .on('head', {
      element(el) {
        el.prepend(
          `<script nonce="${nonce}">` +
          trustedTypesBootstrap() +
          `</script>`,
          { html: true }
        )
      }
    })
    .transform(asset)
}
```

## Trusted Types — policy creation

Define policies ONCE, in a bootstrap script loaded before all other scripts. The name `app-policy` must match the `trusted-types` directive above.

```ts
// src/web/lib/trusted-types.ts — loaded in the TT bootstrap block

function trustedTypesBootstrap(): string {
  // Inlined to avoid circular reference; keep minimal
  return `
if ('trustedTypes' in window && trustedTypes.createPolicy) {
  // Primary app policy — all innerHTML/insertAdjacentHTML/setAttribute funnels here
  window.__AppTrustedTypes = trustedTypes.createPolicy('app-policy', {
    createHTML: (input) => {
      // DOMPurify is the sanitizer; import via side-effect in main bundle
      // Here we have a minimal allowlist for server-rendered strings
      const allowed = /^[\\w\\s<>/="'.-]*$/.test(input)
      if (!allowed) throw new TypeError('TT: createHTML input rejected')
      return input
    },
    createScript: (_input) => {
      throw new TypeError('TT: createScript blocked — use nonce-bearing <script> tags')
    },
    createScriptURL: (input) => {
      const url = new URL(input, location.origin)
      const allowedHosts = ['cdn.example.com', location.hostname]
      if (!allowedHosts.includes(url.hostname)) {
        throw new TypeError('TT: createScriptURL blocked: ' + url.hostname)
      }
      return input
    },
  })

  // lit-html policy — required if using Lit/web components
  if (!trustedTypes.getAttributeType) return // partial browser
  trustedTypes.createPolicy('lit-html', {
    createHTML: (s) => s, // Lit sanitizes internally; allow passthrough
  })
}
`
}
```

## DOM sink violations — the dangerous APIs

Audit every use before enforcing. Run `grep -rn 'innerHTML\|outerHTML\|insertAdjacentHTML\|document.write\|setAttribute.*on\|new Function\|eval(' src/web/` — fix every hit.

| Sink | Replace with |
|---|---|
| `el.innerHTML = str` | `el.innerHTML = policy.createHTML(str)` |
| `el.outerHTML = str` | `el.outerHTML = policy.createHTML(str)` |
| `el.insertAdjacentHTML(pos, str)` | `el.insertAdjacentHTML(pos, policy.createHTML(str))` |
| `document.write(str)` | Never use; remove entirely |
| `el.setAttribute('src', url)` (dynamic) | `el.src = policy.createScriptURL(url)` |
| `el.setAttribute('on*', fn)` | Never use; use `addEventListener` |
| `new Function(str)` | Blocked by CSP; restructure |
| `eval(str)` | Blocked by CSP; restructure |
| `script.src = url` | `script.src = policy.createScriptURL(url)` |

## Feature detection for partial browsers (Firefox 144+ partial)

```ts
// src/web/lib/trusted-types.ts
export const hasTrustedTypes =
  typeof window !== 'undefined' &&
  'trustedTypes' in window &&
  typeof (window as any).trustedTypes.createPolicy === 'function'

export function createHtml(raw: string): string | TrustedHTML {
  if (hasTrustedTypes && window.__AppTrustedTypes) {
    return window.__AppTrustedTypes.createHTML(raw)
  }
  return raw // fallback: plain string (TT not enforced yet in this UA)
}
```

## report-to / report-uri — CF Workers violation receiver

Violations POST to your own Worker; no third-party needed. Aggregate and alert via PostHog.

```ts
// src/worker/routes/csp-report.ts
import { Hono } from 'hono'
import { z } from 'zod'

const app = new Hono<{ Bindings: Env }>()

const CspReportSchema = z.object({
  'csp-report': z.object({
    'document-uri': z.string(),
    'violated-directive': z.string(),
    'blocked-uri': z.string(),
    'original-policy': z.string().optional(),
    'disposition': z.enum(['enforce', 'report']).optional(),
    'line-number': z.number().optional(),
    'source-file': z.string().optional(),
    'status-code': z.number().optional(),
  }),
})

// Reporting API v1 format (Chrome 90+)
const ReportingApiSchema = z.array(z.object({
  type: z.literal('csp-violation'),
  body: z.object({
    documentURL: z.string(),
    violatedDirective: z.string(),
    blockedURL: z.string(),
    disposition: z.enum(['enforce', 'report']).optional(),
    lineNumber: z.number().optional(),
    sourceFile: z.string().optional(),
  }),
}))

app.post('/csp-report', async (c) => {
  const contentType = c.req.header('content-type') ?? ''
  let directive = 'unknown'
  let blockedUri = 'unknown'
  let documentUri = c.req.header('referer') ?? 'unknown'

  if (contentType.includes('application/csp-report')) {
    const raw = await c.req.json()
    const parsed = CspReportSchema.safeParse(raw)
    if (parsed.success) {
      directive = parsed.data['csp-report']['violated-directive']
      blockedUri = parsed.data['csp-report']['blocked-uri']
      documentUri = parsed.data['csp-report']['document-uri']
    }
  } else if (contentType.includes('application/reports+json')) {
    const raw = await c.req.json()
    const parsed = ReportingApiSchema.safeParse(raw)
    if (parsed.success && parsed.data[0]) {
      directive = parsed.data[0].body.violatedDirective
      blockedUri = parsed.data[0].body.blockedURL
      documentUri = parsed.data[0].body.documentURL
    }
  }

  // Capture in PostHog for triage
  await c.env.AI.run('@cf/meta/llama-guard-3-8b', {}) // dummy — use fetch below
  await fetch('https://us.posthog.com/capture/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: c.env.POSTHOG_API_KEY,
      event: 'csp_violation',
      properties: { directive, blockedUri, documentUri, $lib: 'worker' },
    }),
  })

  return c.body(null, 204)
})

export { app as cspReportApp }
```

## Violation triage workflow

1. **Check PostHog** — `SELECT properties.directive, properties.blockedUri, count() FROM events WHERE event='csp_violation' GROUP BY 1,2` via Insight.
2. **Classify by directive:**
   - `script-src` + `blob:` / `data:` → bundler emitting eval; fix rollup config (`output.inlineDynamicImports: false`).
   - `script-src` + CDN URL → check if script loaded dynamically without nonce; add nonce via HTMLRewriter.
   - `trusted-types` → DOM sink not through policy; grep + fix (§ DOM sink violations).
   - `connect-src` → new analytics/API domain added without updating `buildCsp`.
   - `style-src` → CSS-in-JS runtime injection; add `nonce` attribute or use static styles.
3. **Never add `'unsafe-eval'`** — that disables XSS protection entirely.
4. **Never add `'unsafe-hashes'` without hashing the EXACT inline string** — regenerate via `openssl dgst -sha256 -binary <<< 'exact-string' | base64`.
5. **Use `Content-Security-Policy-Report-Only`** before switching to enforced `Content-Security-Policy`.

## Deployment checklist

- [ ] `cspMiddleware` is `app.use('*', ...)` — not route-specific
- [ ] HTMLRewriter injects nonce on every `<script>` and `<style>` emitted by Vite
- [ ] `report-to` endpoint returns 204 in prod, logs to PostHog
- [ ] No `'unsafe-eval'` anywhere in the header
- [ ] `grep -rn "innerHTML\|insertAdjacentHTML" src/` returns 0 hits not wrapped by `createHTML`
- [ ] Playwright E2E asserts `response.headers()['content-security-policy']` contains `strict-dynamic`
- [ ] `Content-Security-Policy-Report-Only` shipped for 1 week before enforcing

## See

- `[[always]]` — CSP Level 3 strict-dynamic + nonce mandate (§ Security headers)
- `[[quality-metrics]]` — CSP gate in the quality checklist
- `[[supreme-polish]]` Agent-H — runs this implementation as part of security hardening
- `[[auto-meta-work]]` — analytics-specific connect-src entries (PostHog, GA4)
- `[[verification-loop]]` — browser console CSP violation = build fail
- `[[hono-api]]` — Hono middleware chain order; CSP goes first
