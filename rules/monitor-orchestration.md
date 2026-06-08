# Monitor Orchestration + One-Prompt Completion (***SUPREME PRIORITY***)

Every multi-faceted user prompt MUST be treated as a single project to be completed in this turn — never split across follow-up prompts. The main thread acts as **Monitor**: decompose the brief, fan out parallel sub-agents for independent work, sequence dependent work, fold results back, verify, ship. Follow-up prompts on the same project signal a shortcoming in the prior turn; every such signal updates this rule set so the gap does not repeat.

## When to fire the Monitor pattern
Fire if ANY of:
- User prompt contains ≥3 distinct work units
- Explicit list / numbered sections / "phases" / "passes" in the prompt
- User previously asked the same project to "finish" / "implement everything" / "do all the phases"
- Brief mentions multiple pages/components/files needing change
- Any prompt that would otherwise yield "I'll defer X to a follow-up turn"

If yes: the **FIRST tool call** is `TaskCreate` for each work unit + parallel `Agent` spawns for the independent ones — NOT a sequential file-read marathon.

## Decomposition rule
Within 30 seconds of receiving the prompt, identify and write down (via TaskCreate):
1. **IndependentPasses** — work that can spawn in parallel agents without file conflicts
2. **DependentPasses** — work that needs another pass's output (e.g., "rewrite refs to local paths" depends on "download images")
3. **ForegroundPasses** — small file edits the main thread does while agents run
4. **ExternalBlockers** — anything that needs the user (API keys, photo permissions, image-gen tools, DNS, parish data)

External blockers do NOT block the parallel work — surface at end-of-turn with concrete next-prompt language.

## Parallel-agent spawn discipline
- Spawn multiple `Agent` calls in the **SAME message** — never sequentially
- Each agent gets a 100-300 word self-contained brief (per `[[full-autonomy]]`) including:
  - Exact scope
  - File paths it owns
  - What NOT to touch (so agents don't stomp)
  - Output format expected
- Use `isolation: "worktree"` when an agent does heavy file rewrites that might race with the main thread
- The Monitor (main thread) does foreground edits + waits via the system's completion notification
- **NEVER** polls / sleeps / tails agent output files
- For Brian's two recurring heavy workloads (test-writing batches + feature/test-impl batches), the ≥5-min-wall-clock fan-out trigger, the fan-out WIDTH (sweet spot 3-4, hard ceiling 6, batch beyond 6), the Sonnet-specialist cost default, and the token guardrails are set by [[parallel-subagent-economy]] — this rule decides IF the Monitor ceremony fires; that rule decides WHEN to fan out + how WIDE + on what MODEL

## Sequencing rule
- Dependent passes wait via a single `Agent` call that runs AFTER prerequisites complete, OR the main thread chains them itself
- The Monitor explicitly orders: parallel batch 1 → main-thread foreground work → wait → parallel batch 2 (using batch-1 outputs) → build → deploy → verify → report
- Never serialize what can parallelize; never parallelize what has a true data dependency

## Follow-up = shortcoming feedback loop (***NON-NEGOTIABLE***)
When a user issues a 2nd / 3rd / Nth prompt on the same project, that is evidence the prior turn under-delivered. The Monitor MUST:
1. Read the new prompt as a gap report
2. Identify which kind of shortcoming it represents
3. Before doing the requested work, append the gap pattern to this rule's "Known shortcomings" list below
4. Cross-link from the relevant rule (always / verification-loop / copy-writing) so the gap is caught at decomposition time on the next project

Updating the rules is part of the response, not deferred. If the gap is project-specific (not a generalizable rule), skip the rule update — but log it inside the project's CLAUDE.md.

## Known shortcomings (append, never delete)
Each entry: `<symptom>` → `<root cause>` → `<rule that prevents it>`.

1. **"Implement all the phases" framing yields one-section-per-turn delivery** → Monitor pattern was not fired, work was done foreground-only on the most visible item → THIS rule (monitor-orchestration).
2. **"Finish everything" / "complete" prompts close with deferred items + "next prompt should..."** → Implementation honesty was real but parallel-agent spawning was missed → THIS rule § Decomposition.
3. **Deferred "external blockers" (image-gen, photo permissions, video commission) silently absorb 30%+ of the brief** → ExternalBlocker bucket was implicit, not explicit → THIS rule § Decomposition (4); also `[[brian-preferences]]` § "Pick ONE, never options — but explicit blockers ARE the answer when the blocker is the truth."
4. **AI chat widget Phase 1 spec'd but never coded across 3 passes** → No Monitor decomposition; each pass picked one tactical fix instead of fanning out parallel widget builds → THIS rule § Parallel-agent spawn (widgets are independent files = perfect parallel candidates).
5. **AUDIT_PASS_N docs accumulate while the items inside them stay open** → Audit-without-implementation drift. Audit docs MUST be followed in the SAME turn by parallel Agent spawns for every item tagged S/M (the agents handle 1-3h work each), NOT just enumerated for later.
6. **Repeated identical user prompts indicate the prior response was wrong-shaped, not wrong-content** → Re-read the prompt fresh, do not just continue prior work; check whether the user is asking the Monitor to FIRE rather than asking for more output.
7. **One-line website-rebuild prompts (`rebuild|optimize|enhance X.com`) executed serially in main thread instead of fired as Monitor** → Rebuild prompt is multi-faceted by nature (≥7 independent work units: crawl→classify→org-type-infer→demographic-i18n→jewel-content-author→IA-normalize→Squarespace-dedupe→deploy-verify) but turn 1 used main-thread sequential file-reads+writes+edits (~12 tool calls) when 3-5 parallel `Agent` spawns + 5 foreground edits in 1 message would have shipped the same result in half the wall clock → `[[source-site-enhancement]]` § Parallel-agent playbook MUST be invoked on the first tool-call message; `[[16-cinematic-website-prime-directive]]` rule 110 amended to make Monitor-fire explicit; `[[15-site-generation/SKILL]]` build-pipeline rewritten as fan-out parallel by default (sequential = build fail).
8. **Follow-up shortcoming feedback loop lived ONLY inside monitor-orchestration so it only fired for multi-faceted briefs** → User issued explicit meta-instruction 2026-05-25 (*"for every prompt, you extract meaningful value...all of these prompts suggest something that was initially done was not enough"*). The single-line correction follow-ups, "now do X", "make sure ___" prompts that hit non-Monitor turns were dropping on the floor. Elevated to SUPREME universal at `[[prompt-as-training-signal]]` with 7 prompt shapes + extraction protocol; this rule now points up to it instead of owning the pattern.
9. **Parallel spawns defaulted to generic `general-purpose` workers → weak specialization, duplicated effort, shallow reviews** → Decomposition fired the Monitor but assigned undifferentiated workers instead of purpose-built specialists; no diversity check existed in the final review → `[[agent-selection]]` (taxonomy + classify-before-spawn + assignment table + rejected-agent note + **Agent Diversity Review gate**). Every parallel run now emits the assignment table before spawning and runs the diversity gate before DONE; the `/agent-diversity-review` + `/final-review` commands own enforcement.

## Update protocol
When this rule itself gets updated (because a new shortcoming surfaced), the Monitor MUST:
- Append to the Known shortcomings list above with the new entry
- Cross-link from the most-relevant adjacent rule
- Include the rule update in the same turn's tool calls (never "I'll update the rules next turn")
- Commit the rule change to `~/.agentskills` immediately so future sessions inherit it

Per the desktop-skill-sync hook in `~/.claude/CLAUDE.md`, the rule reaches the desktop app on the next prompt automatically.

## What this rule does NOT do
- Does not eliminate ALL multi-turn projects — some work genuinely needs human input between turns (photo permissions, DNS cutover, payment-test charges)
- Eliminates UNNECESSARY multi-turn iteration: anything I could have done in turn 1 but split into turn 2-N because of poor decomposition

## Implementation checklist (for the Monitor each turn)
- [ ] Identify if Monitor pattern should fire (see "When to fire" above).
- [ ] `TaskCreate` one task per independent work unit.
- [ ] Multi-`Agent` spawn parallel work in a SINGLE tool-call message.
- [ ] Main thread does foreground edits while agents run.
- [ ] Wait for agent completion (notification-driven, never polling).
- [ ] Fold agent outputs back into a coherent build.
- [ ] Build + deploy + smoke-test on prod URL per `[[verification-loop]]`.
- [ ] If a user follow-up arrives on this project later, BEFORE doing the work: append the shortcoming above + cross-link from the relevant rule.
- [ ] Commit rule changes the SAME turn they're identified.

See: [[always]] § Post-work, [[verification-loop]] (deploy + prod-E2E mandate), [[full-autonomy]] § Sub-agent prompts, [[brian-preferences]] § "NEVER ask permission / multiple options / lose context", [[prompt-as-training-signal]] (SUPREME universal — the every-prompt elevation of this rule's Follow-up loop).
