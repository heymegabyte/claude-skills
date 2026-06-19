---
name: audit-cron-arc
description: Meta-analyze the effectiveness of a /loop arc — per-iteration metrics, LOC delta trend, saturation detection, and a keep/lengthen/delete recommendation.
---

# /audit-cron-arc [--cron-id=<id>]

Analyzes a completed or running `/loop` arc to determine whether it's still producing value or has hit saturation. Emits a markdown report with per-iteration table, ASCII trend chart, saturation verdict, and an actionable recommendation.

## Usage

```
/audit-cron-arc
/audit-cron-arc --cron-id=loop-1718643000
```

## Arguments

| Flag | Default | Description |
|------|---------|-------------|
| `--cron-id=<id>` | most recent CronCreate'd job | Loop job identifier to audit |

## Logic

### Step 0 — Arc-type classifier (run FIRST; gates all downstream thresholds)

Scan files modified across all iterations via `git diff --name-only <start-sha>..<end-sha>`.

**Classify each modified file:**

| Bucket | File patterns |
|--------|--------------|
| DOCTRINAL | `rules/*.md`, `_router.md`, `prompt-cache.md`, `commands/*.md`, `skills/**/*.md` |
| BUG-FIXING | `mcp-servers/*/src/index.ts`, `bin/validate*.mjs`, `rules/*-discipline.md` derived from incidents (check git log for "Principle #", "fix:", "patch:", "guard") |
| META | `retrospectives/*.md`, `rules/audit-baselines/*.json`, `settings.json`, hook files |

**Assign arc type from file counts across ALL iterations:**

- ≥60% DOCTRINAL → `arc_type = DOCTRINAL`
- ≥60% BUG-FIXING → `arc_type = BUG-FIXING`
- Otherwise → `arc_type = MIXED`

Emit arc type at report top. Example:

```
Arc type: BUG-FIXING (14 of 19 modified files match bug-fix patterns across iters 14–18)
```

---

1. **Resolve cron job** — if `--cron-id` omitted, read `~/.claude/loops/active.json`; pick highest `created_at`.
2. **Load task log** — call `TaskList` filtered by `cron_id` tag; sort by `iteration` asc.
3. **Compute per-iteration metrics:**
   - `task_count` — tasks spawned this iteration
   - `files_created` — `git diff --stat` between iteration start+end SHA (new files only)
   - `loc_delta` — net lines added/removed (`git diff --numstat`)
   - `tools_used` — unique tool call types from the task transcript
   - `duration_s` — wall-clock seconds between task start and last child completion
   - `new_findings` — (BUG-FIXING only) distinct violation classes reported; parse transcript for `N violations`, `N findings`, `N call sites`, `N errors`
   - `findings_patched` — (BUG-FIXING only) violations resolved this iteration
4. **Detect saturation curve — per arc type:**

   **DOCTRINAL (LOC-based):**
   - `loc_per_iter[i] < loc_per_iter[i-1] * 0.80` (>20% drop) → "converging"
   - Three consecutive converging iterations → `saturated`
   - Any growing or flat iteration → `still-runway`

   **BUG-FIXING (seam-fork; LOC is NOT the primary signal):**
   - `net_findings[i] = new_findings[i] - findings_patched[i]`
   - `net_findings[i] > 0` → seam forking → `still-runway`
   - `new_findings[i] == 0` AND `findings_patched[i] > 0` → `converging`
   - `new_findings[i] == 0` AND `findings_patched[i] == 0` for ≥2 consecutive iters AND backlog empty → `saturated`
   - LOC-drop threshold does NOT trigger convergence; surgical edits have volatile LOC curves.
   - task_count plateau at 3 for 5+ iters is NOT a convergence signal.

   **MIXED:**
   - `saturated` only when BOTH DOCTRINAL (LOC-based) AND BUG-FIXING (zero-finds) criteria simultaneously indicate saturation. Either alone = `still-runway`.

5. **Render report** (see Output format).
6. **Recommend — per arc type:**

   **DOCTRINAL:**
   - `still-runway` → `keep-cron`
   - `converging` → `lengthen-interval` (2× current interval)
   - `saturated` → `delete-cron`

   **BUG-FIXING:**
   - `still-runway` → `keep-cron` (seam forking; keep running validators)
   - `converging` → `keep-cron` (backlog draining; do not lengthen)
   - `saturated` → `rotate-validator` first; if rotating produces zero new findings → `delete-cron`

   **MIXED:**
   - Apply the more conservative recommendation (never delete if either domain shows runway).

## Output format

```markdown
# Cron Arc Audit — <cron-id>

**Audited:** <timestamp>
**Arc type:** <DOCTRINAL | BUG-FIXING | MIXED>  ← always emit; gates thresholds below
**Arc-type rationale:** <N of M modified files matched <pattern>; <brief reason>>
**Iterations:** <N>
**Total LOC delta:** <+X / -Y>
**Total duration:** <HH:MM:SS>

## Per-Iteration Table

<!-- For DOCTRINAL arcs: -->
| Iter | Tasks | Files+ | LOC Δ | Tools | Duration | Trend |
|------|-------|--------|-------|-------|----------|-------|
|  1   |   4   |   3    | +210  |   7   |   2m14s  |  —    |
|  2   |   6   |   5    | +380  |   9   |   3m01s  |  ↑    |
|  3   |   5   |   2    | +190  |   6   |   2m30s  |  ↓    |
|  4   |   3   |   1    |  +45  |   4   |   1m55s  |  ↓↓   |

<!-- For BUG-FIXING arcs: add New Findings + Patched columns; LOC Trend column is informational only -->
| Iter | Tasks | Files+ | LOC Δ | New Findings | Patched | Net | Seam |
|------|-------|--------|-------|--------------|---------|-----|------|
| 14   |   3   |   4    | +820  |      4       |    0    |  +4 | fork |
| 15   |   3   |   5    | +480  |   1134       |    0    | +1134| fork |
| 16   |   3   |   3    | +170  |    581       |  1134   | -553| close|
| 17   |   3   |   5    | +747  |      0       |  747    | -747| drain|
| 18   |   3   |   6    | +310  |      0       |    0    |   0 | dry? |

## LOC-per-Iteration Trend (ASCII)

```

LOC
400 │      ██
350 │      ██
300 │  ██  ██
250 │  ██  ██
200 │  ██  ██  ██
150 │  ██  ██  ██
100 │  ██  ██  ██
 50 │  ██  ██  ██  ██
  0 └──────────────────
     I1   I2   I3   I4

```

## Verdict

**<still-runway | converging | saturated>**

<1-2 sentence rationale.>

## Recommendation

**<keep-cron | lengthen-interval | delete-cron>**

<What to do and why. If lengthen: suggest new interval. If delete: surface any remaining seam to tackle manually.>
```

## Execution script

```bash
CRON_ID=""

for arg in "$@"; do
  case "$arg" in
    --cron-id=*) CRON_ID="${arg#*=}" ;;
  esac
done

if [[ -z "$CRON_ID" ]]; then
  # Resolve most recent loop from runtime state
  LOOP_STATE="${HOME}/.claude/loops/active.json"
  if [[ -f "$LOOP_STATE" ]]; then
    CRON_ID=$(python3 -c "
import json, sys
d = json.load(open('$LOOP_STATE'))
jobs = sorted(d.get('jobs', []), key=lambda j: j.get('created_at', 0), reverse=True)
print(jobs[0]['id'] if jobs else '')
" 2>/dev/null)
  fi
fi

if [[ -z "$CRON_ID" ]]; then
  echo "No active loop found. Pass --cron-id=<id> explicitly."
  exit 1
fi

echo "Auditing loop arc: $CRON_ID"
echo "→ Fetching task log, computing metrics, rendering report..."
```

## Saturation thresholds (per arc type)

### DOCTRINAL (default — LOC-based)

| Signal | Threshold | Verdict |
|--------|-----------|---------|
| LOC drop iter-over-iter | >20% | converging |
| Consecutive converging iters | ≥3 | saturated |
| Zero new files for ≥2 iters | — | saturated |
| task_count drops to 1 | — | converging |

### BUG-FIXING (seam-fork — findings-based; LOC signals are informational only)

| Signal | Threshold | Verdict |
|--------|-----------|---------|
| `new_findings[i] > 0` | any positive count | still-runway (seam forking) |
| `new_findings[i] == 0` AND `findings_patched[i] > 0` | — | converging (draining backlog) |
| `new_findings[i] == 0` AND `findings_patched[i] == 0` | ≥2 consecutive iters | saturated |
| LOC drop >20% | — | NOT a saturation signal — surgical edits are volatile |
| task_count plateau at 3 for N iters | — | NOT a saturation signal — consistent density = active seam |
| Backlog non-empty after 2 dry iters | — | rotate-validator before delete-cron |

### MIXED

Saturation requires BOTH DOCTRINAL AND BUG-FIXING criteria simultaneously. Either alone = still-runway.

---

**Design rationale (2026-06-18):** Bug-fixing arcs have structurally different saturation curves than
doctrinal arcs. In a doctrinal arc, LOC drops monotonically as gaps close — the seam narrows. In a
bug-fixing arc, each fix exposes adjacent violations — the seam FORKS. Applying LOC-drop thresholds to
a bug-fixing arc produces false-positive `lengthen-interval` verdicts. This was observed at iter 17–18
of the arc-2026-06-18-bug-fixing arc: 747 isError patches dropped LOC to a low; standard thresholds
would have signaled saturation while the bitwarden, mock-coverage, and static-isError seams remained open.
See `retrospectives/arc-2026-06-18-bug-fixing.md` § "The Saturation Curve Is Different".
