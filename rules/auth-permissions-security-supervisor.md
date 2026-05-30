# Auth + Permissions + Security Supervisor (***SUPREME — server-enforced, tenant-isolated, every large app***)

Permissions are enforced server-side, always. Client-only checks are UX, never security. Tenant isolation, audit trails, hashed keys, verified webhooks, rate limits. The security arm of the supervisor system — companion to the project-level multi-tenant isolation discipline.

## When this fires
- Any auth surface, permission check, sensitive action, API key, webhook, or cross-tenant boundary

## Tooling + when to use
- **Better Auth** — auth where it fits the model (sessions, OAuth, passkeys)
- **@casl/ability** — permissions/abilities (define once, enforce server-side, mirror client-side for UX)
- **Zod** + **@t3-oss/env-core** — validate auth inputs + secrets config per [[validation-error-handling-supervisor]]
- **@upstash/ratelimit** — rate limiting where KV/DO can't (global counters, sliding windows)

## Rules
- **Enforce permissions server-side** — every mutating/reading handler checks CASL ability against the caller's role/org; never trust a client-only gate
- **Tenant isolation** — every `:id`/`:siteId` route verifies the resource's `org_id` matches the caller's; return 404 (never 403) on mismatch so existence doesn't leak (the project-level canonical: `siteOrgId` + ownership gate)
- **Audit logs** — every sensitive action (auth change, billing, delete, permission grant, key mint) writes who/what/before-after/when with a correlation ID
- **Hash API keys** — store a hash, compare on use; show the plaintext once at creation only
- **Verify webhook signatures** before parsing per [[notifications-email-webhooks-supervisor]]
- **Rate limit** public + auth endpoints (Turnstile on forms, @upstash/ratelimit on APIs)
- **Safe sessions** — httpOnly + secure + SameSite; rotate on privilege change; short-lived + refresh
- **Secret scanning** — detect-secrets in pre-commit; never log tokens/secrets (redact at the boundary)
- **SSR-safe + XSS-safe** rendering — Trusted Types, CSP Level 3 nonce per [[quality-metrics]]; sanitize all user/OCR/AI/CMS content
- **Sandbox dangerous execution** — generated/untrusted code runs in an isolated sandbox per [[sandbox-execution]], never the main runtime

## See
- [[package-preference-registry]] · [[validation-error-handling-supervisor]] · [[notifications-email-webhooks-supervisor]] · [[sandbox-execution]] · [[drift-detection]] · [[autonomous-engineering]] · [[quality-metrics]] · [[cloudflare-hostable-supervisor]]

## Reference incident (***2026-05-29 — supervisor knowledge-system upgrade, wave 2***)
Brief: Better Auth + CASL; enforce permissions server-side; audit logs; hash API keys; verify webhook signatures; tenant isolation; rate limiting; safe sessions; secret scanning; SSR/XSS-safe rendering; sandbox dangerous execution. Authored wave 2; package decisions in [[package-preference-registry]].
