# Prompt Cache Optimization

## Skill load order (deterministic)
- Skills load: 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12 → 13 → 14 → 15 → 16
- Static content (CLAUDE.md, rules, skill descriptions) at conversation start = cacheable prefix
- Dynamic content (conversation, tool output) after
- Anthropic prompt caching saves 90% on repeated prefixes — random skill activation order defeats it

## Rules load order (alphabetical, never reorder mid-session)
- always → auto-meta-work → brian-preferences → citations → code-style → computer-use-safety → copy-writing → error-recovery → fetch-defaults → full-autonomy → hono-api → i18n-by-demographics → image-quality → logo-contrast → model-routing → monitor-orchestration → payments-routing → prompt-cache → quality-metrics → secret-auto-provisioning → secret-provisioning → source-site-enhancement → text-contrast → timeline-authenticity → verification-loop
- Skills: description always in context, full content only on activation
- Submodules: load on demand, never preload all

## Cache mechanics
- Minimum cacheable prefix is model-dependent:
  - **Opus 4.7/4.6/4.5 + Haiku 4.5** require 4,096 tokens
  - **Sonnet 4.6/4.5 + Opus 4.1 + older** require 1,024 tokens
- Max **4 explicit `cache_control` breakpoints** per request
- TTL: 5min default (free refresh on hit), 1hr extended via `{"ttl": "1h"}`
- 1h entries MUST precede 5m entries in the same request — out-of-order placement silently demotes 1h to 5m

## Cache pricing multipliers
- 5m write = 1.25×
- 1h write = 2.0×
- Read = 0.1×
- Output = 1.0×
- Break-even: 1h beats 5m only at ≥ 3 reads/hour

## Breakpoint placement
- Set at natural boundaries: end of tool definitions, end of system prompt, end of rules, end of conversation
- Optimal ordering: Tools → system → rules → skills → conversation

## Cache pre-warm
- `max_tokens: 0` populates cache before users arrive
- NOT available in batch, streaming, extended-thinking, or structured-outputs paths
- Cache writes still bill on warmup

## Invalidation triggers
- Tool defs change → ENTIRE cache cleared
- `web_search`/`citations` toggled → system + messages cleared
- `tool_choice`/images/thinking-mode change → messages cleared (system + tool-defs preserved)
- Switching adaptive ↔ enabled ↔ disabled thinking modes breaks message cache
- Any rule/skill edit invalidates that block's cache — batch edits in one prompt = single invalidation
- Avoid editing rules mid-conversation

## Cache lookback
- 20-block window
- Placing `cache_control` on per-request varying content (timestamps, request IDs) guarantees miss

## Opus 4.7 tokenizer change
- **~35% more tokens for the same input vs Opus 4.6**
- Per-token price unchanged but effective request cost rises — factor into cost-estimator and pre-warm decisions

## Subagent caching
- Fill subagents with up to 900K relevant context (skills, research, code) — they get their own cache
- Return ≤ 200 word summary to main thread
