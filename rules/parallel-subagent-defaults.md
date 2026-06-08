# Parallel Subagent Defaults (***SUPREME — every test-writing + every feature/test implementation batch***)

Brian's two recurring heavy workloads are (1) writing many tests and (2) implementing many features-with-tests across emdash projects. Both are batches of independent units — exactly what parallel subagent fan-out is for. The default disposition is **fan out, throughput-liberal**: maximize wall-clock + coverage, accept ~3-4× the token cost of serial when the work is genuinely parallel, and never open token-worms (no speculative dozens of agents, no per-agent re-reading of shared context).

This rule answers WHEN to default to fan-out for these two patterns, HOW MANY agents, on WHICH model, and the HARD guardrails. It does NOT re-define the Monitor shell ([[monitor-orchestration]]), the specialist taxonomy ([[agent-selection]]), or the altitude→model map ([[model-routing]]) — it sits on top of all three and biases delegation toward parallel.

## Why parallel agents burn tokens so fast (the diagnosis — read this first)
Past fan-outs torched the budget because cost ≈ `N_agents × (preamble + brief + reads + reasoning + return)`, and several terms multiply per agent:
1. **Preamble re-ingestion (the dominant cost).** Every subagent is a FRESH context that re-reads the whole system preamble — global CLAUDE.md + all loaded rules + project CLAUDE.md + skill descriptions. On this stack that's tens of thousands of tokens PER agent before any work. A flat 10-agent fan-out can spend 300–600k input tokens just booting.
2. **Prompt-cache defeat.** [[prompt-cache]]'s ~90% discount applies to a REPEATED prefix within ONE conversation. Each subagent is a NEW conversation → a full-price cache WRITE (1.25×), not a read (0.1×). Fan-out trades the 90% discount for N writes.
3. **Flat-Opus fan-out.** Opus (xhigh + adaptive thinking) on the orchestrator AND every specialist multiplies the priciest reasoning; Opus 4.7's tokenizer also emits ~35% more tokens/input. Tiering (§ Model policy) is multiples cheaper.
4. **Brief bloat + shared-context re-reads.** Pasting whole files into briefs, or letting each agent re-grep/re-Read the same files the orchestrator already read, multiplies read tokens N×.
5. **Fat returns + runaway count.** Agents echoing full files / long reports back (then re-ingested), or spawning dozens, each paying cause #1.
The cheapest lever is therefore **fewer, well-scoped agents on cheaper tiers, small briefs, ≤200-word returns** — NOT more agents. The defaults below are built to hold all five down.

## Mechanics (the verified June-2026 reality)
- Parallel subagents = the orchestrator emitting MULTIPLE `Agent`/`Task` tool calls in ONE message; the harness runs them concurrently. There is NO on/off toggle and NO numeric max-concurrency setting — concurrency is bounded by Anthropic API rate limits + the model's own decision.
- The levers that DO exist:
  - `CLAUDE_CODE_SUBAGENT_MODEL=claude-sonnet-4-6` — run every spawned subagent on a cheaper model. **Set this for the two heavy workloads** (see § Model policy).
  - `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` — coordinated teams that message each other. Reserve for genuinely interdependent feature work, NOT independent test batches.
  - `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1` — kills background tasks. Leave UNSET for the heavy loops (background deploys/test-runs are useful).
  - `ultracode` — lets Claude auto-decide to spin up Dynamic Workflows (deterministic parallel fan-out + validation). **Enable it** (see § ultracode).
- Custom rules (this file) bias delegation; they don't change the harness.

## Default-to-fan-out triggers (the two heavy patterns)

### Pattern A — Test-writing batch
Fan out by DEFAULT when the work is **≥3 independent test targets** (specs for distinct features/routes/components/endpoints, or distinct E2E journeys per [[e2e-tdd-organization]]). One subagent owns one spec dir (`e2e/<feature>/` or `__tests__/<unit>`), TDD-RED-first per [[e2e-tdd-organization]] + [[verification-loop]].
- 3-5 targets → fan out (this is the sweet spot, see § Width).
- 1-2 targets → serial in main thread (fan-out overhead not worth it).

### Pattern B — Feature + test implementation batch
Fan out by DEFAULT when the brief has **≥3 independent feature modules / vertical slices** (per [[feature-module-architecture]] — one `libs/features/<slug>/` each, non-overlapping files). Each subagent owns its module end-to-end: schema + handler + UI + its own colocated tests, RED-first.
- This is already a [[monitor-orchestration]] multi-faceted trigger; this rule sharpens it to "default fan-out, don't single-thread the slices."

### Always-safe-to-parallelize (no threshold)
- Read-only exploration / research / audits — fan out freely, zero file-conflict risk. (deep-research, drift scans, competitor capture, codebase reconnaissance.)

## Fan-out width (token-bounded)
- **Sweet spot: 3-5 concurrent subagents.** Best coverage-per-token; clears API rate limits comfortably; each agent gets a real slice.
- **Hard ceiling: 8.** Throughput-liberal means a wider ceiling than the conservative 3-5 — but 8 is the cap. Beyond 8, marginal wall-clock gain collapses while token burn keeps climbing (each agent re-establishes its own context) and rate-limit queuing serializes the tail anyway.
- **Token rationale:** N parallel agents ≈ N× the per-agent context cost. At the 3-5 sweet spot that's ~3-5× a serial pass for ~the same wall-clock as one — a good trade for completeness. At 8 it's ~8× tokens for diminishing wall-clock; only justified when 8 targets are genuinely independent AND the batch is the whole point of the turn.
- **Batch, don't trickle:** if there are 12 targets, run two waves of 6 (or three of 4) — never 12 at once (rate-limit tail) and never one-at-a-time (defeats the purpose).

## Model policy (cost)
- **Spawned specialists run on Sonnet** for both heavy workloads — set `CLAUDE_CODE_SUBAGENT_MODEL=claude-sonnet-4-6`. Test-writing + feature implementation are `high`-effort, not `xhigh`-architecture, per [[model-routing]]. Sonnet specialists at 3-5× breadth beat one Opus thread on wall-clock AND tokens.
- **Orchestrator (main thread) stays Opus xhigh** — decomposition, slice boundaries, fold-back, and the verify gate are the `xhigh` work.
- **Trivial grunts (changelog/format/rename) → Haiku** per [[model-routing]] hierarchy.
- When Opus quota is exhausted per [[opus-quota-fallback]], the orchestrator drops to Sonnet too — fan-out width stays, effort drops to `high`.

## ultracode + env levers (recommendation)
- **Enable `ultracode`.** For these batch workloads it's a direct win: it lets Claude auto-decide to spin up Dynamic Workflows = deterministic parallel fan-out WITH a built-in validation step, which is exactly the "run N test/feature slices then gate them" shape. Aligns with [[sandbox-execution]] (validated promotion) + [[event-sourced-build-progress]] (typed progress) + [[verification-loop]] (the gate).
- **Set `CLAUDE_CODE_SUBAGENT_MODEL=claude-sonnet-4-6`** at user scope (cheap specialists, per § Model policy).
- **Leave `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` UNSET by default** — turn it on ONLY for an interdependent feature build where slices must message each other (rare; most batches are independent). Independent test batches do NOT need teams and teams add coordination token overhead.
- **Leave `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS` UNSET** — background test-runs + deploys are useful during the loop.

## Token guardrails (liberal-but-no-worms)
- **Cap at 8, sweet-spot 3-5.** No speculative "spawn one per file" across a 40-file repo.
- **One agent = one disjoint file set.** Overlapping file ownership = serial, not parallel (two agents editing the same file race + waste tokens re-reading each other's churn). Per [[agent-selection]] every spawn declares Scope + Non-goals.
- **No per-agent re-reading of shared context.** The orchestrator reads the shared brief/contract ONCE and passes a 100-300 word self-contained slice per [[full-autonomy]]; subagents do NOT each re-Read the same CLAUDE.md / schema / design doc. Subagents return ≤200-word summaries per [[prompt-cache]]; raw artifacts stay on disk.
- **Dependent work stays serial.** If slice B consumes slice A's output (schema → handler → UI chain), run A, then fan out B+C+D. Never parallelize a true data dependency.
- **Sequential when [[brian-preferences]] Simplicity > Cost > Speed says so** — a 2-target batch is simpler serial; don't fan out to look busy.
- **Fold-back is single-threaded in the orchestrator** — agents don't build/commit/deploy; the main thread folds outputs, builds ONCE, deploys ONCE, verifies ONCE (matches the projectsites loop memory: "agents don't build/commit/deploy — main thread folds + builds + deploys once").

## When NOT to parallelize (serial wins)
- **<3 independent targets** — fan-out overhead (per-agent context spin-up) exceeds the wall-clock gain.
- **Same-file / overlapping edits** — two agents on one file race + churn-read; do it serially.
- **Tight dependency chain** — schema→handler→UI for ONE feature is serial within that feature (parallelize ACROSS features, not WITHIN one).
- **Exploratory / "I don't yet know the slice boundaries"** — decompose first (one orchestrator pass), THEN fan out. Don't fan out a fog.
- **Tiny diffs / one-liners / single bug fix** — main thread, no agents.
- **Opus quota red AND the batch is security/payment/auth-sensitive** — defer per [[opus-quota-fallback]] rather than fan out a Sonnet-only pass on sensitive surfaces.

## Cross-link
- [[monitor-orchestration]] — the Monitor shell this rule fans out INSIDE; this rule sets the default width + model for the two heavy patterns
- [[agent-selection]] — specialists-not-generic + assignment table + diversity gate; every spawned agent here is a named specialist
- [[model-routing]] — Opus orchestrator → Sonnet specialists → Haiku grunts; this rule pins Sonnet for the heavy-batch specialists via the subagent-model env
- [[opus-quota-fallback]] — width survives quota exhaustion; effort drops to high
- [[full-autonomy]] — 100-300 word self-contained subagent briefs; parallel-when-independent
- [[prompt-cache]] — subagents get their own cache; ≤200-word summaries back; no shared-context re-reads
- [[e2e-tdd-organization]] — the RED-first spec layout each test-writing agent owns
- [[feature-module-architecture]] — the `libs/features/<slug>/` unit each feature agent owns
- [[verification-loop]] — the single fold-back build + deploy + prod-E2E gate after fan-out
- [[brian-preferences]] — Simplicity > Cost > Speed; pick ONE, just do it

## Reference incident (***2026-06-08 — parallel-subagent defaults***)
Brian directive to make the agent lean toward parallel subagents for his recurring heavy workloads (lots of test-writing + lots of feature/test implementation), throughput-liberal but token-conscious ("slightly toward liberal usage without opening any worms"), and to enable `ultracode` + the cheap-subagent-model env where it fits. Codified as the default-fan-out bias on top of the existing Monitor/agent-selection/model-routing mesh.

Follow-up same day — Brian: *"I want this to be more like a master/agents process … parallel agents running. However, in the past … it ate the accounts tokens so fast — why was this the case?"* The dominant culprits were **preamble re-ingestion × flat-Opus fan-out × shared-context re-reads**, compounded by **prompt-cache defeat** (a fresh subagent context can't reuse the main thread's cached 90% prefix). Added the "Why parallel agents burn tokens so fast" diagnosis section above so the COST model is explicit, not just the guardrails — the answer to "why" is cause #1 (every agent re-pays the huge preamble) and cause #2 (cache is per-conversation).
