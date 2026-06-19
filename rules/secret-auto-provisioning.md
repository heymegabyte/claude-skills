---
name: "secret-auto-provisioning"
priority: 3
pack: "infra"
triggers:
  - "provision"
  - "mint token"
  - "stripe webhook secret"
paths:
  - "concern:cloudflare-workers"
---

# Secret Auto-Provisioning

Companion to `secret-provisioning.md`. Acquires NEW secrets via generation, API-mint, Computer Use, or manual flow. Every "set this secret" Rec = failure.

## Core mandate

- Producible without human input → produce automatically.
- Requires human → use highest tier available (API > Computer Use > manual deeplink).
- Manual recs reserved for Tier 4 only (paid plans, KYC, no public API).

## Tiers

### Tier 1 — Generate locally (no network)

Generates and age-encrypts via chezmoi → `~/.local/share/chezmoi/home/.chezmoitemplates/secrets-{hostname}/<KEY>`.

- `openssl rand -base64 32` — HMAC/signing keys.
- `openssl rand -hex 32` — URL-safe nonces.
- Examples: `WEEKLY_DIGEST_SECRET`, `SALE_WEBHOOK_SECRET`, `JWT_SIGNING_SECRET`, `SESSION_SECRET`, `CSRF_SECRET`.
- Signing-only secrets auto-rotate (`--rotate-tier1` opt-in); rotation invalidates old tokens, no data loss.

### Tier 1.5 — Data-at-rest (NEVER auto-generate)

- `MCP_ENCRYPTION_KEY` — encrypts MCP OAuth tokens in D1; rotation requires re-OAuth.
- `*_ENCRYPTION_KEY` / `*_AT_REST_KEY` — decrypts persisted data.
- `INTERNAL_BUILD_SECRET` / paired HMAC — mismatch breaks integration.
- Detect-only. Surface one-time mint when absent in BOTH chezmoi AND deploy target. Then fold into `secret-provisioning.md` sync.

### Tier 2 — API-provision via parent credential

**Cloudflare scoped tokens** (parent: `CLOUDFLARE_API_KEY` + `CLOUDFLARE_EMAIL`):

- `POST https://api.cloudflare.com/client/v4/user/tokens`
- Enumerate groups: `GET /user/tokens/permission_groups`
- Permission group IDs:
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
- Name pattern: `{project}-{env}-scoped-{YYYYMMDD}`. Store as `CF_API_TOKEN_SCOPED`; smoke-test before swap.

**Cloudflare Access service tokens**:

- `POST /accounts/{accountId}/access/service_tokens` → `CF_ACCESS_CLIENT_ID` + `CF_ACCESS_CLIENT_SECRET`.
- Rotate 90d; tag `duration: "8760h"` (1y max).

**Stripe** (parent: `STRIPE_SECRET_KEY`):

- Idempotency: `GET /v1/prices?lookup_keys[]=...` before create.
- Auto-mint: `STRIPE_USAGE_PRICE_IDS` (post-2025-03-31 requires `recurring[meter]`), `STRIPE_PRICE_CREDITS_*`, `STRIPE_WEBHOOK_SECRET` (`POST /v1/webhook_endpoints` → `whsec_*`).
- Meters first: `POST /v1/billing/meters`; prices reference `recurring[meter]=mtr_*`.
- NEVER auto-mint `STRIPE_CONNECT_CLIENT_ID` → Tier 3.

**Anthropic Admin API** (parent: `ANTHROPIC_ADMIN_KEY`):

- `POST https://api.anthropic.com/v1/organizations/api_keys` → project-scoped `ANTHROPIC_API_KEY` w/ workspace + role + budget.

**OpenAI Admin API** (parent: org-admin key):

- `POST https://api.openai.com/v1/organization/projects/{project_id}/api_keys` → `OPENAI_API_KEY`.

**GitHub fine-grained PAT** (parent: `gh auth login`):

- Installation tokens: `gh api -X POST /users/{user}/installations/{id}/access_tokens` (60min TTL, auto-rotate).
- Classic PAT requires browser → Tier 3.

**Resend domains** (parent: `RESEND_API_KEY`):

- `POST https://api.resend.com/domains` → DNS records → add via CF zone API in same script.

### Tier 3 — Computer Use (OAuth-app registration)

Use `mcp__desktop-control__computer` on user's REAL Chrome. Playwright/Chrome MCP have zero cookies — cannot complete OAuth app registration.

- Mailchimp: `https://us1.admin.mailchimp.com/account/oauth2/` → Register App → redirect URI `https://{project}/api/mcp/mailchimp/callback`
- HubSpot: `https://developers.hubspot.com/get-started` → Create App → Auth → scopes
- Stripe Connect OAuth: `https://dashboard.stripe.com/settings/connect/onboarding-options/oauth` → enable + redirect URI
- Google OAuth: `https://console.cloud.google.com/apis/credentials` → Create Credentials → OAuth client ID
- GA4 service account: walkthrough → download JSON key → grant Viewer in GA4 Admin
- Microsoft Clarity: `https://clarity.microsoft.com/projects/new?name={domain}&url=...`
- Plausible: `https://plausible.io/sites/new?domain={domain}`

Steps (per `computer-use-safety.md`): screenshot before acting → chain via `computer_batch` → read tier for browsers → scrape client_id + client_secret from DOM, age-encrypt, store → verify OAuth `/authorize` returns 200.

Opt-in: `--computer-use` flag. Not auto-fired.

### Tier 4 — Manual (paid plans, KYC, reseller approval)

Surface deeplinked URL + reason. Never autopilot.

- `TRUSTPILOT_API_KEY` — paid Business plan.
- `OPENSRS_USERNAME` / `OPENSRS_API_KEY` — reseller approval (~1 day).
- `DOMAINR_API_KEY` — RapidAPI subscription.
- `STRIPE_CONNECT_CLIENT_ID` — Connect platform brand review.
- `APPLE_DEVELOPER_*` — $99/yr + review.
- `GOOGLE_PLAY_*` — $25 + review.
- `CHECKR_API_KEY` — **sales-gated**: no self-serve "Create Key" button. Request via `https://checkr.com/contact-us` → Sales → 1-3 business day call. Alternatives: `PERSONA_API_KEY` (`https://withpersona.com`) or `ONFIDO_API_TOKEN` (`https://onfido.com`).

## Vendor gating reality

Symptom of gated API: logged in, no "API Keys" / "Developer Settings" / "Create Key" button anywhere — it's gated, not hidden.

- Self-serve instant: Stripe, Twilio, Resend, Anthropic, OpenAI, Cloudflare, Mailchimp (Marketing API).
- `Checkr` — sales call; alternatives: Persona, Onfido.
- `Plaid` — Sandbox instant; Development + Production require approval.
- `Trustpilot` — paid only; alternative: reviews.io.
- `Stripe Connect` — brand review for platform enablement.
- `Apple Developer` — $99/yr + manual review.

Update as vendor reality surfaces (per `prompt-as-training-signal` §6).

## Security model

- Tier 2 always mints scoped. Global keys ONLY for bootstrapping.
- CF: never put `CLOUDFLARE_API_KEY` + `CLOUDFLARE_EMAIL` on Worker. Worker gets scoped `CF_API_TOKEN`. Global lives in chezmoi + GitHub Actions OIDC.
- GitHub Actions: OIDC + `cloudflare/wrangler-action@v3` instead of long-lived repo secrets.

### Rotation cadence

- Tier 1: 90d (HMAC), 30d (session).
- Tier 2: 90d (CF, Stripe webhook), 60d (Access service tokens).
- Tier 1.5: never rotate without re-encryption job.
- Anthropic/OpenAI project keys: per project lifecycle.

### Storage hierarchy

1. **chezmoi** — age-encrypted at rest, `~/.local/share/chezmoi/home/.chezmoitemplates/secrets-{hostname}/`.
2. **CF Worker secrets** — encrypted, exposed at `env.KEY`.
3. **GitHub Actions secrets** — OIDC + CI-only credentials only.
4. NEVER: env files in repo, `.env.local` checked in, secret-bearing screenshots/logs.

### Log redaction

- Prefixed creds: `${value.slice(0, 7)}…${value.slice(-3)}`.
- Unprefixed: print `(len=N)` only.

### Audit trail

- Tag every minted token: `metadata.managed_by = "projectsites"`, `metadata.minted_at`, `metadata.minter_host`.
- `provision-secrets.mjs --audit` lists every managed token across vendors.

## Trigger points

- **`predeploy`** npm script — Tier 1 + Tier 2 always run; Tier 3/4 surfaced.
- **CI** — Tier 1 + Tier 2 with `--push`, then `wrangler deploy`.
- **`/provision`** slash command — interactive.
- **`npx create-emdash-app`** — full provisioning before first commit.

## Chained provisioning

- Stripe webhook → `STRIPE_WEBHOOK_SECRET` → push to Worker → deploy → verify callback.
- Resend domain → DNS records → CF zone API → wait for verification → mark `verified`.
- CF scoped token → push to Worker → swap `wrangler.toml [vars]` → smoke-test `/v4/user/tokens/verify` → reject if scope-mismatched.

## Idempotency contract

- Tier 1 + Tier 2 safe to re-run forever.
- chezmoi: `tryGetSecret(key) ?? mint()`.
- Vendor pre-check: `GET ?lookup_keys=` (Stripe), `GET /tokens?name=` (CF), `GET /domains?domain=` (Resend) before POST.
- Failed runs leave no orphans (rollback created products if mid-flow).

## Reusable helper

- `scripts/lib/secrets.mjs` exports: `tryGetSecret`, `storeSecret`, `generateBase64Secret`, `generateHexSecret`, `ensureGeneratedSecret`, `ensureCloudflareAuth`, `mintCloudflareScopedToken`, `ensureStripeMeter`, `ensureStripePrice`, `pushSecretToWorker`, `syncSecretsToWorker`, `COMMON_SECRETS[]`.
- `scripts/provision-secrets.mjs` orchestrates all four tiers.
- Reference impl: `apps/project-sites/scripts/{lib/secrets.mjs,provision-secrets.mjs}`.
- Wire into `predeploy` in every new emdash project.

## Anti-friction decision tree

1. Tier 1? Generate.
2. Tier 2? Mint via parent cred.
3. Tier 3? Spawn Computer Use if `--computer-use`, else surface deeplinked URL + prefilled redirect URI.
4. Tier 4? Surface deeplinked URL + reason + estimated wall time.

If rec doesn't specify tier, the rec itself is the gap.
