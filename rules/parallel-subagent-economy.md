---
name: "parallel-subagent-economy"
priority: 2
pack: "core"
triggers:
  - "subagent"
  - "parallel"
  - "fan out"
paths:
  - "*"
---

# Parallel Subagent Economy

**Fan out whenever doing so saves ≥5 min wall-clock over serial**, provided units genuinely independent. Sonnet specialists often cheaper than one Opus thread.

Hard preconditions: units independent (distinct files, no shared state, no data dependency) AND real minutes to save — never fan out for appearance on serial-by-nature or trivially-fast work.

## Layering (this rule sits UNDER existing mesh)

- `monitor-orchestration.md` — decides **IF** Monitor fires
- `agent-selection.md` — decides **WHICH** specialist
- `model-routing.md` — decides **WHICH MODEL** by altitude
- This rule sets only: **TRIGGER**, **WIDTH**, **COST DEFAULT**, **TOKEN GUARDRAILS**

## Mechanics (v2.1.x verified June 2026)

- **Parallel = orchestrator emitting MULTIPLE Task/Agent calls in ONE turn.** No on/off toggle; concurrency bounded by Anthropic rate limits.
- Subagents start **fresh** (system preamble + your brief). `CLAUDE_CODE_FORK_SUBAGENT=1` makes them inherit parent — leave **UNSET**.
- `ultracode` is **session-only** (`/effort ultracode`) — NOT a settings.json value.
- Real env levers: `CLAUDE_CODE_SUBAGENT_MODEL` (SET), `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` (UNSET), `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1` (UNSET).

## Fresh context by default

- **DEFAULT = fresh.** Brief: system preamble + self-contained 100-300 words (role · scope · exact file paths · non-goals · expected output ≤200 words). Keep `CLAUDE_CODE_FORK_SUBAGENT` UNSET.
- **Inherit only when parent already built compact, on-topic, directly-needed state AND parent context is small.** Pass curated PACKET, never raw transcript.
- **Decision test:** "Would competent stranger do better with my conversation, or just a tight brief + files?" Tight brief wins → fresh.
- **Saturation HARD STOP.** Spawns failing "Prompt is too long" (`subagent_tokens: 0`) → CHECKPOINT to `progress.md` + continue in FRESH session. Do NOT retry.

## Cost model (why parallel burns tokens)

Per-agent multipliers (DOMINANT first):

1. **Preamble re-ingestion** — every subagent re-reads system preamble + global rules + project CLAUDE.md: tens of thousands tokens per agent before any work. 10-agent fan-out can spend 300-600k input tokens just booting.
2. **Prompt-cache defeat** — fresh subagent pays full cache WRITE (1.25×), not read (0.1×).
3. **Flat-Opus fan-out** — Opus (xhigh + thinking) on every specialist multiplies priciest tier. Tiering to Sonnet ~5× cheaper.
4. **Brief bloat** — pasting whole files or each agent re-grepping same context = N× read tokens.
5. **Fat returns + runaway count** — agents echoing full files / spawning dozens.

**Dollar reality:** 4-unit job — serial-Opus ~$5.50 · parallel-4×Opus ~$8-9 · parallel-4×Sonnet ~$2.50. Parallel-on-Sonnet often cheaper than single Opus thread.

## ≥5-minute wall-clock rule (primary trigger)

```
Serial time   = sum of unit durations
Parallel time ≈ longest unit + ~2 min overhead
Fan out when  serial − parallel ≥ 5 min  AND  units independent
```

Examples: 2×8 min → saves ~6 → **fan out**. 3×4 min → saves ~6 → **fan out**. 2×3 min → saves ~1 → **serial**.

## Two common shapes that clear the test

- **Test-writing batch** — ≥2 independent spec targets ≥5-min. Zero shared state. **One agent per 2-3 spec dirs (batch), never one-agent-per-spec.** TDD-RED-first inside each.
- **Feature/test-impl batch** — ≥2 independent feature modules ≥5-min; **one agent owns one `libs/features/<slug>/` end-to-end** (schema + handler + UI + unit + E2E + docs). TDD-RED spec and impl stay together in same agent.
- **Read-only sweeps** (grep / audit / drift-scan) — fan out freely; zero write-conflict, minimal cost; doesn't count against width ceiling.
- **Doesn't clear ≥5-min** → foreground / single thread.

## Fan-out width (token-bounded)

- **Sweet spot: 3-4 concurrent specialists.**
- **Hard ceiling: 6 concurrent.** Past 6: marginal wall-clock shrinks, cost stays linear. Exceeding 6 requires one-line justification in assignment table.
- **Batch, don't trickle, don't blow ceiling.** >6 units → sequential waves of ≤6 (12 units → two waves of 6 or 6 agents × 2 units each).
- **Width = distinct file ownership + no shared state.** 9 specs across 3 files = 3 agents.

## Sonnet-specialist cost default (biggest token lever)

- **`CLAUDE_CODE_SUBAGENT_MODEL=claude-sonnet-4-6` SET** (in `~/.claude/settings.json` § env). Every spawned specialist runs Sonnet at `high` effort. ~0% quality loss on impl/test work.
- **Orchestrator (main thread) stays Opus `xhigh`** — decomposes, slices, folds, verifies. **Never implements.**
- **Opus-pinned reviewers stay Opus.** Pass explicit `model: opus` on Agent call when spawning `security-reviewer` / `architect` / `visual-qa` / payment-auth review. Sonnet default MUST NOT silently downgrade sensitive review. If Opus quota red AND review is security/payment/auth-sensitive → **defer** per `opus-quota-fallback.md`.
- **Haiku reserved** for changelog / format / rename.
- **On Opus quota exhaustion**: orchestrator drops to Sonnet; specialists already Sonnet → fan-out width unchanged (effort drops to `high`).

## "No worms" guardrails (hard rules)

- **No shared-context re-reads** — orchestrator reads shared brief/schema/contract once in main thread; passes 100-300 word self-contained slice to each agent.
- **Summaries ≤200 words back** — raw diffs/output stay inside agent.
- **One fold, one build, one deploy.** Agents NEVER build/commit/deploy independently.
- **One agent = one disjoint durable unit** (whole file / spec dir / module) — never fraction of file.
- **Batch to ceiling, never raise it** — 8 units → 6+2 or 4×2.
- **No speculative agents.** No standing "researcher"/"reviewer" alongside implementers per-unit.
- **No one-agent-per-spec / per-file / spawn-N-to-explore.**
- **Don't re-fan-out for repair.** 2 of 4 fail → fix-forward in main thread or ONE targeted agent.

## When NOT to parallelize (serial correct)

- Saves <5 min wall-clock (single unit or batch individually quick)
- Dependent chain — `schema → handler → UI` for ONE module stays in ONE agent; parallelize ACROSS features
- Shared mutable infra — one `index.ts` barrel, one migration, one design-token file → serialize
- Exploratory / ambiguous scope — decompose first, then batch
- Opus quota red AND batch is security/payment/auth-sensitive → defer per `opus-quota-fallback.md`

## ultracode + env levers

- **`ultracode` — USE for heavy test-writing or feature-impl sessions** (`/effort ultracode`). Spins Dynamic Workflows = deterministic parallel fan-out with built-in per-branch validation. This rule's ≥5-min trigger + 6-wide ceiling + Sonnet default + batch-beyond-6 guardrails **still bind** ultracode workflows.
- **`CLAUDE_CODE_SUBAGENT_MODEL=claude-sonnet-4-6` — SET (standing default).** Highest-ROI single change.
- **`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` — LEAVE UNSET.** Adds inter-agent chatter; independent batches don't need coordination.
- **`CLAUDE_CODE_DISABLE_BACKGROUND_TASKS` + `CLAUDE_CODE_DISABLE_WORKFLOWS` — LEAVE UNSET.**

## Folded from Superpowers — dispatching-parallel-agents

*Vendored discipline from [obra/Superpowers](https://github.com/obra/Superpowers) (MIT, Jesse Vincent). Full skill: [[20-superpowers]] → dispatching-parallel-agents/SKILL.md.*

- **Explicit trigger:** 2+ tasks that can be worked WITHOUT shared state or sequential dependency → dispatch in parallel; this complements the ≥5-min wall-clock test above.
- **Independence test BEFORE parallelizing:** prove no shared mutable state AND no ordering dependency. Either fails → single agent or serial waves, not parallel.
- **Group failures by problem domain first** — one agent per independent domain (distinct test file / subsystem / bug). Related failures (fixing one may fix others) → investigate together, don't fan out.
- **Constrain scope in the brief** — name the exact files and add "do NOT touch other code / production code"; an unconstrained agent refactors everything.
- **Collect + reconcile, don't just merge** — read each summary, check agents didn't edit the same code, run the FULL suite once, spot-check for systematic errors before declaring done.
- See [[20-superpowers]]
