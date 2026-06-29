# Anthropic Skill-Authoring Best Practices

Public guidance — read at the source, not restated here:

- Superpowers original: <https://github.com/obra/Superpowers/blob/main/skills/writing-skills/anthropic-best-practices.md>
- Anthropic Agent Skills docs: <https://docs.anthropic.com> (search "Agent Skills")

## Non-obvious points worth keeping local

- **Description = WHEN, not WHAT.** A description that summarizes the workflow becomes a shortcut agents follow *instead of* reading the body — they do one step when the body says two. State triggering conditions only. (See `[[skill-authoring-contract]]` § description-SDO.)
- **Progressive disclosure is a hard budget, not a style.** SKILL.md loads into context; heavy reference (API dumps, 100+ line tables) lives in sibling files loaded on demand. Inline only what changes per task.
- **Name by the action / core insight, verb-first** — `condition-based-waiting` over `async-test-helpers`. Gerunds suit processes (`creating-skills`).
- **Cross-reference by skill name, never `@path`.** `@` force-loads the file immediately and burns context before it's needed. Use `**REQUIRED:** superpowers:test-driven-development`.
- **Automate mechanical constraints instead of documenting them.** If a regex/validator can enforce it, do that; reserve skill prose for judgment calls.
- **One excellent example beats five languages.** Complete, runnable, commented with WHY — not a fill-in-the-blank template.

For the canonical house contract (ordered-by-weight, description template, "match the form to the failure"), see `[[skill-authoring-contract]]`. For testing skills under pressure, see [testing-skills.md](testing-skills.md).
