# Parallel Subagent Economy (***SUPREME — every test-writing batch + every feature/test-impl batch***)

Brian's two recurring heavy workloads — **lots of test-writing** and **lots of feature+test implementation across projects** — are batches of independent, same-shape units. That is exactly the shape parallel subagent fan-out exists for. Default disposition for these two shapes: **fan out**. Calibrated slightly toward liberal — take the parallelism when work is genuinely independent — without opening token-worms. Parallelism buys near-serial wall-clock at ~3-4× the token bill; per [[brian-preferences]] (Simplicity > Cost > Speed) that trade is only worth it when the units are *actually* parallel, never to "look busy" on work that isn't.

This rule sits **UNDER** the existing orchestration mesh and does NOT redefine it:
- [[monitor-orchestration]] decides **IF** the Monitor fires (multi-faceted brief) — this rule pre-answers "yes, fan out" for the two named shapes.
- [[agent-selection]] decides **WHICH** specialist owns each unit (taxonomy + assignment table + diversity gate).
- [[model-routing]] decides **WHICH MODEL** by altitude.
- This rule sets only the **WIDTH**, the **COST default**, and the **token guardrails** for the test/feature workloads.

### Mechanics (verified June 2026, v2.1.x)
- **Parallel = the orchestrator emitting MULTIPLE Task/Agent calls in ONE turn.** The harness runs them concurrently. There is **no on/off toggle** and **no numeric "max concurrent" settings key** — concurrency is bounded by Anthropic API rate limits + the model's own decision. Custom rules (like this one) bias delegation.
- `ultracode` is a **session-only** lever (`/effort ultracode`), NOT a `settings.json` value — it turns on xhigh + auto Dynamic-Workflow orchestration for the session, then resets. The underlying **Dynamic Workflows** feature is what persists (on by default Max/Team; `/config` toggle on Pro; `disableWorkflows` / `CLAUDE_CODE_DISABLE_WORKFLOWS=1` to kill it). Requires CC ≥ v2.1.154.
- The real env levers: `CLAUDE_CODE_SUBAGENT_MODEL` (cheaper specialist model — SET, see below); `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` (coordinated cross-messaging teams — leave unset); `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1` (kills background tasks — leave unset).

### Why parallel agents burn tokens so fast (the diagnosis — read before fanning out)
Past fan-outs torched the budget because cost ≈ `N_agents × (preamble + brief + reads + reasoning + return)`, and several terms multiply PER agent:
1. **Preamble re-ingestion (the dominant cost).** Every subagent is a FRESH context that re-reads the whole system preamble — global CLAUDE.md + all loaded rules + project CLAUDE.md + skill descriptions. On this stack that's tens of thousands of tokens PER agent before any work. A flat 10-agent fan-out can spend 300–600k input tokens just booting.
2. **Prompt-cache defeat.** [[prompt-cache]]'s ~90% discount applies to a REPEATED prefix within ONE conversation. Each subagent is a NEW conversation → a full-price cache WRITE (1.25×), not a read (0.1×). Fan-out trades the 90% discount for N writes.
3. **Flat-Opus fan-out.** Opus (xhigh + adaptive thinking) on the orchestrator AND every specialist multiplies the priciest reasoning; Opus's tokenizer also emits ~35% more tokens/input. Tiering (Sonnet specialists) is multiples cheaper.
4. **Brief bloat + shared-context re-reads.** Pasting whole files into briefs, or letting each agent re-grep/re-Read the same files the orchestrator already read, multiplies read tokens N×.
5. **Fat returns + runaway count.** Agents echoing full files / long reports back (then re-ingested), or spawning dozens, each re-paying cause #1.
The cheapest lever is therefore **fewer, well-scoped agents on cheaper tiers, small briefs, ≤200-word returns** — NOT more agents. Every default below is built to hold all five down.

### The two default-parallel triggers (fan out by default — don't ask, don't serialize)
Fan out the moment a turn is one of these two shapes **AND** the units are independent (distinct file ownership, no shared mutable state):
- **Test-writing batch** — ≥3 distinct spec targets (feature / route / component / endpoint / E2E journey) needing coverage in one prompt. Hermetic specs per [[e2e-tdd-organization]] = zero shared state = perfect parallel candidate. **One agent per 2-3 spec dirs (batch), never one-agent-per-spec.** TDD-RED-first inside each agent.
- **Feature/test-impl batch** — ≥3 independent feature modules / vertical slices to build, **one agent owning one `libs/features/<slug>/` module end-to-end** (schema + handler + UI + colocated unit + E2E + docs). The module's TDD-RED spec and its impl stay **TOGETHER in the same agent** — spec↔impl is data-dependent and must never be split across agents.
- **Below 3 independent units** → foreground / single thread, no agents. Spin-up + summary-fold overhead exceeds the saving.
- **Single surface / single file** → never fan out.

### Fan-out width (token-bounded — slightly liberal, hard-capped)
- **Sweet spot: 3-4 concurrent specialists.** Best wall-time-per-token for these workloads. ~3-4× a serial pass's tokens buys roughly ONE serial pass of wall-clock with full breadth — a good completeness trade.
- **Hard ceiling: 6 concurrent.** Past 6 the marginal wall-clock shrinks (each agent re-establishes context; the Anthropic rate-limit tail serializes anyway) while token cost stays linear → diminishing returns. Going past 6 requires a one-line justification in the [[agent-selection]] assignment table.
- **Batch, don't trickle, don't blow the ceiling.** >6 independent units → sequential **waves of ≤6** (12 units → two waves of 6, or 6 agents × 2 units each), fold summaries between waves. Never spawn 12 at once; never one-at-a-time.
- **Width counts only units with distinct file ownership + no shared state.** 9 specs across 3 files = 3 agents (one per file), not 9.
- **Read-only exploration is the free exception** — grep / read / audit / drift-scan across N dirs has zero write-conflict risk and minimal cost; it does NOT count against the ceiling and may exceed 6. Still prefer one targeted search before fanning a survey.

### Sonnet-specialist cost default (the single biggest token lever)
- **`CLAUDE_CODE_SUBAGENT_MODEL=claude-sonnet-4-6` is SET as the standing default** (in `~/.claude/settings.json` § env). Every spawned specialist runs Sonnet at `high` effort — test-writing + feature-impl is Sonnet-grade execution per [[model-routing]] (~0% quality loss on impl/test work). This is the cornerstone that makes slightly-liberal breadth affordable.
- **Orchestrator (main thread) stays Opus `xhigh`** for decomposition, slice boundaries, fold-back, and the verify gate — **never implements**.
- **Opus-pinned reviewers stay Opus — override the default explicitly.** When spawning `security-reviewer` / `architect` / `visual-qa` / a payment/auth review, pass an explicit `model: opus` on the Agent call (the call-level `model` param takes precedence over the env default per [[model-routing]] + [[agent-selection]]). The Sonnet default must NEVER silently downgrade a security/payment/architecture review. If Opus quota is red AND the review is security/payment/auth-sensitive, **defer** per [[opus-quota-fallback]] rather than ship a Sonnet-only pass.
- **Haiku reserved for grunts only** (changelog / format / rename) — never test logic or feature code.
- **On Opus quota exhaustion** per [[opus-quota-fallback]] the orchestrator drops to Sonnet too; specialists are already Sonnet, so **fan-out width is unchanged** (effort drops to `high`). Don't ALSO run a wide supreme-polish in the same degraded session.

### "No worms" guardrails (liberal-but-bounded — hard rules)
- **No shared-context re-reads (the #1 worm — see diagnosis cause #1/#4).** Orchestrator reads the shared brief / schema / contract / fixture / brand-tokens **ONCE** in the main thread, then passes a 100-300 word self-contained slice into each agent brief per [[full-autonomy]]. Each agent caches its own slice per [[prompt-cache]] — never the whole repo, never each agent re-grepping the same context.
- **Summaries ≤200 words back** per [[prompt-cache]] — raw test output / diffs / file bodies stay inside the agent; no agent echoes full file contents to the main thread.
- **One fold, one build, one deploy.** Agents NEVER build / commit / deploy independently. The main thread folds all summaries, then builds + deploys + verifies ONCE. Parallel builds = parallel CI + token burn for zero gain.
- **One agent = one disjoint, durable unit** (a whole file / spec dir / module owned start-to-finish) — never a fraction of a file (causes races + churn re-reads).
- **Batch to the ceiling, never raise it** — 8 units → 6+2 or 4×2, not "bump to 8."
- **No speculative agents.** No standing "researcher" / "reviewer" alongside implementers per-unit. Final-review fan-out per [[agent-selection]] is ONE pass at the end, not per-unit.
- **No one-agent-per-spec / per-file / spawn-N-to-explore** — that's the worm this rule kills.
- **Don't re-fan-out for repair.** If 2 of 4 agents' specs fail, fix-forward in the main thread or one targeted agent — never re-spawn the whole batch.

### When NOT to parallelize (serial is correct)
- **Single surface / single file / one bug fix** — foreground, one TDD loop, no agents.
- **Dependent chain** — `schema → handler → UI` (or `spec → impl → refactor`) for ONE module stays in ONE agent; parallelize **across** features, never **within** one, per [[full-autonomy]].
- **Shared mutable infra** — one `index.ts` barrel, one migration, one design-token file, one shared component — serialize or agents stomp (see [[monitor-orchestration]] §9 worktree note + the project memory on worktree node_modules corruption).
- **<~20 min of real work per unit** — inline it; spawn + fold overhead exceeds the saving.
- **Exploratory / ambiguous scope** — decompose first in one orchestrator pass, learn the shape, THEN batch the rest. Never fan out a fog.
- **Opus quota red AND the batch is security/payment/auth-sensitive** — defer per [[opus-quota-fallback]] rather than ship a Sonnet-only pass on sensitive surfaces.

### ultracode + env levers
- **`ultracode` — USE IT for the two batch workloads (session-only).** Run `/effort ultracode` at the start of a heavy test-writing or feature-impl session: it spins Dynamic Workflows = deterministic parallel fan-out **with built-in per-branch validation** — exactly the "build N modules, each gated by its own TDD suite" / "write N independent verifiable specs" shape (aligns with [[sandbox-execution]] + [[event-sourced-build-progress]] + [[verification-loop]]). This rule's 6-wide ceiling + Sonnet default + batch-beyond-6 guardrails **still bind** ultracode-spawned workflows — ultracode is NOT a license to widen. Drop back to `/effort high` for routine single-surface work (the workflow overhead isn't worth it) + exploratory work (slice boundaries not yet stable). It's session-only by design (resets each session) + costs more per task, so don't leave it on for routine turns. A single task can also be run as a workflow by including the keyword `ultracode` in the prompt without changing session effort.
- **`CLAUDE_CODE_SUBAGENT_MODEL=claude-sonnet-4-6` — SET (standing default in settings.json).** The cost cornerstone; highest-ROI single change. (Sensitive reviewers override to Opus per the cost section.)
- **`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` — LEAVE UNSET.** Coordinated cross-messaging teams add inter-agent chatter token overhead; the test/feature batches are independent-not-coordinated, so plain parallel Task calls are cheaper. Enable ONLY for a genuinely interdependent build whose slices must message each other (rare).
- **`CLAUDE_CODE_DISABLE_BACKGROUND_TASKS` + `CLAUDE_CODE_DISABLE_WORKFLOWS` — LEAVE UNSET.** Background long builds + test-runs + deploys are useful during the loop; Dynamic Workflows must stay enabled for ultracode to work.

### Reference incident (***2026-06-08 — global subagent-economy upgrade***)
Brian directive: make the agent lean toward parallel subagents for the two recurring heavy workloads (test-writing, feature/test impl), throughput-liberal but token-conscious ("slightly toward liberal usage without opening any worms"), enable ultracode if it fits, and set the cheap-subagent-model env. Three concurrent sessions drafted competing versions (frugal 2-3/4, liberal 3-5/8, balanced 3-4/6); a 4-agent design-panel workflow synthesized + converged them into this single canonical file at the **balanced-leaning-liberal** calibration the brief asked for (3-4 sweet spot / 6 hard ceiling), grafting the liberal draft's token-burn diagnosis + the frugal draft's tight guardrails. Dupes (`parallel-subagent-defaults.md`) removed; the [[prompt-cache]] load-order line converged on this name. `ultracode` found to be session-only (`/effort ultracode`, not persistable in settings.json); Dynamic Workflows verified enabled (CC v2.1.168). `CLAUDE_CODE_SUBAGENT_MODEL=claude-sonnet-4-6` set in settings.json env. Complements (does not duplicate) [[monitor-orchestration]] (IF fire), [[agent-selection]] (WHICH specialist), [[model-routing]] (altitude→model) — sets only WIDTH / MODEL / TOKEN-BILL for these two workloads.

### See
- [[monitor-orchestration]] — the Monitor decomposition shell this rule fans out within
- [[agent-selection]] — specialist taxonomy + assignment table + diversity gate
- [[model-routing]] — Opus orchestrator → Sonnet specialist → Haiku grunt altitude mapping
- [[opus-quota-fallback]] — fan-out survives quota red (width holds, effort drops); defer sensitive reviews
- [[full-autonomy]] — 100-300 word briefs; parallel when independent, serial when chained
- [[prompt-cache]] — per-subagent cache fill + ≤200-word summary returns (the cost diagnosis lives here too)
- [[e2e-tdd-organization]] — hermetic specs = the zero-shared-state property that makes test fan-out safe
- [[feature-module-architecture]] — `libs/features/<slug>/` is the one-agent-one-module unit boundary
- [[verification-loop]] — the single fold-back build + deploy + prod-E2E gate after fan-out
- [[brian-preferences]] — Simplicity > Cost > Speed; the frugal tiebreak on borderline fan-out calls
