---
name: "instruction-compression-playbook"
priority: 1
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

## The compression test

- Compression is **lossless when it removes tokens Claude already infers** (definitions of known concepts, filler, hedging, restated context). Cut these freely.
- Compression is **lossy when it removes a constraint that would change a specific action**. Keep these verbatim.
- Before deleting a line ask: *"Would removing this cause a specific wrong action?"* No → delete. Yes → keep, tighten wording.

## Core rules (MUST)

1. **Description carries activation** — frontmatter `description`/`triggers` load every session; body is lazy. Spend 80% of effort here: what it does + exact trigger phrases, ≤1024 chars.
2. **Imperative over prose** — "Make sure tests pass" → `Run tests before marking done`. Commands are ~60% shorter and unambiguous.
3. **Atomic rules** — one rule per bullet, one idea per sentence. Never `and` two actions into one line; the model satisfies whichever token is most salient.
4. **Structure over paragraphs** — bullets transmit ~3× constraints per token vs prose. Headers are positional anchors for recall.
5. **Delete filler** — strip near-zero-information tokens: "please", "make sure", "be careful", "remember to", "try to", "ideally", "as appropriate", "in order to".
6. **One canonical per concept** — no parallel truths. Duplicate rule across files → keep one, others cross-link. Conflicting rules are the #1 instruction-failure mode.
7. **Consistent vocabulary** — one term per concept globally (pick `handler` OR `route`, never both). Consistency removes disambiguation tokens.
8. **Cut what Claude knows** — never explain what a PDF/HMAC/webhook *is*. Omitting known context is free compression.

## Differential budget (SHOULD)

- **Behavioral rules** — compress 10-20%. Cut filler, keep every constraint.
- **Worked examples** — compress 60-80%. Keep ONE canonical example per pattern; delete the rest.
- **Code blocks** — do NOT gut working code; it is reference, not prose. Long code-heavy files are legitimate (`[[webhook-receiver-architecture]]` = 523 lines, fine). Apply progressive disclosure instead (Rule below).
- **User-facing query templates** — compress 0%. Exact wording matters.

## Structural moves (SHOULD)

- **Progressive disclosure** — SKILL.md is a table of contents. Inline only what changes per-task; link the rest one level deep (`See [[ref]]`). Never nest references >1 deep.
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
- ✗ *"Make sure the description field is good."*
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

## See

- `[[brian-preferences]]` § Skill/Rule File Format — the canonical bullet style
- `retrospectives/arc-2026-06-18-compression-optimization.md` — live arc tracker + 50-idea roadmap
- `[[validator-precision-discipline]]` — when codifying these as a linter, prefer false-negatives
