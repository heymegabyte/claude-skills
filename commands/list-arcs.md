---
name: list-arcs
description: Surface all retrospective documents with key shape metrics; compare arcs deliberately.
argument-hint: [--show=<name>, --compare=<name1>,<name2>]
---

# /list-arcs [--show=<name>] [--compare=<name1>,<name2>]

Surfaces every arc retrospective in `retrospectives/` with normalized shape metrics so Brian can
compare arc types, sizes, and saturation outcomes at a glance. Supports drill-down and side-by-side
comparison for understanding when to run a new arc versus extending an existing one.

## Usage

```
/list-arcs
/list-arcs --show=arc-2026-06-18-bug-fixing
/list-arcs --compare=arc-2026-06-18-doctrinal-extraction,arc-2026-06-18-bug-fixing
```

## Arguments

| Flag | Default | Description |
|------|---------|-------------|
| _(none)_ | — | Print the full arc table, sorted by date ascending |
| `--show=<name>` | — | Print the full retrospective for the named arc; `<name>` is the filename without `.md` |
| `--compare=<name1>,<name2>` | — | Side-by-side key-metric table for exactly two arcs |

---

## Logic

### Default (no flags) — Arc table

1. **Glob** `retrospectives/*.md` — collect all retrospective files.
2. **For each file**, parse:
   - **Arc name** — from frontmatter `# Arc Retrospective — <name>` (H1) or filename stem.
   - **Date** — from `**Date range:**` or `**Generated:**` line; normalize to `YYYY-MM-DD`.
   - **Type** — from `**Arc name:**` description; classify:
     - Contains "doctrinal", "extraction", "principle", "catalogue" → `DOCTRINAL`
     - Contains "bug", "fix", "patch", "cascade", "validator" → `BUG-FIXING`
     - Both present → `MIXED`
   - **Iterations** — from `**Date range:**` iteration range (e.g. "iters 1–13" → 13) or count rows in Per-Iteration Table.
   - **Task count** — sum of Tasks column in Per-Iteration Table; if absent, count `- [x]` + `- [ ]` items in Open Follow-Ups section × 5 (estimate).
   - **Files** — from Totals table: sum of `New` + `Modified` columns, or `**TOTAL**` row.
   - **LOC delta** — from Totals table `**TOTAL**` row notes (e.g. "net +40k LOC"); normalize to integer (40000).
   - **Retrospective path** — absolute path to the `.md` file.
3. **Sort** by date ascending (oldest first).
4. **Emit** a markdown table:

```markdown
## Arc Registry

| Arc name | Type | Date | Iters | Tasks | Files | LOC Δ | Retrospective |
|----------|------|------|-------|-------|-------|-------|---------------|
| Doctrinal Extraction + MCP Fleet Forge | DOCTRINAL | 2026-06-18 | 13 | ~39 | ~96 | +40,000 | retrospectives/arc-2026-06-18-doctrinal-extraction.md |
| Bug-Discovery + Fix + Doctrine Extraction | BUG-FIXING | 2026-06-18 | 5 | ~15 | ~23 | +9,500 | retrospectives/arc-2026-06-18-bug-fixing.md |
```

5. **Emit summary line** below the table:
   - Total arcs: N
   - Doctrinal: X, Bug-fixing: Y, Mixed: Z
   - Largest arc by LOC: `<name>` (+N LOC over M iters)
   - Most recent: `<name>` (<date>)

---

### `--show=<name>` — Full retrospective

1. Resolve `retrospectives/<name>.md` (try exact match; if not found, try case-insensitive prefix match).
2. Print the entire file contents verbatim.
3. Append a one-line nav hint: "Use `/list-arcs --compare=<name>,<other>` to compare with another arc."

---

### `--compare=<name1>,<name2>` — Side-by-side comparison

1. Load both retrospectives.
2. Extract the same metric set as the table step above, plus:
   - **Saturation signal used** — LOC-drop (DOCTRINAL) or zero-finds (BUG-FIXING) or both (MIXED).
   - **Verdict at close** — last `**<keep-cron | lengthen-interval | delete-cron>**` in the retrospective, or "not recorded" if absent.
   - **Open follow-ups** — count of `- [ ]` items in Open Follow-Ups section.
   - **Principles extracted** — count of `### Principle #` headings or `## New Rules` count.
   - **Highest-leverage delta** — text of the `## Highest-Leverage Delta` section (first sentence only).

3. Emit a two-column markdown table:

```markdown
## Arc Comparison

| Metric | Doctrinal Extraction | Bug-Discovery + Fix |
|--------|---------------------|---------------------|
| Type | DOCTRINAL | BUG-FIXING |
| Date | 2026-06-18 | 2026-06-18 |
| Iterations | 13 | 5 |
| Tasks (est.) | ~39 | ~15 |
| Files Δ | ~96 new / ~13 modified | ~17 new / ~6 modified |
| LOC Δ | +40,000 | +9,500 |
| Saturation signal | LOC drop >20% × 3 iters | Zero new findings × 2 iters |
| Verdict at close | lengthen-interval (iter 11) → delete-cron | keep-cron (seam open: bitwarden, mock, static isError) |
| Open follow-ups | 5 | 5 |
| Principles extracted | 30 (checklist closed 30/30) | 3 (#21 #22 #23) |
| Highest-leverage delta | forge --harden yields production MCP in one command | 747 isError patches prevent Claude misreading API errors as success |
| Retrospective | retrospectives/arc-2026-06-18-doctrinal-extraction.md | retrospectives/arc-2026-06-18-bug-fixing.md |
```

4. Emit a **Shape Analysis** paragraph (2–4 sentences) observing:
   - Which arc had higher LOC-per-iteration efficiency.
   - Whether the arc types are complementary (doctrine → enforcement is the archetypal pair).
   - Any surprising divergence in task_count or file count.

---

## Parsing heuristics (implementation notes)

Fields that may be absent from older retrospectives — fall back gracefully:

| Field | Primary source | Fallback |
|-------|---------------|---------|
| Date | `**Generated:**` ISO timestamp | filename date component (e.g. `arc-2026-06-18-*` → `2026-06-18`) |
| Iterations | `**Date range:**` iter range | count `| N |` rows in Per-Iteration Table |
| Type | `**Arc name:**` keyword scan | filename keyword scan (`bug-fix` → BUG-FIXING, `doctrinal` → DOCTRINAL) |
| Files Δ | `**TOTAL**` row in Totals table | sum of `New` + `Modified` per-category rows |
| LOC Δ | `**TOTAL**` row "net +N LOC" | sum LOC Δ column in Per-Iteration Table |
| Tasks | Per-Iteration Table Tasks column sum | `Open Follow-Ups` count × 3 (rough estimate; note as estimated) |

When a field cannot be parsed, emit `—` in the table cell. Do NOT error out or stop parsing — partial data is better than no data.

---

## See

- `retrospectives/` — source documents
- `/post-arc-retrospective` — command to capture a new arc into this registry
- `/audit-cron-arc` — command to assess whether a running arc is saturated (uses arc-type classification)
- `rules/loop-arc-economics.md` — cost model and shape theory for loop arcs
- `rules/loop-driven-development.md` — when to start a new arc vs extend existing
