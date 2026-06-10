---
name: "03 build-breaking planning+research rules"
description: "Universal parallelism + research gates: every build's task graph MUST be parallelized via fan-out architecture (research+brand+media+content concurrent), parallel research agents by era/topic, critical path optimization with concurrency floor, assumption-driven slicing with confidence-tracked decisions. Migrated from prompt-improvements brainstorm 2026-05-10."
metadata:
  version: "1.0.0"
  updated: "2026-05-10"
  effort: "high"
  context: "fork"
license: "Rutgers"
compatibility:
  claude-code: ">=2.0.0"
  agentskills: ">=1.0.0"
---

# 03 — Build-Breaking Planning + Research Rules

Initialized from prompt-improvements brainstorm 2026-05-10 — 4 parallelism rules (#9-12) that bind planning + research phase.

## Every build (***PARALLELISM #1 — FAN-OUT ARCHITECTURE FROM PROMPT-ZERO — UNIVERSAL — BUILD-BREAKING***)

- Build orchestrator MUST spawn ALL boot-time tasks concurrently at prompt-zero — research, brand extraction, media pre-fetch, content corpus crawl, route discovery, sitemap fetch, source-site Wayback lookup
- Never sequentially

### Pipeline

1. Orchestrator boots
2. In single `Promise.all([...])` block launches:
   - `research_task`
   - `brand_extraction_task`
   - `media_prefetch_task`
   - `corpus_crawl_task`
   - `route_discovery_task`
   - `wayback_task`
   - `competitor_scan_task`
3. All must complete before `content_synthesis_task` fires

### Concurrency floor

- 7 boot tasks

### Validator

- `validate-parallel-boot.mjs` — parse `_build_trace.json`, assert ≥7 tasks have overlapping `started_at` windows within 5s of orchestrator boot AND `content_synthesis_task.started_at >= max(boot_tasks.ended_at)`

## Every build (***PARALLELISM #2 — DEEP-RESEARCH AGENTS PER ERA/TOPIC — UNIVERSAL — BUILD-BREAKING***)

- Any site with >50yr history OR >10 content categories OR >100 source-corpus pages MUST split research into ≥3 parallel deep-research agents
- Never single-agent serial crawl

### Splits

- **Era-based** (institutions) — pre-1900 | 1900-1970 | 1970-present
- **Topic-based** (orgs) — products | team | press | case-studies | careers | engineering-blog

### Per-agent output

- `research/<era|topic>-<slug>.json` matching `njsk-timeline-v1` schema
- Fields: `events[]`, `refs[]`, `uncertainties[]`, `verbatim_quotes[]`
- Then merge → dedupe → typecheck → render

### Validator

- `validate-parallel-research.mjs` — assert `research/` contains ≥3 era/topic-segmented JSON files AND their `started_at` windows overlap within 30s

## Every build (***PARALLELISM #3 — CRITICAL-PATH OPTIMIZATION + CONCURRENCY FLOOR — UNIVERSAL — BUILD-BREAKING***)

- Build planner MUST emit `_critical_path.json` before any build phase fires
- Lists every phase, its dependencies, max-concurrency-at-each-step, projected wall-clock
- Phase ordering MUST optimize critical path (longest dependency chain) — never serialize independent tasks

### Concurrency floor per phase

- **Phase 0 (boot)** — ≥7
- **Phase 1 (synthesis)** — ≥3 (page-by-page parallel)
- **Phase 2 (media fill)** — ≥10 (GPT Image 1.5 batch)
- **Phase 3 (validation)** — ≥5 (parallel validators)
- **Phase 4 (deploy)** — ≥1

### Total wall-clock target

- 5-page site — 10 min
- 20-page site — 15 min
- 100-page site — 25 min

### Validator

- `validate-critical-path.mjs` — assert `_critical_path.json` exists with all phases declared + concurrency floors met in `_build_trace.json` AND total duration ≤ projected wall-clock × 1.5

## Every build (***PARALLELISM #4 — ASSUMPTION-DRIVEN SLICING WITH CONFIDENCE-TRACKED DECISIONS — UNIVERSAL — BUILD-BREAKING***)

- Every build plan MUST decompose into vertical slices where each slice carries explicit assumption + confidence (0-1) + fallback

### Format

```
_slice_plan.json[i] = {
  slice_id,
  task,
  parallel_with: [slice_ids],
  depends_on: [slice_ids],
  assumption: "...",
  confidence: 0.X,
  fallback_if_violated: "..."
}
```

### Confidence rules

- **<0.7** — slice MUST emit fact-check sub-task before main task fires
- **≥0.7 + low-risk** — auto-execute
- Assumptions discovered violated during build → slice rolls back to fallback + logs to `_assumption_violations.json`

### Validator

- `validate-slice-confidence.mjs` — assert `_slice_plan.json` has all 5 fields per slice AND no slice with confidence <0.7 lacks fact-check sub-task AND no assumption violation went unlogged
