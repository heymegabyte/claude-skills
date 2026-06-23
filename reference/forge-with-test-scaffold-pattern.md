# Forge-with-Test-Scaffold Pattern — implementation reference

Sourced on demand by rules/forge-with-test-scaffold-pattern.md.

---

## `/forge-from-openapi` → client unit tests

Emit `tests/<skill-name>/client.test.ts` alongside the generated typed client.

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ResendClient } from '../../.agentskills/resend-api/client'

describe('/forge-from-openapi: resend client', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('sends email — happy path returns message id', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 'msg_123' }), { status: 200 })
    )
    const client = new ResendClient({ apiKey: 'test_key' })
    const result = await client.sendEmail({ from: 'a@b.com', to: 'c@d.com', subject: 'Hi', html: '<p>Hi</p>' })
    expect(result.id).toBe('msg_123')
  })

  it('throws on 401 — invalid API key', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 })
    )
    const client = new ResendClient({ apiKey: 'bad_key' })
    await expect(client.sendEmail({ from: 'a@b.com', to: 'c@d.com', subject: 'Hi', html: '' })).rejects.toThrow('401')
  })
})
```

---

## `/forge-webhook-handler` → signature-verification unit tests

Emit `tests/webhooks/<vendor>.test.ts`. The three cases below are the minimum
required set: valid sig, tampered payload, stale replay timestamp.

```typescript
import { describe, it, expect } from 'vitest'
import { verifyStripeSignature } from '../../src/worker/routes/webhooks/stripe'

describe('/forge-webhook-handler: stripe signature verification', () => {
  const WEBHOOK_SECRET = 'whsec_test_secret'

  it('accepts valid signature within replay window', async () => {
    // sign a payload, verify passes
    const result = await verifyStripeSignature(validPayload, validSig, WEBHOOK_SECRET)
    expect(result.valid).toBe(true)
  })

  it('rejects invalid HMAC — tampered payload', async () => {
    const result = await verifyStripeSignature('tampered', validSig, WEBHOOK_SECRET)
    expect(result.valid).toBe(false)
    expect(result.reason).toMatch(/signature mismatch/)
  })

  it('rejects replayed event outside 5-minute window', async () => {
    const staleTimestamp = Math.floor(Date.now() / 1000) - 400
    const result = await verifyStripeSignature(validPayload, sigWithTimestamp(staleTimestamp), WEBHOOK_SECRET)
    expect(result.valid).toBe(false)
    expect(result.reason).toMatch(/replay window/)
  })
})
```

---

## `/forge-oauth-callback` → Playwright E2E happy path

Emit `e2e/oauth/<provider>.spec.ts`. Tests run against `PROD_URL` with a real
Chromium session; mock accounts only, never real user credentials.

```typescript
import { test, expect } from '@playwright/test'

test.describe('/forge-oauth-callback: auth0 happy path', () => {
  test('exchanges code for token and redirects to /dashboard', async ({ page }) => {
    await page.goto(process.env.PROD_URL + '/oauth/start/auth0')
    // Simulate callback with mock code (test account only)
    await page.goto(process.env.PROD_URL + '/oauth/callback/auth0?code=test_code&state=test_state')
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.locator('h1')).toBeVisible()
  })

  test('handles invalid state param — shows error, no token stored', async ({ page }) => {
    await page.goto(process.env.PROD_URL + '/oauth/callback/auth0?code=test&state=INVALID')
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
  })
})
```

---

## `/forge-graphql-skill` → typed query unit tests + E2E

Emit `tests/<skill-name>/queries.test.ts` (typed client unit tests) AND
`e2e/graphql/<name>.spec.ts` (HTTP surface Playwright spec).

See `commands/forge-graphql-skill.md` for the full scaffold templates for both files.
