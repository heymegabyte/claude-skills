# Prompt Cache Strategy — implementation reference

Sourced on demand by rules/prompt-cache-strategy.md.

---

## Worked example — Claude Code subagent API call

Full annotated JSON body showing exact `cache_control` placement, breakpoint positions,
and cumulative token counts for a deploy-verifier subagent.

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

On next call with same system + context pack, first ~3,700 tokens cost **0.1×** instead of
**1.0×**. Net saving: 98.6% on the stable input portion.

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

## Cache pre-warming script

Send a request with `max_tokens: 1` to populate cache before users arrive.
Write still bills at 1.25× or 2.0× but output cost is minimal.

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

Not available in: batch mode, streaming, extended thinking, structured outputs paths.

---

## Content stability ordering (within each block)

Put the most stable content at the top. The cache key is a prefix — any mutation
invalidates everything after it.

```
[system block]                    ← BP1 or BP2 here
  1. Fixed identity paragraph     (never changes)
  2. Tool list (if not separate)  (changes on new tool)
  3. Skill pack summary           (changes on skill update)
  4. Session-volatile info        (date, user-specific) ← put LAST, after breakpoints
```
