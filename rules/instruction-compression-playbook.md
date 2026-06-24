---
name: "instruction-compression-playbook"
priority: 2
pack: "core"
triggers:
  - "compress"
  - "optimize file"
  - "shorten rule"
  - "token budget"
  - "rewrite skill"
  - "authoring skill"
  - "authoring rule"
paths:
  - "*.md"
  - "rules/**"
  - "skills/**"
  - "**/SKILL.md"
---

# Instruction Compression Playbook

How to compress any AI-instruction file (rule / skill / SKILL.md / AGENTS.md) without shedding meaning. Research-grounded (Anthropic Skills docs, context-engineering 2025-26, LLMLingua, EARS, llms.txt). Eat the dogfood: this file obeys its own rules.
Cross-links: `[[brian-preferences]]` `[[always]]` `[[drift-detection]]` `[[repo-folder-hygiene]]` `[[prompt-as-training-signal]]`

## The governing priority (Brian, 2026-06-21)

- **Business requirements > inferable knowledge.** It matters more that the AI clearly knows every business requirement it CANNOT infer (brand values, vendor/version choices, thresholds, named files, hard rules) than that a file restates general engineering Claude already knows. Spend tokens on the former; cut the latter to near-zero.
- **All rules stay available; each costs far fewer tokens.** Compress content — do NOT drop rules. Total per-prompt load must shrink, not the rule count.

## The compression test

- Compression is **lossless when it removes tokens Claude already infers** (definitions of known concepts, filler, hedging, restated context, rationale/"why this matters"). Cut these freely.
- Compression is **lossy when it removes a constraint that would change a specific action** (a business requirement). Keep these verbatim.
- Before deleting a line ask: *"Would removing this cause a specific wrong action?"* No → delete. Yes → keep, tighten wording.

## Always-loaded budget — HARD GATE (every-prompt cost)

- Rules with `priority: 1` OR `paths: ["*"]` load on EVERY prompt. Their aggregate token total is capped by `bin/audit-always-load-budget.mjs` (blocking gate 19): `tier-1 ≤ 38K`, `eligible(+paths:*) ≤ ELIGIBLE_BUDGET`. The eligible budget is a **RATCHET — lower it as the arc compresses; it may only go down.** This is what stops per-prompt load drifting back toward 150K.
- **Logs / archives / records are NEVER `paths: ["*"]`.** They are records, not instructions — scope `paths` to a concern (they still load via their triggers when relevant). `[[principles-incident-log]]`, `[[root-cause-validator-findings]]` → `concern:observability`. Don't compress their content (per Don't below); just keep them OUT of the every-prompt set.
- **New always-loaded rule** (`priority:1` or `paths:["*"]`) must justify "truly every prompt?" AND fit the ratchet — else `priority:2` + a concern path (loads via triggers).

## Core rules (MUST)

1. **Description carries activation** — frontmatter `description`/`triggers` load every session; body is lazy. Spend 80% of effort here: what it does + exact trigger phrases, ≤1024 chars.
2. **Imperative over prose** — "Make sure tests pass" → `Run tests before marking done`. Commands are ~60% shorter and unambiguous. <!-- validator-ignore: filler -->
3. **Atomic rules** — one rule per bullet, one idea per sentence. Never `and` two actions into one line; the model satisfies whichever token is most salient.
4. **Structure over paragraphs** — bullets transmit ~3× constraints per token vs prose. Headers are positional anchors for recall.
5. **Delete filler** — strip near-zero-information tokens: "please", "make sure", "be careful", "remember to", "try to", "ideally", "as appropriate", "in order to". <!-- validator-ignore: filler -->
6. **One canonical per concept** — no parallel truths. Duplicate rule across files → keep one, others cross-link. Conflicting rules are the #1 instruction-failure mode.
7. **Consistent vocabulary** — one term per concept globally (pick `handler` OR `route`, never both). Consistency removes disambiguation tokens.
8. **Cut what Claude knows** — never explain what a PDF/HMAC/webhook *is*. Omitting known context is free compression.

## Differential budget (SHOULD)

- **Behavioral rules** — compress 10-20%. Cut filler, keep every constraint.
- **Worked examples** — compress 60-80%. Keep ONE canonical example per pattern; delete the rest.
- **Code blocks** — do NOT gut working code; it is reference, not prose. Long code-heavy files are legitimate (`[[webhook-receiver-architecture]]` = 523 lines, fine). Apply progressive disclosure instead (Rule below).
- **User-facing query templates** — compress 0%. Exact wording matters.

## Dynamic sourcing — `reference/` (Brian, 2026-06-21)

- Heavy **implementation detail** (full code handlers, schemas, RFC templates, exhaustive examples) lives in `reference/<owning-rule>.md`, NOT inline. The router indexes only `rules/*.md` + `*/SKILL.md`, so `reference/` costs **0 tokens until Read on demand**.
- Keep in the rule: the **requirement** (WHAT/WHEN, thresholds, vendor/version, [MUST]) + a plain-path pointer `` See `reference/<topic>.md` ``. Move out: the **HOW** (long code, boilerplate).
- Keep inline: short snippets that ARE the spec (a required header value, a legally-required field). Pointer is a plain path, NOT a `[[crosslink]]`.
- Net effect: a domain rule loads lean every time its triggers fire; the implementation is one `Read` away when actually building. See `reference/README.md`.

## Structural moves (SHOULD)

- **Progressive disclosure** — SKILL.md is a table of contents. Inline only what changes per-task; link the rest one level deep (`See [[ref]]` for rules, `` `reference/<topic>.md` `` for code). Never nest references >1 deep.
- **Critical-first-and-last** — put the most load-bearing constraint in the first 10 lines AND echo in the last 5. Middle-context recall is ~40% worse (U-curve / "lost in the middle").
- **Archive temporal guidance** — date-stamped patterns ("before Aug 2025…") go stale; wrap in `<details>` or a `## Legacy` block so they cost 0 tokens to skip.
- **TOC for files >100 lines** — add a `## Contents` block so the file can be preview-read without full load.
- **Scripts over inline code** — a pre-built `validate.mjs` costs one reference line; the inline equivalent costs 30+. Scripts are also more reliable.

## EARS — rewrite loose rules as atomic testable requirements

- **Ubiquitous** — `The [system] shall [action]` (always active).
- **Event** — `When [trigger], the [system] shall [action]`.
- **State** — `While [state], the [system] shall [action]`.
- **Unwanted** — `If [error/condition], then the [system] shall [response]`.
- **Optional** — `Where [feature present], the [system] shall [action]`.
- Tag tier inline: `[MUST]` / `[SHOULD]` / `[COULD]` (MoSCoW) so priority survives compression.

### Before / after

- ✗ *"Handle errors well in the API."*
- ✓ `[MUST] If a fetch() throws or returns 4xx-5xx, the handler shall return { isError: true, content: [{ type:'text', text: JSON.stringify({code,message}) }] }.`
- ✗ *"Make sure the description field is good."* <!-- validator-ignore: filler -->
- ✓ `The description shall: (1) third person, (2) state what it does, (3) ≥3 trigger phrases, (4) ≤1024 chars.`

## Do / Don't

### Do

- Read 10 lines of a sibling rule before writing — match its density.
- Keep frontmatter, cross-links, and code blocks intact.
- Run `npx markdownlint-cli2` (or repo lint) after every rewrite.
- Track token/line delta; shrinking is the goal.

### Don't

- Don't compress historical logs (`[[principles-incident-log]]`, retrospectives) — they are records, not instructions.
- Don't delete a constraint to hit a line target — meaning beats brevity.
- Don't introduce markdown tables for simple key→value maps — use `- **key** — value` (per `[[brian-preferences]]`).
- Don't grow a file >20% without a `## Why this grew` note.

## Wired validators (run on every commit)

- `bin/audit-crosslinks.mjs` — every `[[slug]]` must resolve to a rule/command/skill/numbered-dir `.md`. Blocking gate 16 in `bin/lint-all.sh` (`--ci` exits 1 on any broken link). Skips fenced + inline code.
- `bin/check-compression-regression.mjs` — fails any `rules/*.md` growing >20% vs git HEAD without `## Why this grew` or `<!-- grow-ok -->`. Blocking gate 17. Locks in compression gains.
- `bin/audit-instruction-files.mjs` — token-budget + EARS/hedge + filler audit (`--json`/`--ci`). Manual/pre-commit tool; strips inline-code spans, honors `<!-- validator-ignore: filler|hedge -->`. Not a blocking gate (long code-reference files legitimately exceed the line budget).
- `bin/audit-trigger-collisions.mjs` — inverted index of frontmatter `triggers:` across rules + skills; reports phrases shared by ≥2 files. Advisory (NOT blocking) — the router loads ALL matching rules, so shared triggers are usually intentional.
- `bin/audit-near-duplicates.mjs` — 3-gram shingle Jaccard across rules/ (no embeddings); reports merge candidates. Advisory — corpus currently well-differentiated (max 0.053).

## See

- `[[skill-authoring-contract]]` § File format — the canonical bullet style
- `retrospectives/arc-2026-06-18-compression-optimization.md` — live arc tracker + 50-idea roadmap
- `[[validator-precision-discipline]]` — when codifying these as a linter, prefer false-negatives
