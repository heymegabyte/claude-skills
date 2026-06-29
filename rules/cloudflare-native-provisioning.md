---
last_reviewed: 2026-06-29
superseded_by: null
name: cloudflare-native-provisioning
description: Provision Cloudflare-native products (Turnstile widgets, DNS zones + records, custom domains) programmatically via the CF REST API using CLOUDFLARE_API_KEY + CLOUDFLARE_EMAIL — never hand-create in the dashboard or ask the user for keys CF itself mints.
pack: "infra"
metadata:
  type: reference
---

Cloudflare-native products are provisionable by API with the global key — do NOT ask the user for a key/secret that CF itself issues, and do NOT hand-create in the dashboard. Auth header pair: `X-Auth-Email: $CLOUDFLARE_EMAIL` + `X-Auth-Key: $CLOUDFLARE_API_KEY` (global key from `get-secret CLOUDFLARE_API_KEY`; email `blzalewski@gmail.com`). Account id: `GET /accounts`.

## Turnstile (CAPTCHA) — keys are CF-minted, retrieve via API (njsk.org, 2026-06-27)
- **Create a widget** → returns the **sitekey** (public, → build var e.g. `VITE_TURNSTILE_SITEKEY`) AND the **secret** (→ `wrangler secret put TURNSTILE_SECRET_KEY`):
  `POST /accounts/{acct}/challenges/widgets` `{"name":"…","domains":["njsk.org","www.njsk.org","<worker>.workers.dev"],"mode":"managed"}`
- The create response shows the secret ONCE. If you mask/lose it, **rotate** to get a fresh value and pipe straight into wrangler (never echo it):
  `POST /accounts/{acct}/challenges/widgets/{sitekey}/rotate_secret {"invalidate_immediately":true}` → `.result.secret` → `printf '%s' "$SECRET" | npx wrangler secret put TURNSTILE_SECRET_KEY`.
- Sitekeys are PUBLIC (embedded in client HTML) — safe to commit to `.env.production`. Secrets are Worker secrets only.

## ⚠️ `routes` in wrangler.toml disables workers.dev — set `workers_dev = true` (incident njsk.org 2026-06-28)
- Declaring ANY `routes`/`custom_domain` block in `wrangler.toml` makes Wrangler default **`workers_dev = false`** — the `<worker>.<subdomain>.workers.dev` URL starts returning **404 on EVERY path** (homepage, `/api/health`, all routes). If the custom domain's zone isn't active yet (NS not flipped), workers.dev was the ONLY live URL → the whole site goes dark silently.
- **ALWAYS add `workers_dev = true` in the same edit that adds `routes`** when the custom-domain zone is still pending. Custom domains stay staged and activate on NS flip; workers.dev keeps serving meanwhile.
- **HTTP-verify the LIVE URL after ANY routing/wrangler.toml change** — not just the deploy "Success" line or an API check. `curl -s -o /dev/null -w '%{http_code}' https://<worker>.workers.dev/` MUST be 200. A deploy that succeeds can still 404 the whole site (incident: njsk.org ran dark across ~3 deploys because only the CF-API custom-domain attach was verified, never an HTTP GET of workers.dev).
- Recovery: add `workers_dev = true` → `wrangler deploy` → site 200 in seconds (`wrangler rollback` also works).

## DNS zones + records + Worker custom domains — all API
- Create zone: `POST /zones {"name":"njsk.org","account":{"id":"{acct}"},"type":"full"}` → returns `name_servers` (give those to the user for the registrar). Zone is **pending** until NS flip — records + custom domains can be PRE-STAGED on a pending zone and activate automatically when it goes active.
- Add records: `POST /zones/{zone}/dns_records {"type":"TXT","name":"…","content":"…"}`.
- Worker custom domains: add `routes = [{ pattern = "njsk.org", custom_domain = true }, …]` to `wrangler.toml` + `wrangler deploy` — CF provisions the proxied DNS + TLS for the custom domain when the zone is in the same account.

## PostHog — CLOUD-HOSTED, not self-hosted (exception to the self-host default)
- Per Brian (2026-06-27): PostHog is one of the FEW services we do NOT self-host — we use **PostHog Cloud** (US region: ingestion `https://us.i.posthog.com`, assets `https://us-assets.i.posthog.com`). Do not stand up a self-hosted PostHog.
- Public project key `phc_…` is client-embedded by design (build-env-gated `VITE_POSTHOG_KEY`); the personal API key is a secret.
- A **PostHog MCP** is connected — verify ingestion by querying the backend (`$pageview` trends), NEVER by headless browser (posthog-js bot-filters automation → 0 events is an artifact, not a bug). Cross-ref `[[auto-meta-work]]` § PostHog.

## SES email auth caveat
- SES domain identity (DKIM/SPF/DMARC) lives on the SENDING domain's zone. Check `BRAND.email` first — if the site domain ≠ sending domain (e.g. njsk.org site sends from @njsoupkitchen.org), the records belong on the sending domain's zone, which may differ from the site zone. Surface the mismatch to the user before staging DKIM.
