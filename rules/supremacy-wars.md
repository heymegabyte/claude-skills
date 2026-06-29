# Supremacy Wars

Hooks > rules > skills > prompts. Every time a hook catches what CLAUDE.md said but the model ignored, it goes here.

---

## 2026-06-29 — Vendored-skill compression bypass

**What CLAUDE.md said:** "Every prompt is a gradient" (prompt-as-training-signal). When user re-prompts on the same surface, the prior turn under-delivered. Extract the lesson and write it to the durable layer BEFORE doing the requested work.

**What the model did instead:** Shipped the vendored skill verbatim on pass 1. When asked "Now make me a compression rule too," it created `rules/vendored-skill-compression.md` — but the rule restated the requirement rather than extracting why the first pass was wrong. The gradient was "you shipped raw; you should have compressed" — but the written rule was "compress vendor skills" not "why did you skip compression on pass 1?"

**Which hook caught it:** The re-prompt itself. The user having to say "now make a rule" twice on the same surface = the hook. Exit code 2 (the Claude Code harness surfaced the asymmetry: user expanded the prompt to include the meta-lesson the first pass omitted).

**Hook stderr reminder:** "A re-prompt on the same surface means prior turn under-delivered. Extract the lesson before doing the work — the gradient is the delta between what you shipped and what they asked for, not a restatement of the final instruction."

---

## Future entries

Use this template:

```markdown
## YYYY-MM-DD — <incident name>

**What CLAUDE.md said:** ...

**What the model did instead:** ...

**Which hook caught it:** ... (hook name / exit code)

**Hook stderr reminder:** ...
```
