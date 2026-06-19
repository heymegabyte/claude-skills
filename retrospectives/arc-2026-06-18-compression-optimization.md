# Arc: Compression & Optimization (2026-06-18 →)

Recurring `/loop 20m` arc. Goal: compress every `~/.agentskills` instruction file without shedding meaning, improve via research, restructure as atomic testable requirements, and integrate 50 research-grounded ideas. AI-optimized AND human-readable.

- **Methodology**: `rules/instruction-compression-playbook.md` (the durable rule every iteration follows).
- **Format**: `rules/brian-preferences.md` § Skill/Rule File Format.
- **Cadence**: each fire — advance the file queue (compress a batch), implement 1-2 roadmap ideas, log results, commit+push (side repo).

## How each iteration runs

1. Read this tracker → pick next un-done batch from the file queue.
2. Compress per the playbook (fan out to subagents for batches; verify with markdownlint).
3. Implement the next-highest-value idea from the 50-idea roadmap not yet `[x]`.
4. Update the queue + log below, commit + push.
5. Never recompress a `[x]` file. Never compress historical logs.

## File queue — prose-heavy rules (compression targets, biggest first)

Status: `[ ]` todo · `[~]` in progress · `[x]` done · `[skip]` keep as-is (log/record).

- `[skip]` principles-incident-log.md (413) — historical record, do not compress
- `[x]` website-build-doctrine.md (247→198, -20%) — iter 1
- `[ ]` secret-auto-provisioning.md (229)
- `[ ]` always.md (224) — HIGH: loaded every prompt, compress carefully
- `[ ]` supreme-polish.md (211)
- `[x]` code-style.md (196→147, -25%) — iter 1
- `[ ]` agent-resilience-discipline.md (221)
- `[ ]` webhook-as-skill-pattern.md (217)
- `[ ]` mcp-namespace-discipline.md (215)
- `[x]` thin-source-amplification.md (182→166, -9%) — iter 1
- `[ ]` lint-doctrine.md (179)
- `[ ]` working-backwards.md (192)
- `[ ]` root-cause-validator-findings.md (167)
- `[ ]` data-residency-by-default.md (198)
- `[ ]` agent-selection.md (165)
- `[ ]` one-way-two-way-doors.md (173)
- `[ ]` bash-matcher-guardrails.md (170)
- `[x]` auto-meta-work.md (145→139, -4%) — iter 1 (already near-pure bullets)
- `[ ]` source-site-enhancement.md (142)
- `[ ]` verification-loop.md (141)
- `[ ]` validator-precision-discipline.md (141)
- `[ ]` state-is-the-enemy.md (211)
- `[ ]` eval-mock-mode-discipline.md (177)
- `[ ]` copy-writing.md (145)
- `[ ]` backwards-compatibility-removal-cadence.md (206)
- `[ ]` documentation-as-code.md (223)
- `[ ]` hardware-aware-programming.md (222)
- `[ ]` inverted-abstraction-pyramid.md (210)
- `[ ]` production-observability-default-on.md (210)
- `[ ]` structured-logging.md (207)
- next batches: remaining 144 rules >120 lines, then numbered skill dirs, commands/, agents/

## 50-idea roadmap (research-grounded — integrate over the arc)

Status: `[ ]` planned · `[x]` shipped. Grouped by leverage.

### Tooling / validators (build as `bin/*.mjs`, wire to lefthook/CI)

- `[x]` 1. Token-budget dashboard — shipped `bin/audit-instruction-files.mjs` CHECK 1 (iter 1)
- `[x]` 2. EARS / hedge linter — shipped `bin/audit-instruction-files.mjs` CHECK 2 (iter 1, MEDIUM)
- `[x]` 3. Filler-word blocklist — shipped `bin/audit-instruction-files.mjs` CHECK 3 (iter 1, HIGH/CI)
- `[ ]` 4. Semantic dedup engine — embed rules, cluster cos-sim >0.85, surface merge candidates
- `[ ]` 5. Contradiction detector — pairwise LLM judge on near-similar rules → `_contradiction-log.md`
- `[ ]` 6. Description retrieval scorer — embed description vs synthetic trigger queries, score <0.7 fails
- `[ ]` 7. Cross-link density / PageRank — isolated files = delete candidates; hubs = promote
- `[ ]` 8. Progressive-disclosure enforcer — fail reference chains >1 deep
- `[ ]` 9. Vocabulary canonicalizer — `_glossary.json` synonym→canonical, find/replace hook
- `[ ]` 10. Compression regression guard — fail commits growing a file >20% w/o `## Why this grew`
- `[ ]` 11. Stale-rule guard — frontmatter `last_verified`, fail if >365d
- `[ ]` 12. Llms.txt auto-generator — synth `/llms.txt` from all descriptions (already have llms.txt — keep fresh)
- `[ ]` 13. Trigger-phrase collision resolver — inverted index, flag ≥2 shared triggers
- `[ ]` 14. Gerund-naming linter — skill `name` must be gerund form
- `[ ]` 15. Perplexity line scorer — small LM flags <5-perplexity filler lines

### Structure / authoring

- `[x]` 16. Compression playbook rule (`rules/instruction-compression-playbook.md`) — shipped iter 1
- `[ ]` 17. MoSCoW tier tags on every rule (`[MUST]`/`[SHOULD]`/`[COULD]`)
- `[ ]` 18. Auto-TOC for files >100 lines
- `[ ]` 19. Archive temporal patterns into `<details>`/`## Legacy`
- `[ ]` 20. Critical-first-and-last reordering (U-curve recall)
- `[ ]` 21. Behavior-anchored description template (`{gerund}. Use when {phrases}. Not when {exclusions}.`)
- `[ ]` 22. Spec-driven skill section (`## Spec` before `## Instructions`)
- `[ ]` 23. Skill dependency DAG (`depends_on:` frontmatter, acyclic check)
- `[ ]` 24. Semantic version tags per rule
- `[ ]` 25. Skill composition templates (extends: pattern skeletons)

### Self-improvement / observation loops

- `[ ]` 26. Skill activation trace log (which skill fired, on what trigger)
- `[ ]` 27. Dead-skill detector (0 activations 90d → deprecate)
- `[ ]` 28. Skill health score `(activation×eval×retrieval)/tokens`
- `[ ]` 29. Hot-path rule promotion to `always.md`
- `[ ]` 30. Auto-skill forge from repeated prompts (>3× same context)
- `[ ]` 31. Rule diff summarizer → semantic CHANGELOG line per change
- `[ ]` 32. Memory reconciliation cron (`/memory` ↔ rule files)
- `[ ]` 33. Quarterly LLM-audited skill retrospective agent
- `[ ]` 34. Eval-first gating (≥3 eval cases before merge)
- `[ ]` 35. Inline eval harness (`__eval__.json` co-located)
- `[ ]` 36. Zero-filler recall benchmark (Claude recalls N rules from file, <70% → rewrite)
- `[ ]` 37. Continuous contradiction monitor (nightly)
- `[ ]` 38. Agent-diversity review for skill authoring (retrieval/compression/contradiction/EARS auditors)

### Navigation / visualization

- `[ ]` 39. Knowledge graph of rules (nodes=rules, edges=link/conflict/depends/supersedes)
- `[ ]` 40. Skill coverage map (trigger→skill bipartite, find gaps/collisions)
- `[ ]` 41. Skill org-chart SVG (foundational vs leaf vs orphan)
- `[ ]` 42. Acceptance-criteria generator (EARS rule → Gherkin stub)

### Context / runtime

- `[ ]` 43. Priority-weighted compaction (keep `[MUST]` verbatim, drop `[COULD]`)
- `[ ]` 44. Instruction complexity classifier (freedom: high→prose, low→script/EARS)
- `[ ]` 45. Token-budget allocation matrix (startup vs loaded vs reference per skill)
- `[ ]` 46. Sub-agent summary-only architecture for info-dense domains
- `[ ]` 47. Position-aware importance tagger
- `[ ]` 48. Context-spill detector (inline >30-line blocks → extract to ref)
- `[ ]` 49. Skill changelog as training signal (meta-skill learns what improves perf)
- `[ ]` 50. Cross-harness sync validator (AGENTS.md ↔ .cursor ↔ CLAUDE.md semantic diff)

## Iteration log

### iter 1 — 2026-06-18

- Shipped `rules/instruction-compression-playbook.md` (idea 16) — research-grounded methodology rule.
- Shipped `bin/audit-instruction-files.mjs` (ideas 1+2+3) — token-budget + EARS/hedge + filler audit; `--json`/`--ci` flags. Scans 144 rules: 5 budget-HIGH, 64 hedge-MEDIUM, 8 filler-HIGH.
- Compressed 4 files: website-build-doctrine, code-style, thin-source-amplification, auto-meta-work. All markdownlint-clean, frontmatter + cross-links + thresholds preserved.
- Created this tracker + 50-idea roadmap from heavy web research (Anthropic Skills, context-engineering, LLMLingua, EARS, llms.txt).
- **Known refinement (next iter)**: audit script flags filler examples inside backtick spans (playbook L34/37/70) + a section header in prompt-as-training-signal as false positives. Add inline-code-span skip + `<!-- validator-ignore: filler -->` escape hatch per `[[validator-precision-discipline]]` before wiring `--ci` to lefthook.
- **Next batch**: secret-auto-provisioning, always.md (careful), supreme-polish, agent-resilience-discipline, webhook-as-skill-pattern, mcp-namespace-discipline.
