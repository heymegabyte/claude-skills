# Secret Auto-Provisioning (***UNIVERSAL — every deploy, every project***)

Companion to [[secret-provisioning]]. Where that rule covers _pushing_ existing secrets to deploy targets, this rule covers _acquiring_ secrets that don't exist yet — by generation, API-provisioning, Computer Use, or surfaced manual flows. Every "set this secret" recommendation in a Recs section is a failure of this rule.

## Core mandate
- Any secret that CAN be produced without human input MUST be produced automatically.
- Any secret that requires human input MUST be acquired via the highest tier available (API > Computer Use > manual deeplink).
- "Set this secret manually" recommendations are reserved for Tier 4 only — paid plans, KYC-gated signups, or providers without public APIs.

## Tiered acquisition policy

### Tier 1 — Generate locally (openssl, no network)
HMAC secrets, nonces, encryption keys. The script generates, age-encrypts via chezmoi, and stores under `~/.local/share/chezmoi/home/.chezmoitemplates/secrets-{hostname}/<KEY>` in a single shot. No human-in-the-loop.

- **Pattern**: `openssl rand -base64 32` (HMAC / signing) | `openssl rand -hex 32` (URL-safe nonces)
- **Examples**: `WEEKLY_DIGEST_SECRET`, `SALE_WEBHOOK_SECRET`, `JWT_SIGNING_SECRET`, `SESSION_SECRET`, `CSRF_SECRET`
- **Rotation-safe defaults**: secrets used only for signing outbound tokens (rotation = old tokens invalidate, no data loss) auto-rotate freely. Use `--rotate-tier1` flag to opt in.

### Tier 1.5 — Data-at-rest secrets (DO NOT auto-generate)
NEVER auto-rotate these — generation = decryption failure of existing ciphertext.
- `MCP_ENCRYPTION_KEY` — encrypts MCP OAuth tokens in D1; rotation requires re-OAuth of every connected user
- `*_ENCRYPTION_KEY` / `*_AT_REST_KEY` — anything decrypting persisted data
- `INTERNAL_BUILD_SECRET` / paired HMAC secrets — paired with another service's env; mismatch breaks the integration
- **Behavior**: detect-only. Surface a one-time mint instruction when absent EVERYWHERE (chezmoi AND deploy target). Once minted, fold into [[secret-provisioning]] sync flow forever.

### Tier 2 — API-provision via parent credential
The most powerful tier: use a high-trust parent credential to mint scoped, least-privilege secrets via vendor REST API. No browser. No human. Fully automated.

#### Cloudflare scoped tokens (use global API key to mint scoped tokens)
- **Parent cred**: `CLOUDFLARE_API_KEY` + `CLOUDFLARE_EMAIL` (global, in chezmoi)
- **Minted**: `CF_API_TOKEN` with `User → Tokens : Edit` permission group
- **Endpoint**: `POST https://api.cloudflare.com/client/v4/user/tokens`
- **Permission groups** (enumerate at `GET /user/tokens/permission_groups`):
  - `e086da7e2179491d91ee5f35b3ca210a` Workers Scripts Write
  - `f7f0eda5697f475c90846e879bab8666` Workers KV Storage Write
  - `09b2857d1c31407795e75e3fed8617a1` D1 Write
  - `bf7481a1826f439697cb59a20b22293e` Workers R2 Storage Write
  - `bacc64e0f6c34fc0883a1223f938a104` Workers AI Write
  - `6c8a3737f07f46369c1ea1f22138daaf` AI Gateway Write
  - `8d28297797f24fb8a0c332fe0866ec89` Pages Write
  - `bdbcd690c763475a985e8641dddc09f7` Workers Containers Write
  - `05880cd1bdc24d8bae0be2136972816b` Workers Tail Read
  - `b89a480218d04ceb98b4fe57ca29dc1f` Account Analytics Read
  - `e17beae8b8cb423a99b1730f21238bed` Cache Purge (zone-scoped)
- **Pattern**: name token `{project}-{env}-scoped-{YYYYMMDD}` so audit log is grep-able. Store in chezmoi as `CF_API_TOKEN_SCOPED`, swap into Worker secret manually after smoke-test.

#### Cloudflare Access service tokens
- **Endpoint**: `POST /accounts/{accountId}/access/service_tokens`
- **Minted**: `CF_ACCESS_CLIENT_ID` + `CF_ACCESS_CLIENT_SECRET` (bypasses bot protection for container builds)
- **Pattern**: rotate every 90 days; tag with `duration: "8760h"` (1y max) per CF.

#### Stripe (idempotent product/price/meter creation)
- **Parent cred**: `STRIPE_SECRET_KEY` (already in chezmoi)
- **Idempotency key**: `lookup_key` parameter — search first via `GET /v1/prices?lookup_keys[]=...` before creating
- **Auto-minted**:
  - `STRIPE_USAGE_PRICE_IDS` — JSON map of meter-backed metered prices (post-2025-03-31 API requires `recurring[meter]`)
  - `STRIPE_PRICE_CREDITS_*` — one-time credit-pack prices
  - `STRIPE_WEBHOOK_SECRET` — `POST /v1/webhook_endpoints` returns the `whsec_*` secret (push directly to deploy target)
- **Meters first**: `POST /v1/billing/meters` per metric; then prices reference `recurring[meter]=mtr_*`
- **NEVER auto-mint**: `STRIPE_CONNECT_CLIENT_ID` (requires OAuth app registration in dashboard → Tier 3)

#### Anthropic Admin API
- **Parent cred**: organization-admin key (`ANTHROPIC_ADMIN_KEY` if stored, else manual)
- **Endpoint**: `POST https://api.anthropic.com/v1/organizations/api_keys`
- **Mints**: project-scoped `ANTHROPIC_API_KEY` with workspace + role + budget
- **Use case**: per-project key isolation for cost-attribution + revocation without rotating sibling projects

#### OpenAI Admin API
- **Parent cred**: org-admin key
- **Endpoint**: `POST https://api.openai.com/v1/organization/projects/{project_id}/api_keys`
- **Mints**: project-scoped `OPENAI_API_KEY`
- **Use case**: same as Anthropic — per-project keys, per-project billing

#### GitHub fine-grained PAT (via gh CLI)
- **Parent cred**: `gh auth login` session
- **Pattern**: `gh api -X POST /users/{user}/installations/{id}/access_tokens` for installation tokens (60min TTL, auto-rotate)
- **For static**: classic PAT creation still requires browser → Tier 3

#### Resend / SendGrid sending domains
- **Parent cred**: `RESEND_API_KEY` (already in chezmoi)
- **Endpoint**: `POST https://api.resend.com/domains` returns DNS records to add via CF API (chain!)
- **Pattern**: auto-create sending domain + auto-add DNS records via CF zone API in same script

### Tier 3 — Computer Use (OAuth-app registration)
For providers without OAuth-app-management APIs. Launch the macOS Computer Use MCP (`mcp__desktop-control__computer`) to drive the user's REAL Chrome via the desktop, NOT a fresh isolated Chromium (Chrome MCP / Playwright MCP have zero session cookies and CANNOT complete OAuth-app registration). The user's daily Chrome already has the vendor sessions live; desktop Computer Use is the only path. Each flow is repeatable + parameterizable.

- **Mailchimp**: `https://us1.admin.mailchimp.com/account/oauth2/` → "Register App" form → redirect URI `https://{project}/api/mcp/mailchimp/callback`
- **HubSpot**: `https://developers.hubspot.com/get-started` → Create App → Auth tab → scopes
- **Stripe Connect OAuth**: `https://dashboard.stripe.com/settings/connect/onboarding-options/oauth` → enable + add redirect URI
- **Google OAuth credentials**: `https://console.cloud.google.com/apis/credentials` → Create Credentials → OAuth client ID
- **GA4 service account + JSON key**: walkthrough URL form → download key → grant Viewer in GA4 Admin
- **Microsoft Clarity project**: `https://clarity.microsoft.com/projects/new?name={domain}&url=...`
- **Plausible site**: `https://plausible.io/sites/new?domain={domain}`

**Computer Use flow primitives** (per [[computer-use-safety]]):
1. Screenshot before acting
2. Chain via `computer_batch`
3. Read tier for browsers (use Chrome MCP for interaction when DOM is stable)
4. After OAuth app creation: scrape client_id + client_secret from the rendered DOM, age-encrypt, store
5. Verify state by hitting the OAuth `/authorize` URL — 200 = working app

**Opt-in flag**: `--computer-use` on the provisioning script. Not auto-fired (browser cost + cognitive overhead).

### Tier 4 — Manual (paid plans, KYC, reseller approval)
Last resort. Surface with deeplinked URLs + reason. Never autopilot.

- `TRUSTPILOT_API_KEY` — paid Trustpilot Business plan
- `OPENSRS_USERNAME` / `OPENSRS_API_KEY` — reseller account approval (~1 business day)
- `DOMAINR_API_KEY` — RapidAPI subscription
- `STRIPE_CONNECT_CLIENT_ID` — Connect platform enablement (requires brand review)
- `APPLE_DEVELOPER_*` — Apple Developer Program ($99/yr + review)
- `GOOGLE_PLAY_*` — Google Play Console ($25 + review)

## Security model

### Least-privilege scoped tokens > global API keys
- **Default**: Tier 2 always mints scoped tokens. Global keys ONLY for bootstrapping scoped tokens.
- **CF specifically**: never put `CLOUDFLARE_API_KEY` + `CLOUDFLARE_EMAIL` on a Worker. The Worker gets a scoped `CF_API_TOKEN`. The global key lives in chezmoi on Brian's machine + GitHub Actions OIDC.
- **GitHub Actions**: use OIDC + `cloudflare/wrangler-action@v3` instead of long-lived tokens in repo secrets.

### Rotation cadence
- **Tier 1 generated secrets**: 90d (HMAC), 30d (session)
- **Tier 2 scoped tokens**: 90d (CF, Stripe webhook), 60d (Access service tokens)
- **Tier 1.5 at-rest keys**: never rotate without re-encryption job
- **Anthropic/OpenAI project keys**: rotate per project lifecycle (per-deploy if budget allows)

### Storage hierarchy
1. **chezmoi** (age-encrypted at rest, `~/.local/share/chezmoi/home/.chezmoitemplates/secrets-{hostname}/`)
2. **CF Worker secrets** (encrypted at rest by CF, exposed at `env.KEY` to handler)
3. **GitHub Actions secrets** (only for OIDC tokens + CI-only credentials)
4. **NEVER**: env files in repo, `.env.local` checked in, secret-bearing screenshots, secret-bearing logs

### Secret-redacting logs
- Every provisioning script MUST redact secret values before printing
- Pattern: `${value.slice(0, 7)}…${value.slice(-3)}` for prefixed creds (`sk_live…XYZ`)
- For unprefixed: print `(len=N)` only, never the body

### Audit trail
- Tag every minted token in vendor metadata: `metadata.managed_by = "projectsites"` + `metadata.minted_at` + `metadata.minter_host`
- Vendor dashboards (CF token list, Stripe products list, Resend domains) become the audit log
- `provision-secrets.mjs --audit` lists every managed-by-projectsites token across vendors

## Integrations perspective

### Trigger points
- **Pre-deploy** (`predeploy` npm script) — Tier 1 + Tier 2 always run; Tier 3/4 surfaced
- **CI workflow** — Tier 1 + Tier 2 run with explicit `--push`, then `wrangler deploy`
- **`/provision`** slash command — same as pre-deploy but interactive
- **New project scaffold** — `npx create-emdash-app` runs full provisioning before first commit

### Chained provisioning
The provisioning script is composable. Examples:
- Stripe webhook endpoint creation → mints `STRIPE_WEBHOOK_SECRET` → push to Worker secret → wrangler deploy → fires Stripe event → verify webhook callback received
- Resend sending domain → returns DNS records → CF API adds them to zone → wait for verification → mark domain `verified` in Resend
- CF scoped token mint → push to Worker → swap in `wrangler.toml [vars]` → smoke-test against `/v4/user/tokens/verify` → reject if scope-mismatched

### Idempotency contract
- Every Tier 1 + Tier 2 call MUST be safe to re-run forever without side-effects
- chezmoi check: `tryGetSecret(key) ?? mint()`
- Vendor check: `GET ?lookup_keys=` (Stripe), `GET /tokens?name=` (CF), `GET /domains?domain=` (Resend) before POST
- Failed runs leave no orphans (rollback created products if minting fails mid-flow)

## Reusable helper
- `scripts/lib/secrets.mjs` exports: `tryGetSecret`, `storeSecret`, `generateBase64Secret`, `generateHexSecret`, `ensureGeneratedSecret`, `ensureCloudflareAuth`, `mintCloudflareScopedToken`, `ensureStripeMeter`, `ensureStripePrice`, `pushSecretToWorker`, `syncSecretsToWorker`, `COMMON_SECRETS[]`
- `scripts/provision-secrets.mjs` orchestrates all four tiers
- Reference impl: `apps/project-sites/scripts/{lib/secrets.mjs,provision-secrets.mjs}`
- Copy verbatim into every new emdash project; wire into `predeploy` npm script

## Anti-friction principle (***strengthens [[secret-provisioning]]***)
Every "set this secret manually" rec is a code smell. Before surfacing:
1. Tier 1? Generate it.
2. Tier 2? Use the parent cred to mint it.
3. Tier 3? Spawn Computer Use if `--computer-use` flag passed, else surface deeplinked URL + form-prefilled redirect URI.
4. Tier 4? Surface with the deeplinked URL + reason + estimated wall time.

If the rec doesn't specify the tier, the rec itself is the gap.

## See
- [[secret-provisioning]] — pushing existing secrets to deploy targets (this rule is the upstream)
- [[full-autonomy]] — Tier 2 + 3 count as authorized infrastructure
- [[brian-preferences]] — pick ONE, never ask permission
- [[auto-meta-work]] — analytics provisioning (Sentry + PostHog + GA4 + Workers Tracing + AI Gateway) is a Tier 2 flow
- [[verification-loop]] — every provisioning step ends with a verify call
- [[computer-use-safety]] — Tier 3 execution discipline
- [[payments-routing]] — Stripe vs Square decision precedes any payment-secret provisioning
- [[fetch-defaults]] — vendor APIs called from local scripts need realistic UA
