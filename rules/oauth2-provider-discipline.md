---
last_reviewed: 2026-06-29
superseded_by: null
priority: 2
pack: core
triggers:
  - "OAuth2"
  - "oauth"
  - "which auth provider"
  - "Bitwarden token"
  - "Auth0"
  - "Okta"
  - "Cognito"
  - "M2M"
  - "PKCE"
paths:
  - "template/utils/**token-cache*"
  - "src/worker/**"
  - "workers/**"
---

# OAuth2 Provider Discipline

Decision tree for picking the right OAuth2 provider per use-case. Never hand-roll
OAuth2 — use Clerk + Better Auth + the listed providers. Every provider has a matching
typed helper in `template/utils/`.

## Provider quick-reference

| Provider       | Primary use-case                                  | Grant type          | Template util                          |
|----------------|---------------------------------------------------|---------------------|----------------------------------------|
| **Bitwarden**  | Internal secrets vault, M2M between own Workers   | client_credentials  | `bitwarden-token-cache.ts`             |
| **Auth0**      | B2B SaaS auth, SAML/OIDC federation, broad IdP    | client_credentials + PKCE | `auth0-token-cache.ts`           |
| **Okta**       | Enterprise IT / workforce auth, HR provisioning   | client_credentials  | `okta-token-cache.ts`                  |
| **Cognito**    | AWS-tenant apps, AWS-native service federation    | client_credentials  | `cognito-token-cache.ts`               |
| **PKCE flow**  | Any user-facing OAuth2 (browser redirect)         | authorization_code + PKCE | `oauth2-pkce-cache.ts`           |
| **Clerk**      | User auth for all Brian-owned consumer/SaaS apps  | managed (Clerk SDK) | Clerk SDK — no custom token util       |

See `reference/oauth2-provider-discipline.md` for the full decision tree and per-provider usage snippets.

## Provider profiles

### Bitwarden — internal credentials and M2M

- Best for: vault secrets, internal Worker authentication, CLI tools, cron secrets.
- Anti-pattern: do NOT use for user-facing auth or customer-tenant M2M.

### Auth0 — B2B SaaS and SAML/OIDC federation

- Best for: B2B SaaS multi-tenant, social login aggregation, SAML federation.
- Pricing: 7k MAU free; M2M tokens limited to 1k/month on free plan.

### Okta — enterprise IT and workforce

- Best for: Okta-shop enterprise clients, SCIM provisioning, HR-integrated lifecycle.
- Free Developer org supports up to 100 MAU — suitable for prototyping.

### Cognito — AWS-tenant federation

- Best for: AWS Lambda / API Gateway auth, Cognito User Pool federation, Amplify apps.
- Anti-pattern: avoid for non-AWS stacks — Cognito has AWS-specific JWT claims and SDK assumptions.

### PKCE (user-facing) — browser redirect flow

- Use for ANY flow where the user must consent in a browser tab.
- Provider-agnostic: pass any provider's authorize + token endpoints.
- Never store `code_verifier` in a cookie — keep in `sessionStorage` on the client only.

## Hard rules

- NEVER hand-roll OAuth2 (token generation, PKCE, refresh logic).
- NEVER store client secrets in source code — always from `env.*` via Zod-validated env schema.
- ALWAYS use the matching typed util — raw fetch to a token endpoint is a drift violation.
- ALWAYS validate returned tokens with `validateJwt()` before trusting claims.
- ALWAYS refresh 60s before expiry (the utils handle this automatically).
- PKCE: generate `code_verifier` via `generatePkceVerifierAndChallenge()` — never roll your own random.

## Skip list — what NOT to use

| Anti-pattern                         | Correct approach                                  |
|--------------------------------------|---------------------------------------------------|
| Hand-rolled `/token` fetch           | Use typed util matching the provider              |
| `passport.js` in a Worker            | Workers don't support Node HTTP — use fetch util  |
| Plain `client_credentials` for users | Use `authorization_code + PKCE` for user flows    |
| Storing `client_secret` in git       | `env.*` + Bitwarden secret injection              |
| Azure AD / Entra                     | Use Okta or Auth0 with SAML federation to Azure   |

## Scale modifier

| Scale         | Notes                                                                 |
|---------------|-----------------------------------------------------------------------|
| Solo / small  | Bitwarden for internal; Auth0 free tier for B2B (up to 7k MAU free)  |
| Enterprise    | Okta preferred for workforce (SCIM + HR sync); Auth0 for B2C/B2B     |
| AWS-locked    | Cognito only when team already owns AWS IAM / Lambda surface          |

## See also

- `[[mcp-server-hardening]]` — MCP token security and rotation
- `[[mcp-auth-options]]` — MCP-specific OAuth2 wiring
- `[[secret-provisioning]]` — how secrets reach Workers at runtime
- `[[zod-everywhere]]` — validating env and token response shapes
- `[[oauth2-pkce-cache]]` — PKCE flow implementation details
