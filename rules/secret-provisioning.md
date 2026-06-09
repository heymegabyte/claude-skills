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

## Anti-friction principle

- Every "set this secret manually" recommendation in a Recs section is a code smell
- If get-secret has it → the deploy script should push it
- If get-secret doesn't have it → the rec must include:
  - The exact URL to generate it
  - The exact command to add it to get-secret (`echo "VALUE" > /Users/Apple/.local/secrets/KEY`) so it lands in get-secret for next time
