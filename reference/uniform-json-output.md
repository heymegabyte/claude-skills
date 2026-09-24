# Uniform JSON Output — reference examples

Sourced on demand by `rules/uniform-json-output.md`. The rule holds the contract + rules; this file holds the full worked examples so they cost 0 tokens until needed.

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

## Composed envelope shape

```json
{
  "meta": { ... },
  "gates": [ /* parent's own gate results */ ],
  "info": [
    {
      "name": "pricing",
      "status": "clean" | "drift",
      "payload": { "meta": {...}, "refs": [...], "summary": {...} }
    }
  ],
  "summary": { "pass": N, "fail": N, "skip": N, "info_drift": N, "exit": 0 }
}
```

## `jq` recipes for composed envelopes

```bash
# Did any sub-envelope drift?
... | jq '.summary.info_drift'

# Drill into one sub-envelope's payload
... | jq '.info[] | select(.name=="pack-frontmatter") | .payload.drift'

# Treat parent + sub-envelopes as a single flat array
... | jq '[.gates[], (.info[] | {name, status})]'
```

## `emit-json.sh` usage

```bash
SKILLS_ROOT="${SKILLS_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
# shellcheck source=lib/emit-json.sh
. "$SKILLS_ROOT/bin/lib/emit-json.sh"
META_BLOCK=$(emit_meta_block "$PWD" "$(emit_iso_ts)" "$(emit_git_sha)" "default")
printf '{%s,"entries":[…]}\n' "$META_BLOCK"
```
