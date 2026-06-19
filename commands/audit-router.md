---
description: Validate _router.md — check every referenced skill file exists; surface stale entries + orphan files; --fix prunes or stubs
argument-hint: [--fix]
allowed-tools: Bash, Read, Edit, Glob
---

<!-- <SUBAGENT-STOP>: skip this skill when running inside a subagent. Meta-skills must not leak into spawned subagent contexts. -->
<SUBAGENT-STOP/>

Audit `_router.md` for dead references and unregistered files. A router pointing at non-existent skills silently misdirects Claude; skill files that exist but aren't routed are invisible.

**Purpose** — keep the router as a live, accurate map — not a historical artifact.

**When to use** — after adding or deleting a skill file; after a pruning run; when routing feels off; on demand.

**Inputs** — `$ARGUMENTS`: pass `--fix` to prune stale entries or generate placeholder files for orphans. Without `--fix`, read-only.

---

## Step 1 — Load the router

Read `~/.claude/plugins/heymegabyte-claude-skills/_router.md`.

Parse two sections:

**A. Category Map** — lines like:

```
- **05 — Architecture and Stack** — `cf-auto-provision`, `drizzle-orm-and-migrations`, ...
```

Extract each backtick-wrapped token as a slug. Map slug → category number (e.g., `cf-auto-provision` → `05`).

**B. Task Routing** — lines like:

```
- **Build feature** → `05`, `06`, `07`
- **Billing / auth** → `05/auth-and-session-management`, `13/stripe-billing`
```

Extract path-form tokens (`05/auth-and-session-management`) as slug references. Also resolve bare category numbers to their known directories.

Build `router_refs`: a deduplicated list of `{slug, category, source_line}`.

---

## Step 2 — Resolve each reference to a file path

For each slug in `router_refs`, resolve the expected file path:

```
slug: cf-auto-provision, category: 05
→ ~/.claude/plugins/heymegabyte-claude-skills/05-architecture-and-stack/cf-auto-provision.md
```

Directory name convention: `<NN>-<kebab-description>/` — build this from the Category Map headers. Example header `**05 — Architecture and Stack**` → dir `05-architecture-and-stack`.

Glob `~/.claude/plugins/heymegabyte-claude-skills/` to get the actual directory names for categories 01–19.

For each resolved path, check:

```bash
test -f <path> && echo EXISTS || echo MISSING
```

Collect:

- `stale[]` — router references a slug but the file is MISSING
- `present[]` — router references a slug and the file EXISTS

---

## Step 3 — Find orphan files

Glob all `.md` files across skill category directories:

```bash
find ~/.claude/plugins/heymegabyte-claude-skills -mindepth 2 -maxdepth 2 -name "*.md" \
  | grep -E '/[0-9]{2}-' | sort
```

Exclude:

- `_*.md` files (internal: `_router.md`, `_pruned-*.md`)
- `CLAUDE.md`, `README.md`, `CONVENTIONS.md`, `SKILL_PROFILES.md`
- Files in `commands/`, `agents/`, `rules/`, `bin/`, `scripts/`, `templates/`, `forge-templates/`, `spec/`

For each remaining `.md`, extract the slug (filename without `.md`). Check if slug is in `router_refs`.

Collect:

- `orphans[]` — file exists in a category dir but has no entry in `_router.md`

---

## Step 4 — Emit alphabetized report table

```
Router Audit — ~/.claude/plugins/heymegabyte-claude-skills/_router.md
══════════════════════════════════════════════════════════════════════

SUMMARY
  Router references:   87
  Present:             83
  Stale (MISSING):      4
  Orphan files:         6

STALE ENTRIES (referenced in router, file missing)
┌─────────────────────────────────────────────────────────────────────┐
│ Slug                          │ Category │ Expected path             │
├─────────────────────────────────────────────────────────────────────┤
│ bolt-artifact-protocol        │ 15       │ 15-site-generation/...md  │
│ picovoice-eagle-biometric     │ 07       │ 07-quality-and-...        │
│ shared-api-pool               │ 05       │ 05-architecture-...       │
│ wisdom-and-human-psychology   │ 04       │ 04-preference-...         │
└─────────────────────────────────────────────────────────────────────┘

ORPHAN FILES (file exists, not in router)
┌─────────────────────────────────────────────────────────────────────┐
│ Slug                          │ Category │ File path                 │
├─────────────────────────────────────────────────────────────────────┤
│ email-deliverability          │ 08       │ 08-deploy-and-...         │
│ feature-flags-implementation  │ 13       │ 13-observability-...      │
│ mcp-server-registry           │ 13       │ 13-observability-...      │
│ parallel-subagent-economy     │ 01       │ 01-operating-system/...   │
│ test-data-factories           │ 07       │ 07-quality-and-...        │
│ workers-ai-gateway            │ 05       │ 05-architecture-...       │
└─────────────────────────────────────────────────────────────────────┘

PRESENT (83 entries confirmed — omitted for brevity; pass --verbose to show)
```

---

## Step 5 — --fix mode (only when $ARGUMENTS contains --fix)

**Prune stale entries:**
For each slug in `stale[]`:

- Read `_router.md`
- Find the line containing the stale slug (in backticks)
- Remove the slug token from that line (or remove the line if it becomes empty)
- Write the updated file
- Emit: `→ pruned stale entry: <slug> from Category Map line / Task Routing line`

**Register orphan files:**
For each slug in `orphans[]`:

- Determine which Category Map line corresponds to its directory number
- Append the slug (backtick-wrapped) to that line in the Category Map
- Emit: `→ added orphan to router: <slug> (category <NN>)`

After all edits:

- Re-run the full slug check to confirm zero stale + zero orphans
- Emit: `--fix complete: N stale pruned, M orphans registered.`

Note: `--fix` only edits `_router.md`. It does NOT create or delete skill `.md` files — those require human review.

---

## Step 6 — Verdict

- Zero stale + zero orphans → `✓ router clean`
- Orphans only → `~ router has unregistered files — run --fix or add manually`
- Stale entries → `✗ router has dead references — run --fix to prune`

---

**Verification** — After `--fix`, re-run `/audit-router` (no flag) to confirm clean report.

**See**

- `rules/drift-detection.md` — router drift is a class of doc drift; fix in-turn
- `rules/repo-folder-hygiene.md` — ≤10 items per folder; orphan accumulation is a hygiene signal
- `/drift-check` — broader config + doc drift sweep that calls this
