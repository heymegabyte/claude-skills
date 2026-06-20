---
name: "pii-handling-discipline"
priority: 2
pack: "backend"
triggers:
  - "pii"
  - "personally identifiable"
  - "audit log"
  - "email hash"
  - "sha-256"
  - "gdpr"
  - "login attempt"
  - "security event"
  - "deletion_audit"
  - "payment_events"
paths:
  - "drizzle/**"
  - "src/worker/**"
  - "workers/**"
  - "scripts/migrate*"
  - "**/schema.ts"
---

# PII Handling Discipline

PII is **never** stored plaintext in audit logs, event logs, or security event tables. Every audit row references PII via SHA-256 hash — never by raw value.

## Core Principles

- **Audit rows are not subject-of-record** — `deletion_audit`, `login_attempts`, `security_events` are legal evidence; the user has rights over their profile row, not the audit row.
- **Hash-then-store** — hash PII before inserting any audit or event row.
- **Irreversibility is the feature** — SHA-256 of lowercase email + per-record salt cannot be reversed without both the salt and original value.
- **Plaintext belongs only in active subject-of-record rows** (`users`, `sessions`) — those are deleted on RTBF request. Audit logs survive deletion.

## Surfaces Requiring Hashed PII

| Table / surface | PII to hash |
|---|---|
| `login_attempts` | email → `email_sha256` |
| `api_key_creation_events` | creator email → `email_sha256` |
| `payment_events` | customer email → `email_sha256`; card last4 OK plaintext |
| `deletion_audit` | requester email → `email_sha256` |
| `security_events` | email, IP address → `email_sha256`, `ip_sha256` |
| `webhook_delivery_log` | destination email (if present) → `email_sha256` |
| `admin_action_log` | acting admin email → `email_sha256` |
| `failed_auth_log` | attempted email → `email_sha256` |

IP addresses are PII under GDPR — hash them too.

## D1 Schema Patterns

### Column naming

```sql
-- CORRECT
email_sha256  TEXT NOT NULL   -- SHA-256 hex of lowercase email
ip_sha256     TEXT            -- SHA-256 hex of remote IP; nullable when not captured

-- WRONG — never use these column names in audit/event tables
email         TEXT            -- plaintext PII in a log table
user_email    TEXT            -- same problem
customer_email TEXT           -- same problem
```

### login_attempts

```sql
CREATE TABLE IF NOT EXISTS login_attempts (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email_sha256  TEXT NOT NULL,          -- SHA-256(lowercase(email)) — NOT the email
  ip_sha256     TEXT,                   -- SHA-256(remote IP) — NOT the IP
  outcome       TEXT NOT NULL,          -- 'success' | 'wrong_password' | 'not_found' | 'rate_limited'
  user_agent    TEXT,                   -- browser UA string is not PII per GDPR
  attempted_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
-- DO NOT add an `email` column. The hash is the only link to the identity.
```

### payment_events

```sql
CREATE TABLE IF NOT EXISTS payment_events (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email_sha256    TEXT NOT NULL,        -- hashed; not the billing email
  provider        TEXT NOT NULL,        -- 'stripe' | 'square'
  event_type      TEXT NOT NULL,        -- 'charge.succeeded' | 'refund.created' etc.
  amount_cents    INTEGER,
  currency        TEXT,
  card_last4      TEXT,                 -- last 4 digits are NOT PII (PCI-DSS allows)
  provider_event_id TEXT,               -- idempotency / dispute lookup
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### security_events

```sql
CREATE TABLE IF NOT EXISTS security_events (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  event_type    TEXT NOT NULL,          -- 'api_key_created' | 'mfa_disabled' | 'password_reset' etc.
  email_sha256  TEXT NOT NULL,
  ip_sha256     TEXT,
  metadata      TEXT,                   -- JSON blob; MUST NOT contain PII — scrub before insert
  severity      TEXT NOT NULL DEFAULT 'info', -- 'info' | 'warn' | 'critical'
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
```

## Hashing Implementation

Use the shared utility below — never inline hash logic at call sites.

```typescript
// src/worker/lib/pii.ts

/**
 * Hash an email for audit log storage.
 * Input is lowercased before hashing — 'User@Example.com' and 'user@example.com'
 * produce the same hash, preventing duplicate audit rows for the same identity.
 *
 * Uses Web Crypto API (available in CF Workers) — no Node.js import needed.
 */
export async function hashEmail(email: string): Promise<string> {
  const normalized = email.toLowerCase().trim()
  const encoded = new TextEncoder().encode(normalized)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Hash an IP address for audit log storage.
 * IPv4 and IPv6 are hashed as-is (after trimming).
 */
export async function hashIp(ip: string): Promise<string> {
  const encoded = new TextEncoder().encode(ip.trim())
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Scrub a metadata object of known PII fields before JSON-stringifying
 * for storage in `metadata` columns.
 */
const PII_KEYS = new Set(['email', 'user_email', 'customer_email', 'phone', 'address',
  'ip', 'ip_address', 'remote_ip', 'name', 'full_name', 'ssn', 'dob'])

export function scrubPii(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => !PII_KEYS.has(k.toLowerCase()))
  )
}
```

### Usage in a login attempt handler

```typescript
// src/worker/routes/auth/login.ts
import { hashEmail, hashIp } from '../../lib/pii'

app.post('/auth/login', async (c) => {
  const { email, password } = await c.req.json()
  const remoteIp = c.req.header('CF-Connecting-IP') ?? ''

  // ... auth logic ...

  const outcome = verified ? 'success' : 'wrong_password'

  // Audit log — hashed, never plaintext
  await c.env.DB.prepare(
    `INSERT INTO login_attempts (email_sha256, ip_sha256, outcome, user_agent)
     VALUES (?, ?, ?, ?)`
  ).bind(
    await hashEmail(email),
    remoteIp ? await hashIp(remoteIp) : null,
    outcome,
    c.req.header('User-Agent') ?? null,
  ).run()

  if (!verified) return c.json({ error: 'Invalid credentials' }, 401)
  // ... issue session ...
})
```

## Where Plaintext Is Allowed

Plaintext PII belongs only in **active subject-of-record rows** deleted in full on right-to-deletion.

| Table | PII column | Reason |
|---|---|---|
| `users` | `email TEXT NOT NULL` | Subject of record; deleted on RTBF |
| `sessions` | — (joins to users) | Session token, not PII; user row is the identity |
| `billing` | `stripe_customer_id` only | Opaque ID; actual PII stored at Stripe |
| `oauth_accounts` | `provider_user_id` | Opaque ID; not PII |
| Resend / PostHog API calls | email in transit | Never persisted in D1 |

Never store plaintext email in any table that survives a deletion cascade — `deletion_audit` is updated last, not deleted, because it uses a hash.

## Right-to-Deletion Compatibility

- GDPR Art. 17 requires deletion of personal data.
- A SHA-256 hash is not personal data under GDPR — it cannot be reverse-engineered once the `users` row is deleted.
- Audit rows **may persist** after deletion, satisfying Art. 5(2) accountability while complying with Art. 17.
- No special deletion step needed for audit tables.

## Audit Log Retention

Retain hashed audit rows for **3 years** per GDPR Art. 5(2) and EU privacy claim statute of limitations.

```sql
-- Cron: delete audit rows older than 3 years (safe — hashed only)
DELETE FROM login_attempts    WHERE attempted_at < datetime('now', '-3 years');
DELETE FROM security_events   WHERE created_at   < datetime('now', '-3 years');
DELETE FROM payment_events    WHERE created_at   < datetime('now', '-3 years');
DELETE FROM deletion_audit    WHERE requested_at < datetime('now', '-3 years');
```

Wire as a CF Cron Trigger running monthly.

## Drift Detection

- `grep -rn 'email.*TEXT' drizzle/` — audit/event tables must use `email_sha256`, not `email`; active tables (`users`) expect `email TEXT`.
- `grep -rn "\.bind(email," src/worker/` in INSERT/UPDATE context on audit tables — likely inserting plaintext; replace with `await hashEmail(email)`.
- New event/audit tables added without `email_sha256` pattern = drift; fix in-turn per `drift-detection`.

## Anti-Patterns

- `email TEXT NOT NULL` in an audit or event table.
- Hashing without lowercasing first — `User@Example.com` and `user@example.com` produce different hashes, creating duplicate audit identities.
- `btoa(email)` or base64 encoding — encoding, not hashing; trivially reversible.
- Storing IP address as plaintext in any table.
- JSON `metadata` column containing raw email fields — scrub before inserting.

## Cross-links

- `[[right-to-deletion]]` — deletion cascade; audit tables survive because they use hashes
- `[[email-deliverability-implementation]]` — email in transit (Resend API calls); never persisted
- `[[secret-provisioning]]` — `POSTHOG_PERSONAL_API_KEY`, `RESEND_API_KEY` env setup
- `[[data-residency-by-default]]` — D1 read-replica placement for EU compliance
- `[[zod-everywhere]]` — validate audit insert payloads at the boundary; schema enforces no `email` field
