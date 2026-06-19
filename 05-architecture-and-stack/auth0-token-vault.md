---
name: "auth0-token-vault"
priority: 2
pack: "architecture"
triggers:
  - "token vault"
  - "federated token"
  - "CIBA"
  - "agent on behalf of user"
  - "google calendar agent"
  - "user delegation"
  - "async authorization"
  - "human confirmation"
  - "agent acts as user"
  - "AuthorizationPendingInterrupt"
  - "OwnedAgent"
  - "AuthAgent"
paths:
  - "**/agents/**"
  - "**/wrangler.{toml,jsonc}"
  - "**/agent.ts"
  - "**/server.ts"
---

# Auth0 Token Vault + CIBA for Agents

Pattern for AI agents acting on behalf of users — reading their Google Calendar, posting to their Slack, booking their flights — without re-prompting for OAuth consent every time. Tokens are stored in KV per user sub and refreshed automatically. For high-risk actions (stock trades, payments), CIBA (Client-Initiated Backchannel Authentication) suspends the agent stream and waits for user confirmation via push/email before proceeding.

Source: `auth0-lab/cloudflare-agents-starter`. See `[[cf-agents-do-pattern]]`, `[[cloudflare-lock-in-is-leverage]]`.

## Architecture overview

```
Browser → Hono (auth0-hono OIDC) → agentsMiddleware → DO Chat agent
                                          ↓
                              AuthAgent: parses Bearer + x-refresh-token
                              OwnedAgent: extracts user sub from JWT
                              TokenVault: KV → federated access tokens
                              AsyncUserConfirmationResumer: CIBA alarm loop
```

## Key packages

```bash
npm i @auth0/auth0-hono              # OIDC middleware for Hono
npm i @auth0/auth0-cloudflare-agents-api  # AuthAgent + OwnedAgent DO mixins
npm i @auth0/ai-cloudflare           # CloudflareKVStore + AsyncUserConfirmationResumer
npm i @auth0/ai-vercel               # Auth0AI, withTokenVault, withAsyncAuthorization
npm i hono-agents                    # agentsMiddleware — Hono ↔ CF Agents bridge
```

## wrangler.jsonc bindings

```jsonc
{
  "kv_namespaces": [
    {
      "binding": "Session",
      "id": "<kv-namespace-id>"
    },
    {
      "binding": "ChatList",
      "id": "<kv-namespace-id>"
    }
  ],
  "durable_objects": {
    "bindings": [
      { "name": "Chat", "class_name": "Chat" }
    ]
  },
  "migrations": [
    { "tag": "v1", "new_sqlite_classes": ["Chat"] }
  ]
}
```

`Session` KV is dual-purpose: OIDC session cookies + Token Vault federated tokens per user sub.

## Hono server — OIDC + agent bridge

```ts
// src/server.ts
import { type OIDCVariables, auth, requiresAuth } from '@auth0/auth0-hono';
import { Hono } from 'hono';
import { agentsMiddleware } from 'hono-agents';

export type HonoEnv = {
  Bindings: Env;
  Variables: OIDCVariables;
};

const app = new Hono<HonoEnv>();

// OIDC middleware — handles login/callback/logout/session refresh automatically
app.use(
  auth({
    domain: process.env.AUTH0_DOMAIN!,
    clientID: process.env.AUTH0_CLIENT_ID!,
    clientSecret: process.env.AUTH0_CLIENT_SECRET!,
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    authorizationParams: {
      audience: process.env.AUTH0_AUDIENCE,
      scope: 'openid profile email',
    },
    session: { secret: process.env.AUTH0_SESSION_ENCRYPTION_KEY! },
    authRequired: false,
    idpLogout: true,
    // Forward extra OAuth params for federated connections (Google Calendar, etc.)
    forwardAuthorizationParams: ['scope', 'access_type', 'prompt', 'connection', 'connection_scope'],
  })
);

// Route agents — inject auth tokens into the WS/HTTP request before DO handles it
app.use('/agents/*', requiresAuth('error'), async (c, next) => {
  const session = await c.var.auth0Client?.getSession(c);
  const tokenSet = await c.var.auth0Client?.getAccessToken(c);

  // Forward tokens to the DO via headers — AuthAgent reads them
  const addToken = (req: Request) => {
    if (tokenSet?.accessToken) {
      req.headers.set('Authorization', `Bearer ${tokenSet.accessToken}`);
    }
    // x-refresh-token needed ONLY for Token Vault federated connections (e.g. Google Calendar)
    if (session?.refreshToken) {
      req.headers.set('x-refresh-token', session.refreshToken);
    }
    return req;
  };

  return agentsMiddleware({
    options: {
      prefix: 'agents',
      onBeforeRequest: addToken,
      onBeforeConnect: addToken,
    },
  })(c, next);
});

export { Chat } from './agent';
export default app;
```

## DO agent — mixin stack

```ts
// src/agent.ts
import { AIChatAgent } from 'agents/ai-chat';
import { AuthAgent, OwnedAgent } from '@auth0/auth0-cloudflare-agents-api';
import { AsyncUserConfirmationResumer } from '@auth0/ai-cloudflare';
import { extend } from 'agents';

// Build the mixin stack — order matters:
// 1. AIChatAgent: base WebSocket chat agent with message persistence
// 2. AuthAgent: parses Authorization + x-refresh-token headers, exposes getClaims()/getCredentials()
// 3. OwnedAgent: extracts owner (user sub) from JWT, exposes getOwner()
// 4. AsyncUserConfirmationResumer: CIBA polling loop via DO alarms
const SuperAgent = extend(AIChatAgent<Env>)
  .with(AuthAgent)
  .with(OwnedAgent)
  .with(AsyncUserConfirmationResumer)
  .build();

export class Chat extends SuperAgent {
  // Access verified identity in any method:
  async someMethod() {
    const claims = this.getClaims();     // { email, sub, aud, ... }
    const creds = this.getCredentials(); // { access_token, refresh_token, ... }
    const owner = this.getOwner();       // user sub string
  }
}
```

## Token Vault — federated OAuth tokens in KV

The Token Vault stores OAuth access tokens for third-party services (Google Calendar, Slack, GitHub) keyed by user sub. Tokens are refreshed automatically when expired.

```ts
// src/agent.ts
import { Auth0AI } from '@auth0/ai-vercel';
import { CloudflareKVStore, getAccessTokenFromTokenVault } from '@auth0/ai-cloudflare';

const auth0AI = new Auth0AI();

// Helper — returns the Token Vault store backed by KV
function getTokenStore(env: Env) {
  return new CloudflareKVStore({ kv: env.Session });
}

// Wrap a tool with Token Vault — auto-fetches + refreshes the federated access token
export const withGoogleCalendar = auth0AI.withTokenVault({
  // Where to get the refresh token for this user
  refreshToken: async () => {
    // getAgent() returns the current DO instance (set up by AgentContext)
    const agent = getAgent<Chat>();
    return agent.getCredentials()?.refresh_token;
  },
  // Which Auth0 federated connection to use
  connection: 'google-oauth2',
  // Scopes required for this tool
  scopes: ['https://www.googleapis.com/auth/calendar.freebusy'],
});

// Inside a tool definition — no token arg threading needed:
const checkCalendarAvailability = tool({
  description: 'Check if the user is free on a given date and time',
  inputSchema: z.object({
    date: z.string().describe('ISO 8601 date-time'),
  }),
  // Wrap tool execute with the Token Vault
  execute: withGoogleCalendar(async ({ date }) => {
    // Token is available in async-local-storage — no arg needed
    const accessToken = getAccessTokenFromTokenVault();

    const response = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timeMin: date,
        timeMax: new Date(Date.parse(date) + 3600_000).toISOString(),
        items: [{ id: 'primary' }],
      }),
    });

    const data = await response.json<any>();
    return { busy: data.calendars.primary.busy };
  }),
});
```

## CIBA — human confirmation for high-risk actions

CIBA suspends the agent stream when user approval is required (stock trades, payments, irreversible operations). The DO schedules an alarm to poll for approval; when the user approves via push/email, the alarm fires and the agent resumes.

```ts
// src/agent.ts
import { withAsyncAuthorization, AuthorizationPendingInterrupt } from '@auth0/ai-vercel';

// Wrap a tool with CIBA confirmation
const tradeTool = withAsyncAuthorization({
  // Who needs to approve
  userID: async () => getAgent<Chat>().getOwner(),
  // What permission is being requested
  scopes: ['stock:trade'],
  // Message shown to user in their phone push notification
  bindingMessage: 'Please confirm the stock trade in the app.',
  // What to do when authorization is pending (agent stream suspended)
  onAuthorizationInterrupt: async (interrupt, context) => {
    // Persist the interrupt + context to DO storage; schedule wakeup alarm
    await getAgent<Chat>().scheduleAsyncUserConfirmationCheck({ interrupt, context });
  },
})(
  tool({
    description: 'Execute a stock trade',
    inputSchema: z.object({
      ticker: z.string(),
      shares: z.number(),
      action: z.enum(['buy', 'sell']),
    }),
    execute: async ({ ticker, shares, action }) => {
      // Only reached after CIBA approval
      return executeTrade({ ticker, shares, action });
    },
  })
);
```

### CIBA flow sequence

```
1. Agent calls trade tool
2. withAsyncAuthorization checks if user has pre-authorized 'stock:trade'
3. No → throws AuthorizationPendingInterrupt
4. onAuthorizationInterrupt: DO stores interrupt + schedules alarm (30s poll)
5. Agent stream suspends — client sees "Waiting for your approval..."
6. Auth0 sends push notification to user's phone
7. User approves in Auth0 app
8. DO alarm fires → polls Auth0 CIBA endpoint → approval confirmed
9. Agent resumes from stored context → trade executes
10. Agent stream resumes — client sees trade result
```

### DO alarm loop (AsyncUserConfirmationResumer mixin handles this automatically)

```ts
// This is what AsyncUserConfirmationResumer does internally — shown for understanding:
async alarm() {
  const pending = await this.state.storage.get<PendingConfirmation[]>('pendingConfirmations');
  for (const item of pending ?? []) {
    const status = await auth0AI.checkAsyncAuthorizationStatus(item.interrupt);
    if (status === 'approved') {
      // Resume the agent with the stored context
      await this.resumeWithContext(item.context);
    } else if (status === 'denied') {
      await this.sendMessage('Authorization was denied. Operation cancelled.');
    } else {
      // Still pending — reschedule alarm
      await this.state.storage.setAlarm(Date.now() + 30_000);
    }
  }
}
```

## TokenVaultError → consent flow

When the user has never granted consent for a federated connection, `withTokenVault` throws `TokenVaultError`. Handle it in the frontend:

```tsx
// Client-side React — show consent popup when token is missing
import { TokenVaultConsent } from '@auth0/ai-react';

function ChatUI() {
  return (
    <div>
      <ChatMessages />
      {/* Renders a consent popup when agent throws TokenVaultError */}
      <TokenVaultConsent
        onConsent={() => window.location.href = '/auth/google-calendar'}
      />
    </div>
  );
}
```

## When to use this vs plain Clerk

| Scenario | Use |
|---|---|
| Agent reads/writes user's Google Calendar | **Auth0 Token Vault** |
| Agent posts to user's Slack workspace | **Auth0 Token Vault** |
| Agent executes a financial trade on behalf of user | **Auth0 Token Vault + CIBA** |
| Agent uses YOUR service's API (not user's 3rd-party) | **Clerk** — standard JWT |
| No agent delegation needed | **Clerk** — simpler, better DX |

## Gotchas

- **`Session` KV namespace is dual-purpose** — OIDC session cookies AND Token Vault federated tokens share one namespace, keyed differently. Don't delete or TTL-expire KV entries indiscriminately
- **`x-refresh-token` header only for Token Vault** — the header is only needed when tools use `withTokenVault`. Standard agent tools don't need it; the comment in the source code is clear on this
- **CIBA requires Auth0 Action** — the push notification / CIBA flow requires configuring an Auth0 Action in the tenant to send notifications. The agent SDK handles the polling; Auth0 handles delivery
- **`extend(...).with(...).build()` order matters** — `AuthAgent` must come before `OwnedAgent` because `OwnedAgent` depends on the parsed token that `AuthAgent` produces from the header
- **Local dev** — federated connections won't work in `wrangler dev --local` because Auth0's token endpoints require HTTPS. Use `wrangler dev --remote` for Token Vault testing

## Cross-links

- `[[cf-agents-do-pattern]]` — base Agent/DO patterns; this mixin stack extends them
- `[[cf-zero-trust-access]]` — alternative for protecting routes without delegated user tokens
- `[[cloudflare-lock-in-is-leverage]]` — KV as Token Vault keeps everything on CF edge
- `[[ai-agent-supervisor]]` — supervisor pattern for orchestrating agents that use Token Vault tools
