---
name: "register-forged-mcps"
description: "Scan ~/.claude/plugins/heymegabyte-claude-skills/mcp-servers/*/ and emit .claude.json registration JSON for each forged MCP server. Default is dry-run; use --apply to write to ~/.claude.json."
triggers:
  - "register forged mcps"
  - "register mcp servers"
  - "mcp registration"
  - "claude.json mcpServers"
  - "/register-forged-mcps"
---

# /register-forged-mcps

Scans `~/.claude/plugins/heymegabyte-claude-skills/mcp-servers/*/mcp-server/` and emits
ready-to-paste `.claude.json` `mcpServers` registration blocks, with per-server build
status. Default: **DRY-RUN** (print diff, write nothing). Pass `--apply` to merge into
`~/.claude.json` non-destructively.

---

## Step 1 — Discover servers

```bash
PLUGIN_DIR="$HOME/.claude/plugins/heymegabyte-claude-skills/mcp-servers"
find "$PLUGIN_DIR" -mindepth 2 -maxdepth 2 -type d -name "mcp-server"
```

Each result path has shape: `$PLUGIN_DIR/<server-slug>/mcp-server/`

Extract `<server-slug>` from the path: `basename $(dirname <path>)`

---

## Step 2 — Determine transport per server

For each `<server-slug>/mcp-server/` directory:

**HTTP transport** (Cloudflare Workers deployment):

- `wrangler.toml` present at `<dir>/wrangler.toml`
- Server runs on the edge; requires `wrangler deploy` before registration
- Registration block uses `url` key

**stdio transport** (local Node process):

- No `wrangler.toml`
- Server runs as a local process; requires `npm run build` (or `tsc`) to produce `dist/index.js`
- Registration block uses `command` + `args` keys

---

## Step 3 — Determine build status

For each server, classify status before emitting the block:

| Status | Condition |
|---|---|
| `READY` | stdio: `dist/index.js` exists and is newer than `src/`; http: deployed URL reachable |
| `NEEDS_BUILD` | stdio: `dist/index.js` missing or stale; http: `wrangler.toml` present but no deployed URL found |
| `NEEDS_DEPLOY` | http: built but deployed URL not yet confirmed (no wrangler output or URL in `wrangler.toml`) |

For http servers: attempt to read the deployed URL from `wrangler.toml` → `[env.production] route` or `workers_dev = true` → `https://<name>.<account>.workers.dev`. If unresolvable, mark `NEEDS_DEPLOY`.

---

## Step 4 — Emit registration blocks

### stdio server block

```json
"<server-slug>": {
  "command": "node",
  "args": ["<absolute-path-to-mcp-server>/dist/index.js"],
  "env": {}
}
```

Where `<absolute-path-to-mcp-server>` is the fully-resolved absolute path to the
`mcp-server/` directory. Never use `~` or relative paths in the output — `~/.claude.json`
is read by the Claude Code host process which may not expand `~` in `args`.

### http server block

```json
"<server-slug>": {
  "url": "<deployed-workers-url>"
}
```

If the URL cannot be determined: emit a `PENDING` block with a comment and skip from
the `--apply` merge:

```json
"<server-slug>": {
  "_status": "PENDING",
  "_action": "Run `wrangler deploy` in <abs-path>, then re-run /register-forged-mcps --apply"
}
```

---

## Step 5 — Output format (dry-run default)

Print a human-readable summary table followed by the ready-to-paste JSON block:

```
/register-forged-mcps — DRY-RUN (pass --apply to write ~/.claude.json)

Server              Transport  Status         Action
─────────────────── ────────── ────────────── ──────────────────────────────────────
github-mcp          stdio      READY          —
stripe-mcp          http       NEEDS_DEPLOY   wrangler deploy in stripe-mcp/mcp-server/
square-mcp          stdio      NEEDS_BUILD    npm run build in square-mcp/mcp-server/
twilio-mcp          stdio      READY          —

--- mcpServers block to merge into ~/.claude.json ---

{
  "mcpServers": {
    "github-mcp": {
      "command": "node",
      "args": ["/Users/Apple/.claude/plugins/heymegabyte-claude-skills/mcp-servers/github-mcp/mcp-server/dist/index.js"]
    },
    "twilio-mcp": {
      "command": "node",
      "args": ["/Users/Apple/.claude/plugins/heymegabyte-claude-skills/mcp-servers/twilio-mcp/mcp-server/dist/index.js"]
    },
    "stripe-mcp": {
      "_status": "PENDING",
      "_action": "Run `wrangler deploy` in /Users/Apple/.claude/plugins/heymegabyte-claude-skills/mcp-servers/stripe-mcp/mcp-server/, then re-run /register-forged-mcps --apply"
    },
    "square-mcp": {
      "_status": "NEEDS_BUILD",
      "_action": "cd /Users/Apple/.claude/plugins/heymegabyte-claude-skills/mcp-servers/square-mcp/mcp-server && npm run build"
    }
  }
}
```

PENDING and NEEDS_BUILD entries are shown in the JSON for visibility but are **excluded**
from the `--apply` merge (only READY entries are written).

---

## Step 6 — `--apply` mode

When `--apply` is passed, merge READY entries into `~/.claude.json` non-destructively:

```bash
CLAUDE_JSON="$HOME/.claude.json"

# Read existing mcpServers, merge new READY entries, write back
python3 - <<'PYEOF'
import json, sys, os

claude_json_path = os.path.expanduser("~/.claude.json")

# Load existing config (create empty if missing)
try:
    with open(claude_json_path) as f:
        config = json.load(f)
except FileNotFoundError:
    config = {}

config.setdefault("mcpServers", {})

# NEW_ENTRIES injected by the agent as a Python dict literal
new_entries = {}  # <-- agent fills this in at runtime

merged = 0
skipped = 0
for slug, block in new_entries.items():
    if "_status" in block:
        skipped += 1
        continue
    if slug in config["mcpServers"]:
        print(f"  SKIP (already registered): {slug}")
        skipped += 1
    else:
        config["mcpServers"][slug] = block
        print(f"  ADDED: {slug}")
        merged += 1

with open(claude_json_path, "w") as f:
    json.dump(config, f, indent=2)

print(f"\n✓ {merged} servers registered, {skipped} skipped.")
print(f"  Restart Claude Code to activate: Cmd+Shift+P → 'Reload Window'")
PYEOF
```

Preserve ALL existing `mcpServers` entries. Never overwrite or delete entries not in
the scanned set — this command only **adds**, never removes.

---

## Non-goals

- Does not build or deploy servers — it reports status and prints the commands needed.
- Does not validate that a registered server's tools are working — run `/audit-mcp-fleet` for that.
- Does not manage API keys or env vars — those belong in `~/.claude.json` `env` blocks per `[[secret-provisioning]]`.

---

## Cross-links

- `[[audit-mcp-fleet]]` — post-registration health check for all wired MCP servers
- `[[deploy-forged-mcp]]` — deploy an http-transport MCP server via wrangler
- `[[forge-from-openapi]]` — forge a new MCP server from an OpenAPI spec
- `[[secret-provisioning]]` — wiring API keys into MCP server `env` blocks
- `[[agent-resilience-discipline]]` — write registration output early; don't batch at end
