---
description: Catch mock/live divergence in MCP eval golden tests (anti-pattern #2 from eval-mock-mode-discipline)
argument-hint: [--server=<name>]
---

<!-- <SUBAGENT-STOP>: skip this skill when running inside a subagent. Meta-skills must not leak into spawned subagent contexts. -->
<SUBAGENT-STOP/>

Audit MCP server eval golden tests for mock/live divergence: cases where `mock_response.body` claims a shape that the live API no longer returns. A stale mock silently teaches Claude wrong expectations. [[eval-mock-mode-discipline]] [[drift-detection]] [[run-mcp-evals]]

**When to use** — Monday morning (cron candidate); after an upstream API changelog; after an MCP server version bump; whenever a live eval returns unexpected shape. Weekly cron: `CronCreate "0 8 * * 1"`.

**Inputs**

- `--server=<name>` — audit only the named server directory under `~/.claude/mcp-servers/`

---

## Step 1 — Discover eval files

Glob:

```
~/.claude/mcp-servers/*/evals/*.json
```

Apply `--server=<name>` filter if provided (match the directory one level below `mcp-servers/`).

If no eval files found, emit:

```
No eval golden test files found under ~/.claude/mcp-servers/*/evals/
Nothing to audit.
```

Exit 0.

---

## Step 2 — Identify mock-bearing tests

For each `.json` eval file, parse as JSON. Collect every test case (top-level array or `tests[]` field) that contains a `mock_response` field with a non-null `body` subfield:

```json
{
  "id": "test_id",
  "tool": "tool_name",
  "input": { ... },
  "mock_response": {
    "status": 200,
    "body": { ... }
  },
  "expected_output": { ... }
}
```

If a test has no `mock_response` or `mock_response.body` is null/absent, skip it (live-only tests have no mock to drift from).

Collect:

```
{
  server: string       // directory name
  eval_file: string    // absolute path
  test_id: string      // id field or array index
  tool: string         // tool name under test
  mock_body: object    // the claimed response shape
  needs_api_key: boolean  // true when server has an env-var key requirement
}
```

---

## Step 3 — Detect API key availability per server

For each server, check whether an API key is available in the environment. Read the server's source entry-point (same glob from `/audit-mcp-error-semantics`) for patterns:

```
process.env.RESEND_API_KEY
process.env.STRIPE_SECRET_KEY
process.env.<SERVER>_API_KEY
process.env.<SERVER>_TOKEN
```

Then check `process.env` for the detected key name. If the key is absent or empty:

- Mark all tests for this server as `needs-secret`.
- Print a per-server note:

  ```
  Server: resend-mcp — API key RESEND_API_KEY not set. Skipping live comparison.
  Set the key via: get-secret RESEND_API_KEY
  ```

- Do not attempt live calls for this server.

---

## Step 4 — Live comparison (servers with keys present)

For each mock-bearing test where the API key IS available, execute the same tool call against the live API:

1. Identify the HTTP call the tool makes by reading the handler source (same grep approach as `/audit-mcp-error-semantics` Step 2).
2. Replay the same request using `fetch()` with the live credentials from env.
3. Collect the live response body as a JSON object.

If the live call returns a non-2xx status, record:

```
{
  test_id: ...,
  live_status: 404 | 429 | 500 | ...,
  skip_reason: "live call failed"
}
```

Do not count a live-call failure as drift — it may be an auth scope issue. Surface separately in the `live-call-errors` section of the report.

---

## Step 5 — Shape comparison (key-set + value-type diffing)

Compare `mock_body` shape vs `live_body` shape. Compare ONLY:

- **Key set** — keys present in mock but absent in live; keys present in live but absent in mock
- **Value types** — `typeof` (string/number/boolean/object/array/null) at each shared key (non-recursive for nested objects — flag nested objects as `nested: check manually`)

Do NOT compare exact values — live values legitimately differ (IDs, timestamps, counts).

For each test, compute a `drift_severity`:

| Severity | Condition |
|----------|-----------|
| `low`    | Live has extra keys mock doesn't claim (additive — mock is just incomplete) |
| `medium` | Mock claims keys absent in live (mock is stale — Claude will expect a field that won't exist) |
| `high`   | Type mismatch on a shared key (e.g. mock says `"count": 0` but live returns `"count": "0"`) |
| `none`   | Mock shape is a valid subset of live shape with matching types |

Collect per-test drift records:

```
{
  server: string
  eval_file: string
  test_id: string
  tool: string
  severity: 'none' | 'low' | 'medium' | 'high'
  extra_in_live: string[]    // keys live has that mock doesn't
  missing_in_live: string[]  // keys mock claims that live doesn't have
  type_mismatches: Array<{ key: string, mock_type: string, live_type: string }>
}
```

---

## Step 6 — Output per-server drift report

Print a grouped report:

```
Server: resend-mcp
File: ~/.claude/mcp-servers/resend-mcp/evals/send-email.json
────────────────────────────────────────────────────────────────────────
 Test                  Tool              Severity  Issue
 test_send_basic       resend_send_email HIGH      mock.data.id: string, live.data.id: number
 test_send_cc          resend_send_email MEDIUM    mock claims "message_id" — absent in live
 test_send_bcc         resend_send_email LOW       live has extra field "object" not in mock
────────────────────────────────────────────────────────────────────────

Server: stripe-mcp
  RESEND_API_KEY not set — skipped (0 tests run)

SUMMARY
  Servers audited  : 6
  Servers skipped  : 2  (missing API keys)
  Tests checked    : 14
  Tests clean      : 11
  HIGH drift       : 1
  MEDIUM drift     : 1
  LOW drift        : 1
  Live-call errors : 0
```

If all checked tests are clean (severity `none` or only `low`), print:

```
All mock response shapes are valid subsets of live API responses.
No medium/high drift detected.
```

---

## Step 7 — Cron registration reminder

After the report, always print:

```
─── Weekly cron candidate ───────────────────────────────────────────
Run this audit every Monday at 08:00 to catch upstream API drift early:

  CronCreate "0 8 * * 1" "/audit-mcp-mock-drift"

Wire in .claude/settings.json or as a scheduled CF Worker if live API
calls need a server context.
─────────────────────────────────────────────────────────────────────
```

---

## Notes for the executor

- Shape comparison is structural, not semantic — do not infer meaning from key names.
- Nested objects are flagged as `nested: check manually`; recursion is intentionally one level to keep output scannable.
- The `--fix` rewrite path (updating `mock_response.body` to match live shape) is deferred: present the diff and print `Run /audit-mcp-mock-drift --fix to rewrite stale mocks` at the end. The `--fix` flag is reserved for a future version once the comparison logic is validated against several servers.
- When the eval file uses a top-level array (no `tests[]` wrapper), treat each element as a test case; derive `test_id` from the `id` field or fall back to `test_<index>`.
- Live-call errors (non-2xx) are surfaced separately and never counted as drift — they need human triage (scope, expired key, rate limit).
