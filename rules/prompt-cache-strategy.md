---
name: "prompt-cache-strategy"
priority: 2
pack: "ai"
triggers:
  - "prompt cache"
  - "cache_control"
  - "cache breakpoint"
  - "anthropic cache"
  - "input token cost"
  - "cache hit"
  - "cache miss"
  - "warm cache"
paths:
  - "concern:ai-features"
---

# Prompt Cache Strategy (Deep Dive)

Extends `[[prompt-cache]]` with implementation-grade detail: exact breakpoint placement, model thresholds, ordering rules, invalidation triggers, and a fully annotated worked example.

Source: Anthropic. (2025). *Prompt caching*. `docs.anthropic.com/en/docs/build-with-claude/prompt-caching`

---

## Token minimums (hard floor — cache silently skips below these)

| Model family | Min cacheable prefix |
|---|---|
| claude-opus-4-8 / 4.7 / 4.6 / 4.5 | **4,096 tokens** |
| claude-haiku-4-5 | **4,096 tokens** |
| claude-sonnet-4-6 / 4.5 | **1,024 tokens** |
| claude-opus-4-1 and older Sonnet/Haiku | **1,024 tokens** |

- Claude Code subagents run `claude-sonnet-4-6` → 1,024-token floor is achievable with even a modest system prompt + rules pack.
- Opus 4.7/4.8 tokenizer is ~35% heavier than 4.6 for the same UTF-8 input — a 3,000-token 4.6 prefix becomes ~4,050 tokens on 4.7/4.8, which clears the 4,096 floor naturally; factor into pre-warm decisions.

---

## Pricing multipliers

| Operation | Multiplier vs base input price |
|---|---|
| Cache write (5 min TTL) | **1.25×** |
| Cache write (1 hr TTL) | **2.0×** |
| Cache read (hit) | **0.1×** |
| Output tokens | 1.0× (unaffected) |

- **Break-even (5 min):** Write costs 1.25× once; reads cost 0.1×. Break-even at read #2. Every subsequent read saves 0.9×/read.
- **Break-even (1 hr):** Write costs 2.0×. Needs ≥3 reads in the hour for net savings. Use 1 hr TTL only for long-running agents, batch pipelines, or pre-warmed API endpoints with consistent traffic.

---

## The 4-breakpoint ceiling

Anthropic allows exactly **4** `cache_control` breakpoints per request. Place in descending stability order — most stable first:

```
BP1 → tools block          (changes rarely — new tool = invalidation)
BP2 → system prompt        (changes when CLAUDE.md / skill pack changes)
BP3 → rules + context pack (changes when a rule file is edited)
BP4 → recent conversation  (changes every turn)
```

- Unused slots have no cost — skip BP3/BP4 if only 2 breakpoints needed.
- **1-hr TTL entries MUST appear BEFORE 5-min entries** in the same request. Out-of-order placement silently demotes 1-hr entries to 5-min.

---

## Content stability ordering

- Put the most stable content at the top within each block — the cache key is a prefix; any mutation invalidates everything after it.
- Never put session-volatile content (current date, request ID, user ID, timestamps) before a breakpoint — it guarantees a cache miss every turn.
- Order within the system block: fixed identity → tool list → skill pack summary → session-volatile info (after breakpoints).

See `reference/prompt-cache-strategy.md` for the full worked API call example and per-agent-type placement patterns.

---

## Cache invalidation triggers

| Trigger | What breaks |
|---|---|
| Any tool definition changes | Entire cache cleared (all 4 BPs) |
| `web_search` / `citations` toggled | System + messages cleared |
| `tool_choice` changed | Messages cleared; system + tools preserved |
| Image added/removed from messages | Messages cleared |
| Thinking mode switch (adaptive↔enabled↔disabled) | Messages cleared |
| CLAUDE.md / skill rule file edited | System BP and all BPs after it |
| Model ID changed | Entire cache (different tokenizer = different key space) |

- **Batch edits:** Editing 5 rule files in one turn = 1 invalidation event. Editing across 5 turns = 5 events. Always batch rule file edits.

---

## Cache pre-warming

- Send a request with `max_tokens: 1` to populate cache before users arrive.
- Write still bills at 1.25× or 2.0× but output cost is minimal.
- Not available in: batch mode, streaming, extended thinking, structured outputs paths.

See `reference/prompt-cache-strategy.md` for the pre-warm curl script.

---

## Monitoring cache hit rate

Check `usage.cache_read_input_tokens` in the response body. If consistently 0:

1. Confirm prefix exceeds model minimum (4,096 for Opus/Haiku 4.5, 1,024 for Sonnet 4.6).
2. Check no volatile content sits before the breakpoint.
3. Verify `cache_control: { type: "ephemeral" }` is on the block you want to cache UP TO, not the one after.
4. Check TTL — 5-min entries expire; if requests are >5 min apart, write cost hits again.

**Expected hit rates for well-structured agents:**

- Orchestrator with stable rules pack: **~85–95% warm** after first turn.
- Subagent with per-task context pack: **~60–80%** (context changes per task).
- Chat assistant: **~70–90%** on system + tools; conversation history always cold.

**Target: ≥70% warm hit rate** across a session. Below 70% → investigate with the checklist above.

---

## Cost reduction estimates

| Scenario | Tokens cached | Cache read cost vs uncached | Net saving |
|---|---|---|---|
| Full warm (stable system + context) | 90% of input | 0.1× on 90% | ~82% off input cost |
| Partial warm (system only) | 40% of input | 0.1× on 40% | ~36% off input cost |
| Cold (no cache or miss) | 0% | 1.0× on all | 0% |

- Output tokens are never cached — on response-heavy tasks, caching has diminishing returns.

---

## Token-efficient tool use (bonus — Sonnet 4.6 only)

- Add header `anthropic-beta: token-efficient-tools-2025-02-19` on every `messages.create` inside agent / MCP / tool-use loops.
- Reduces output tokens ~14% on tool-call surfaces. Zero quality impact.
- Stack with prompt caching — they are orthogonal optimizations.
- Default-on for all Claude Code subagents per `[[parallel-subagent-economy]]`.

---

## Integration with `[[model-routing]]`

- **Opus 4.8:** 4,096-token cache floor, same 4-BP ceiling, 2.0× heavier tokenizer than 4.6 — pre-warm decisions must account for this.
- **Sonnet 4.6:** default subagent model; 1,024-token floor enables caching even lean context packs.
- **Haiku 4.5:** use for changelog/format/classification; 4,096-token floor means lean system prompts may not cache — pad with ruleset if needed.

---

## See also

- `[[prompt-cache]]` — canonical ordering rules, TTL table, invalidation summary
- `[[model-routing]]` — which model per task tier
- `[[parallel-subagent-economy]]` — subagent fresh-context defaults + token budget
- `[[opus-quota-fallback]]` — Sonnet 4.6 fallback config when Opus quota exhausted
