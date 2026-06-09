---
name: "uniform-json-output"
priority: 3
pack: "core"
triggers:
  - "json output"
  - "machine-readable"
  - "ci dashboard"
paths:
  - "*"
---

# Uniform JSON Output

Every `--json`-emitting helper in `~/.agentskills/bin/` SHOULD produce the same envelope shape: `{meta, <payload>, <summary?>}`. This lets PostHog/Sentry/CI dashboards consume any helper's output via shared parser logic.

## The contract

### Required `meta` block (3-tuple minimum)

- **`repo`** — absolute path to the repository being audited/reported on
- **`generated_at`** — ISO 8601 UTC timestamp (`date -u +%Y-%m-%dT%H:%M:%SZ`)
- **`git_sha`** — short commit SHA (`git rev-parse --short HEAD`), or `"unknown"` if not in git

### Optional `meta` fields

- **`filter`** — input args / parameters that shaped this output (so the consumer knows the slice)
- **`skills_root`** — when the helper depends on agentskills, the absolute path so the consumer can resolve scripts
- **`project`** — when distinct from `repo` (e.g., audit run against a sibling project)

### Payload

- Helper-specific top-level field (e.g. `entries`, `checks`, `proposals`).
- Always an array of objects, even if single-item.

### Summary (optional)

- Tally / aggregate when the payload has discrete-status items.
- Shape: `{pass, fail, skip, exit}` for checks; `{total}` for entries.

## Canonical examples

### `bin/security-supply-chain.sh --json`
```json
{
  "meta": {
    "skills_root": "/Users/.../heymegabyte-claude-skills",
    "project": "/Users/.../my-project",
    "timestamp": "2026-06-09T07:03:29Z",
    "git_sha": "e663398"
  },
  "checks": [
    {"name": "sha-pin", "status": "pass", "details": "all action refs SHA-pinned"}
  ],
  "summary": {"pass": 3, "fail": 0, "skip": 2, "exit": 0}
}
```

### `bin/session-recap.sh --json`
```json
{
  "meta": {
    "repo": "/Users/.../heymegabyte-claude-skills",
    "generated_at": "2026-06-09T09:03:38Z",
    "git_sha": "5d3753c",
    "filter": "today"
  },
  "entries": [
    {"date": "2026-06-09", "pass_id": "pass-35", "summary": "...", "body_preview": [...]}
  ],
  "total": 17
}
```

## Rules

- **Human report → stderr**, JSON → stdout. Composable: `... --json | jq ...`.
- **Validate before declaring**: `... --json | python3 -m json.tool >/dev/null` should succeed. If it fails, the helper has a JSON-emission bug.
- **No bare strings in payload arrays** — always wrap in `{}` so future fields can be added without breaking consumers.
- **Use snake_case for keys** consistent with `bin/`'s shell convention.
- **JSON-escape** strings via `gsub(/\\/, "\\\\", s); gsub(/"/, "\\\"", s)` (awk) or `json.dumps` (python).

## Anti-patterns

- ❌ Stdout pollution from helper scripts (e.g., `tail -3` output mixed with JSON). Fix: `... 2>&1 | tail -3 >&2`.
- ❌ Mixing JSON and human output on stdout. Stderr is for the human; stdout is for the machine.
- ❌ Inconsistent meta keys across helpers (e.g., `created_at` vs `generated_at`). Pick one — `generated_at` per this rule.
- ❌ Missing `--json` flag on a helper that prints structured output anyway.

## Shared library (consume in new helpers)

`bin/lib/emit-json.sh` (since pass-38) is the sourceable lib every uniform-JSON helper imports. A new helper drops from ~12 lines of boilerplate to 3:

```bash
SKILLS_ROOT="${SKILLS_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
# shellcheck source=lib/emit-json.sh
. "$SKILLS_ROOT/bin/lib/emit-json.sh"
META_BLOCK=$(emit_meta_block "$PWD" "$(emit_iso_ts)" "$(emit_git_sha)" "default")
printf '{%s,"entries":[…]}\n' "$META_BLOCK"
```

Exposed helpers: `json_escape` · `emit_iso_ts` · `emit_git_sha [project-dir]` · `emit_meta_block <repo> <ts> <sha> [filter]` · `emit_kv_string <key> <value>` · `emit_kv_int <key> <value>`.

The lib was extracted once 3 helpers (security-supply-chain, session-recap, lint-auto-improve) had diverged on the same emission boilerplate. Per `rules/lint-doctrine.md` § Codified incidents: 3-caller threshold = extract; 2 = defer. Future uniform-JSON helpers source the lib by default — no inline `date -u +...` / `git rev-parse` / escape logic.

## See

- `bin/lib/emit-json.sh` — shared lib (pass-38)
- `bin/security-supply-chain.sh` — first uniform-JSON helper
- `bin/session-recap.sh` — second uniform-JSON helper
- `bin/lint-auto-improve.sh` — third uniform-JSON helper (triggered lib extraction)
- `rules/lint-doctrine.md` § Codified incidents — 3-caller divergence threshold that justified the lib
- `rules/contract-first-ai.md` — same boundary-discipline applied to AI outputs
- `rules/tool-design-as-api.md` — same API discipline for tool surfaces
