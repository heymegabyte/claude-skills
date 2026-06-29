---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Writing Plans

Write an implementation plan for an engineer with zero context for this codebase and questionable test taste. Decompose into bite-sized, independently verifiable tasks. DRY, YAGNI, TDD, frequent commits.

Pairs with `/generate-prp` (research-driven blueprint) and `/writing-plans`. Save to `docs/superpowers/plans/YYYY-MM-DD-<feature>.md` (user preference overrides). Worktree, if isolated, comes from `using-git-worktrees` at execution time.

Announce: "Using the writing-plans skill to create the implementation plan."

## Scope

- One plan per independent subsystem — each must produce working, testable software alone. If the spec spans several, suggest splitting into separate plans.

## File structure (decide before tasks)

- Map every file to create/modify and its single responsibility — this locks in decomposition.
- One responsibility per file; prefer small focused files; files that change together live together (split by responsibility, not layer).
- Follow established codebase patterns. Restructure a file only when it's grown unwieldy AND you're already modifying it.

## Task right-sizing

- A task = the smallest unit that carries its own test cycle and is worth a fresh reviewer's gate.
- Fold setup/config/scaffolding/docs into the task whose deliverable needs them. Split only where a reviewer could reject one task while approving its neighbor.
- Each task ends with an independently testable deliverable.

## Step granularity

Each step is one 2-5 min action: write failing test → run it (confirm RED) → minimal implementation → run (confirm GREEN) → commit.

## Plan document shape

Header (required):

```markdown
# [Feature] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use `- [ ]` checkboxes.

**Goal:** [one sentence]   **Architecture:** [2-3 sentences]   **Tech Stack:** [key libs]

## Global Constraints
[Project-wide spec requirements — version floors, dep limits, naming/copy rules,
platform — one line each, exact values verbatim. Every task implicitly includes this.]
```

Per task:

- **Files** — exact `Create:` / `Modify:path:lines` / `Test:` paths.
- **Interfaces** — `Consumes:` exact signatures from earlier tasks; `Produces:` exact names + param/return types later tasks rely on (implementers see only their own task).
- **Steps** — checkbox per step, with the ACTUAL test code, exact run command + expected output, the ACTUAL implementation code, and the commit.

## No placeholders (these are plan failures)

- "TBD"/"TODO"/"implement later"/"fill in details".
- "Add appropriate error handling / validation / edge cases".
- "Write tests for the above" without the test code; "similar to Task N" without repeating the code (tasks may be read out of order).
- Steps describing what without showing how (code steps need code blocks).
- References to types/functions/methods not defined in any task.

## Self-review (yourself, not a subagent)

1. **Spec coverage** — every spec requirement maps to a task; list + fill gaps.
2. **Placeholder scan** — hunt the patterns above; fix inline.
3. **Type consistency** — names/signatures in later tasks match earlier definitions (`clearLayers()` in T3 vs `clearFullLayers()` in T7 is a bug).

For a fresh-eyes pass, dispatch `plan-document-reviewer-prompt.md`.

## Execution handoff

Offer: **(1) Subagent-driven** (recommended) — `superpowers:subagent-driven-development`, fresh subagent per task + two-stage review; **(2) Inline** — `superpowers:executing-plans`, batch execution with checkpoints.
