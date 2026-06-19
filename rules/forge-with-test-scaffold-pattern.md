---
name: "forge-with-test-scaffold-pattern"
priority: 2
pack: "testing"
triggers:
  - "forge"
  - "forge-*"
  - "scaffold"
  - "generate skill"
  - "emit test"
  - "test scaffold"
  - "forge command"
paths:
  - "commands/forge-*.md"
  - "e2e/**/*.spec.ts"
  - "tests/**/*.test.ts"
---

# Forge-with-Test-Scaffold Pattern

Every `forge-*` command MUST emit a paired test file alongside every generated source
file. The test goes RED first per `[[verification-loop]]`. A forge that ships source
code alone is incomplete — the user is left to remember tests later. They don't.

## The core rule

When any `/forge-*` command scaffolds new source code, it MUST also write:

- **E2E spec** (`e2e/<feature>/<name>.spec.ts`) when the output is a Hono route, OAuth
  callback, webhook handler, or any HTTP-reachable surface. Uses real Playwright against
  a local or PROD URL per `[[e2e-tdd-organization]]`.
- **Unit test** (`tests/<feature>/<name>.test.ts` or `<path>.test.ts` co-located) when
  the output is a typed client, utility module, schema transformer, or pure function.
  Uses Vitest 3 + `vi.fn()` — no network calls.
- **Both** when the output has a pure-function core consumed by an HTTP surface (e.g.
  an OpenAPI client used by a route — emit unit tests for the client AND a Playwright
  E2E for the route that calls it).

The test file is written in the SAME forge turn, immediately after the source files. It
is NOT deferred, NOT listed as a Rec, NOT left as a `TODO`. If the forge command's
execution section has Steps 1–N, the test step is Step N+1 (always last, never
optional).

## Mandatory test content

Every emitted test MUST contain at minimum:

1. **At least one failing assertion** — the test must be runnable and RED before the
   implementation is wired. A test that only `console.log` and passes vacuously is not
   a test.
2. **A clear `describe` label** matching the forged feature name and the forge command
   that created it. Example: `describe('/forge-graphql-skill: shopify queries', () => {`.
3. **The happy path** — the simplest successful invocation (correct input → correct
   output / HTTP 200 / expected JSON shape).
4. **At least one failure path** — invalid input, bad auth, malformed payload, or
   network error. The system must handle it gracefully.
5. **Cleanup** — `afterEach` / `afterAll` drops any test fixtures, DB rows, or temp
   files written during the run.

## Examples per forge command

### `/forge-from-openapi` → client unit tests

Emits `tests/<skill-name>/client.test.ts`:

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

### `/forge-webhook-handler` → signature-verification unit tests

Emits `tests/webhooks/<vendor>.test.ts`:

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

### `/forge-oauth-callback` → Playwright E2E happy path

Emits `e2e/oauth/<provider>.spec.ts`:

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

### `/forge-graphql-skill` → typed query unit tests + E2E

Emits `tests/<skill-name>/queries.test.ts` (typed client) AND `e2e/graphql/<name>.spec.ts`
(HTTP surface). See `commands/forge-graphql-skill.md` for full scaffolds.

## Anti-patterns

- **Source-only forge** — a forge command that only emits `.ts` source files with no
  paired test. The engineer is left to write tests later. History shows: they don't.
  Any forge command shipped without test emission is a build-fail per `[[06-build-and-slice-loop]]`.
- **Passing vacuous tests** — a test that imports the module, calls nothing, and
  `expect(true).toBe(true)` is not a test scaffold; it is noise that hides the missing
  assertion. The RED→GREEN flow requires an assertion that can actually fail.
- **Deferring to Recs** — listing "add tests" in a Recommendations section instead of
  emitting them inline. Per `[[auto-integrate-recs]]`, <2h work ships inline. A test
  scaffold takes 5–15 minutes. It always ships inline.
- **Integration-only tests without unit coverage** — forging a complex client library
  with only an E2E that calls a live API. Network flakiness makes this unreliable. Always
  pair: unit tests mock the network, E2E confirms the real endpoint.

## New forge commands — checklist before shipping

A new `commands/forge-*.md` is NOT shippable until it satisfies:

- [ ] Execution section has a dedicated "Write test scaffold" step (numbered, mandatory)
- [ ] Step specifies: file path, test framework (Vitest vs Playwright), happy path +
      failure path coverage
- [ ] Generated test has `describe` label naming both the forge command and the feature
- [ ] Generated test is runnable RED without the implementation wired
- [ ] This rule file is cross-linked in the forge command's frontmatter or body
- [ ] `e2e/FEATURES.md` entry added for any Playwright spec emitted (per `[[e2e-tdd-organization]]`)

## Cross-links

- `[[verification-loop]]` — RED before GREEN is mandatory; forge tests are the RED step
- `[[e2e-tdd-organization]]` — directory layout, hermetic specs, 6-viewport × 3-browser matrix
- `[[06-build-and-slice-loop]]` — build slice = source + test; never source-only slice
- `[[auto-integrate-recs]]` — test scaffolds are never Recs; they always ship inline
- `[[conditional-ci-gates]]` — CI test run gates on spec presence (hashFiles pattern)
