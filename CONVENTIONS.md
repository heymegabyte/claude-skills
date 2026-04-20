# Conventions

Shared constants and patterns. Reference this instead of re-deriving values.

## Brand Tokens

| Token | Value |
|-------|-------|
| Black | #060610 |
| Cyan | #00E5FF |
| Blue | #50AAE3 |
| Font heading | Sora |
| Font body | Space Grotesk |
| Font mono | JetBrains Mono |

## Deploy Command

```bash
npx wrangler deploy
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

## Secret Access

```bash
get-secret SECRET_NAME          # Primary (chezmoi, 182 encrypted secrets)
# Central: /Users/apple/emdash-projects/worktrees/rare-chefs-film-8op/.env.local
#   └── 50+ keys: AI APIs, media APIs, MCP server tokens, self-hosted URLs
# Config: ~/.config/emdash/ (coolify-token, gcp-service-account.json)
```

**All MCP secrets are consolidated in `.env.local`** — read with `grep KEY_NAME .env.local`.
`get-secret` checks env vars first, then chezmoi. Load `.env.local` to make both paths work.

## Self-Hosted Services

| Service | URL |
|---------|-----|
| Sentry | sentry.megabyte.space |
| PostHog | posthog.megabyte.space |
| Postiz | postiz.megabyte.space |
| SearXNG | searxng.megabyte.space |
| FireCrawl | firecrawl.megabyte.space |
| n8n | n8n.megabyte.space |
| Coolify | coolify.megabyte.space |
| Authentik | authentik.megabyte.space |
| Browserless | browserless.megabyte.space |

## MCP Servers (All Configured in ~/.claude.json)

| Server | Type | Enables Skills | Secret Source |
|--------|------|----------------|---------------|
| Cloudflare | OAuth | 05 Arch, 08 Deploy, 44 Drizzle | OAuth (connected) |
| Playwright | stdio | 07 Quality, 20 A11y | None needed |
| Sentry | HTTP | 13 Observability | OAuth (one-time) |
| PostHog | SSE | 13 Observability | OAuth (one-time) |
| Gmail | OAuth | 19 Email | OAuth (one-time) |
| Google Calendar | OAuth | Scheduling | OAuth (one-time) |
| Google Drive | OAuth | Media, docs | OAuth (one-time) |
| Stripe | OAuth | 18 Stripe | OAuth (one-time) |
| Canva | OAuth | 12 Media | OAuth (one-time) |
| GitHub | HTTP | CI/CD, PRs | `ghp_*` in .claude.json (move to chezmoi) |
| Coolify | stdio | 50 Coolify | `COOLIFY_ACCESS_TOKEN` inline (move to chezmoi) |
| Firecrawl | stdio | RAG, scraping | `FIRECRAWL_API_KEY` inline (move to chezmoi) |
| n8n | stdio | 45 Webhooks, automation | `N8N_API_KEY` inline (move to chezmoi) |
| Home Assistant | stdio | IoT, smart home | `HASS_TOKEN` (in chezmoi) |
| DeepSeek | stdio | AI fallback | `DEEPSEEK_API_KEY` inline (move to chezmoi) |
| Postiz | HTTP | 27 Social | `POSTIZ_MCP_URL` (in chezmoi) |
| Notion | stdio | Docs, knowledge base | `NOTION_TOKEN` inline (move to chezmoi) |
| Supermemory | HTTP | AI memory | Bearer token inline (move to chezmoi) |
| WordPress | stdio | megabyte.space CMS | `WP_API_PASSWORD` inline (move to chezmoi) |
| Plane | stdio | Project management | `PLANE_API_KEY` inline (move to chezmoi) |
| Omi | stdio (Docker) | Memory, transcription | `OMI_MCP_KEY` inline (move to chezmoi) |
| Sequential Thinking | stdio | Complex reasoning | None needed |
| Computer Use | native | Desktop automation | Permission-gated |

### Secret Hygiene TODO
12 MCP servers have inline secrets in `~/.claude.json` that should be migrated to chezmoi.
Pattern: encrypt with `chezmoi encrypt < secret.txt > SECRET_NAME`, place in `secrets-macbook-pro/`.

## Key Integrations for projectsites.dev

| Tool | Purpose | Integration |
|------|---------|-------------|
| CF AI Search | RAG search per tenant | Shared instance + metadata filtering |
| Stagehand (22K) | AI browser testing | Augments Playwright with natural language |
| CF Agents SDK | Multi-agent on Workers | Think class on Durable Objects |
| Inngest (5K) | Step functions for Workers | Workflow orchestration |
| Mem0 (54K) | Persistent AI memory | Context across chat sessions |

## Error Envelope

```typescript
{ error: string, code?: string, details?: unknown }
```

## Zod Validation Pattern

```typescript
const Schema = z.object({ /* fields */ });
const result = Schema.safeParse(input);
if (!result.success) return c.json({ error: result.error.flatten() }, 400);
```

## Turnstile Pattern

```html
<div class="cf-turnstile" data-sitekey="${SITE_KEY}" data-theme="dark"></div>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
```
Server verify: POST `https://challenges.cloudflare.com/turnstile/v0/siteverify` with `secret` + `response`.

## CSP Header Template

```
default-src 'self';
script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://challenges.cloudflare.com https://*.posthog.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: https://images.unsplash.com https://images.pexels.com https://*.stripe.com;
connect-src 'self' https://www.google-analytics.com https://*.posthog.com https://*.sentry.io https://challenges.cloudflare.com;
frame-src https://www.youtube.com https://js.stripe.com https://challenges.cloudflare.com;
```

## Image Compression Targets

| Format | Quality | Max Size |
|--------|---------|----------|
| WebP photo | 80% | 200KB |
| WebP illustration | 90% | 150KB |
| PNG logo/icon | Lossless | 50KB |
| SVG | Optimized | 10KB |
| MP4 hero | CRF 28 | 2MB |
| OG image | 1200x630 | PNG |

## Linting and Formatting

Use **Biome** (24K stars, Rust-based) instead of ESLint + Prettier. 10-100x faster. Single binary.
Auto-runs via PostToolUse hook in `~/.claude/settings.json` on every file edit.
```bash
npx @biomejs/biome check --write src/  # Manual run
```

## Readability

Flesch score >= 50 on all user-facing text and code comments. Short sentences. No jargon.

## Cloudflare Credentials

Account: blzalewski@gmail.com
API Token: `get-secret CLOUDFLARE_API_TOKEN`
Account ID: `get-secret CLOUDFLARE_ACCOUNT_ID`

## Breakpoints (shared across all skills)

```typescript
const BREAKPOINTS = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 14', width: 390, height: 844 },
  { name: 'iPad', width: 768, height: 1024 },
  { name: 'iPad Landscape', width: 1024, height: 768 },
  { name: 'Laptop', width: 1280, height: 720 },
  { name: 'Desktop', width: 1920, height: 1080 },
];
```

## JSON-LD Templates (use on every page)

```json
// Organization (every page)
{"@context":"https://schema.org","@type":"Organization","name":"","url":"","logo":"","sameAs":[]}
// WebSite (homepage only)
{"@context":"https://schema.org","@type":"WebSite","name":"","url":"","potentialAction":{"@type":"SearchAction","target":"{search_term_string}","query-input":"required name=search_term_string"}}
// WebPage (every page)
{"@context":"https://schema.org","@type":"WebPage","name":"","description":"","url":""}
```

## Hono Worker Starter

```typescript
import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { cors } from 'hono/cors';
type Env = {
  DB: D1Database;
  KV: KVNamespace;
  AI: Ai;
  VECTORIZE: VectorizeIndex;
  AI_SEARCH: AiSearch;
  TURNSTILE_SECRET: string;
  SITE_NAME: string;
  SITE_DESCRIPTION: string;
};
const app = new Hono<{ Bindings: Env }>();
app.use('*', secureHeaders());
app.use('/api/*', cors({ origin: ['https://domain.com'] }));
export default app;
```

## Standard AI Bindings (include in EVERY wrangler.toml)

```toml
[ai]
binding = "AI"

[[vectorize]]
binding = "VECTORIZE"
index_name = "site-content"

[[ai_search]]
binding = "AI_SEARCH"
index_name = "site-search"

[vars]
SITE_NAME = ""
SITE_DESCRIPTION = ""
```

## Common Failure Patterns and Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `wrangler deploy` fails with "binding not found" | Missing D1/KV/R2 in wrangler.toml | Add `[[d1_databases]]` or `[kv_namespaces]` section |
| Turnstile returns "invalid-input-response" | Wrong secret key or not awaiting verification | Check `TURNSTILE_SECRET` in wrangler secrets |
| `ERR_BLOCKED_BY_CSP` in console | CSP header too restrictive | Add the blocked domain to the relevant CSP directive |
| Playwright test flaky | Missing `waitFor` or race condition | Replace `sleep` with `expect().toBeVisible()` |
| D1 "no such table" | Migration not applied | Run `wrangler d1 migrations apply DB_NAME` |
| Angular build fails on deploy | SSR/SSG incompatibility with Workers | Use `@angular/ssr` with Cloudflare adapter |

## Transactional Email Checklist (for any feature that sends email)

Every email-sending feature must include:
- Subject line with product name (not generic "Notification")
- Plain-text fallback alongside HTML
- Unsubscribe link if marketing (CAN-SPAM)
- Tax receipt details if donation (amount, date, 501c3 status, EIN)
- Resend API error handling with retry (1 retry, then log to Sentry)
- Test mode flag that sends to `test@resend.dev` instead of real users

## Webhook Reliability Pattern

```typescript
// Idempotent webhook handler template
app.post('/api/webhooks/stripe', async (c) => {
  const sig = c.req.header('stripe-signature');
  const event = stripe.webhooks.constructEvent(body, sig!, WEBHOOK_SECRET);
  // Check idempotency: skip if event.id already processed
  const existing = await c.env.KV.get(`webhook:${event.id}`);
  if (existing) return c.json({ received: true }); // Already processed
  // Process event...
  await c.env.KV.put(`webhook:${event.id}`, 'processed', { expirationTtl: 86400 * 7 });
  return c.json({ received: true });
});
```

## Git Commit Message Convention

```
type(scope): description

Types: feat, fix, refactor, test, docs, style, perf, ci, chore
Scope: component name, skill number, or feature area
Example: feat(contact): add Turnstile verification to contact form
```
