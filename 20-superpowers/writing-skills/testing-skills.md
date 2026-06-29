# Testing Skills

Merges the testing + bulletproofing method from the vendored [obra/Superpowers](https://github.com/obra/Superpowers) writing-skills (MIT, Jesse Vincent). The technique, not the prose.

Testing a skill is TDD on process documentation: run the scenario WITHOUT the skill (RED — watch the agent fail), write the skill against those exact failures (GREEN), close the new loopholes the agent finds (REFACTOR). If you never watched an agent fail without it, you don't know the skill prevents the right thing.

**REQUIRED BACKGROUND:** superpowers:test-driven-development defines RED-GREEN-REFACTOR. This adapts it to docs.

## Iron Law

NO SKILL — OR EDIT — SHIPS WITHOUT A FAILING TEST FIRST. Wrote it before testing? Delete it, start from baseline. Applies to "simple additions" and "just a section" too.

## What to test (and what not to)

- Test skills that enforce discipline, carry a compliance cost (time, rework), or can be rationalized away under pressure.
- Don't pressure-test pure reference skills (API/syntax). Test those for *retrieval* instead: can an agent find the right entry and apply it? Are common cases covered?

## Match the form to the failure (do this BEFORE writing guidance)

Classify the baseline failure first — the form that fixes one type backfires on another. (Canonical version: `[[skill-authoring-contract]]`.)

| Baseline failure | Right form | Wrong form |
|---|---|---|
| Knows the rule, skips it under pressure | Prohibition + rationalization table + red flags | Soft guidance ("prefer…", "consider…") |
| Complies but output is wrong-shaped (bloated, buried verdict, restated spec) | Positive recipe: state what the output IS, its parts in order | Prohibition ("don't restate", "never narrate") |
| Omits a required element it already produces | Structural: a REQUIRED slot in the template | Prose reminder near the template |
| Behavior should depend on a condition | Conditional on an observable predicate | Unconditional rule + exemption clauses |

- **Prohibitions backfire on shaping problems.** Under a competing incentive the agent negotiates with "don't X"; in head-to-head wording tests the prohibition arm produced *more* unwanted content than even the no-guidance control. A recipe leaves nothing to negotiate.
- **No nuance clauses.** "Don't X unless it matters" reopens the negotiation — it turned a consistent recipe noisy in the same tests. Express a real exception as its own conditional.
- **Exemption clauses don't scope.** "Doesn't apply to code blocks" still suppresses code blocks. Restructure so the rule can't reach the exempt part.

## RED — baseline

Run a pressure scenario WITHOUT the skill. A good scenario:

- Combines 3+ pressures (single pressure is resisted; stacked pressure breaks). Types: time, sunk cost, authority, economic, exhaustion, social, "being pragmatic not dogmatic".
- Forces a concrete A/B/C choice — no open-ended "what should you do", no deferring to "I'd ask the human".
- Uses real paths, real times, real consequences. Frame it as real work, not a quiz ("This is a real scenario. Choose and act.").

Document choices and rationalizations **verbatim** — "the agent was wrong" tells you nothing; "Tests after achieve same goals" tells you exactly what to counter. Note which pressures triggered the violation.

## GREEN — minimal skill

Write only enough to address the failures you actually observed; no content for hypothetical cases. Re-run the same scenarios WITH the skill. Still failing → the skill is unclear or incomplete, not the agent.

## REFACTOR — close loopholes

For each NEW rationalization the agent invents:

1. **Explicit negation** — don't just state the rule, forbid the workaround. `Delete it.` → `Delete it. Start over. Don't keep it as "reference", don't "adapt" it, don't look at it. Delete means delete.`
2. **Rationalization table row** — `| "Keep as reference, write tests first" | You'll adapt it. That's testing after. Delete means delete. |`
3. **Red-flag entry** — a self-check list of phrases that mean STOP ("I already manually tested it", "spirit not letter", "this is different because…").
4. **Foundational principle, stated early** — `Violating the letter of the rules is violating the spirit.` kills a whole class of "I'm following the spirit" outs.
5. **Update the description** with the symptoms of being ABOUT to violate.

Re-test the same scenarios. Bulletproof when, under maximum pressure, the agent picks the right option, cites the skill, and acknowledges the temptation but holds. Not bulletproof if it invents new rationalizations, argues the skill is wrong, or builds a "hybrid".

### Micro-test the wording before full scenarios

Full pressure runs are the final gate but slow. Verify the wording first (raw API call or single-shot subagent):

- System prompt = the realistic context the guidance lives in (the whole skill/template, not the line in isolation); user message = a task that tempts the failure.
- **Always include a no-guidance control.** If the control doesn't fail, there's nothing to fix — don't author guidance. (See `[[micro-test-instruction-wording]]`.)
- 5+ reps per variant — single samples lie. Read every flagged match by hand; template echoes and quoted counter-examples masquerade as hits.
- **Variance is the metric.** When wording binds, reps converge on one shape. Five interpretations across five reps = tighten the form before adding words.

### Meta-test when GREEN won't hold

Ask the failing agent: "You read the skill and chose C anyway — how should it have been written so A was the only acceptable answer?" Three answers map to three fixes: "it was clear, I ignored it" → add a stronger foundational principle; "it should have said X" → add X verbatim; "I didn't see section Y" → make Y more prominent / move it earlier.

## Rationalizations for skipping testing — all mean "test first"

| Excuse | Reality |
|---|---|
| "Obviously clear" | Clear to you ≠ clear to other agents. |
| "Just a reference" | References have gaps. Test retrieval. |
| "I'll test if problems emerge" | Problems = agents can't use it. Test before deploy. |
| "I'm confident it's good" | Overconfidence guarantees issues. |

## STOP — per-skill deployment gate

After writing ANY skill, finish it before starting the next. No batching untested skills "for efficiency". Deploying an untested skill = deploying untested code.

Checklist: baseline ran + rationalizations captured verbatim · form matches the failure type · behavior-shaping wording micro-tested vs a control · description is "Use when…" triggers-only, third person, keyword-rich · one runnable example (not multi-language) · WITH-skill re-test passes under max pressure · rationalization table + red-flags built from real iterations · commit + push.

## Anti-patterns

- Narrative example ("in session 2025-10-03 we…") — too specific, not reusable.
- Multi-language dilution (example.js + .py + .go) — mediocre, maintenance burden.
- Code or generic labels (`step1`, `helper2`) in flowcharts — unreadable, no semantic meaning.
- Vague counters ("don't cheat") — only specific negations ("don't keep as reference") bind.
- Stopping after one passing run — passing once ≠ bulletproof.

## See

- [examples/CLAUDE_MD_TESTING.md](examples/CLAUDE_MD_TESTING.md) — worked test campaign over CLAUDE.md variants
- persuasion-principles.md — why authority/commitment/scarcity raise compliance
- `[[skill-authoring-contract]]` · `[[instruction-compression-playbook]]` · `[[micro-test-instruction-wording]]`
