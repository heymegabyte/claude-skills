# Secret Provisioning (***UNIVERSAL — every deploy, every project***)

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
3. Both stale → ask user to `! npx wrangler login` per [[verification-loop]] auth fallback chain

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

## Anti-friction principle
- Every "set this secret manually" recommendation in a Recs section is a code smell
- If get-secret has it → the deploy script should push it
- If get-secret doesn't have it → the rec must include:
  - The exact URL to generate it
  - The exact command to add it to get-secret (`echo "VALUE" > /Users/Apple/.local/secrets/KEY`) so it lands in get-secret for next time

## Reference incident (***2026-05-21 — template.projectsites.dev v3.7***)
Closed turn with "wire `RESEND_API_KEY` via `wrangler pages secret put`" as a Rec. Brian: *"isn't `RESEND_API_KEY` available with get-secret? Ensure this mistake is not happening again... make sure you automatically load from get-secret, when the secret is available."* Fixed by building `scripts/lib/secrets.mjs` reusable helper + wiring into `deploy-template.mjs` + `deploy-applied.mjs`. Every CF Pages project I touch from this point forward gets the helper automatically.

## See
- [[secret-auto-provisioning]] — upstream rule: how to ACQUIRE secrets when they don't exist (openssl → API mint → Computer Use → manual). This rule is the downstream push step.
- [[brian-preferences]] — pick ONE, never ask permission, just do it
- [[auto-meta-work]] — Sentry+PostHog+GA4+Workers Tracing+AI Gateway provisioning
- [[verification-loop]] — CF auth fallback chain
- [[full-autonomy]] — secrets count as authorized infrastructure, push without asking
