---
name: "monitor-orchestration"
priority: 1
pack: "core"
triggers: []
paths:
  - "*"
---

# Monitor Orchestration + One-Prompt Completion

Every multi-faceted user prompt MUST be completed in this turn — never split across follow-ups. Main thread acts as **Monitor**: decompose → fan out parallel sub-agents → sequence dependents → fold → verify → ship.

## When to fire

Fire if ANY of:

- ≥3 distinct work units in prompt
- Explicit list / numbered sections / "phases" / "passes"
- "finish everything" / "implement all phases" framing
- Multiple pages/components/files needing change
- Prompt would otherwise yield "defer X to follow-up"

If yes: **FIRST tool call** is `TaskCreate` per work unit + parallel `Agent` spawns for independent ones — NOT a sequential file-read marathon.

## Decomposition (within 30s of prompt)

1. **IndependentPasses** — no file conflicts → spawn parallel agents
2. **DependentPasses** — need another pass's output → sequence explicitly
3. **ForegroundPasses** — small edits main thread does while agents run
4. **ExternalBlockers** — needs user (API keys, DNS, images) → surface at end-of-turn; do NOT block parallel work

## Parallel-agent spawn discipline

- Spawn multiple `Agent` calls in **ONE message** — never sequentially
- Each agent: 100-300 word self-contained brief (scope · files owned · what NOT to touch · output format)
- Use `isolation: "worktree"` for heavy file rewrites that might race
- Monitor waits via completion notification — **NEVER polls/sleeps**
- `parallel-subagent-economy` governs fan-out WHEN/WIDTH/MODEL; this rule governs WHETHER Monitor fires

## Sequencing

- Dependent passes: one `Agent` after prerequisite completes, OR main thread chains
- Order: parallel-batch-1 → foreground → wait → parallel-batch-2 → build → deploy → verify → report
- Never serialize what can parallelize; never parallelize what has a true data dependency

## Follow-up = shortcoming feedback loop

When user issues a 2nd/Nth prompt on same project:

1. Read it as a gap report
2. Identify the shortcoming type
3. **Before doing the work**: append gap to Known shortcomings below + cross-link from relevant rule
4. Commit rule update same turn — never deferred

## Known shortcomings (append, never delete)

Each entry: `<symptom>` → `<root cause>` → `<rule that prevents it>`.

1. **"Implement all phases" yields one-section-per-turn** → Monitor not fired → THIS rule.
2. **"Finish everything" closes with deferred items** → parallel-agent spawning missed → THIS rule § Decomposition.
3. **External blockers silently absorb 30%+ of brief** → ExternalBlocker bucket implicit → THIS rule § Decomposition (4); `brian-preferences` § explicit blockers.
4. **AI chat widget spec'd but never coded across 3 passes** → no Monitor decomposition; each pass picked one fix → THIS rule § Parallel-agent spawn.
5. **AUDIT_PASS_N docs accumulate while items stay open** → audit-without-implementation drift; S/M items MUST fan out to parallel Agent spawns same turn.
6. **Repeated identical prompt = wrong-shaped response** → re-read fresh; check if user wants Monitor to FIRE not more output.
7. **One-line rebuild (`rebuild|optimize X.com`) executed serially** → rebuild is ≥7 independent units (crawl→classify→org-type→i18n→jewel→IA→deploy-verify) → `source-site-enhancement` § Parallel-agent playbook; `16-cinematic-website-prime-directive` rule 110; Monitor-fire explicit on first tool-call message.
8. **Single-prompt corrections ("now do X") dropped on the floor outside Monitor turns** → elevated to SUPREME universal at `prompt-as-training-signal` (7 prompt shapes + extraction protocol); this rule points up to it.
9. **Parallel spawns defaulted to `general-purpose` workers** → no diversity check → `agent-selection` (taxonomy + classify-before-spawn + assignment table + rejected-agent note + **Agent Diversity Review gate**). Emit assignment table before spawning; diversity gate before DONE.
10. **`/loop`-driven sessions accumulate 15+ serial passes — NOT always a shortcoming.** Per `parallel-subagent-economy` (<5-min gain → serial-correct), bounded iterative `/loop` passes that each close prior Recs are healthy. "Follow-up = shortcoming" applies when prior turn under-delivered, NOT when prior turn deliberately scoped one slice. Diagnostic: if pass-N Recs → pass-(N+1) Next AND CHANGELOG grows linearly → healthy iteration.

11. **Vendored third-party skills committed verbatim (7K lines of upstream prose)** → fidelity over-indexed, compression skipped → `[[vendored-skill-compression]]` (compress on the way in, reference public content, fold overlaps); re-prompt "absorb while compressing" was the correction.

## Healthy iteration patterns (NOT shortcomings)

1. **`/loop N{m,h}` cron + bounded iterative prompt** — serial main-thread passes each scoping one coherent slice; pass-N Recs become pass-(N+1) Next; CHANGELOG grows one § per pass; diff ~5-200 LOC/pass.
2. **Recs section with 2-3 future candidates** — per `auto-integrate-recs`: <2h items ship in-turn; only design-conversation / external-blocker / >2h items belong in Recs.
3. **One-coherent-slice-per-turn against `/loop`** — distinct from shortcoming #1 (multi-faceted "implement all" brief). Healthy when scope is intentionally narrow + self-iterating.

Trigger heuristic: identical prompt + no Recs closed + deferred items piling up → shortcoming. Identical prompt + Recs closed + CHANGELOG linear → healthy.

## Update protocol

On this rule being updated:

- Append to Known shortcomings
- Cross-link from most-relevant adjacent rule
- Include update in same turn's tool calls (never "next turn")
- Commit to `~/.agentskills` immediately

## Implementation checklist (Monitor each turn)

- [ ] Monitor pattern fires? (see When to fire)
- [ ] `TaskCreate` one task per independent work unit
- [ ] Multi-`Agent` spawn parallel work in ONE tool-call message
- [ ] Main thread foreground edits while agents run
- [ ] Wait notification-driven, never polling
- [ ] Fold agent outputs → coherent build
- [ ] Build + deploy + smoke-test on prod URL per `verification-loop`
- [ ] User follow-up arrives → append shortcoming + cross-link BEFORE doing work
- [ ] Rule changes committed same turn

See: `always` § Post-work, `verification-loop`, `full-autonomy` § Sub-agent prompts, `prompt-as-training-signal` (SUPREME universal).

## Folded from Superpowers — executing-plans

*Vendored discipline from [obra/Superpowers](https://github.com/obra/Superpowers) (MIT, Jesse Vincent). Full skill: [[20-superpowers]] → writing-plans/SKILL.md (plan authoring) + subagent-driven-development.*

- Before executing a written plan: read it whole, **review critically**, raise concerns with the user BEFORE starting — not mid-execution.
- Create one todo per plan item; execute each step exactly (plans carry bite-sized steps); run the step's specified verification before marking done.
- **Stop and ask, don't guess** when blocked: missing dependency, failing test, unclear instruction, or repeated verification failure.
- Return to plan-review when the approach needs rethinking or the user revises the plan.
- Never start implementation on `main` without explicit consent (this repo: worktree-isolate per `[[main-only-branch]]`).
- On completion → `[[20-superpowers]]` → finishing-a-development-branch (verify tests, choose merge/PR/cleanup).
- Where subagents exist, prefer `[[20-superpowers]]` → subagent-driven-development over solo serial execution.
- See [[20-superpowers]]
