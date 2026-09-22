# Routing Matrix — Where Every Lesson Goes

Classify every reusable lesson before writing it anywhere. This is the single decision table for routing.

## Decision Table

| Signal Type | Example | Destination | Why |
|---|---|---|---|
| Universal, every-session rule | "Always run TDD" | `~/.claude/CLAUDE.md` | Loaded every prompt |
| Personal philosophy, identity | "I'm a solo builder" | `AGENTSKILLS.md` | Durable, changes rarely |
| Reusable workflow, procedure | "How to compress docs" | `~/.claude/skills/<name>/SKILL.md` | Invoked by name or trigger |
| Copy-paste prompt template | "Find all TODOs in markdown" | `prompts/<nn>-<name>.md` | Human or agent copy-pastes |
| Project-specific workflow | "Deploy this specific app" | `project/.claude/skills/<name>/SKILL.md` | Travels with repo |
| Human-readable policy | "Why we chose React over Vue" | `project/docs/<NAME>.md` | For contributors |
| Deterministic lifecycle gate | "Check for retrospective at end of turn" | `~/.claude/hooks/<name>.sh` | Runs automatically |
| Noisy, parallelizable scan | "Find all stale TODOs in 100 files" | subagent (spawn via Agent tool) | Isolated, parallel |
| Superseded, low-value, overfit | "Old version of prompt 03" | `archives/` | Preserved, not canonical |
| Why something was changed | "Added rule X because Y kept happening" | `LEDGER.md` | Future agent context |

## Classification Heuristics

### Goes to CLAUDE.md when:

- Should affect nearly every Claude Code session
- Is a hard constraint (never/always)
- Is a safety rule (never delete without asking)
- Is a stack default (always use React 19 + Vite)

### Goes to AGENTSKILLS.md when:

- Describes who the user is and how they work
- Is a philosophical stance on engineering
- Is a thinking discipline (Boil the Lake, Self-Argue)
- Changes less than monthly

### Goes to a skill when:

- Has multiple steps or phases
- Might be invoked by name ("run the retrospective")
- Has a clear trigger phrase
- Benefits from progressive disclosure (frontmatter → body → reference)

### Goes to a prompt when:

- Is a complete, copy-pasteable instruction
- Might be adapted for different contexts
- Has clear trigger phrases that map to user wording
- Isn't complex enough to need a full skill

### Goes to a hook when:

- Must run deterministically at a lifecycle point
- Should gate or validate behavior
- Is simple enough to express in a shell script or Python
- Must never be skipped

### Goes to a subagent when:

- Scans many files in parallel
- Is noisy (lots of findings, not all actionable)
- Benefits from isolation (won't pollute main context)
- Is a recurring audit or sweep task

### Goes to LEDGER.md when:

- Any durable artifact is created, updated, or archived
- A decision needs future agents to understand context
- A correction pattern is worth documenting

### Goes to archives/ when:

- Was useful but is now superseded
- Was overfit to a specific project that no longer exists
- Was an experiment that didn't work out
- Must not stay canonical but might be referenced later

## Anti-Patterns

- **Don't dump into CLAUDE.md**. It should be <200 lines. Put procedural knowledge into skills.
- **Don't create a skill for a one-off**. Skills should be invoked 3+ times.
- **Don't create a prompt for a procedure**. Prompts are copy-pasteable text; skills are invoked workflows.
- **Don't skip the ledger**. If it's worth changing, it's worth logging.
- **Don't archive without a replacement**. Superseded material should point to what replaced it.

## Cross-References

- `rules/prompt-as-training-signal.md` — full doctrinal rule for learning extraction
- `_router.md` — skill routing index (which skill handles which task)
- `prompt-library-policy.md` — rules for maintaining the prompt library
- `retrospective-policy.md` — when and how to run retrospectives
