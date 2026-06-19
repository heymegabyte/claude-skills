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
  - "*"
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

## Content stability ordering (within each block)

Put the most stable content at the top. The cache key is a prefix — any mutation invalidates everything after it:

```
[system block]                    ← BP1 or BP2 here
  1. Fixed identity paragraph     (never changes)
  2. Tool list (if not separate)  (changes on new tool)
  3. Skill pack summary           (changes on skill update)
  4. Session-volatile info        (date, user-specific) ← put LAST, after breakpoints
```

- Never put session-volatile content (current date, request ID, user ID, timestamps) before a breakpoint — it guarantees a cache miss every turn.

---

## Worked example — Claude Code subagent API call

```json
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 8192,
  "tools": [
    {
      "name": "bash",
      "description": "Execute a shell command...",
      "input_schema": { "type": "object", "properties": { "command": { "type": "string" } } }
    },
    {
      "name": "read",
      "description": "Read a file from disk...",
      "input_schema": { "type": "object", "properties": { "file_path": { "type": "string" } } }
    }
  ],
  "tool_choice": { "type": "auto" },

  "system": [
    {
      "type": "text",
      "text": "You are a deploy-verifier agent...\n\n[IDENTITY — 200 tokens, never changes]"
    },
    {
      "type": "text",
      "text": "## Stack rules\n\n[hono-api rules, cloudflare-lock-in-is-leverage, error-recovery — ~1,500 tokens, changes only when rules are edited]",
      "cache_control": { "type": "ephemeral" }
    }
  ],

  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "## Context pack\n\nProject: njsk.org\nKey files:\n- src/worker/index.ts (typed hono app)\n- wrangler.jsonc (bindings)\n\n[~2,000 tokens of relevant file content and prior research — stable for this session]",
          "cache_control": { "type": "ephemeral" }
        },
        {
          "type": "text",
          "text": "Verify the deploy at https://njsk.org — check status, console errors, JSON-LD, axe, and all 6 breakpoints. Report pass/fail per gate."
        }
      ]
    }
  ]
}
```

**Breakpoint analysis for this call:**

| Breakpoint | Location | Tokens covered | TTL recommendation |
|---|---|---|---|
| BP1 (implicit) | End of tools array | ~300 | Anthropic caches tools block automatically when `cache_control` appears elsewhere |
| BP2 | End of stack-rules system block | ~1,700 cumulative | 1 hr (stable across many deploys) |
| BP3 | End of context-pack user block | ~3,700 cumulative | 5 min (changes between projects) |
| BP4 | (unused — only 3 needed here) | — | — |

- On next call with same system + context pack, first ~3,700 tokens cost **0.1×** instead of **1.0×**. Net saving: 98.6% on the stable input portion.

---

## Placement strategy by agent type

### Orchestrator (meta-orchestrator, architect)

Heavy system prompt (CLAUDE.md + all rules). Light messages (task description only).

```
BP1 → end of tools               (1 hr TTL)
BP2 → end of system (full rules) (1 hr TTL — rules rarely change mid-session)
BP3 → end of prior agent outputs (5 min — changes each turn)
BP4 → (unused or on conversation history)
```

### Subagent (deploy-verifier, visual-qa, seo-auditor)

Minimal system prompt. Heavy context pack (research, file contents, prior findings).

```
BP1 → end of identity + role paragraph in system  (1 hr)
BP2 → end of context pack in first user message   (5 min)
BP3 → (unused — subagents are short-lived)
```

### Chat endpoint (user-facing assistant)

```
BP1 → end of tools block         (1 hr)
BP2 → end of system prompt       (1 hr)
BP3 → end of conversation so far (5 min — per-turn)
BP4 → (reserve for tool output caching in agentic loops)
```

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

Send a request with `max_tokens: 1` to populate cache before users arrive. Write still bills at 1.25× or 2.0× but output cost is minimal.

```bash
# Pre-warm script (run before peak traffic)
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-sonnet-4-6",
    "max_tokens": 1,
    "system": [
      { "type": "text", "text": "<your full system prompt>",
        "cache_control": { "type": "ephemeral" } }
    ],
    "messages": [{ "role": "user", "content": "ping" }]
  }'
```

- Not available in: batch mode, streaming, extended thinking, structured outputs paths.

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

---

## Cost reduction estimates

| Scenario | Tokens cached | Cache read cost vs uncached | Net saving |
|---|---|---|---|
| Full warm (stable system + context) | 90% of input | 0.1× on 90% | ~82% off input cost |
| Partial warm (system only) | 40% of input | 0.1× on 40% | ~36% off input cost |
| Cold (no cache or miss) | 0% | 1.0× on all | 0% |

- **Target: ≥70% warm hit rate** across a session. Below 70% → investigate with the checklist above.
- Output tokens are never cached — on response-heavy tasks, caching has diminishing returns.

---

## Token-efficient tool use (bonus — Sonnet 4.6 only)

```
anthropic-beta: token-efficient-tools-2025-02-19
```

- Add this header on every `messages.create` inside agent / MCP / tool-use loops.
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
