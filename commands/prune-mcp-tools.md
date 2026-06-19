# /prune-mcp-tools

Reduce a forge-generated MCP server's tool surface. Comment out low-value tools (preserving reversibility), update the README tool count, and emit a pruning report.

## Usage

```
/prune-mcp-tools <mcp-server-dir> [--keep-top=N] [--by=traffic|category|name] [--reverse]
```

**Args**

- `<mcp-server-dir>` — path to MCP server root (contains `src/index.ts`).
- `--keep-top=N` — keep the top N tools by score; comment out the rest. Default: keep top 50%.
- `--by=traffic|category|name` — scoring strategy (default: `traffic`).
  - `traffic` — score from `.claude/mcp-usage.json` (calls in last 30d). Zero-call tools are pruned first.
  - `category` — group by JSDoc `@category` tag; keep all tools in kept categories, prune orphans.
  - `name` — allowlist regex from `.claude/mcp-prune-rules.json` `{ "keep": ["regex", ...] }`.
- `--reverse` — un-prune: uncomment all `// pruned:` lines and restore tool count in README.

## Step-by-step logic

### 1. Read `src/index.ts`

- Locate every `server.tool(` call (regex: `server\.tool\s*\(`).
- For each, extract:
  - **name** — first string argument (strip quotes).
  - **description** — second string argument or JSDoc above the call.
  - **JSDoc tags** — `@category`, `@deprecated`, `@since`.
  - **line range** — start line of `server.tool(` to its matching closing `)`.
- Build a `ToolEntry[]` array: `{ name, description, category, lineStart, lineEnd, pruned }`.

### 2. Score tools by strategy

**`--by=traffic`**

- Read `.claude/mcp-usage.json` (schema: `{ tools: { [name: string]: { calls_30d: number } } }`).
- Score = `calls_30d`. Missing entry = score 0.
- Sort descending. Keep top N (`--keep-top`) or top 50% if flag omitted.
- Any tool with `@deprecated` in JSDoc is moved to prune list regardless of score.

**`--by=category`**

- Read `.claude/mcp-usage.json` — aggregate calls per `@category` tag: `categoryScore = sum(calls_30d for tools in category)`.
- Missing `.claude/mcp-usage.json` → categoryScore = 0 for all.
- Sort categories descending. Keep tools in top-half categories.
- Tools with no `@category` → score 0, candidate for pruning.

**`--by=name`**

- Read `.claude/mcp-prune-rules.json` → `{ "keep": ["regex1", "regex2", ...] }`.
- Tool name matches ANY keep regex → kept. No match → pruned.
- `--keep-top` is ignored in name mode.

### 3. Comment out pruned tools

- For each tool in prune list, prepend every line in `[lineStart, lineEnd]` with `//`.
- Insert a one-line banner comment directly above `lineStart`:

  ```ts
  // pruned: low-traffic 0 calls 30d — /prune-mcp-tools --reverse to restore
  ```

  (For category mode: `// pruned: low-category-score (0 calls 30d across category)`.)
  (For name mode: `// pruned: not in allowlist (.claude/mcp-prune-rules.json)`.)

- NEVER delete lines. Comment-out only — full reversibility is a hard requirement.

### 4. Update README tool count

- Search README.md for pattern `/\*\*\d+\s+tools?\*\*/i` or `\d+\s+tools?` in the first 30 lines.
- Replace the numeric count with the new kept-tool count.
- If no count pattern found, append to the end of the first `##` section:

  ```
  <!-- tool-count: N active, M pruned -->
  ```

### 5. Emit pruning report

Print a markdown table to stdout:

```
## Prune report — <mcp-server-dir>
Strategy: traffic | Date: 2026-06-18 | Kept: K | Pruned: P

| Tool | Score | Action | Reason |
|------|-------|--------|--------|
| create_item | 412 | KEPT | top 50% by calls_30d |
| delete_item | 0 | PRUNED | 0 calls 30d |
| legacy_sync | 0 | PRUNED | @deprecated tag |
...

Reversible: run `/prune-mcp-tools <dir> --reverse` to restore all pruned tools.
```

Save report to `.claude/mcp-prune-report-<timestamp>.md` (gitignored — add `**/.claude/mcp-prune-report-*.md` to `.gitignore`).

### 6. `--reverse` mode

- Grep `src/index.ts` for lines matching `^(\s*)// pruned:` (the banner line).
- For each banner, uncomment all `//`-prefixed lines in the block below it (until a non-commented line or next `server.tool`).
- Remove the banner comment line itself.
- Recount kept tools → update README.
- Print: `Restored N tools. README count updated.`

## Edge cases

- **No `.claude/mcp-usage.json`** — traffic mode falls back to score=0 for all; warns: `No mcp-usage.json found — all tools score 0, keeping top 50% by name (alphabetical).`
- **Already-pruned tools** — skip lines that already start with `// pruned:` when running a fresh prune.
- **`--keep-top=0`** — refuse with error: `--keep-top must be ≥1.`
- **`--keep-top` > total tools** — keep all, emit: `Nothing to prune — keep-top (N) >= total tools (M).`
- **`src/index.ts` not found** — error: `No src/index.ts in <dir>. Is this an MCP server?`

## Files read / written

| Path | Read | Written |
|------|------|---------|
| `<dir>/src/index.ts` | yes | yes (comments added) |
| `<dir>/README.md` | yes | yes (count updated) |
| `.claude/mcp-usage.json` | yes | no |
| `.claude/mcp-prune-rules.json` | yes (name mode) | no |
| `.claude/mcp-prune-report-<ts>.md` | no | yes |
| `<dir>/.gitignore` | yes | yes (adds report glob) |

## Example session

```
/prune-mcp-tools ~/emdash/my-mcp-server --keep-top=10 --by=traffic

Reading src/index.ts — found 24 tools.
Loading .claude/mcp-usage.json — 24 entries matched.
Strategy: traffic. Keeping top 10, pruning 14.

KEPT:  list_items (891), get_item (744), create_item (412), ...
PRUNED: legacy_sync (0), debug_dump (0), admin_wipe (0), ...

src/index.ts updated — 14 tools commented out.
README.md updated — "24 tools" → "10 tools".
Report saved: .claude/mcp-prune-report-20260618T143200.md
```

## See also

- `forge-from-openapi` — generates the MCP server this command prunes
- `deploy-forged-mcp` — deploys after pruning
- `drift-detection` — zero-call tools with no deprecation tag are drift
- `tool-design-as-api` — narrow surface is the goal; prune is the correction path
