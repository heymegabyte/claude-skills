---
description: Capture the cumulative output of a /loop arc into a single auditable retrospective document; scans the heymegabyte-claude-skills plugin for modified files, categorizes by directory, counts LOC delta, extracts tool counts from MCP servers, and writes a timestamped report to retrospectives/
argument-hint: [--since=<git-ref>]
allowed-tools: Bash, Read, Write, Glob
---

# /post-arc-retrospective

Produce a complete, auditable retrospective for a completed loop arc. Scans
`~/.claude/plugins/heymegabyte-claude-skills/` for files changed since the given
git ref, categorizes output by directory, counts new/modified files and LOC delta,
extracts MCP tool counts, rule descriptions, and command descriptions from
frontmatter, then writes a timestamped markdown report.

## Step 1 — Parse arguments

Read the raw argument string.

- `--since=<git-ref>` — git ref to diff from. Default: `HEAD~50`.
- If no `--since` flag, also check `~/.claude/plugins/heymegabyte-claude-skills/retrospectives/.last-arc-start`
  for a stored start commit written by `CronCreate`; use it if present.
- Store the resolved ref as `$SINCE_REF`.

```bash
PLUGIN_DIR="$HOME/.claude/plugins/heymegabyte-claude-skills"
SINCE_REF="${ARGS#--since=}"
[ "$SINCE_REF" = "$ARGS" ] && SINCE_REF=""  # no flag found

if [ -z "$SINCE_REF" ]; then
  STORED="$PLUGIN_DIR/retrospectives/.last-arc-start"
  [ -f "$STORED" ] && SINCE_REF=$(cat "$STORED")
fi
[ -z "$SINCE_REF" ] && SINCE_REF="HEAD~50"
```

## Step 2 — Collect changed files via git

Run inside the plugin directory. Capture both Added (`A`) and Modified (`M`)
files separately.

```bash
cd "$PLUGIN_DIR"
NEW_FILES=$(git diff --name-only --diff-filter=A "$SINCE_REF" HEAD -- . 2>/dev/null)
MODIFIED_FILES=$(git diff --name-only --diff-filter=M "$SINCE_REF" HEAD -- . 2>/dev/null)
ALL_CHANGED=$(git diff --name-only "$SINCE_REF" HEAD -- . 2>/dev/null)
LOC_DELTA=$(git diff --stat "$SINCE_REF" HEAD -- . 2>/dev/null | tail -1)
```

If the git diff fails (e.g., shallow clone or no commits), fall back to
`find . -newer retrospectives/.last-arc-start -not -path '*/.git/*' -not -path '*/node_modules/*'`.

## Step 3 — Categorize by directory

Iterate `$ALL_CHANGED` and bucket each path into one of these categories.
Use the first matching rule (longest prefix wins):

| Category | Path prefix |
|---|---|
| Rules | `rules/` |
| Commands | `commands/` |
| Agents | `agents/` |
| Hooks | `~/.claude/hooks/` or `hooks/` |
| MCP Servers | `mcp-servers/` |
| Template Utils | `template/utils/` or `template/evals/` |
| Numbered Skills | `17-*/`, `18-*/`, `19-*/` (and higher) |
| Core Skills | `[0-9][0-9]-*/` |
| Bin / Scripts | `bin/` or `scripts/` |
| Marketplace | `marketplace-submissions/` |
| Config/Meta | `settings.json`, `package.json`, `*.yml`, `*.json` at root |
| Packs | `_packs/` |
| Other | everything else |

For each category track:

- `new_count` — files in `$NEW_FILES` matching this prefix
- `modified_count` — files in `$MODIFIED_FILES` matching this prefix
- list of file basenames (for rules/commands: also extract description)

## Step 4 — Extract MCP server tool counts

For each directory under `mcp-servers/*/mcp-server/src/index.ts`:

```bash
for mcp in "$PLUGIN_DIR/mcp-servers"/*/mcp-server/src/index.ts; do
  name=$(echo "$mcp" | sed 's|.*/mcp-servers/||' | sed 's|/mcp-server/src/index.ts||')
  tool_count=$(grep -c 'inputSchema' "$mcp" 2>/dev/null || echo 0)
  echo "$name: $tool_count"
done
```

Also check for a `.mcp-prune-rules.json` alongside to note original vs pruned
counts: `original_count` vs current `tool_count`.

## Step 5 — Extract rule descriptions from frontmatter

For each new rule file in `rules/`:

```bash
for f in $NEW_RULE_FILES; do
  name=$(grep '^name:' "$PLUGIN_DIR/rules/$f" 2>/dev/null | head -1 | sed 's/name: //' | tr -d '"')
  h1=$(grep '^# ' "$PLUGIN_DIR/rules/$f" 2>/dev/null | head -1 | sed 's/^# //')
  echo "- **$h1** \`rules/$f\`"
done
```

Fall back to the filename stem if no `name:` frontmatter found.

## Step 6 — Extract command descriptions from frontmatter

For each new command file in `commands/`:

```bash
for f in $NEW_CMD_FILES; do
  desc=$(grep '^description:' "$PLUGIN_DIR/commands/$f" 2>/dev/null | head -1 | sed 's/^description: *//' | tr -d '"')
  [ -z "$desc" ] && desc=$(grep '^# /' "$PLUGIN_DIR/commands/$f" | head -1 | sed 's/^# //')
  echo "- \`/$( basename $f .md )\` — $desc"
done
```

## Step 7 — Compute totals

Aggregate across all categories:

- Total new files
- Total modified files
- LOC delta (from `git diff --stat`)
- MCP server count
- Total MCP tools (sum of all `tool_count` values)
- New rule count
- New command count
- New numbered-skill count (skills ≥17)

## Step 8 — Identify highest-leverage delta

Apply this heuristic to surface the single most impactful change:

1. If a new MCP server was added → "New `<name>` MCP server: `N` tools"
2. If a forge template or forge command was added/modified → "forge `--target` capability upgraded"
3. If a rule with `priority: 1` was added → name that rule
4. If a command that enables a whole workflow was added → name that command
5. Otherwise → the category with the highest new-file count

Write one sentence: "Highest-leverage delta: `<noun>` — `<one-line what this unlocks>`"

## Step 9 — Build "what's now possible" section

For each new MCP server: one bullet — "Call `<API name>` tools directly from Claude without leaving the IDE"
For each new numbered skill (≥17): one bullet — "Invoke skill `/<skill-name>` for `<domain>` workflows"
For each new command: one bullet from its description
For each new hook: one bullet on what behavior it automates

Cap at 12 bullets total; pick highest-leverage entries.

## Step 10 — Write the report

Output path: `$PLUGIN_DIR/retrospectives/arc-$(date +%Y-%m-%dT%H%M%S).md`

Report structure:

```markdown
# Arc Retrospective — <date>

**Ref range:** `<SINCE_REF>..HEAD`
**Generated:** <ISO timestamp>

## Totals

| Category | New | Modified | Notes |
|---|---|---|---|
| Rules | N | N | |
| Commands | N | N | |
| Agents | N | N | |
| Hooks | N | N | |
| MCP Servers | N | N | N total tools |
| Template Utils | N | N | |
| Numbered Skills | N | N | skills 17–NN |
| Bin/Scripts | N | N | |
| **TOTAL** | **N** | **N** | **+/- NNN LOC** |

## MCP Servers

| Server | Tools | Notes |
|---|---|---|
| stripe-mcp | N | pruned from original N |
...

## New Rules

...

## New Commands

...

## New Hooks

...

## New Numbered Skills

...

## Template Utils

...

## Highest-Leverage Delta

<one-sentence summary>

## What's Now Possible

- ...
- ...

## Open Follow-Ups

- [ ] ...
```

Also write a 5-line executive summary to stdout:

```
Arc closed: <date>
Ref range: <SINCE_REF>..HEAD
Files: +N new / N modified / ±NNN LOC
MCP: N servers / N total tools
Highest leverage: <one-line>
```

## Step 11 — Store arc start marker for next loop

```bash
git rev-parse HEAD > "$PLUGIN_DIR/retrospectives/.last-arc-start"
```

This ensures the next `/post-arc-retrospective` (or a scheduled CronCreate run)
automatically picks up from the right boundary.
