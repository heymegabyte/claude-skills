# Agent Report Template

<!-- Copy into the final report of every multi-agent run. Governed by [[agent-selection]]. -->
<!-- Lives at: templates/agent-report.md — copy-paste, never edit in place. -->
<!-- Fill the Assignment Table BEFORE spawning. Fill one Structured Agent Report per spawned agent. -->
<!-- The reviewer fills the Reviewer-only addendum + Agent Diversity Review table at fold-back. -->

## 1. Agent Assignment Table (***fill BEFORE spawning***)

| Agent | Purpose | Scope | Non-goals | Deliverable | Verification |
|-------|---------|-------|-----------|-------------|--------------|
| `<agent-name>` | <one-line why it exists> | <files / dirs it owns> | <what it must NOT touch> | <concrete artifact> | <how its work is proven: build / test / E2E / screenshot> |
| | | | | | |
| | | | | | |

### Rejected-agent note (***specialists considered but not spawned***)

| Specialist considered | Reason not needed |
|-----------------------|-------------------|
| `<agent-name>` | <why this run didn't warrant it> |
| | |

## 2. Structured Agent Report

<!-- Duplicate this block once per spawned agent. -->

## Agent Report: `<agent-name>`

- **Mission** — <the 100-300 word brief, distilled to one or two sentences>
- **Files inspected** — <absolute paths read / grepped but not changed>
- **Files changed** — <absolute paths written / edited, one per line>
- **Decisions** — <key choices made + the rationale behind each>
- **Verification performed** — <exact commands run + pass/fail; build, unit, E2E, a11y, screenshots>
- **Risks** — <what could break, what was left fragile, what assumptions were made>
- **Recommended follow-up** — <next-prompt language for anything not shipped this turn>
- **Should this become a reusable global improvement?** — Yes / No + <reason; if Yes, name the rule/skill/template/command it should land in>

## 3. Reviewer-only addendum

<!-- Filled by the agent-diversity-reviewer / completeness reviewer at fold-back, never by the worker agent. -->

- **Pass/fail** — PASS | FAIL | PASS WITH WARNINGS
- **Blocking issues** — <merge-blockers that must be fixed this turn; "none" if clean>
- **Non-blocking improvements** — <nice-to-haves shipped inline or surfaced in Recs>
- **Global config improvements recommended** — <rule / skill / template / command edits worth landing in `~/.claude/` or the plugin; "none" if nothing>

## 4. Agent Diversity Review table

<!-- The 5 standard rows. Run every multi-agent turn per [[agent-selection]]. -->

| Review Question | Result | Action Taken |
|-----------------|--------|--------------|
| Were named specialists used instead of generic do-everything agents? | Yes / No | <action> |
| Was any specialist that should have run missing from this turn? | Yes / No | <action> |
| Did any two agents have overlapping scope? | Yes / No | <action> |
| Did this run reveal a new reusable agent worth defining? | Yes / No | <action> |
| Does a global skill / rule / command need updating from this run? | Yes / No | <action> |
