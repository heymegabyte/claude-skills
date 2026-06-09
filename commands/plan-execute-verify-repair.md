---
description: Run the autonomous-engineering operating loop on a task (plan→implement→verify→repair→report)
argument-hint: <task description>
---

Run the autonomous engineering operating loop per [[autonomous-engineering]].

**Purpose** — drive a task end-to-end with built-in verification + repair, no premature stop.

**When to use** — any non-trivial implementation task that should run to a verified, deployed finish.

**Inputs** — `$ARGUMENTS` = the task.

Loop (in order; repair-loop on any red, max 3 cycles):

1. **Inspect** — read the relevant code + tests + docs; understand current state.
2. **Plan** — vertical slice plan; decompose + parallelize independent work per [[monitor-orchestration]].
3. **Implement** — TDD-first (failing test before code per [[verification-loop]]); full files, no stubs.
4. **Typecheck** — `tsc --noEmit` (or stack equivalent).
5. **Test** — unit suite green.
6. **E2E** — Playwright against PROD URL, homepage-first, 6 breakpoints.
7. **Validate architecture** — feature-module + flag + drift gates per [[feature-module-architecture]] / [[drift-detection]].
8. **Repair** — fix every red, re-run from the failing step.
9. **Docs** — JSDoc + CLAUDE.md + FEATURES.md updates for what changed.
10. **Skills** — fold any REUSABLE lesson into global config per [[prompt-as-training-signal]].
11. **Report** — Changes / Next / Recs per [[always]] end-of-response report.

**Outputs** — deployed change, green gates, verification log, docs updated, end-of-turn report.

**Verification** — typecheck + unit + E2E all green; prod route fetched + asserted per [[verification-loop]]; no console errors.

**Can update ~/.agentskills or ~/.claude?** Only via step 10 (the skills/lessons step) — reusable lessons only. Otherwise NO.
