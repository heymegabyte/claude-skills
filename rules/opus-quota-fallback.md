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

When Opus weekly quota is exhausted or unreachable, the main thread MUST silently fall back to Sonnet without dropping work. No `/model` re-toggle needed each turn. No agent spawn failures left dangling. Brian keeps shipping; quality dips slightly, throughput stays.

## Detection signals (any one fires fallback for the rest of session)

- **User-initiated**: user typed `/model claude-sonnet-4-6` this session → respect the session model for all agent spawns
- **Flag file**: `~/.claude/.opus-disabled` exists (touchable manually before launching, e.g. `touch ~/.claude/.opus-disabled` when weekly bucket goes red)
- **Env var**: `CLAUDE_OPUS_DISABLED=true` exported in the shell that launched Claude Code
- **Transient 429**: any agent spawn errors with `rate_limit` or `quota_exceeded` on Opus → set in-memory flag for the rest of the session
- **Usage report ≥95%**: when `/usage` (or `claude config get usage`) shows weekly all-models ≥95%, the main thread proactively switches to fallback mode without waiting for the 429

When ANY signal fires, the main thread sets internal `OPUS_AVAILABLE=false` for the remainder of the session.

## Fallback rules

### Agent frontmatter convention

Every agent that declares `model: opus` (or `model: claude-opus-4-8` / `claude-opus-4-7` / `claude-opus-4-6`) MUST also declare:

```yaml
model: claude-opus-4-7
model_fallback: claude-sonnet-4-6
effort: xhigh
effort_fallback: high
```

When `OPUS_AVAILABLE=false`, the main thread reads `model_fallback` and `effort_fallback` and uses those values in the `Agent` tool call's `model:` parameter (overriding the frontmatter `model:` field).

### Skill `effort:` frontmatter

Same convention. Skills with `effort: xhigh` ship with `effort_fallback: high`. Monitor degrades on quota miss.

### Fast Mode (`/fast`)

Fast Mode is Opus-only. When `OPUS_AVAILABLE=false`, Fast Mode automatically disables — main thread runs on Sonnet at standard speed. No user prompt needed.

### Hard-coded Opus uses (skill content saying "use Opus 4.8 / 4.7" in prose)

Any skill body or rule body that explicitly recommends Opus 4.8 or 4.7 should pair every recommendation with "(Sonnet 4.6 fallback when Opus quota exhausted)". Anti-pattern: hard-coding `claude-opus-4-8` or `claude-opus-4-7` in source code without the fallback path.

## Quality expectations during fallback

| Surface | Opus Quality | Sonnet Fallback Quality | Diff |
|---|---|---|---|
| Architecture decisions | xhigh | high | -10% (structural tradeoffs still sound; reasoning depth slightly shallower) |
| Completeness checks | xhigh | high | -5% (Sonnet catches 90% of what Opus catches in FCE scans) |
| Security review | xhigh | high | -15% (sophisticated supply-chain attacks may be missed) |
| Visual QA | xhigh | high | -5% (a11y-tree-based checks unaffected; visual subjective scoring slightly noisier) |
| Meta-orchestration | xhigh | high | -10% (multi-MCP chain planning slightly less creative) |
| Feature implementation | high | high | 0% (already Sonnet) |
| Content writing | medium | medium | 0% (already Haiku/Sonnet) |
| Code formatting / changelogs | low | low | 0% (already Haiku) |

Total session quality dip during fallback: ~5-10% on Brian's typical workload. Acceptable for keeping shipping.

## What NOT to do during fallback

- Don't run `/supreme-polish`, `/audit-everything`, `/100-ideas`, or any rule that fans out >5 Opus agents — Sonnet bucket will burn faster than expected. Defer until weekly reset.
- Don't trigger ``source-site-enhancement`` § Parallel-agent playbook (9-agent fan-out) — the orchestrator still expects Opus-quality decomposition. Wait for reset OR run the canonical 9 sequentially on Sonnet.
- Don't downgrade `effort` on security-reviewer when reviewing payment / auth / encryption code — better to defer that work until Opus returns than ship a Sonnet-only security pass on sensitive surfaces.

## Detection helper script

Ship `~/.claude/hooks/opus-quota-check.sh`:

```sh
#!/usr/bin/env sh
# Returns 0 if Opus available, 1 if quota exhausted or flag set.
# Source from Monitor before each Opus agent spawn.

[ -f "$HOME/.claude/.opus-disabled" ] && exit 1
[ "$CLAUDE_OPUS_DISABLED" = "true" ] && exit 1

# Future: parse `claude config get usage` JSON output when CLI exposes it
exit 0
```

The Monitor can call `opus-quota-check.sh || sub_agent_model=claude-sonnet-4-6` before each spawn. If the script isn't shipped, fall back to checking the flag file + env var inline.

## Auto-restore

- **Weekly reset**: every Monday 9am America/New_York, the all-models bucket resets. The fallback flag file (`~/.claude/.opus-disabled`) should be deleted at that time. If the user wants permanent Sonnet-only mode, they can `touch` it again.
- **Explicit user override**: `/model claude-opus-4-8` / `/model claude-opus-4-7` (or any opus alias) re-enables Opus for the session, regardless of the flag file. Treat user `/model` selection as authoritative.
- **Transient 429 backoff**: 429-triggered fallbacks expire after 5 minutes. After 5 minutes, the main thread can try Opus again — if it 429s again, re-set the flag for another 5 minutes. Avoids permanent fallback from a single rate-limit blip.

## End-of-turn report

When `OPUS_AVAILABLE=false`, the end-of-turn report (per ``always``) must include:

```
**Model:** Sonnet 4.6 (Opus quota exhausted — auto-fallback active until Mon 9am ET)
```

When `OPUS_AVAILABLE=true` but weekly is >80%, surface a warning:

```
**Model:** Opus 4.8 (weekly all-models at 87% — fallback to Sonnet imminent)
```

This preempts the next-day "why did my session degrade?" question.
