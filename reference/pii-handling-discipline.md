# PII Handling Discipline — implementation reference

Sourced on demand by rules/pii-handling-discipline.md.

## D1 Schema Definitions

Column naming spec — use exactly these names in audit/event tables:

```sql
-- CORRECT
email_sha256  TEXT NOT NULL   -- SHA-256 hex of lowercase email
ip_sha256     TEXT            -- SHA-256 hex of remote IP; nullable when not captured

-- WRONG — never use these column names in audit/event tables
email         TEXT            -- plaintext PII in a log table
user_email    TEXT            -- same problem
customer_email TEXT           -- same problem
```

### login\_attempts table

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

### payment\_events table

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

### security\_events table

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

## Hashing Utility — `src/worker/lib/pii.ts`

Place this module at `src/worker/lib/pii.ts`. Import it at every audit insert site — never inline hash logic.

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

## Usage Example — login attempt handler

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

## Audit Log Retention Cron

Retain hashed audit rows for **3 years** per GDPR Art. 5(2) and EU privacy claim statute of limitations. Wire as a CF Cron Trigger running monthly.

```sql
-- Cron: delete audit rows older than 3 years (safe — hashed only)
DELETE FROM login_attempts    WHERE attempted_at < datetime('now', '-3 years');
DELETE FROM security_events   WHERE created_at   < datetime('now', '-3 years');
DELETE FROM payment_events    WHERE created_at   < datetime('now', '-3 years');
DELETE FROM deletion_audit    WHERE requested_at < datetime('now', '-3 years');
```
