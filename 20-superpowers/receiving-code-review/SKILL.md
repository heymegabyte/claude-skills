---
name: receiving-code-review
description: Use when receiving code review feedback, before implementing suggestions, especially if feedback seems unclear or technically questionable - requires technical rigor and verification, not performative agreement or blind implementation
---

# Receiving Code Review

Feedback is suggestions to evaluate, not orders to follow. **Verify before implementing, ask before assuming** — technical correctness over social comfort. Verify against the codebase the same way `[[verification-loop]]` gates deploys: evidence before action.

## Response pattern

1. Read the full feedback without reacting.
2. Restate each item in your own words — or ask if unclear.
3. Verify against codebase reality; evaluate if it's sound for THIS stack.
4. Acknowledge technically, or push back with reasoning.
5. Implement one item at a time, testing each.

## No performative agreement

- Never "You're absolutely right!" / "Great point!" / "Thanks for catching that!" — any gratitude or praise.
- Never "Let me implement that" before verifying.
- Instead: restate the requirement, ask, push back, or just start working. The code shows you heard it.
- Catch yourself typing "Thanks" or "You're right" → delete it, state the fix.

## Unclear feedback → stop

- If ANY item is unclear, implement NOTHING yet — items may be related; partial understanding ships the wrong fix.
- Ask only about the unclear ones: "Understand 1,2,3,6. Need clarification on 4 and 5 before proceeding."

## Source-specific

- **From your partner** — trusted; implement after understanding, ask if scope unclear, skip to action.
- **From external reviewers** — skeptical but careful. Before implementing, check: correct for THIS codebase? breaks existing behavior? reason the current code exists? works on all target platforms/versions? does the reviewer have full context?
- Can't verify → say so: "Can't verify without [X]. Investigate, ask, or proceed?"
- Conflicts with a prior architectural decision → stop and discuss with your partner first.

## YAGNI check

- Reviewer says "implement it properly" → grep for real usage first.
- Unused → "Nothing calls this endpoint. Remove it (YAGNI)?" Used → implement properly.

## Implementation order

1. Clarify everything unclear first.
2. Then: blocking (breaks/security) → simple (typos/imports) → complex (refactor/logic).
3. Test each fix individually; verify no regressions.

## Push back when

- Suggestion breaks existing functionality, violates YAGNI, is wrong for this stack, ignores legacy/compat reasons, lacks full context, or conflicts with a partner architectural call.
- How: technical reasoning not defensiveness; cite working tests/code; ask specific questions; escalate to partner if architectural.
- Uncomfortable pushing back? Name the tension and raise the issue anyway — honesty is the value.

## Acknowledging

- Correct feedback → "Fixed. [what changed]" or "Good catch — [issue]. Fixed in [location]." No thanks.
- You pushed back and were wrong → "You were right — checked [X], it does [Y]. Fixing." No apology, no over-explaining.

## GitHub threads

Reply inline in the comment thread (`gh api repos/{owner}/{repo}/pulls/{pr}/comments/{id}/replies`), not as a top-level PR comment.

**Verify. Question. Then implement.**

## Rationalizations — stop, these are wrong

| Excuse | Reality |
|---|---|
| "Reviewer is more senior" | Senior reviewers make mistakes. Verify technically. |
| "I'll just apply it and move on" | Blind agreement ships bugs the reviewer didn't catch. |
| "The feedback is obviously right" | Obvious things are often wrong. Open the code. |
| "Pushing back is rude" | Shipping bad code is rude. Push back with evidence. |

**Red Flags — STOP and re-read the code yourself:** agreeing without opening a file · "they probably checked" · gratitude instead of verification · applying feedback you don't understand.

<!-- budget: ~63 -->
