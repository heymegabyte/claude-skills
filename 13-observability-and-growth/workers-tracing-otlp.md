# Workers Tracing + OTLP Export — Observability 2026

Cloudflare Workers automatic tracing is in open beta. Zero-config OpenTelemetry instrumentation for every I/O: KV, R2, D1, DO, fetch, AI binding, Vectorize, Queue.

## Enable

`wrangler.jsonc`:

```jsonc
{
  "observability": { "enabled": true }
}
```

Free until **March 1, 2026** — then billed.

## Export to External Backends

### Axiom (Cloudflare partner — cheapest at edge volumes)

```ts
import { setupAxiomOtel } from '@axiomhq/cloudflare-workers';

setupAxiomOtel({
  dataset: env.AXIOM_DATASET,
  token: env.AXIOM_TOKEN,
});
```

### Honeycomb (best for trace exploration + BubbleUp anomaly detection)

```ts
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const exporter = new OTLPTraceExporter({
  url: 'https://api.honeycomb.io/v1/traces',
  headers: { 'x-honeycomb-team': env.HONEYCOMB_API_KEY },
});
```

### Grafana / Datadog

Same OTLP pattern — change URL + auth headers.

## Pillar Roles (avoid duplication)

- **Sentry** (`@sentry/cloudflare` v9) — **exceptions** only. Use `withSentry` wrapper. Drop the manual breadcrumb scaffolding for I/O; Workers Tracing covers that.
- **Workers Tracing (OTLP)** — **spans** for every I/O, perf timing, "where did time go" debugging.
- **PostHog** — product analytics + session replay + feature flags + frontend error tracking (one platform). New projects can go PostHog-only for frontend, Sentry-only for backend.
- **GA4 / GTM** — marketing + acquisition + conversion funnels.
- **AI Gateway** — every LLM call. Logging + caching + rate-limit + fallback in one binding.

## Sentry v9 + Cloudflare Pattern

```ts
import { withSentry } from '@sentry/cloudflare';

export default withSentry(
  (env) => ({
    dsn: env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    sendDefaultPii: false,
    release: env.SENTRY_RELEASE,
    environment: env.ENVIRONMENT,
  }),
  {
    async fetch(request, env, ctx) {
      // your worker
    },
  },
);
```

Use **OIDC** to mint `CLOUDFLARE_API_TOKEN` in GitHub Actions — never long-lived secret in env.

## PostHog Unified (Frontend)

```ts
posthog.init(env.POSTHOG_TOKEN, {
  api_host: 'https://us.i.posthog.com',
  persistence: 'memory', // cookie-free
  autocapture: true,
  capture_pageview: true,
  capture_pageleave: true,
  enable_recording_console_log: true, // ties errors → session replay
});
```

CSP additions:

```
script-src 'self' https://us.i.posthog.com;
connect-src 'self' https://us.i.posthog.com https://us-assets.i.posthog.com;
```

## CI/CD via GitHub Actions

```yaml
- uses: actions/checkout@v5
- uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    # Or OIDC:
    # accountId: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
```

Or use **Workers Builds** (native CF CI, simpler for Worker-only projects, auto-detects framework, preview URL per branch via `wrangler versions upload`).

## Pin versions

- `actions/checkout@v5`
- `actions/upload-artifact@v4`
- `actions/setup-node@v4`
- `cloudflare/wrangler-action@v3` (Wrangler 4 default)
