# Conventions

Shared constants and patterns. Reference instead of re-deriving.

## Brand Tokens

| Token | Value |
|-------|-------|
| Black | #060610 |
| Cyan | #00E5FF |
| Blue | #50AAE3 |
| Purple (cosmic only) | #7C3AED |
| Font heading | Sora |
| Font body | Space Grotesk |
| Font mono | JetBrains Mono |
| Handle | HeyMegabyte |
| Email | hey@megabyte.space |
| GitHub (products) | HeyMegabyte |
| GitHub (infra) | ProfessorManhattan |
| GitHub (skills+templates) | megabytespace |
| Template repo | megabytespace/saas-starter |
| Infra configs | ProfessorManhattan/proxmox-configs, coolify-configs |

Dark theme FIRST. "Simpler is better." Purple for cosmic/space only.

## Owned Domains

megabyte.space, projectsites.dev, fundl.ink, gitl.ink, deskl.ink, linkbl.ink, thebestsites.com, install.doctor, claimyour.site, item.link, socia.link, onionl.ink, all-hands.dev, dreame.dev, soupl.ink, grantl.ink

## Runtime & UI

Bun (Node.js fallback) | Angular+PrimeNG | Ionic+Capacitor | Clerk (SaaS)/Authentik (self-hosted) | Google Sign-In + magic email

## Pricing Defaults

SaaS: Free + $50/mo Pro. Nonprofits: $10/$25/$50/$100/$250/$500 presets.

## Bash

camelCase functions, UPPER_CASE vars, `gum log` (never echo), shdoc format, ShellCheck+shfmt, cross-platform, error-resistant.

## Deploy

```bash
npx wrangler deploy
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

## Secrets

```bash
get-secret SECRET_NAME  # chezmoi, 182 encrypted secrets
# Central: /Users/apple/emdash-projects/worktrees/rare-chefs-film-8op/.env.local (50+ keys)
# Config: ~/.config/emdash/ (coolify-token, gcp-service-account.json)
```

All MCP secrets in `.env.local` — grep KEY_NAME. get-secret checks env vars first, then chezmoi.

## Infrastructure

Proxmox+ZFS | OPNsense | CF Tunnels | WireGuard+Mullvad | Headscale | PBS→R2+Wasabi

## Self-Hosted (70+ on Coolify)

Coolify coolify.megabyte.space (orchestrator) | Authentik (SSO) | Healthchecks | Open WebUI | Bolt.diy | Dify | Postiz (social) | n8n (workflows) | NocoDB | Home Assistant | Windmill | Chatwoot | Sentry sentry.megabyte.space | Netdata | Firecrawl | Listmonk | PostHog posthog.megabyte.space | Browserless | Grafana | LiteLLM ai.megabyte.space | SearXNG | Backrest | Code Server | Directus | Langflow | MetaMCP | Plane | Paymenter

## MCP Servers

Cloudflare (OAuth), Playwright (stdio), Sentry (HTTP/OAuth), PostHog (SSE/OAuth), Gmail/Calendar/Drive (OAuth), Stripe (OAuth), Canva (OAuth), GitHub (HTTP), Coolify (stdio), Firecrawl (stdio), n8n (stdio), Home Assistant (stdio), DeepSeek (stdio), Postiz (HTTP), Notion (stdio), Supermemory (HTTP), WordPress (stdio), Plane (stdio), Omi (Docker), Sequential Thinking (stdio), Computer Use (native)

## Key Integrations

CF AI Search (RAG per tenant) | Stagehand (AI browser testing) | CF Agents SDK (Think on DO) | Inngest (step functions) | Mem0 (persistent AI memory)

## Patterns

Error envelope: `{ error: string, code?: string, details?: unknown }`

Zod: `Schema.safeParse(input)` → if !success return 400 with error.flatten()

Turnstile: `<div class="cf-turnstile" data-sitekey="${SITE_KEY}" data-theme="dark">` + server POST to siteverify

## CSP Template

```
default-src 'self'; script-src 'self' 'unsafe-inline' googletagmanager.com challenges.cloudflare.com *.posthog.com;
style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com;
img-src 'self' data: images.unsplash.com images.pexels.com *.stripe.com;
connect-src 'self' google-analytics.com *.posthog.com *.sentry.io challenges.cloudflare.com;
frame-src youtube.com js.stripe.com challenges.cloudflare.com;
```

## Image Targets

WebP photo 80% <200KB | WebP illustration 90% <150KB | PNG logo lossless <50KB | SVG optimized <10KB | MP4 hero CRF28 <2MB | OG 1200x630 PNG

## Linting

Biome (Rust) instead of ESLint+Prettier. `npx @biomejs/biome check --write src/`

## CF Credentials

blzalewski@gmail.com | `get-secret CLOUDFLARE_API_TOKEN` | `get-secret CLOUDFLARE_ACCOUNT_ID`

## Breakpoints

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

## Hono Worker Starter

```typescript
import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { cors } from 'hono/cors';
type Env = { DB: D1Database; KV: KVNamespace; AI: Ai; VECTORIZE: VectorizeIndex; AI_SEARCH: AiSearch; TURNSTILE_SECRET: string; SITE_NAME: string; SITE_DESCRIPTION: string; };
const app = new Hono<{ Bindings: Env }>();
app.use('*', secureHeaders());
app.use('/api/*', cors({ origin: ['https://domain.com'] }));
export default app;
```

## Common Failures

| Error | Fix |
|-------|-----|
| "binding not found" | Add binding to wrangler.toml |
| Turnstile invalid-input | Check TURNSTILE_SECRET |
| ERR_BLOCKED_BY_CSP | Add domain to CSP |
| Playwright flaky | Replace sleep with waitFor |
| D1 "no such table" | wrangler d1 migrations apply |
| Angular SSR on Workers | Use @angular/ssr CF adapter |

## Webhook Pattern

```typescript
app.post('/api/webhooks/stripe', async (c) => {
  const event = stripe.webhooks.constructEvent(body, sig!, SECRET);
  if (await c.env.KV.get(`webhook:${event.id}`)) return c.json({ received: true });
  // Process...
  await c.env.KV.put(`webhook:${event.id}`, 'processed', { expirationTtl: 604800 });
  return c.json({ received: true });
});
```

## Git Convention

`type(scope): description` — Types: feat, fix, refactor, test, docs, style, perf, ci, chore
