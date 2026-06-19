---
description: Run golden-test eval suites against one or all MCP servers in mcp-servers/; compares actual tool responses to expected via exact-match + regex + min-count tiers; supports mock-mode so CI runs without API keys
argument-hint: [<server-name>] [--ci] [--mock-only] [--live-only]
allowed-tools: Bash, Read
---

Run MCP server eval suites. Spawns each server via stdio, exercises tool calls, and scores responses against `mcp-servers/<name>-mcp/evals/*.json` golden tests. `--ci` exits nonzero on any failure. `--mock-only` skips tests without a `mock_response`; `--live-only` ignores `mock_response` and hits the real API.

**Purpose** — catch regressions in generated MCP servers before they hit production; enforce golden tests as the contract between forge output and real API behaviour; run safely in CI without API keys via mock-mode.

**When to use** — after `/forge-from-openapi` or `/migrate-to-hardened`; on CI push (always `--mock-only`); when an MCP returns unexpected errors; before publishing a new MCP version (use `--live-only` or default hybrid).

**Inputs**

- `<server-name>` — optional; run only this server (e.g. `resend`, `stripe`). Omit to scan all.
- `--ci` — machine-readable NDJSON to stdout; human summary to stderr; exit 1 on any failure.
- `--mock-only` — only run tests that have a `mock_response` field; skip live tests. Use in CI to avoid requiring API keys.
- `--live-only` — ignore `mock_response` on all tests; always call the live API. Use for manual pre-release verification.
- Default (neither flag): prefer mock when `mock_response` is present; call live API when not present (hybrid mode).

**Mock-mode overview** — See `rules/eval-mock-mode-discipline.md` for the full discipline. Short version: the harness sets `MCP_MOCK_RESPONSE_JSON=<base64>` in the MCP server's env before spawning it; the server's fetch wrapper checks this var and returns the canned response without touching the network. This requires the MCP server to implement the env-var hook (added automatically by `forge-from-openapi --harden`).

---

## Step 1 — Discover servers + parse flags

```bash
PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd 2>/dev/null)" \
  || PLUGIN_ROOT="${HOME}/.claude/plugins/heymegabyte-claude-skills"

SERVER_NAME=""
CI_MODE=0
MOCK_ONLY=0
LIVE_ONLY=0

for arg in "$@"; do
  case "$arg" in
    --ci)        CI_MODE=1 ;;
    --mock-only) MOCK_ONLY=1 ;;
    --live-only) LIVE_ONLY=1 ;;
    --*)         echo "Unknown flag: $arg" >&2; exit 2 ;;
    *)           SERVER_NAME="$arg" ;;
  esac
done

if [[ $MOCK_ONLY -eq 1 && $LIVE_ONLY -eq 1 ]]; then
  echo "✗ --mock-only and --live-only are mutually exclusive" >&2
  exit 2
fi

# Glob all MCP server dirs
mapfile -t MCP_DIRS < <(ls -d "${PLUGIN_ROOT}/mcp-servers/"*-mcp 2>/dev/null | sort)

if [[ ${#MCP_DIRS[@]} -eq 0 ]]; then
  echo "✗ No MCP server dirs found under ${PLUGIN_ROOT}/mcp-servers/" >&2
  exit 1
fi

# Filter to named server if provided
if [[ -n "$SERVER_NAME" ]]; then
  mapfile -t MCP_DIRS < <(printf '%s\n' "${MCP_DIRS[@]}" | grep "/${SERVER_NAME}-mcp$" || true)
  if [[ ${#MCP_DIRS[@]} -eq 0 ]]; then
    echo "✗ No server found matching '${SERVER_NAME}'" >&2
    exit 1
  fi
fi
```

---

## Step 2 — For each server: locate entry point and eval files

For each `MCP_DIR` in `MCP_DIRS`:

1. Derive `SERVER_ID` = basename of `MCP_DIR` (e.g. `resend-mcp`).
2. Locate entry point in priority order:
   - `${MCP_DIR}/mcp-server/dist/index.js` — prefer built artifact
   - `${MCP_DIR}/mcp-server/src/index.ts` — fallback; requires `tsx` or `ts-node`
   - Skip server with warning if neither exists.
3. Glob eval files: `${MCP_DIR}/evals/*.json`. If none exist, emit `SKIP (no evals)` and continue.

```bash
for MCP_DIR in "${MCP_DIRS[@]}"; do
  SERVER_ID=$(basename "$MCP_DIR")
  ENTRY=""
  if [[ -f "${MCP_DIR}/mcp-server/dist/index.js" ]]; then
    ENTRY="${MCP_DIR}/mcp-server/dist/index.js"
    RUNNER="node"
  elif [[ -f "${MCP_DIR}/mcp-server/src/index.ts" ]]; then
    ENTRY="${MCP_DIR}/mcp-server/src/index.ts"
    RUNNER="npx tsx"
  else
    echo "  SKIP ${SERVER_ID} — no dist/index.js or src/index.ts" >&2
    continue
  fi

  mapfile -t EVAL_FILES < <(ls "${MCP_DIR}/evals/"*.json 2>/dev/null | sort)
  if [[ ${#EVAL_FILES[@]} -eq 0 ]]; then
    echo "  SKIP ${SERVER_ID} — no evals/*.json" >&2
    continue
  fi
done
```

---

## Step 3 — Determine mock vs. live per test, then spawn + run

For each test object read from the eval JSON:

### 3a — Mock/live resolution

```
USE_MOCK = false

if LIVE_ONLY:
  USE_MOCK = false                          # always hit live API
elif test.mock_response is present:
  if MOCK_ONLY or default:
    USE_MOCK = true                         # prefer mock when available
elif MOCK_ONLY and test.mock_response is absent:
  SKIP test with note "no mock_response, --mock-only set"
  continue
# else: live-only (no mock_response) in default mode → USE_MOCK = false
```

Emit a per-test mode badge in human output:

- `[mock]` — running against mock_response
- `[live]` — calling the real API
- `[skip/no-mock]` — skipped because --mock-only but no mock_response

### 3b — Spawn the MCP server

When `USE_MOCK = true`, base64-encode the `mock_response` object and set it in the server env:

```bash
MOCK_JSON=$(python3 -c "import json,base64,sys; d=json.load(sys.stdin); print(base64.b64encode(json.dumps(d).encode()).decode())" <<< '{"status":200,"body":{...}}')
export MCP_MOCK_RESPONSE_JSON="$MOCK_JSON"
```

Then spawn the server as normal:

```bash
$RUNNER "$ENTRY" &
SERVER_PID=$!
sleep 2  # give server time to boot
```

When `USE_MOCK = false`, spawn without the env var (or explicitly unset it):

```bash
unset MCP_MOCK_RESPONSE_JSON
$RUNNER "$ENTRY" &
SERVER_PID=$!
sleep 2
```

**Option A (recommended, requires server cooperation):** The MCP server's fetch wrapper checks `process.env.MCP_MOCK_RESPONSE_JSON` at the start of every outgoing HTTP call. If present, it decodes and returns the canned response without touching the network. This is the cleanest intercept — no proxy, no patching. It does require that the MCP server was forged with `--harden` (which adds the hook automatically) or that it was hand-added per `rules/eval-mock-mode-discipline.md`.

**Option B (fallback, no server changes needed):** Wrap the server spawn in a custom script that monkey-patches Node's `https` module via `--require` before the server loads:

```bash
node --require /tmp/mcp-mock-intercept.mjs "$ENTRY" &
```

Where `mcp-mock-intercept.mjs` overrides `globalThis.fetch` to return the mock payload when `MCP_MOCK_RESPONSE_JSON` is set. Less clean — requires maintaining the intercept script — but works with servers that don't implement Option A.

**Trade-off summary:**

| | Mock mode | Live mode |
|---|---|---|
| Needs API key | No | Yes |
| Tests real network | No | Yes |
| Catches API contract drift | No | Yes |
| Safe in CI | Yes | Only with injected secrets |
| Requires server cooperation | Option A: yes; B: no | No |

### 3c — MCP handshake + tool calls

1. **Send `initialize` handshake** (JSON-RPC 2.0):

   ```json
   {"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"mcp-eval-harness","version":"1.0"}}}
   ```

   Expect: `{"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"...","capabilities":...}}`

2. **Send `tools/list`** (satisfies any `__meta_list_tools` test):

   ```json
   {"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}
   ```

   Capture the full tool list for scoring.

3. **For each non-meta test in the eval file**, send:

   ```json
   {"jsonrpc":"2.0","id":<n>,"method":"tools/call","params":{"name":"<test.tool>","arguments":<test.input>}}
   ```

   Capture response within 10s timeout.

   When running in mock mode, set `MCP_MOCK_RESPONSE_JSON` to the base64 of `test.mock_response` BEFORE this call (the server resets it per-request). When cycling through multiple tests in a single server session the harness MUST re-spawn the server per test (or send the mock payload via a side-channel RPC if the server supports it — simpler to re-spawn).

4. **Shut down** the server process (SIGTERM → 2s → SIGKILL).

---

## Step 4 — Score each test

Load each `*.json` eval file. Iterate `tests[]`. For each test, apply scoring based on `scoring` field:

**`__meta_list_tools`** (tool field starts with `__meta_`):

- Assert `result.tools.length >= expected_tool_count_min` if set.
- Assert every name in `expected_tool_names_include[]` appears in the tool list.
- Missing count threshold OR missing tool name → FAIL with diff.

**`exact-match-keys+id-pattern-regex`**:

- Parse response `content[0].text` as JSON.
- For each key in `expected` that does NOT end in `_pattern`:
  - Compare `actual[key] === expected[key]`. Mismatch → FAIL.
- For each key ending in `_pattern`:
  - Field name = strip `_pattern` suffix. Test `new RegExp(expected[key]).test(actual[field])`.

**`exact-match`**:

- Parse response as JSON. Deep-equal `actual` vs `expected`.

**`error-shape`**:

- Assert `result.isError === true`.
- Assert `actual.code === expected.code` if set.
- Assert `actual.message` contains `expected.message_contains` if set.

**`schema-valid`**:

- Parse `actual` against `expected_schema` (inline JSON Schema). All required keys present → PASS.

**Semantic similarity** (future tier — not yet implemented):

- If `scoring` starts with `llm-judge:`, emit `SKIP (llm-judge not implemented)` and count as neutral.

---

## Step 5 — Emit per-server PASS/FAIL table

```
MCP Eval Run — 2026-06-18T16:00:00Z
Mode: mock-preferred (default) | --mock-only | --live-only
═══════════════════════════════════════════════════════════

resend-mcp                  PASS  (5/5 tests)
  ✓  send-email-happy-path       [mock]  exact-match-keys+id-pattern-regex
  ✓  list-tools-presence         [live]  __meta_list_tools
  ✓  get-email-valid-id          [mock]  schema-valid
  ✓  send-email-missing-from     [mock]  error-shape
  ✓  list-audiences-exact-shape  [mock]  exact-match-keys

stripe-mcp                  FAIL  (3/4 tests)
  ✓  list-tools-presence         [live]  __meta_list_tools
  ✓  create-payment-intent       [mock]  exact-match-keys+id-pattern-regex
  ✗  refund-invalid-id           [live]  error-shape
     expected: { isError: true, code: "invalid_request" }
     actual:   { isError: false, content: [{ type: "text", text: "{}" }] }
  ✓  list-customers-schema       [mock]  schema-valid

───────────────────────────────────────────────────────────
SUMMARY  2 servers · 9 tests · 8 passed · 1 failed · 0 skipped
STATUS   FAIL
```

For each failure, emit a diff block:

```
FAIL  <test.id>  [mock|live]
  tool:     <test.tool>
  scoring:  <test.scoring>
  expected: <JSON>
  actual:   <JSON or raw text>
  diff:     <key-by-key mismatch or regex failure detail>
```

---

## Step 6 — CI mode NDJSON + exit code

If `--ci` is set, emit one NDJSON line per test result to stdout (include `mode` field):

```json
{"ts":"2026-06-18T16:00:01Z","server":"resend-mcp","test_id":"send-email-happy-path","pass":true,"mode":"mock","scoring":"exact-match-keys+id-pattern-regex","duration_ms":12}
{"ts":"2026-06-18T16:00:01Z","server":"stripe-mcp","test_id":"refund-invalid-id","pass":false,"mode":"live","scoring":"error-shape","expected":{"isError":true,"code":"invalid_request"},"actual":{"isError":false}}
{"ts":"2026-06-18T16:00:01Z","server":"resend-mcp","test_id":"get-email-by-id-schema-valid","pass":null,"mode":"skip","reason":"--mock-only but no mock_response"}
```

Final summary line:

```json
{"ts":"2026-06-18T16:00:02Z","event":"summary","servers":2,"tests":9,"passed":8,"failed":1,"skipped":0,"mock_count":6,"live_count":3,"exit":1}
```

Exit code:

- `0` — all tests passed (or all skipped).
- `1` — any test failed or any server errored during spawn/IO.
- `2` — harness internal error (bad eval file JSON, missing entry point for a named server, conflicting flags).

---

## Step 7 — Verification

After the run, spot-check one passing server manually:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' \
  | node "${MCP_DIR}/mcp-server/dist/index.js" 2>/dev/null \
  | head -c 300
```

Confirm tool count matches `expected_tool_count_min`.

**See**

- `template/evals/mcp-evals/example.json` — golden test format with mock_response examples
- `rules/eval-mock-mode-discipline.md` — when to use mock vs live, CI policy, forge requirements
- `bin/validate-mcp-tools.mjs` — static pre-eval validator
- `commands/forge-from-openapi.md` — how MCP servers are generated
- `commands/deploy-forged-mcp.md` — deploy + smoke-test pipeline
- `07-quality-and-verification/llm-evals.md` — scoring tiers doctrine
