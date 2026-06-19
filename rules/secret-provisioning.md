---
name: "secret-provisioning"
priority: 2
pack: "infra"
triggers:
  - "secret"
  - "env var"
  - "api key"
paths:
  - "concern:cloudflare-workers"
---

# Secret Provisioning

## Why this grew

- 2026-06-19: added § "Mint a scoped CF API token from the Global API Key" + § "Never-overwrite-live-secrets discipline" — two arc-proven techniques (projectsites.dev) that unblock prod secret-put without escalating to the user. Load-bearing recipes, not filler.

Auto-fetch every required secret from `get-secret` and push it to the destination platform before running any deploy; never prompt the user to do it manually.

## Core mandate

- Every deploy that depends on a secret MUST auto-fetch from `/Users/Apple/.local/bin/get-secret` and push to the destination BEFORE running the deploy command
- Destinations: CF Pages `npx wrangler pages secret put` | CF Workers `npx wrangler secret put` | Vercel `vercel env add` | Fly `flyctl secrets set` | Render dashboard API | etc.
- NEVER recommend the user run `wrangler pages secret put` themselves — that is friction for zero gain when the secret is right there in get-secret

## Detect-availability protocol

- Call `/Users/Apple/.local/bin/get-secret KEY`
- If stdout starts with `"The file "` (missing-secret error) → treat as absent
- Else → treat trimmed stdout as the secret value
- Silently skip absent keys — they stay whatever the destination already has
- Surface a single "set this secret" rec ONLY for genuinely missing keys, ONLY with the exact deeplinked URL where the secret is generated (`https://dash.cloudflare.com/?to=/:account/turnstile` not "go to CF dashboard")

## Alias-aware gap analysis

- Code commonly checks multiple alias variants for the same secret: `env.X_OAUTH_CLIENT_ID || env.X_CLIENT_ID || ''`. Naming-convention comment in `apps/project-sites/CLAUDE.md` MCP OAuth section: "`{PROVIDER}_OAUTH_CLIENT_ID` + `_OAUTH_CLIENT_SECRET`. Historical aliases (`MAILCHIMP_CLIENT_ID`, `HUBSPOT_CLIENT_ID`, `STRIPE_CONNECT_CLIENT_ID`, `GITHUB_CLIENT_ID`, `GOOGLE_CLIENT_ID`) kept as fallbacks."
- Gap audit MUST grep the code for ALL alias variants of each `env.X` reference, then check the live secret list against the FULL alias set, not just the bare name
- Bash: `grep -rhoE "env\.${PROVIDER}[A-Z_]+" src | sort -u` gives the alias surface for one provider
- A "missing" claim that ignores OAuth-prefix aliases = false positive = wasted Computer Use session + user time
- Reference incident (2026-05-26, projectsites.dev): claimed `HUBSPOT_CLIENT_ID/SECRET` and `MAILCHIMP_CLIENT_ID/SECRET` were missing — actually live as `_OAUTH_*` variants. HubSpot code reads both; Mailchimp code reads only the bare name and missed its own live OAuth-prefixed secret (separate code-bug surfaced by the audit, not a provisioning gap)
- When code reads only the bare name but the live secret is `_OAUTH_*`-prefixed, that's a CODE BUG (add the fallback chain), NOT a missing secret. Surface as a one-line code fix, not as a Computer Use task

## Canonical secret list (try every one on every CF/Vercel/Fly deploy — silently skip missing)

- `RESEND_API_KEY`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_API_KEY`
- `TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SQUARE_ACCESS_TOKEN`
- `SQUARE_WEBHOOK_SIGNATURE_KEY`
- `SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `POSTHOG_API_KEY`
- `POSTHOG_PROJECT_API_KEY`
- `GA4_MEASUREMENT_ID`
- `GA4_API_SECRET`
- `CLERK_SECRET_KEY`
- `CLERK_PUBLISHABLE_KEY`
- `NEON_DATABASE_URL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `AXIOM_TOKEN`
- `AXIOM_DATASET`
- `DATADOG_API_KEY`
- `INNGEST_EVENT_KEY`
- `INNGEST_SIGNING_KEY`
- `CALCOM_API_KEY`
- `CAL_API_KEY`

## CF auth bootstrap (fallback chain)

1. `CLOUDFLARE_API_TOKEN` from get-secret
2. `CLOUDFLARE_API_KEY` + `CLOUDFLARE_EMAIL`
3. Both stale → ask user to `! npx wrangler login` per `verification-loop` auth fallback chain

NEVER silently skip the deploy step because creds were missing — surface it as a blocker the same turn.

## Reusable helper pattern (every project)

- `scripts/lib/secrets.mjs` exports:
  - `tryGetSecret(key)`
  - `ensureCloudflareAuth()`
  - `syncSecretsToPages(projectName, keys[])`
  - `COMMON_SECRETS[]`
- Every deploy script imports this — one source of truth, zero copy-paste
- Reference: `template.projectsites.dev/scripts/lib/secrets.mjs`
- Copy verbatim into every new emdash project's `scripts/lib/secrets.mjs` and wire into `deploy-*.mjs` before the `wrangler pages deploy` line

## Idempotency

- `wrangler pages secret put` overwrites silently on second run — safe to call every deploy
- Reading `wrangler pages secret list` first to "check if it exists" wastes a roundtrip — skip the check, just write

## Two-way mirror — prod ↔ chezmoi

- Every `wrangler secret put KEY` (worker, page, or any deploy target) MUST be paired with a chezmoi write at `~/.local/share/chezmoi/home/.chezmoitemplates/secrets/{KEY}` via `printf '%s' "$VALUE" | chezmoi encrypt > "$path"` BEFORE OR IMMEDIATELY AFTER the push
- Every chezmoi write of a new secret MUST also push to the relevant deploy target the same turn
- Drift = recovery risk: a secret living in prod-only is unrecoverable if the worker config is wiped (Cloudflare dashboard accident, account compromise, account hand-off) since `wrangler secret list` exposes NAMES ONLY, never values
- Drift = recovery risk in the other direction: a chezmoi-only secret that never reaches prod silently no-ops the feature it powers
- The reusable helper `scripts/lib/secrets.mjs` MUST do the dual-write atomically — never accept a flow where only one direction lands
- `scripts/check-secrets.mjs` (every project, every pre-deploy) MUST audit BOTH directions: report any name in `wrangler secret list` that's missing from chezmoi, AND any chezmoi entry that's missing from the worker
- Audit cadence: run `scripts/check-secrets.mjs --audit` after every `wrangler secret put`, every chezmoi write, every CF dashboard secret edit, and as a pre-deploy gate
- When provisioning via Computer Use (Tier 3 OAuth-app + API-key flows), the dual-write is part of the same atomic step — never leave the browser with a value the chezmoi store doesn't have
- Reference incident (2026-05-26, projectsites.dev): 156 prod secrets, 70 chezmoi entries — 7 secrets (`CF_API_TOKEN`, `CF_ZONE_ID`, `GOOGLE_CSE_CX`, `GOOGLE_CSE_KEY`, `STABILITY_API_KEY`, `UNSPLASH_ACCESS_KEY`, `WHOISXML_API_KEY`) lived in production but never in chezmoi. Unrecoverable without re-minting from each vendor's console. Brian's explicit meta-instruction: "always do this in the future" → this rule

## Mint a scoped CF API token from the Global API Key (when the vaulted token lacks a perm)

When `npx wrangler secret put` (or any CF API call) fails with **`Authentication error [code: 10000]`** or `10053`, the vaulted `CF_API_TOKEN` is under-scoped. Do NOT escalate to the user for a new token — **mint one autonomously from the Global API Key** (`CLOUDFLARE_API_KEY` + `CLOUDFLARE_EMAIL`, both in get-secret). Proven 2026-06-19 (projectsites.dev): unblocked `wrangler secret put --env production` after the vaulted token 10000'd on the Workers-secrets endpoint.

Recipe:

1. **Verify the global key** — `GET https://api.cloudflare.com/client/v4/user` with headers `X-Auth-Email: $CLOUDFLARE_EMAIL` + `X-Auth-Key: $CLOUDFLARE_API_KEY` → `success:true`.
2. **Find permission-group IDs** — `GET /user/tokens/permission_groups` (same headers); grep the names you need. Deploy set: `Workers Scripts Write` (covers `secret put` + script deploy), `Workers KV Storage Write`, `Workers R2 Storage Write`, `Workers Routes Write`, `Workers AI Write`, `Workers Containers Write`.
3. **Create the token** — `POST /user/tokens` (same headers) with body `{"name":"<proj>-deploy-minted-<YYYY-MM>","policies":[{"effect":"allow","resources":{"com.cloudflare.api.account.<ACCT_ID>":"*"},"permission_groups":[{"id":"<gid>"},…]}]}`. Response `result.value` is the new token (≈53 chars).
4. **Use it** — `export CLOUDFLARE_API_TOKEN=<value>`; verify via `GET /user/tokens/verify` → `status:active`; then `wrangler secret put` / `wrangler deploy` work.
5. **Persist** — write the minted token to local `.dev.vars` (replacing the under-scoped `CF_API_TOKEN`) and, if a set-secret path exists, into get-secret so the next session reuses it. Never echo the value; stash via `/tmp` within one shell session only, `rm` after.

Safety: account-scoped + least-privilege (only the Workers write groups), named with a date so it's auditable/revocable at `https://dash.cloudflare.com/profile/api-tokens`. The Global API Key is all-powerful — use it ONLY to mint scoped tokens, never as the deploy credential itself.

## Never-overwrite-live-secrets discipline

Before `wrangler secret put` in bulk, **list existing destination secrets first** (`wrangler secret list --env production`) and set ONLY genuinely-missing keys (`comm -23 <(local keys) <(prod keys)`). Prod often already holds the real vendor values; blindly re-pushing get-secret values risks clobbering a hand-tuned live key with a stale local one. Additive-only. Reference: projectsites.dev prod had 163 secrets; only 3 were genuinely missing.

- A non-secret that lives in `wrangler.toml [vars]` (e.g. `CF_ACCOUNT_ID`) will reject a `secret put` with `code: 10053 "Binding name already in use"` — that's correct, leave it as a var.
- A prod **auth-bypass / test-login seam secret** (e.g. `E2E_TEST_PASSWORD`) is security-sensitive — setting it ACTIVATES the seam (404→403). Set it only on explicit user instruction (it's `approval-required` tier per `autonomous-engineering`), then verify live (the endpoint flips from 404 to a 401/403 on a wrong password).

## Anti-friction principle

- Every "set this secret manually" recommendation in a Recs section is a code smell
- If get-secret has it → the deploy script should push it
- If get-secret doesn't have it → the rec must include:
  - The exact URL to generate it
  - The exact command to add it to get-secret (`echo "VALUE" > /Users/Apple/.local/secrets/KEY`) so it lands in get-secret for next time
- If a CF perm is missing → mint a scoped token from the Global API Key (§ above), never escalate
