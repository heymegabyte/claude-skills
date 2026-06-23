# OAuth2 Provider Discipline — implementation reference

Sourced on demand by rules/oauth2-provider-discipline.md.

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

## Provider usage snippets

### Bitwarden — internal credentials and M2M

- Token endpoint: `https://identity.bitwarden.com/connect/token`
- Grant: `client_credentials`, scope `api`

```typescript
import { getBitwardenToken } from "@/utils";
const token = await getBitwardenToken({ clientId: env.BW_ID, clientSecret: env.BW_SECRET });
```

### Auth0 — B2B SaaS and SAML/OIDC federation

- Token endpoint: `https://<tenant>.us.auth0.com/oauth/token`
- Grant: `client_credentials` (M2M) or `authorization_code + PKCE` (user-facing)
- Pricing: 7k MAU free; M2M tokens limited to 1k/month on free plan

```typescript
import { getAuth0Token } from "@/utils";
const token = await getAuth0Token({ domain: env.AUTH0_DOMAIN, clientId: env.AUTH0_ID, clientSecret: env.AUTH0_SECRET, audience: env.AUTH0_AUDIENCE });
```

### Okta — enterprise IT and workforce

- Token endpoint: `https://<org>.okta.com/oauth2/default/v1/token`
- Grant: `client_credentials` (service app) or `authorization_code + PKCE` (workforce SSO)
- Free Developer org: up to 100 MAU (suitable for prototyping)

```typescript
import { getOktaToken } from "@/utils";
const token = await getOktaToken({ orgUrl: env.OKTA_ORG_URL, clientId: env.OKTA_ID, clientSecret: env.OKTA_SECRET, scope: "openid profile" });
```

### Cognito — AWS-tenant federation

- Token endpoint: `https://<pool>.auth.<region>.amazoncognito.com/oauth2/token`
- Grant: `client_credentials` (app client without secret rotation) or `authorization_code`
- Anti-pattern: avoid for non-AWS stacks — Cognito has AWS-specific JWT claims

```typescript
import { getCognitoToken } from "@/utils";
const token = await getCognitoToken({ tokenEndpoint: env.COGNITO_TOKEN_URL, clientId: env.COGNITO_ID, clientSecret: env.COGNITO_SECRET });
```
