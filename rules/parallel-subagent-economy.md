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

Primary rule: **fan out whenever doing so saves ≥5 min wall-clock over serial**, provided units genuinely independent. Sonnet specialists often *cheaper* than one Opus thread — time saved is the deciding factor.

Hard preconditions: units independent (distinct files, no shared state, no data dependency) AND real minutes to save — never fan out to "look busy" on serial-by-nature or trivially-fast work.

## Layering (this rule sits UNDER existing mesh)

- `monitor-orchestration.md` decides **IF** Monitor fires (multi-faceted brief). This rule pre-answers "yes, fan out" via ≥5-min test.
- `agent-selection.md` decides **WHICH** specialist owns each unit.
- `model-routing.md` decides **WHICH MODEL** by altitude.
- This rule sets only the **TRIGGER**, **WIDTH**, **COST default**, and **token guardrails**.

## Mechanics (v2.1.x verified June 2026)

- **Parallel = orchestrator emitting MULTIPLE Task/Agent calls in ONE turn.** Harness runs concurrently. No on/off toggle. No numeric "max concurrent" key — concurrency bounded by Anthropic rate limits + model's decision. Custom rules bias delegation.
- Subagents start **fresh** (system preamble + your brief) — do NOT inherit parent conversation by default. `/clear` does NOT reduce cost. `CLAUDE_CODE_FORK_SUBAGENT=1` makes them inherit it — leave UNSET.
- `ultracode` is **session-only** (`/effort ultracode`), NOT a settings.json value — turns on xhigh + auto Dynamic-Workflow orchestration for session, then resets.
- Real env levers: `CLAUDE_CODE_SUBAGENT_MODEL` (cheaper specialist — SET), `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` (coordinated cross-messaging — unset), `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1` (kills background — unset).

## Fresh context by default — inherit ONLY when deliberately-good starting point

- **DEFAULT = fresh.** Spawn every subagent with fresh, MINIMAL context: system preamble + self-contained 100-300 word brief (role · scope · exact file paths · non-goals · expected output ≤200 words). Keep `CLAUDE_CODE_FORK_SUBAGENT` UNSET.
- **Inherit/hand-down ONLY when parent already built compact, on-topic, directly-needed state AND parent context small.** Pass curated PACKET pasted into brief, never raw transcript.
- **Decision test:** "Would competent stranger do this BETTER with my conversation, or just w/ tight brief + files?" Tight brief wins → fresh.
- **Saturation HARD STOP.** Spawns failing "Prompt is too long" (`subagent_tokens: 0`) = signal to CHECKPOINT to `progress.md` + continue in FRESH session — NOT keep retrying. Saturated parent makes BOTH fresh-spawn AND fork-inherit overflow.
- **Why:** fresh-minimal cheaper (no parent-transcript re-ingestion) AND more reliable.

## Cost model (why parallel agents burn tokens)

Cost ≈ `N_agents × (preamble + brief + reads + reasoning + return)`. Per-agent multipliers:

1. **Preamble re-ingestion (DOMINANT)** — every subagent fresh context re-reads system preamble + global CLAUDE.md + all rules + project CLAUDE.md + skill descriptions: tens of thousands tokens PER agent before any work. Flat 10-agent fan-out can spend 300-600k input tokens just booting.
2. **Prompt-cache defeat** — fresh subagent pays full-price cache WRITE (1.25×), not read (0.1×). Fan-out trades discount for N writes.
3. **Flat-Opus fan-out** — Opus (xhigh + thinking) on every specialist multiplies priciest tier. Tiering to Sonnet ~5× cheaper.
4. **Brief bloat + shared-context re-reads** — pasting whole files, or each agent re-grepping what orchestrator already read = N× read tokens.
5. **Fat returns + runaway count** — agents echoing full files / spawning dozens, each re-paying #1.

**Dollar reality:** 4-unit job ≈ serial-Opus **~$5.50** · parallel-4×Opus **~$8-9** · parallel-4×Sonnet **~$2.50**. Parallel-on-Sonnet often cheaper than single Opus thread.

## ≥5-minute wall-clock rule (primary trigger)

Estimate before every borderline batch:

- **Serial time** = sum of units' durations
- **Parallel time** ≈ longest single unit + ~2 min fan-out overhead
- **Fan out when `serial − parallel ≥ 5 min`** AND units independent

Examples: 2 units × 8 min → serial 16, parallel ~10 → saves ~6 → **fan out**. 3 units × 4 min → serial 12, parallel ~6 → saves ~6 → **fan out**. 2 units × 3 min → serial 6, parallel ~5 → saves ~1 → **serial**. 1 unit → **serial**.

Lowers old "≥3 units" floor to ~2 substantial units while excluding trivial. Independence is *possibility* gate; ≥5-min is *worth-it* gate.

## Two common shapes that clear the test

- **Test-writing batch** — ≥2 independent spec targets clearing ≥5-min. Hermetic specs per `e2e-tdd-organization.md` = zero shared state. **One agent per 2-3 spec dirs (batch), never one-agent-per-spec.** TDD-RED-first inside each.
- **Feature/test-impl batch** — ≥2 independent feature modules clearing ≥5-min, **one agent owning one `libs/features/<slug>/` module end-to-end** (schema + handler + UI + colocated unit + E2E + docs). Module's TDD-RED spec and impl stay TOGETHER in same agent.
- **Read-only sweeps** (grep / audit / drift-scan / research) — fan out freely; zero write-conflict, minimal cost, doesn't count against width ceiling.
- **Doesn't clear ≥5-min** (1 unit, batch quick enough that `serial − parallel < 5 min`) → foreground / single thread.

## Fan-out width (token-bounded)

- **Sweet spot: 3-4 concurrent specialists.** Best wall-time-per-token; clears ≥5-min bar with margin.
- **Hard ceiling: 6 concurrent.** Past 6 marginal wall-clock shrinks while token cost stays linear. Going past 6 requires one-line justification in `agent-selection.md` assignment table.
- **Batch, don't trickle, don't blow ceiling.** >6 independent units → sequential **waves of ≤6** (12 units → two waves of 6, or 6 agents × 2 units each), fold summaries between.
- **Width counts only units with distinct file ownership + no shared state.** 9 specs across 3 files = 3 agents (one per file), not 9.

## Sonnet-specialist cost default (biggest token lever)

- **`CLAUDE_CODE_SUBAGENT_MODEL=claude-sonnet-4-6` SET as standing default** (in `~/.claude/settings.json` § env). Every spawned specialist runs Sonnet at `high` effort. ~0% quality loss on impl/test work.
- **Orchestrator (main thread) stays Opus `xhigh`** for decomposition, slice boundaries, fold-back, verify gate. **Never implements.**
- **Opus-pinned reviewers stay Opus — override default explicitly.** When spawning `security-reviewer` / `architect` / `visual-qa` / payment-auth review, pass explicit `model: opus` on Agent call (call-level `model` param takes precedence over env default). Sonnet default must NEVER silently downgrade sensitive review. If Opus quota red AND review is security/payment/auth-sensitive, **defer** per `opus-quota-fallback.md`.
- **Haiku reserved for grunts only** (changelog / format / rename).
- **On Opus quota exhaustion** per `opus-quota-fallback.md`, orchestrator drops to Sonnet too; specialists already Sonnet, so **fan-out width unchanged** (effort drops to `high`).

## "No worms" guardrails (liberal-but-bounded — hard rules)

- **No shared-context re-reads** — orchestrator reads shared brief / schema / contract / fixture / brand-tokens **ONCE** in main thread, passes 100-300 word self-contained slice into each agent brief per `full-autonomy.md`. Each agent caches its own slice per `prompt-cache.md` — never whole repo, never each agent re-grepping same context.
- **Summaries ≤200 words back** per `prompt-cache.md` — raw test output / diffs / file bodies stay inside agent.
- **One fold, one build, one deploy.** Agents NEVER build / commit / deploy independently. Main thread folds all summaries, then builds + deploys + verifies ONCE.
- **One agent = one disjoint, durable unit** (whole file / spec dir / module owned start-to-finish) — never fraction of file.
- **Batch to ceiling, never raise it** — 8 units → 6+2 or 4×2, not "bump to 8."
- **No speculative agents.** No standing "researcher" / "reviewer" alongside implementers per-unit. Final-review fan-out per `agent-selection.md` is ONE pass at end.
- **No one-agent-per-spec / per-file / spawn-N-to-explore.**
- **Don't re-fan-out for repair.** If 2 of 4 agents' specs fail, fix-forward in main thread or one targeted agent — never re-spawn whole batch.

## When NOT to parallelize (serial correct)

- **Parallelizing saves <5 min wall-clock** — single unit, or batch individually quick. Inline.
- **Dependent chain** — `schema → handler → UI` (or `spec → impl → refactor`) for ONE module stays in ONE agent; parallelize **across** features, never **within**.
- **Shared mutable infra** — one `index.ts` barrel, one migration, one design-token file, one shared component — serialize or agents stomp.
- **Exploratory / ambiguous scope** — decompose first in one orchestrator pass, learn shape, THEN batch the rest.
- **Opus quota red AND batch is security/payment/auth-sensitive** — defer per `opus-quota-fallback.md`.

## ultracode + env levers

- **`ultracode` — USE for two batch workloads (session-only).** Run `/effort ultracode` at start of heavy test-writing or feature-impl session. Spins Dynamic Workflows = deterministic parallel fan-out **w/ built-in per-branch validation** (aligns with `sandbox-execution.md` + `event-sourced-build-progress.md` + `verification-loop.md`). This rule's ≥5-min trigger + 6-wide ceiling + Sonnet default + batch-beyond-6 guardrails **still bind** ultracode-spawned workflows.
- **`CLAUDE_CODE_SUBAGENT_MODEL=claude-sonnet-4-6` — SET (standing default).** Cost cornerstone; highest-ROI single change.
- **`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` — LEAVE UNSET.** Cross-messaging adds inter-agent chatter overhead; test/feature batches are independent-not-coordinated, so plain parallel Task calls cheaper.
- **`CLAUDE_CODE_DISABLE_BACKGROUND_TASKS` + `CLAUDE_CODE_DISABLE_WORKFLOWS` — LEAVE UNSET.**
