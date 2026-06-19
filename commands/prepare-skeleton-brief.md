---
name: prepare-skeleton-brief
description: Turn Pattern B from agent-resilience-discipline into a one-keystroke agent brief for a single-file deliverable < 300 lines.
---

# /prepare-skeleton-brief <target-path> <description>

Generates a complete, copy-paste-ready Agent brief for a single-file skeleton deliverable,
following Pattern B from `rules/agent-resilience-discipline.md`.

## Usage

```
/prepare-skeleton-brief src/worker/routes/invoices.ts "Hono route handler for invoice CRUD with Drizzle D1"
```

## Logic

1. Parse `<target-path>` and `<description>` from args.
2. Infer file extension → language → code fence marker.
3. Detect existing sibling files in the same directory to surface as context hints.
4. Read `rules/agent-resilience-discipline.md` (if present) and extract the Pattern B prompt
   template — look for the block that starts with "Pattern B" or "single-file skeleton".
5. Synthesize the full agent brief in the format below.
6. Print the brief to stdout (user copies it into an `Agent` tool call).

## Brief template (output)

```markdown
## Agent Brief — Skeleton: <basename>

**Role:** Skeleton author — writes the initial file, nothing else.
**Scope:** ONE file: `<target-path>` — < 300 lines, no stubs, no TODOs.
**Description:** <description>

### Context (read-only)
- Sibling files: <list of up to 5 siblings>
- Stack: <inferred stack from extension + project root>
- Contracts to honour: <relevant Zod schemas or types found via grep>

### Deliverable
Write `<target-path>` with the content below as the starting structure.
Flesh out EVERY function body — no empty functions, no placeholder comments.
Respect the project's import style and naming conventions.

```<lang>
// <target-path>
// <description>
// Generated skeleton — flesh out before shipping.

<SCAFFOLD — filled in by the skill at runtime based on extension>
```

### Non-goals

- Do NOT create any other file.
- Do NOT modify existing files.
- Do NOT add dependencies not already in package.json.

### Output format

Return the final file content only — no preamble, no explanation.
File will be written to `<target-path>` by the caller.
Max 300 lines.

```

## Scaffold hints by extension

| Extension | Scaffold opener |
|-----------|-----------------|
| `.ts` | `import { z } from 'zod'` + typed fn signatures |
| `.tsx` | React 19 functional component + Tailwind className |
| `.py` | `from __future__ import annotations` + typed dataclass |
| `.sql` | `-- Migration: <basename>` + CREATE TABLE skeleton |
| `.md` | `# <title>` + section headers |
| `.json` | `{}` with required top-level keys inferred from description |
| other | bare file with comment header |

## Execution script (runs in-process)

```bash
TARGET="$1"
DESCRIPTION="$2"

if [[ -z "$TARGET" || -z "$DESCRIPTION" ]]; then
  echo "Usage: /prepare-skeleton-brief <target-path> <description>"
  exit 1
fi

BASENAME=$(basename "$TARGET")
DIR=$(dirname "$TARGET")
EXT="${BASENAME##*.}"

# Collect siblings (up to 5)
SIBLINGS=$(ls "$DIR" 2>/dev/null | grep -v "^${BASENAME}$" | head -5 | tr '\n' ', ')

echo "## Agent Brief — Skeleton: ${BASENAME}"
echo ""
echo "**Role:** Skeleton author — writes the initial file, nothing else."
echo "**Scope:** ONE file: \`${TARGET}\` — < 300 lines, no stubs, no TODOs."
echo "**Description:** ${DESCRIPTION}"
echo ""
echo "### Context (read-only)"
echo "- Sibling files: ${SIBLINGS:-none}"
echo "- Extension: .${EXT}"
echo ""
echo "### Deliverable"
echo "Write \`${TARGET}\` fully fleshed — no empty fn bodies, no TODO lines."
echo ""
echo "### Non-goals"
echo "- Do NOT create any other file."
echo "- Do NOT modify existing files."
echo ""
echo "### Output format"
echo "Return the final file content only. Max 300 lines."
```
