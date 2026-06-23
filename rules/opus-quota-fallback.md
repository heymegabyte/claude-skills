---
name: "opus-quota-fallback"
priority: 2
pack: "ai"
triggers:
  - "quota"
  - "fallback"
paths:
  - "*"
---

# Opus Quota Fallback

When Opus weekly quota is exhausted or unreachable, silently fall back to Sonnet. No `/model` re-toggle needed. No agent spawn failures dangling.

## Detection signals (any one fires fallback for rest of session)

- **User `/model`**: typed `/model claude-sonnet-4-6` this session
- **Flag file**: `~/.claude/.opus-disabled` exists (`touch ~/.claude/.opus-disabled` to pre-set)
- **Env var**: `CLAUDE_OPUS_DISABLED=true` in shell
- **Transient 429**: any spawn errors with `rate_limit` or `quota_exceeded` on Opus → in-memory flag for session
- **Usage ≥95%**: `/usage` shows weekly all-models ≥95% → proactively switch without waiting for 429

When ANY signal fires: internal `OPUS_AVAILABLE=false` for remainder of session.

## Fallback rules

### Agent frontmatter convention

Every agent declaring `model: opus` (or `claude-opus-4-8` / `claude-opus-4-7` / `claude-opus-4-6`) MUST also declare:

```yaml
model: claude-opus-4-7
model_fallback: claude-sonnet-4-6
effort: xhigh
effort_fallback: high
```

When `OPUS_AVAILABLE=false`, main thread reads `model_fallback` + `effort_fallback` and uses those in the `Agent` tool call's `model:` parameter.

### Skill `effort:` frontmatter

Skills with `effort: xhigh` ship with `effort_fallback: high`. Monitor degrades on quota miss.

### Fast Mode (`/fast`)

Opus-only. When `OPUS_AVAILABLE=false`, Fast Mode auto-disables — main thread runs Sonnet at standard speed.

### Hard-coded Opus in prose

Any skill/rule body recommending Opus 4.8 or 4.7 MUST pair with "(Sonnet 4.6 fallback when Opus quota exhausted)". Never hard-code `claude-opus-4-8` or `claude-opus-4-7` without the fallback path.

## Quality during fallback

- **Architecture decisions**: xhigh → high (-10%, reasoning depth slightly shallower)
- **Completeness checks**: xhigh → high (-5%, Sonnet catches ~90%)
- **Security review**: xhigh → high (-15%, sophisticated supply-chain attacks may be missed)
- **Visual QA**: xhigh → high (-5%, subjective scoring slightly noisier)
- **Meta-orchestration**: xhigh → high (-10%, multi-MCP chain planning slightly less creative)
- **Feature implementation**: high → high (0%, already Sonnet)
- **Content writing**: medium → medium (0%)
- **Code formatting / changelogs**: low → low (0%)

Total session quality dip: ~5-10%. Acceptable for keeping shipping.

## What NOT to do during fallback

- Don't run `/supreme-polish`, `/audit-everything`, `/100-ideas`, or any fan-out >5 Opus agents — defer until weekly reset.
- Don't trigger `source-site-enhancement` § Parallel-agent playbook (9-agent fan-out) — wait for reset OR run sequentially on Sonnet.
- Don't downgrade `effort` on security-reviewer for payment / auth / encryption code — defer until Opus returns.

## Detection helper

Ship `~/.claude/hooks/opus-quota-check.sh`:

```sh
#!/usr/bin/env sh
# Returns 0 if Opus available, 1 if quota exhausted or flag set.
[ -f "$HOME/.claude/.opus-disabled" ] && exit 1
[ "$CLAUDE_OPUS_DISABLED" = "true" ] && exit 1
# Future: parse `claude config get usage` JSON when CLI exposes it
exit 0
```

Monitor: `opus-quota-check.sh || sub_agent_model=claude-sonnet-4-6` before each spawn.

## Auto-restore

- **Weekly reset**: every Monday 9am America/New_York bucket resets; delete `~/.claude/.opus-disabled` at that time. Re-touch for permanent Sonnet-only mode.
- **Explicit override**: `/model claude-opus-4-8` / `/model claude-opus-4-7` re-enables Opus for session regardless of flag file.
- **Transient 429 backoff**: 429-triggered fallbacks expire after 5 minutes; retry Opus after 5 min, re-set flag for another 5 min on repeat 429.

## End-of-turn report

When `OPUS_AVAILABLE=false`:

```
**Model:** Sonnet 4.6 (Opus quota exhausted — auto-fallback active until Mon 9am ET)
```

When `OPUS_AVAILABLE=true` but weekly >80%:

```
**Model:** Opus 4.8 (weekly all-models at 87% — fallback to Sonnet imminent)
```
