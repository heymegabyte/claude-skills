---
priority: high
pack: core
triggers:
  - "audit-doctrine"
  - "doctrine baseline"
  - "principle drift"
  - "milestone"
  - "--gate"
  - "CI doctrine"
paths:
  - ".github/workflows/**"
  - "rules/**"
---

# Principle Stability Monitoring

Tracks doctrine surface against a known-good milestone snapshot. Lost principles are
P1 blockers; gained principles are P3 notifications. Prevents silent rule decay across
merges and loop arcs.

## Why this exists

`/audit-doctrine` produces a structured JSON baseline at any moment. Without a CI gate
that *compares* the current surface to a committed baseline, principles can silently
disappear — a rule file gets deleted, a skill loses a section, a merge squashes a key
bullet. This rule makes that decay observable and merge-blocking.

## PR gate (what every PR runs)

```bash
/audit-doctrine --milestone=30-30-true-saturated --gate
```

- `--milestone=<label>` identifies the snapshot stored in `rules/audit-baselines/<label>.json`
- `--gate` exits non-zero if any PRESENT→MISSING transitions are detected
- The gate is additive: new MISSING→PRESENT (gained principles) are logged but do not block

### Severity table

| Transition       | Label      | PR action         | Alert channel              |
|------------------|------------|-------------------|----------------------------|
| PRESENT→MISSING  | LOST       | P1 — block merge  | `principles-incident-log`  |
| PARTIAL→PRESENT  | PROMOTED   | P3 — allow merge  | audit summary comment      |
| MISSING→PRESENT  | GAINED     | P3 — allow merge  | audit summary comment      |
| PRESENT→PARTIAL  | DEGRADED   | P2 — warn + allow | `principles-incident-log`  |
| unchanged        | STABLE     | pass silently     | —                          |

## Baseline update protocol

When a principle is intentionally promoted, demoted, or retired, capture a fresh snapshot:

```bash
# 1. Make the intentional rule change
# 2. Re-run audit with a new milestone label
/audit-doctrine --milestone=<YYYY-MM-DD-<slug>> --save

# 3. Commit the new baseline alongside the rule change in the SAME commit
git add rules/audit-baselines/<YYYY-MM-DD-<slug>>.json
git commit -m "docs(doctrine): promote <principle> — baseline <YYYY-MM-DD-<slug>>"

# 4. Update the CI workflow MILESTONE env var
```

Never update the baseline *without* updating the CI milestone reference — stale milestone
references defeat the gate.

## GitHub Actions CI snippet

```yaml
# .github/workflows/doctrine-gate.yml
name: Doctrine Gate

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

env:
  MILESTONE: "30-30-true-saturated"   # <-- bump when baseline intentionally changes

jobs:
  doctrine:
    name: Principle Stability Gate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: "22"

      - name: Install Claude CLI
        run: npm install -g @anthropic-ai/claude-code

      - name: Run doctrine audit gate
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          claude --print "/audit-doctrine --milestone=$MILESTONE --gate" \
            || (echo "::error::P1 — lost principles detected. Check audit output above." && exit 1)

      - name: Upload baseline diff
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: doctrine-audit-${{ github.sha }}
          path: rules/audit-baselines/_last-diff.json
          if-no-files-found: ignore
```

## Current baseline

Latest committed baseline: `30-30-true-saturated`
Location: `rules/audit-baselines/30-30-true-saturated.json`

30 principles tracked across 30 rule files. All PRESENT at saturation. This is the
floor every future merge must clear.

## Principles incident log

When a LOST or DEGRADED transition fires in CI, create an entry in
`rules/audit-baselines/_incident-log.ndjson`:

```jsonc
{
  "ts": "2026-06-18T12:00:00Z",
  "milestone": "30-30-true-saturated",
  "principle": "zod-everywhere",
  "transition": "PRESENT→MISSING",
  "pr": 1712,
  "resolution": "restored in commit abc1234",
  "resolved_at": "2026-06-18T14:00:00Z"
}
```

One NDJSON line per incident. Never delete lines — append only. This log is the
source-of-truth for "how often does doctrine decay" metrics.

## Routing rule — when to touch the baseline

| Scenario                                         | Action                                        |
|--------------------------------------------------|-----------------------------------------------|
| New rule file adds a principle                   | Re-run `/audit-doctrine --milestone=<new>` next arc |
| Rule file intentionally deleted                  | Update baseline + milestone ref SAME commit   |
| CI gate fires on a false positive                | Investigate first; update ONLY if intentional |
| Loop arc completes (see `loop-arc-economics`)    | Run `/audit-doctrine --save` as final step    |

## See also

- `[[audit-doctrine]]` — the audit skill that produces baselines and diffs
- `[[conditional-ci-gates]]` — broader CI gate framework
- `[[drift-detection]]` — rule for catching doctrine drift in-turn
- `[[principles-incident-log]]` — incident append protocol
- `[[loop-arc-economics]]` — when to trigger a new audit after an arc
