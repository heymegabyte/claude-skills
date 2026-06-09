---
name: "model-routing"
priority: 2
pack: "ai"
triggers:
  - "opus"
  - "sonnet"
  - "haiku"
  - "claude model"
paths:
  - "*"
---

# Model Routing

## Opus 4.8 (`claude-opus-4-8`) — flagship

- **Use for** — same surfaces as Opus 4.7 below; zero-cost upgrade (same $5/$25 per MTok pricing).
- 1M context, 128K output. Adaptive thinking only.
- Source: Anthropic. (2026). *Models overview*. `docs.anthropic.com/en/docs/about-claude/models/overview`
- Migration: `rg "claude-opus-4-7" ~/.claude ~/.agentskills` → s/4-7/4-8/. Keep 4.7/4.6 as fallback chain per `opus-quota-fallback`.

## Opus 4.7 (`claude-opus-4-7`) — fallback

- **Use for** — architecture decisions, complex multi-file refactors, security review, planning, competitive analysis, visual QA, completeness verification, agentic orchestration.
- 1M context, 128K output.
- **Adaptive thinking is the ONLY mode** — manual `thinking.type:"enabled"` with `budget_tokens` returns 400.
- `thinking.display:"omitted"` is default — set `"summarized"` to surface reasoning.
- `xhigh` effort recommended (Opus-4.7-only; falls back to `high` elsewhere).
- New tokenizer produces ~35% more tokens per input vs 4.6 — factor into cost.

## Opus 4.6 (`claude-opus-4-6`)

- Stable fallback if 4.7 unavailable.
- 1M context, 128K output.
- `thinking.type:"enabled"` deprecated but still works; prefer `adaptive`.

## Sonnet 4.6 (`claude-sonnet-4-6`)

- **Use for** — standard implementation, feature building, debugging, testing, code simplification, deployment.
- 1M context, 64K output.
- `interleaved-thinking-2025-05-14` header still needed for manual interleaved mode.

## Haiku 4.5 (`claude-haiku-4-5`)

- **Use for** — formatting, linting review, changelog generation, content writing, simple code review, hook evaluation, cost estimation.
- 200K context, 64K output.
- Prefer evergreen alias `claude-haiku-4-5` over the dated `…-20251001` snapshot.

## Retired models (requests error)

- `claude-3-opus`
- `claude-3-haiku`
- `claude-sonnet-3-7`
- `claude-haiku-3-5`
- **Retired Apr 19 2026** — `claude-haiku-3`
- **Retiring Jun 15 2026** — `claude-sonnet-4` (alias `claude-sonnet-4-0` → `…-20250514`), `claude-opus-4` (alias `claude-opus-4-0` → `…-20250514`)

## Never

- **Opus** — single-file edits, formatting, commit messages, simple bug fixes
- **Haiku** — architecture, security, complex logic, multi-file refactors

## Agent routing

- **Opus** — architect, completeness-checker, security-reviewer, visual-qa, meta-orchestrator (each has `model_fallback: claude-sonnet-4-6` + `effort_fallback: high` per ``opus-quota-fallback``)
- **Sonnet** — code-simplifier, computer-use-operator, deploy-verifier, dependency-auditor, incident-responder, migration-agent, performance-profiler, test-writer
- **Haiku** — seo-auditor, content-writer, accessibility-auditor, cost-estimator, changelog-generator

## Quota-aware routing

- When the user has switched the session to Sonnet (`/model claude-sonnet-4-6`), Opus-pinned agents transparently read their `model_fallback` field and spawn as Sonnet
- When `~/.claude/.opus-disabled` flag file exists OR `CLAUDE_OPUS_DISABLED=true` is exported, same fallback fires
- When an Opus API call 429s on `rate_limit` / `quota_exceeded`, the Monitor sets an in-memory `OPUS_AVAILABLE=false` for the next 5 minutes
- Fast Mode (`/fast`) auto-disables when `OPUS_AVAILABLE=false` — no user prompt needed
- Sonnet fallback is ~5-10% quality drop on Brian's typical workload — acceptable to keep shipping; never blocks work
- Defer ``supreme-polish`` / ``source-site-enhancement`` § 9-agent fan-out / payment+auth security reviews until Opus restores

## Effort parameter

- **`xhigh`** — architecture / security / planning on Opus 4.8 / 4.7
- **`max`** — same on 4.6
- **`high`** — implementation / testing
- **`medium`** — content writing
- **`low`** — formatting / changelog

Match effort to task complexity.

## Batch API

- 50% discount.
- Extended-output via header `output-300k-2026-03-24` unlocks 300k output for Opus 4.8/4.7/4.6 + Sonnet 4.6.
- Pre-warm cache with `max_tokens:0` (not in batch / streaming / extended-thinking paths).

## Cloudflare Workers AI (`env.AI.run`)

- **Always reach for the FP8 variants** — the full-precision aliases are deprecated on most accounts and return 400 at runtime
- **Llama 3.3 70B** → `@cf/meta/llama-3.3-70b-instruct-fp8-fast` (2-3× faster + free on Workers AI)
- **Llama 3.1 8B** → `@cf/meta/llama-3.1-8b-instruct-fp8`
- **Llama 4 Scout 17B** → `@cf/meta/llama-4-scout-17b-16e-instruct` (vision-capable, multimodal)
- **Never use** — `@cf/meta/llama-3.3-70b-instruct`, `@cf/meta/llama-3.1-8b-instruct`, `@cf/meta/llama-3.1-70b-instruct` (retired)
- Verify availability via REST: `GET /accounts/{id}/ai/models/search?search=<term>` before shipping a model name in code
- Reference incident (2026-05-24, projectsites.dev): AI chat returned "service is unavailable" 100% — 18 files referenced retired aliases; patched to `…-fp8-fast` + `…-fp8` in one sed pass.

## Hierarchical orchestration

1. **Orchestrator** — Opus, `xhigh`
2. **Specialists** — Sonnet, `high`
3. **Grunts** — Haiku, `low`

Hierarchical compounds gains over flat fanout. Sub-agent prompts 100–300 words — beyond that you're cloning context, not specializing.

Spawned specialists for batch test/feature work run on the standing `CLAUDE_CODE_SUBAGENT_MODEL=claude-sonnet-4-6` default per `parallel-subagent-economy` — Opus orchestrates, Sonnet builds. Opus-pinned reviewers (architect/security/visual-qa/meta-orchestrator) override that default with an explicit `model: opus` on the spawn; the call-level model param takes precedence over the env default.
