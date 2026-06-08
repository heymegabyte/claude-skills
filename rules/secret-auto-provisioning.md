# Secret Auto-Provisioning

Companion to `secret-provisioning.md`. That rule pushes existing secrets; this rule acquires new ones via generation, API-mint, Computer Use, or manual flow. Every "set this secret" Rec = failure.

## Core mandate
- Producible without human input → produce automatically.
- Requires human → acquire via highest tier available (API > Computer Use > manual deeplink).
- Manual recs reserved for Tier 4 only (paid plans, KYC, no public API).

## Tiered acquisition

### Tier 1 — Generate locally (openssl, no network)
HMAC, nonces, encryption keys. Script generates, age-encrypts via chezmoi, stores under `~/.local/share/chezmoi/home/.chezmoitemplates/secrets-{hostname}/<KEY>`. No human-in-loop.

- Pattern: `openssl rand -base64 32` (HMAC/signing) | `openssl rand -hex 32` (URL-safe nonces)
- Examples: `WEEKLY_DIGEST_SECRET`, `SALE_WEBHOOK_SECRET`, `JWT_SIGNING_SECRET`, `SESSION_SECRET`, `CSRF_SECRET`
- Rotation: secrets only for signing outbound tokens (rotation = old tokens invalidate, no data loss) auto-rotate freely. `--rotate-tier1` flag opt-in.

### Tier 1.5 — Data-at-rest secrets (NEVER auto-generate)
- `MCP_ENCRYPTION_KEY` — encrypts MCP OAuth tokens in D1; rotation requires re-OAuth
- `*_ENCRYPTION_KEY` / `*_AT_REST_KEY` — anything decrypting persisted data
- `INTERNAL_BUILD_SECRET` / paired HMAC — mismatch breaks integration
- Behavior: detect-only. Surface one-time mint when absent EVERYWHERE (chezmoi AND deploy target). Once minted, fold into `secret-provisioning.md` sync forever.

### Tier 2 — API-provision via parent credential
Use high-trust parent to mint scoped, least-privilege secrets via vendor REST API. No browser, no human, fully automated.

**Cloudflare scoped tokens** (mint via global API key):
- Parent: `CLOUDFLARE_API_KEY` + `CLOUDFLARE_EMAIL` (global, chezmoi)
- Minted: `CF_API_TOKEN` w/ `User → Tokens : Edit`
- Endpoint: `POST https://api.cloudflare.com/client/v4/user/tokens`
- Permission groups (enumerate at `GET /user/tokens/permission_groups`):
  - `e086da7e2179491d91ee5f35b3ca210a` Workers Scripts Write
  - `f7f0eda5697f475c90846e879bab8666` Workers KV Write
  - `09b2857d1c31407795e75e3fed8617a1` D1 Write
  - `bf7481a1826f439697cb59a20b22293e` R2 Write
  - `bacc64e0f6c34fc0883a1223f938a104` Workers AI Write
  - `6c8a3737f07f46369c1ea1f22138daaf` AI Gateway Write
  - `8d28297797f24fb8a0c332fe0866ec89` Pages Write
  - `bdbcd690c763475a985e8641dddc09f7` Workers Containers Write
  - `05880cd1bdc24d8bae0be2136972816b` Workers Tail Read
  - `b89a480218d04ceb98b4fe57ca29dc1f` Account Analytics Read
  - `e17beae8b8cb423a99b1730f21238bed` Cache Purge (zone-scoped)
- Naming: `{project}-{env}-scoped-{YYYYMMDD}`. Store as `CF_API_TOKEN_SCOPED`, swap into Worker secret after smoke-test.

**Cloudflare Access service tokens**:
- Endpoint: `POST /accounts/{accountId}/access/service_tokens`
- Minted: `CF_ACCESS_CLIENT_ID` + `CF_ACCESS_CLIENT_SECRET` (bypasses bot protection for container builds)
- Rotate 90d; tag w/ `duration: "8760h"` (1y max).

**Stripe** (idempotent product/price/meter):
- Parent: `STRIPE_SECRET_KEY` (chezmoi)
- Idempotency: `lookup_key` — search via `GET /v1/prices?lookup_keys[]=...` before create
- Auto-minted: `STRIPE_USAGE_PRICE_IDS` (JSON map meter-backed metered prices, post-2025-03-31 API requires `recurring[meter]`), `STRIPE_PRICE_CREDITS_*` (one-time credit packs), `STRIPE_WEBHOOK_SECRET` (`POST /v1/webhook_endpoints` returns `whsec_*`, push to deploy target)
- Meters first: `POST /v1/billing/meters` per metric; prices reference `recurring[meter]=mtr_*`
- NEVER auto-mint: `STRIPE_CONNECT_CLIENT_ID` (requires OAuth app reg → Tier 3)

**Anthropic Admin API**:
- Parent: org-admin key (`ANTHROPIC_ADMIN_KEY` if stored, else manual)
- Endpoint: `POST https://api.anthropic.com/v1/organizations/api_keys`
- Mints: project-scoped `ANTHROPIC_API_KEY` w/ workspace + role + budget
- Use: per-project key isolation for cost-attribution + revocation

**OpenAI Admin API**:
- Parent: org-admin key
- Endpoint: `POST https://api.openai.com/v1/organization/projects/{project_id}/api_keys`
- Mints: project-scoped `OPENAI_API_KEY`

**GitHub fine-grained PAT (via gh CLI)**:
- Parent: `gh auth login` session
- Installation tokens: `gh api -X POST /users/{user}/installations/{id}/access_tokens` (60min TTL, auto-rotate)
- Classic PAT still requires browser → Tier 3

**Resend / SendGrid sending domains**:
- Parent: `RESEND_API_KEY` (chezmoi)
- Endpoint: `POST https://api.resend.com/domains` returns DNS records → add via CF API (chain!)
- Auto-create sending domain + auto-add DNS records via CF zone API in same script

### Tier 3 — Computer Use (OAuth-app registration)
For providers without OAuth-app-management APIs. Launch `mcp__desktop-control__computer` to drive user's REAL Chrome (Chrome MCP / Playwright MCP have zero cookies, can't complete OAuth app reg).

- Mailchimp: `https://us1.admin.mailchimp.com/account/oauth2/` → "Register App" → redirect URI `https://{project}/api/mcp/mailchimp/callback`
- HubSpot: `https://developers.hubspot.com/get-started` → Create App → Auth → scopes
- Stripe Connect OAuth: `https://dashboard.stripe.com/settings/connect/onboarding-options/oauth` → enable + redirect URI
- Google OAuth: `https://console.cloud.google.com/apis/credentials` → Create Credentials → OAuth client ID
- GA4 service account + JSON key: walkthrough → download → grant Viewer in GA4 Admin
- Microsoft Clarity: `https://clarity.microsoft.com/projects/new?name={domain}&url=...`
- Plausible: `https://plausible.io/sites/new?domain={domain}`

Computer Use primitives (per `computer-use-safety.md`):
1. Screenshot before acting
2. Chain via `computer_batch`
3. Read tier for browsers
4. After OAuth app: scrape client_id + client_secret from DOM, age-encrypt, store
5. Verify by hitting OAuth `/authorize` URL — 200 = working

Opt-in: `--computer-use` flag on script. Not auto-fired.

### Tier 4 — Manual (paid plans, KYC, reseller approval)
Surface w/ deeplinked URLs + reason. Never autopilot.

- `TRUSTPILOT_API_KEY` — paid Trustpilot Business
- `OPENSRS_USERNAME` / `OPENSRS_API_KEY` — reseller approval (~1 day)
- `DOMAINR_API_KEY` — RapidAPI subscription
- `STRIPE_CONNECT_CLIENT_ID` — Connect platform enablement (brand review)
- `APPLE_DEVELOPER_*` — Apple Dev Program ($99/yr + review)
- `GOOGLE_PLAY_*` — Google Play Console ($25 + review)

## Security model

### Least-privilege scoped tokens > global keys
- Default: Tier 2 always mints scoped. Global keys ONLY for bootstrapping.
- CF: never put `CLOUDFLARE_API_KEY` + `CLOUDFLARE_EMAIL` on Worker. Worker gets scoped `CF_API_TOKEN`. Global lives in chezmoi + GitHub Actions OIDC.
- GitHub Actions: OIDC + `cloudflare/wrangler-action@v3` instead of long-lived tokens in repo secrets.

### Rotation cadence
- Tier 1 generated: 90d (HMAC), 30d (session)
- Tier 2 scoped tokens: 90d (CF, Stripe webhook), 60d (Access service tokens)
- Tier 1.5 at-rest: never rotate without re-encryption job
- Anthropic/OpenAI project keys: per project lifecycle (per-deploy if budget allows)

### Storage hierarchy
1. **chezmoi** (age-encrypted at rest, `~/.local/share/chezmoi/home/.chezmoitemplates/secrets-{hostname}/`)
2. **CF Worker secrets** (encrypted, exposed at `env.KEY`)
3. **GitHub Actions secrets** (OIDC + CI-only credentials only)
4. NEVER: env files in repo, `.env.local` checked in, secret-bearing screenshots/logs

### Secret-redacting logs
- Provisioning script MUST redact before printing
- Prefixed creds: `${value.slice(0, 7)}…${value.slice(-3)}` (`sk_live…XYZ`)
- Unprefixed: print `(len=N)` only

### Audit trail
- Tag every minted token in vendor metadata: `metadata.managed_by = "projectsites"` + `metadata.minted_at` + `metadata.minter_host`
- Vendor dashboards (CF token list, Stripe products, Resend domains) = audit log
- `provision-secrets.mjs --audit` lists every managed-by-projectsites token across vendors

## Integrations

### Trigger points
- **Pre-deploy** (`predeploy` npm script) — Tier 1 + Tier 2 always run; Tier 3/4 surfaced
- **CI workflow** — Tier 1 + Tier 2 run w/ explicit `--push`, then `wrangler deploy`
- **`/provision`** slash command — interactive
- **New project scaffold** — `npx create-emdash-app` runs full provisioning before first commit

### Chained provisioning
- Stripe webhook → mints `STRIPE_WEBHOOK_SECRET` → push to Worker → deploy → fire Stripe event → verify callback
- Resend sending domain → returns DNS records → CF API adds to zone → wait for verification → mark `verified`
- CF scoped token mint → push to Worker → swap in `wrangler.toml [vars]` → smoke-test against `/v4/user/tokens/verify` → reject if scope-mismatched

### Idempotency contract
- Every Tier 1 + Tier 2 safe to re-run forever
- chezmoi: `tryGetSecret(key) ?? mint()`
- Vendor: `GET ?lookup_keys=` (Stripe), `GET /tokens?name=` (CF), `GET /domains?domain=` (Resend) before POST
- Failed runs leave no orphans (rollback created products if mid-flow)

## Reusable helper
- `scripts/lib/secrets.mjs` exports: `tryGetSecret`, `storeSecret`, `generateBase64Secret`, `generateHexSecret`, `ensureGeneratedSecret`, `ensureCloudflareAuth`, `mintCloudflareScopedToken`, `ensureStripeMeter`, `ensureStripePrice`, `pushSecretToWorker`, `syncSecretsToWorker`, `COMMON_SECRETS[]`
- `scripts/provision-secrets.mjs` orchestrates all four tiers
- Reference impl: `apps/project-sites/scripts/{lib/secrets.mjs,provision-secrets.mjs}`
- Copy verbatim into every new emdash project; wire into `predeploy`

## Anti-friction
Every "set this secret manually" rec = code smell. Before surfacing:
1. Tier 1? Generate.
2. Tier 2? Use parent cred to mint.
3. Tier 3? Spawn Computer Use if `--computer-use` flag, else surface deeplinked URL + form-prefilled redirect URI.
4. Tier 4? Surface w/ deeplinked URL + reason + estimated wall time.

If rec doesn't specify tier, rec itself is the gap.

## See
- `secret-provisioning.md` (downstream push) · `full-autonomy.md` · `brian-preferences.md` · `auto-meta-work.md` · `verification-loop.md` · `computer-use-safety.md` · `payments-routing.md` · `fetch-defaults.md`
