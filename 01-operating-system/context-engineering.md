---
name: "Context Engineering"
version: "1.0.0"
updated: "2026-04-23"
description: "JIT retrieval, structured note-taking, tool result clearing, hybrid architecture, Goldilocks prompts. Anthropic's 5 techniques for managing context in agentic workflows. 3-tier multi-agent model. Compaction strategies."
---

# Context Engineering

Replaced "prompt engineering" as the discipline. Context>prompting — what the model sees matters more than how you ask.

## 5 Techniques (Anthropic Engineering)

**JIT retrieval:** agents hold file paths/identifiers, load data at runtime. Never preload entire codebases. `grep`/`head` for targeted reads, not `cat *`.

**Structured note-taking:** persistent notes outside context window (`progress.md`, `SPEC.md`) for multi-hour operations. Preserves coherence across compactions. Write before context>60%.

**Tool result clearing:** safest compaction — remove tool outputs, keep reasoning chain. Reconstructable data is disposable; decisions are not.

**Hybrid architecture:** pre-load `CLAUDE.md`+rules (cacheable prefix) + allow autonomous exploration via tools. Static context sets policy; dynamic context discovers facts.

**Goldilocks prompts:** XML/Markdown-sectioned, specific enough to guide, flexible enough for heuristics. System prompts >3000 tokens degrade reasoning. Rules: pipe-delimited one-liners. Skills: dense fragments. CLAUDE.md <200 lines.

## 3-Tier Multi-Agent Model

**Tier 1 — In-process:** Claude Code subagents, same terminal, shared filesystem. Fast. Default.
**Tier 2 — Local orchestrator:** 3-5 agents in isolated worktrees, task state files for coordination, file ownership enforced. Sweet spot for feature work.
**Tier 3 — Cloud async:** overnight runs, return to a PR. Agent teams, remote triggers, `/ultraplan`.

Coordination: shared task list + dependency tracking + peer messaging + file locking. Each agent sees only files it owns (specialization > generalism). Token costs scale linearly with agent count.

## Context Budget

Subagents: fill with 900K relevant context (skills+code+docs+web research). Return ≤200-word summary to main thread. Main thread: orchestrate only, never implement. Context >60% → save `progress.md` → spawn fresh.

## Anti-Patterns

Context rot: agent understanding degrades as conversation grows — compact proactively. Autonomy outrunning verification: every build step needs a check step. 48% of AI-generated code contains security vulnerabilities (Becker study) — never skip review. Idle time doubles in agentic mode — keep agents busy, not developers waiting.

## Caching Strategy

Deterministic load order: Tools→System→CLAUDE.md→rules(alpha)→skill descriptions→MEMORY.md→conversation. Static prefix = cacheable (90% savings on repeated reads). Min cacheable: Opus 4096 tokens, Sonnet 2048 tokens. Cache TTL: 5min default, 1hr with frequent access.

## Ownership
**Owns:** context window strategy, compaction triggers, subagent context loading, caching order, note-taking protocol, JIT retrieval patterns, multi-agent coordination.
**Cross-refs:** autonomous-orchestrator.md (Ralph Loop), output-compression.md (token reduction).
