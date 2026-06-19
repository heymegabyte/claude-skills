---
name: prepare-multi-file-brief
description: Turn a comma-separated list of file paths into a fully structured Pattern A agent brief — ordered writes, per-file schemas, and a verification step baked in.
argument-hint: <file-list-csv> <description>
---

# /prepare-multi-file-brief <file-list-csv> <description>

Generates a complete, copy-paste-ready Agent brief for a multi-file deliverable following
Pattern A from `[[agent-resilience-discipline]]`: each file is written in its own
separate Write tool call, ordered by importance, with per-file structure guidance embedded.

## Usage

```
/prepare-multi-file-brief src/worker/routes/auth.ts,src/worker/schemas/auth.ts,e2e/auth.spec.ts "Clerk JWT auth guard for Hono with D1 user lookup and Playwright E2E"
```

## Logic

1. Parse `<file-list-csv>` by splitting on `,` (trim whitespace). Parse `<description>` as remaining args.
2. For each path:
   - Detect language from extension (`.ts` → TypeScript, `.tsx` → React/TSX, `.sql` → SQL, `.md` → Markdown, `.py` → Python, `.json` → JSON, other → text).
   - Determine write priority: schemas/types first → route handlers → tests → docs.
   - Sample up to 50 lines of the first existing sibling file for import/style context.
3. Sort paths by priority (inferred from basename: `schema|types|zod` → 1, `route|handler|service` → 2, `spec|test|e2e` → 3, `readme|docs|md` → 4).
4. Synthesize the full brief in the output format below.
5. Print brief to stdout — user pastes into an `Agent` tool call.

## Brief output format

```markdown
## Agent Brief — Multi-file Write: <description>

**Role:** File author — writes each file completely, nothing else.
**Scope:** <N> files listed below. No other files touched, no deps added.
**Description:** <description>

> ⚠️ Pattern A — Write each file in a **SEPARATE** Write tool call.
> Never batch multiple file contents into one Write. Never truncate.
> Complete each file fully before moving to the next.

---

### Write order (most important first)

| # | Path | Type | Notes |
|---|------|------|-------|
| 1 | `<path-1>` | <lang> | <role inferred from basename> |
| 2 | `<path-2>` | <lang> | <role inferred from basename> |
| … | … | … | … |

---

### File 1 — `<path-1>`

**Purpose:** <one-line role>
**Structure to follow:**
- <inferred structure for this file type — see § Structure hints>
- <sibling context: "mirrors `<sibling-basename>` in same dir — match its import style">

---

### File 2 — `<path-2>`

**Purpose:** <one-line role>
**Structure to follow:**
- <inferred structure>
- Imports from File 1 via `<expected import path>`

---

<!-- repeat for each file -->

---

### Verification (final step — run after all Writes)

```bash
# Confirm every file was written
<for each path: ls -la <path> 2>/dev/null || echo "MISSING: <path>">

# Line count sanity (each file must be > 10 lines)
<for each path: wc -l <path>>
```

Expected: all files exist, each > 10 lines, no "MISSING" output.

---

### Non-goals

- Do NOT create files not listed above.
- Do NOT modify pre-existing files.
- Do NOT add packages not already in package.json.
- Do NOT leave TODO / stub / placeholder in any file — every function body complete.

```

## Structure hints by extension

| Extension | Opener | Required exports |
|-----------|--------|-----------------|
| `.ts` (schema) | `import { z } from 'zod'` | named `Schema` + inferred `Type` |
| `.ts` (route) | `import { Hono } from 'hono'` | default `app` or named router |
| `.ts` (service) | typed class or exported fns | no default export |
| `.tsx` | React 19 FC + Tailwind className | default component export |
| `.spec.ts` / `e2e` | `import { test, expect } from '@playwright/test'` | no exports — test blocks only |
| `.test.ts` | `import { describe, it, expect } from 'vitest'` | no exports |
| `.sql` | `-- Migration: <basename>` | `CREATE TABLE IF NOT EXISTS` |
| `.md` | `# <title>` + ## sections | n/a |
| `.json` | `{}` with top-level keys from description | n/a |

## Priority scoring (used to sort write order)

```

basename matches /schema|types|zod|model/i  → priority 1
basename matches /route|handler|service|api/i → priority 2
basename matches /spec|test|e2e/i           → priority 3
basename matches /readme|docs|changelog/i   → priority 4
everything else                              → priority 2

```

Files with the same priority keep the order given in the CSV input.

## Execution script (runs in-process)

```bash
# Split args: everything before the first space is csv, rest is description
CSV="${ARGUMENTS%% *}"
DESCRIPTION="${ARGUMENTS#* }"

if [[ -z "$CSV" || -z "$DESCRIPTION" || "$CSV" == "$DESCRIPTION" ]]; then
  echo "Usage: /prepare-multi-file-brief <file-list-csv> <description>"
  exit 1
fi

IFS=',' read -ra FILES <<< "$CSV"

echo "## Agent Brief — Multi-file Write: ${DESCRIPTION}"
echo ""
echo "> ⚠️ Pattern A — Write each file in a **SEPARATE** Write tool call."
echo "> Never batch multiple file contents into one Write. Never truncate."
echo ""
echo "### Write order"
echo ""
I=1
for F in "${FILES[@]}"; do
  F="$(echo "$F" | xargs)"  # trim whitespace
  BASENAME="$(basename "$F")"
  EXT="${BASENAME##*.}"
  DIR="$(dirname "$F")"
  SIBLING="$(ls "$DIR" 2>/dev/null | grep -v "^${BASENAME}$" | head -1)"

  echo "#### File $I — \`$F\`"
  echo "- Extension: .$EXT"
  [[ -n "$SIBLING" ]] && echo "- Sibling context: \`$DIR/$SIBLING\` (match its import/naming style)"
  echo "- Structure: see § Structure hints for .$EXT"
  echo ""
  I=$((I+1))
done

echo "### Verification"
echo ""
echo "\`\`\`bash"
for F in "${FILES[@]}"; do
  F="$(echo "$F" | xargs)"
  echo "ls -la \"$F\" 2>/dev/null || echo \"MISSING: $F\""
  echo "wc -l \"$F\""
done
echo "\`\`\`"
echo ""
echo "All files must exist and exceed 10 lines. No TODOs, no stubs."
```
