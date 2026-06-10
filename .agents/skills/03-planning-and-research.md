---
name: "planning-and-research"
description: "Deep web research, competitor scanning, technology evaluation, and implementation planning. Decomposes work into vertical slices, identifies parallel workstreams, tracks assumptions with confidence levels, and designs the critical path for minimum wall-clock time."
metadata:
  version: "2.1.0"
  updated: "2026-05-03"
  effort: "high"
  model: "opus"
license: "Rutgers"
compatibility:
  claude-code: ">=2.0.0"
  agentskills: ">=1.0.0"
priority: 2
pack: "research"
triggers:
  - "research"
  - "plan"
  - "competitor"
paths:
  - "*"
---

# 03 — Planning and Research

## Deep research protocol

Before any non-trivial implementation:

1. Web search top 50 results for primary keyphrase
2. Read top 10 in depth — extract directives + counter-arguments
3. Cross-ref against existing rule mesh
4. Confidence-track every claim 0-1

Use `web_search_20260209` + `web_fetch_20260209` (free when paired with `code_execution_20260120`).

## Competitor scanning

For every website build, run `rules/competitor-research.md` Phase -1 BEFORE Phase 0:

- Identify top 5-10 audience-comparable sites
- Score each on 100-pt rubric (10 dims × 10pts)
- Set ≥15% beat-floor for Phase 6 loop termination

## Technology evaluation

For every new dep / framework / service consideration:

1. **Already have equivalent?** → use it
2. **Feature truly needed?** → if speculative, defer
3. **License?** → OSS free only (per `rules/brian-preferences.md` priority order)
4. **CF compat?** → adapter pattern per `rules/cloudflare-hostable-supervisor.md`
5. **Bundle/perf impact?** → measure before commit
6. **Lighter existing solution?** → prefer
7. Decide: install now · defer · adapter-only · reject + document why

## Implementation planning

### Decomposition

- Identify atomic units (file × layer)
- Mark dependencies between units
- Distinguish independent vs serial chains

### Vertical slicing

Per `06-build-and-slice-loop`:

- Each slice ships through every layer (UI → API → DB → tests → deploy)
- Homepage FIRST (no exceptions)
- Slice = one feature, not one layer

### Parallelism plan

Per `rules/parallel-subagent-economy.md`:

- ≥5-min wall-clock saving + independent → fan out
- Sweet spot 3-4 specialists, ceiling 6
- Batch beyond 6 in waves
- Sonnet default; Opus for security/architect/visual-qa overrides

### Critical path

- Identify longest dependency chain
- Front-load research that gates implementation
- Parallelize everything off the critical path
- Wall-clock = max(critical_path, max parallel branch)

## Assumption tracking

Every assumption logged in `_assumptions.md` with:

- Claim
- Confidence 0-1
- Evidence sources
- Decision impact if wrong
- Verification trigger

Confidence <0.7 → research more. Per `rules/auto-meta-work.md`.

## Three-Layer Knowledge

Per `~/.claude/CLAUDE.md` § Thinking:

- L1 = proven (existing rules + patterns)
- L2 = trending (blog posts, recent papers)
- L3 = first principles (build from scratch)

Prefer L3. Best outcome of research is NOT finding a solution to copy — it's understanding the problem deeply enough to design a better one.

## Self-Argue (before major decisions)

Generate strongest counterargument. If you can't defeat it, decision is wrong.

## Boil-the-lake

Marginal cost of completeness is near-zero. When complete costs minutes more than shortcut, do complete. Boil lakes, flag oceans.

## Output artifacts

- `_research.json` — raw findings, source URLs, confidence
- `_assumptions.md` — tracked claims
- `PLAN.md` — implementation roadmap w/ parallelism plan + critical path
- `_decisions.md` — architectural decisions w/ rationale + alternatives
- `_brief_summary.txt` — 100-word digest for downstream agents
