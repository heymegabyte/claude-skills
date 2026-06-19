---
priority: high
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

## Decision tree

```
Is this flow user-facing (browser redirect → consent → callback)?
  YES → authorization_code + PKCE
        └─ pick provider below for the token endpoint
  NO (M2M / server-to-server) → client_credentials
        └─ use decision table below
```

### M2M / server-to-server decision table

```
Who owns the data / identity store?
├── Brian / Megabyte Labs internal tools
│   ├── Secrets / vault credentials              → Bitwarden  (bitwarden-token-cache.ts)
│   └── Any other internal Worker-to-Worker M2M  → Bitwarden  (bitwarden-token-cache.ts)
│
├── B2B customer (you're selling SaaS)
│   ├── Customer wants SAML / OIDC federation    → Auth0      (auth0-token-cache.ts)
│   ├── Customer is enterprise IT (Okta shop)    → Okta       (okta-token-cache.ts)
│   └── Customer is AWS-native                   → Cognito    (cognito-token-cache.ts)
│
└── Partner / external service
    ├── Partner already uses Auth0               → Auth0      (auth0-token-cache.ts)
    ├── Partner uses Okta / Workforce IdP        → Okta       (okta-token-cache.ts)
    └── Partner uses AWS Cognito User Pool       → Cognito    (cognito-token-cache.ts)
```

### Scale modifier

| Scale         | Notes                                                                 |
|---------------|-----------------------------------------------------------------------|
| Solo / small  | Bitwarden for internal; Auth0 free tier for B2B (up to 7k MAU free)  |
| Enterprise    | Okta preferred for workforce (SCIM + HR sync); Auth0 for B2C/B2B     |
| AWS-locked    | Cognito only when team already owns AWS IAM / Lambda surface          |

## Provider profiles

### Bitwarden — internal credentials and M2M

- Token endpoint: `https://identity.bitwarden.com/connect/token`
- Grant: `client_credentials`, scope `api`
- Best for: vault secrets, internal Worker authentication, CLI tools, cron secrets
- Util: `getBitwardenToken(opts)` — wraps `createOAuth2ClientCredentialsCache`
- Anti-pattern: do NOT use for user-facing auth or customer-tenant M2M

```typescript
import { getBitwardenToken } from "@/utils";
const token = await getBitwardenToken({ clientId: env.BW_ID, clientSecret: env.BW_SECRET });
```

### Auth0 — B2B SaaS and SAML/OIDC federation

- Token endpoint: `https://<tenant>.us.auth0.com/oauth/token`
- Grant: `client_credentials` (M2M) or `authorization_code + PKCE` (user-facing)
- Best for: B2B SaaS multi-tenant, social login aggregation, SAML federation
- Util: `getAuth0Token(opts)` for M2M; `createAuth0PkceClient(opts)` for PKCE
- Pricing: 7k MAU free, then metered; M2M tokens limited on free plan (1k/month)

```typescript
import { getAuth0Token } from "@/utils";
const token = await getAuth0Token({ domain: env.AUTH0_DOMAIN, clientId: env.AUTH0_ID, clientSecret: env.AUTH0_SECRET, audience: env.AUTH0_AUDIENCE });
```

### Okta — enterprise IT and workforce

- Token endpoint: `https://<org>.okta.com/oauth2/default/v1/token`
- Grant: `client_credentials` (service app) or `authorization_code + PKCE` (workforce SSO)
- Best for: Okta-shop enterprise clients, SCIM provisioning, HR-integrated lifecycle
- Util: `getOktaToken(opts)`
- Note: Okta's free Developer org supports up to 100 MAU — suitable for prototyping

```typescript
import { getOktaToken } from "@/utils";
const token = await getOktaToken({ orgUrl: env.OKTA_ORG_URL, clientId: env.OKTA_ID, clientSecret: env.OKTA_SECRET, scope: "openid profile" });
```

### Cognito — AWS-tenant federation

- Token endpoint: `https://<pool>.auth.<region>.amazoncognito.com/oauth2/token`
- Grant: `client_credentials` (app client without secret rotation) or `authorization_code`
- Best for: AWS Lambda / API Gateway auth, Cognito User Pool federation, Amplify apps
- Util: `getCognitoToken(opts)`
- Anti-pattern: avoid for non-AWS stacks — Cognito has AWS-specific JWT claims and SDK assumptions

```typescript
import { getCognitoToken } from "@/utils";
const token = await getCognitoToken({ tokenEndpoint: env.COGNITO_TOKEN_URL, clientId: env.COGNITO_ID, clientSecret: env.COGNITO_SECRET });
```

### PKCE (user-facing) — browser redirect flow

- Use for ANY flow where the user must consent in a browser tab
- Provider-agnostic: pass any provider's authorize + token endpoints
- Util: `createAuth0PkceClient(opts)` (Auth0 flavor) or `oauth2-pkce-cache.ts` generics
- Never store `code_verifier` in a cookie — keep in `sessionStorage` on the client only

## Hard rules

- NEVER hand-roll OAuth2 (token generation, PKCE, refresh logic)
- NEVER store client secrets in source code — always from `env.*` via Zod-validated env schema
- ALWAYS use the matching typed util — raw fetch to a token endpoint is a drift violation
- ALWAYS validate returned tokens with `validateJwt()` before trusting claims
- ALWAYS refresh 60s before expiry (the utils handle this automatically)
- PKCE: generate `code_verifier` via `generatePkceVerifierAndChallenge()` — never roll your own random

## Skip list — what NOT to use

| Anti-pattern                         | Correct approach                                  |
|--------------------------------------|---------------------------------------------------|
| Hand-rolled `/token` fetch           | Use typed util matching the provider              |
| `passport.js` in a Worker            | Workers don't support Node HTTP — use fetch util  |
| Plain `client_credentials` for users | Use `authorization_code + PKCE` for user flows    |
| Storing `client_secret` in git       | `env.*` + Bitwarden secret injection              |
| Azure AD / Entra                     | Use Okta or Auth0 with SAML federation to Azure   |

## See also

- `[[mcp-server-hardening]]` — MCP token security and rotation
- `[[mcp-auth-options]]` — MCP-specific OAuth2 wiring
- `[[secret-provisioning]]` — how secrets reach Workers at runtime
- `[[zod-everywhere]]` — validating env and token response shapes
- `[[oauth2-pkce-cache]]` — PKCE flow implementation details
