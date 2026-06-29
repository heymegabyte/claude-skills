---
name: skill-authoring-contract
priority: 2
pack: core
triggers:
  - "new skill"
  - "SKILL.md"
  - "authoring contract"
  - "skill quality"
paths:
  - "NN-*/SKILL.md"
  - "rules/*.md"
---

# Skill Authoring Contract

Codifies the quality contract every SKILL.md and rules/*.md file must satisfy.
Enforced by `bin/audit-skill-authoring.mjs`. Violations are drift — fix in-turn.

## (a) Required structure: `## Spec` before `## Instructions`

Every skill MUST open with a `## Spec` section (before any `## Instructions` section):

```markdown
## Spec

- **name**: kebab-case slug matching frontmatter `name`
- **trigger phrases**: comma-separated natural-language phrases that activate this skill
- **acceptance criteria**: bullet list of measurable outcomes that define "done"
```

Rationale: the router selects skills from triggers; criteria drive the completeness check.
Skills missing `## Spec` cannot be routed reliably and fail the completeness-checker agent.

## (b) Behavior-anchored description template

Every `description:` frontmatter value MUST follow this template:

```
{Gerund phrase summarizing what skill does}. Use when {trigger phrases}. Not when {exclusion cases}.
```

Examples:

- `"Auditing NN-* SKILL.md files for quality. Use when checking authoring compliance or adding a skill. Not when reviewing non-skill markdown."`
- `"Generating MCP servers from OpenAPI specs. Use when a new API joins the stack. Not when hand-rolling is faster than forge time."`

Rules:

- ≥30 chars, contains at least one gerund (`-ing` word) or the phrase `Use when`.
- Must name the primary artifact or domain the skill acts on.
- No filler: "helps with", "provides", "supports" → rewrite to active gerund.

## (c) Optional `depends_on:` frontmatter — must stay acyclic

Skills may declare upstream skill dependencies:

```yaml
depends_on:
  - 01-operating-system
  - rules/feature-flags
```

- **Acyclicity is a hard gate** — `bin/audit-skill-authoring.mjs --ci` exits 1 on any cycle.
- Keep the graph a DAG; never let skill A depend on skill B that (transitively) depends on A.
- `depends_on:` is optional. Most skills omit it; declare only when load-order matters.

## (d) Eval-first: ≥3 cases before "stable"

A skill is not `stable` until it has ≥3 eval cases co-located:

- `NN-<slug>/evals/` directory containing ≥3 JSON eval case files, OR
- `NN-<slug>/__eval__.json` with a `cases:` array of ≥3 entries.

Until eval coverage exists the skill is advisory only (`stage: experimental`).
`bin/audit-skill-authoring.mjs` flags skill dirs missing both as MEDIUM (advisory).

Eval case minimum shape:

```json
{
  "id": "unique-id",
  "prompt": "User prompt that should activate the skill",
  "expected_behavior": "What a passing response looks like",
  "pass_criteria": ["criterion 1", "criterion 2"]
}
```

## Audit command

```bash
node bin/audit-skill-authoring.mjs          # human-readable
node bin/audit-skill-authoring.mjs --json   # machine-readable
node bin/audit-skill-authoring.mjs --ci     # CI gate: exits 1 only on HIGH
```

Severity mapping:

- **HIGH** — dependency cycle (blocks CI)
- **MEDIUM** — description template violation, missing evals (advisory)

<!-- grow-ok --> Absorbed § File format from brian-preferences (tier-1) so authoring guidance loads on rule/skill edits via this rule's paths instead of taxing every prompt's always-load budget — net token reduction across prompts.

## File format (all `.md` in `~/.claude/` + `~/.agentskills/`)

Human-readable **bullets** (unordered) or **numbered lists** (when priority/weight matters). Concise — bullets not paragraphs, fragments where they read clean, no padding. (Canonical home for this; loads on rule/skill edits via this rule's `paths`, so it isn't taxed onto every prompt's budget.)

### Do

- Use `-` bullets for unordered items
- Use `1.` numbered lists when order or priority matters
- Use `### Subheaders` to group related bullets
- Use `**bold**` for keywords inside bullets
- Use backticks for paths, commands, code identifiers
- Preserve `cross-links` to sibling rules
- Keep bullet text tight: one idea per bullet, ≤2 lines
- Match new sibling density — read 10 lines of a sibling rule before writing

### Don't

- Don't use pipe-delimited one-liners (`a|b|c|d`) — split into bullets
- Don't use `→` separators inside text — break into "X → Y" bullets or sub-bullets
- Don't write multi-sentence paragraphs when bullets work
- Don't pad with explanatory prose — fragments are fine
- Don't write verbose headers
- Don't use markdown tables for simple mappings — use definition-style bullets (`- **key** — value`)

### Pattern: priority list

1. Highest priority
2. Next
3. Then

### Pattern: definition-style bullet

- **Term** — short definition or value
- **Another term** — its meaning

### Pattern: do/don't

Use `### Do` / `### Don't` subheaders so contrast is scannable.

<!-- grow-ok -->
<!-- Growth justified: absorbed the four best writing-skills insights from vendored Superpowers (2026-06-29) into the canonical authoring rule rather than leaving them in a verbose vendored skill — net token reduction, one canonical home. -->

## Ordered by weight (scope & requirements)

- Write scope/requirements as **numbered lists, most important #1** — order encodes priority and survives compression. Reserve `-` bullets for unordered peers.
- Front-load the one constraint that most changes behavior; echo it in the last lines (middle-context recall is worst).

## Human voice (anti-slop)

- Sound like one sharp engineer wrote it. No "in today's fast-paced world", no throat-clearing, no "it's worth noting".
- Fragments beat full sentences when they read clean. Cut every word that survives its own deletion.
- No emoji-as-decoration, no hype adjectives, no restating the heading in the first bullet.

## Description SDO — the discovery trap

1. **NEVER summarize the workflow in `description:`.** Agents follow the description and skip the body. State *only* triggering conditions ("Use when…"), not steps.
2. Cover ≥3 trigger phrases: error strings, symptoms, synonyms, tool/file names an agent would grep.
3. Third person, ≤1024 chars, name the primary artifact. The description is the only part loaded every session — spend the effort here.

## Match the form to the failure

Classify the baseline failure first; the form that fixes one backfires on another.

1. **Skips a rule under pressure** → prohibition + rationalization table + red-flags. (Soft "prefer…" loses.)
2. **Wrong-shaped output** (bloated, buried verdict) → positive recipe: state what the output IS, in order. (Prohibitions backfire here — agents negotiate with "don't X".)
3. **Omits a required element** → structural REQUIRED slot in the template, not a prose reminder.
4. **Behavior should be conditional** → conditional keyed to an observable predicate, not a rule + exemption clauses.

- No nuance clauses ("don't X unless…") — they reopen the negotiation. Express a real exception as its own conditional.

## Cross-links

- [[instruction-compression-playbook]] — token-efficient skill prose style
- [[vendored-skill-compression]] — compress third-party skills on the way in
- [[micro-test-instruction-wording]] — prove guidance wording works before shipping it
- [[brian-preferences]] — communication, output, git, deploy preferences (file format now lives here)
- [[validator-precision-discipline]] — keep audit false-positive rate near zero
- [[drift-detection]] — authoring violations are drift, fixed in-turn
- [[internal-skill-discovery]] — `metadata.internal: true` for OS-layer skills
