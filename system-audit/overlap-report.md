# Overlap Report

Concepts defined in more than one file, with canonical ownership recommendations.
Audit date: 2026-04-19

---

## 1. "Zero Recommendations" Gate

The ultimate done definition — loop until the AI has no more suggestions.

| File | Line(s) | Version |
|------|---------|---------|
| `01-operating-system/SKILL.md` | 227, 234-244 | Full definition with FCE integration. Calls it "THE ULTIMATE DONE DEFINITION." |
| `07-quality-and-verification/SKILL.md` | 54-58 | Brief 4-line version under "Convergence Test" heading. |
| `53-autonomous-orchestrator/SKILL.md` | 179-184 | Medium version under "THE ULTIMATE DONE TEST" heading. |
| `56-completeness-verification/SKILL.md` | 127-130 | Referenced as criterion #6 in convergence criteria list. |

**Strongest version:** 01-operating-system (lines 234-244) — includes the loop logic, explains relationship to FCE and GPT-4o vision, and frames it as a convergence test.

**Recommendation:** Skill 01 is the canonical owner (it owns "done definitions"). Others should reference it with: "See Skill 01 'Zero Recommendations Gate' for the convergence test." Remove the duplicated explanation text from 07, 53, and 56 — replace with a one-line cross-reference.

---

## 2. Feature Completeness Engine (FCE) / grep scans

The automated grep for "Coming soon", "placeholder", "TODO" etc.

| File | Line(s) | Version |
|------|---------|---------|
| `01-operating-system/SKILL.md` | 295-328 | Full FCE definition with grep commands, data wiring scan, route scan, visual scan, and action protocol. |
| `53-autonomous-orchestrator/SKILL.md` | 88-103, 186-191 | Duplicates the grep patterns under "Proactive Feature Discovery" and "Feature Completeness Engine Must Pass." |
| `14-independent-idea-engine/SKILL.md` | 19-33 | Duplicates grep patterns under "Defect Discovery Scan" (Mode 1). |
| `06-build-and-slice-loop/SKILL.md` | 251, 316 | References FCE but does not duplicate the implementation. |

**Strongest version:** 01-operating-system (lines 295-328) — most complete, includes all four scan types (technical, data wiring, route, visual).

**Recommendation:** Skill 01 owns the FCE definition. Skills 53 and 14 should replace their grep blocks with: "Run the Feature Completeness Engine (Skill 01, line 295). All findings are DEFECTS — fix immediately." The grep commands should exist in exactly ONE place.

---

## 3. Emphasis Signal Processing / ***PROCESS THIS***

Parsing and acting on triple-asterisk emphasis signals.

| File | Line(s) | Version |
|------|---------|---------|
| `01-operating-system/SKILL.md` | 142-168 | Full definition: parsing, classification (global/project/temp/experimental/hard/permanent), and ***PROCESS THIS*** 7-step directive. |
| `53-autonomous-orchestrator/SKILL.md` | 260-279 | Near-duplicate: 5 classification types (global/project/temp/hard/permanent) and 6-step ***PROCESS THIS*** directive. |

**Strongest version:** 01-operating-system — has 7 steps (vs 6 in 53), adds "Experimental" as a classification type, and includes the "Emphasis Classification" subsection.

**Recommendation:** Skill 01 is the canonical owner (it explicitly lists "Emphasis signal processing" under "What This Skill Owns"). Skill 53 should replace its section with: "Emphasis signals processed per Skill 01 rules. This skill acts on the RESULTS (regenerated context), not the parsing."

---

## 4. Voice of the Customer (VoC)

Model for capturing user preferences, frustrations, and aspirations.

| File | Line(s) | Version |
|------|---------|---------|
| `04-preference-and-memory/SKILL.md` | 18-88 | Complete VoC model: structure, capture rules, storage locations, usage contexts. The CANONICAL implementation. |
| `53-autonomous-orchestrator/SKILL.md` | 283-312 | Duplicate VoC section with capture, storage format, refresh triggers, and application list. |
| `01-operating-system/SKILL.md` | 178 | Single reference: "Detect Voice of the Customer signals" in re-synthesis engine. |
| `51-wisdom-and-human-psychology/SKILL.md` | 77 | Brief mention: "Voice of the Customer (skill 04) isn't just data — it's empathy." |

**Strongest version:** 04-preference-and-memory — canonical owner, most detailed, includes storage paths and confidence-level taxonomy.

**Recommendation:** Skill 04 is the canonical owner. Skill 53 should delete its VoC section entirely and replace with: "VoC model maintained by Skill 04. Read VoC before making autonomous decisions." The storage format in 53 slightly differs (simpler) from 04's — this divergence causes confusion.

---

## 5. Breakpoint List

The 6 responsive breakpoints for testing and screenshots.

| File | Line(s) | Version |
|------|---------|---------|
| `CONVENTIONS.md` | 216-224 | **THE** canonical definition with TypeScript code block. |
| `07-quality-and-verification/SKILL.md` | 411-418, 586-594 | Duplicated TWICE within the same file. |
| `56-completeness-verification/SKILL.md` | 76-84 | Duplicated with note "(from CONVENTIONS.md)." |
| `20-accessibility-gate/SKILL.md` | 26-32 | Duplicated. |
| `55-chrome-and-browser-workflows/SKILL.md` | 119-125 | Duplicated. |
| `scripts/visual-tdd-loop.sh` | 23-30 | Duplicated in bash array format. |
| `~/.claude/rules/testing.md` | (line 6) | References "6 breakpoints: 375, 390, 768, 1024, 1280, 1920." |
| `~/.claude/CLAUDE.md` | (line 6) | References "6 breakpoints." |

**Total duplications:** 7 files, 8 occurrences of the same data.

**Strongest version:** CONVENTIONS.md — self-identifies as the single source of truth for shared constants.

**Recommendation:** CONVENTIONS.md is the canonical owner. All other files should reference it: "Breakpoints per CONVENTIONS.md." The only exception is `scripts/visual-tdd-loop.sh` which needs the values inline for shell execution — acceptable. Skill 07 should remove one of its two internal duplicates. Skills 20, 55, and 56 should replace their code blocks with a reference.

---

## 6. GPT-4o Vision Analysis

Using GPT-4o to analyze screenshots for visual defects.

| File | Line(s) | Version |
|------|---------|---------|
| `07-quality-and-verification/SKILL.md` | 569-665, 952-1011 | Two separate sections: "AI Visual Inspection Loop" (general) and "AI Visual Critique via GPT-4o Vision" (structured prompt with scoring). |
| `56-completeness-verification/SKILL.md` | 14-70 | The completeness loop definition, structured prompt, and provider priority table. |
| `57-ai-technology-integration/SKILL.md` | 13-65 | "Visual TDD Loop" with curl command implementation and shell script references. |
| `53-autonomous-orchestrator/SKILL.md` | 51, 94-103 | References GPT-4o Vision for UI auditing and screenshot analysis. |
| `01-operating-system/SKILL.md` | 261-269 | "Visual Inspection with Screenshots + AI Vision" — brief protocol. |
| `scripts/gpt4o-vision-analyze.sh` | 1-45 | Shell implementation of single-image analysis. |
| `scripts/visual-tdd-loop.sh` | 1-102 | Shell implementation of the full loop. |

**Analysis:** This concept is spread across 5 skill files and 2 scripts. Each has a slightly different prompt, different framing, and different integration pattern.

**Strongest version:** 56-completeness-verification — most structured, includes provider priority, convergence criteria, and cost management.

**Recommendation:** Create a clear ownership split:
- **56-completeness-verification** owns the LOOP PROTOCOL (when to run, convergence criteria, iteration logic).
- **57-ai-technology-integration** owns the API IMPLEMENTATION (curl commands, model selection, cost).
- **07-quality-and-verification** owns the QUALITY CRITERIA (what to look for, pass/fail thresholds).
- Others (01, 53) should only REFERENCE these three, not duplicate their content.

---

## 7. Self-Healing / Error Recovery

Autonomous fix-forward behavior when errors occur.

| File | Line(s) | Version |
|------|---------|---------|
| `01-operating-system/SKILL.md` | 357-365, 410-420 | Two sections: "Continuous Self-Healing" (TDD context) and "Self-Healing (Automatic)" with 8 specific recovery patterns. |
| `53-autonomous-orchestrator/SKILL.md` | 212-256 | Full decision tree: Transient / Code Bug / Architecture Mismatch / External Dependency / Skill Mismatch with recovery protocol. |
| `07-quality-and-verification/SKILL.md` | 32-41 | "Continuous Self-Healing Loop" focused on test failures (7 steps + 2 NEVER rules). |
| `06-build-and-slice-loop/SKILL.md` | 320 | Brief heading "Continuous Self-Healing" (subsection). |
| `~/.claude/rules/error-recovery.md` | 1-26 | Compact decision tree + 5 "Never Do" rules. |

**Analysis:** Five different self-healing definitions with overlapping but non-identical content. The rules/error-recovery.md is the most compact; 53 is the most comprehensive decision tree; 01 has the most specific recovery patterns.

**Strongest version:** 53-autonomous-orchestrator — most complete classification tree with escalation paths. But rules/error-recovery.md is the most actionable (compact enough to actually follow).

**Recommendation:** Consolidate ownership:
- **rules/error-recovery.md** — quick-reference decision tree (keep compact, this is what the model actually reads fast).
- **53-autonomous-orchestrator** — detailed classification tree (expanded reference for complex failures).
- **01-operating-system** — policy-level statement: "Self-heal autonomously. See rules/error-recovery.md for the decision tree."
- **07-quality-and-verification** — keep only test-specific recovery (max 5 attempts, never .skip). Delete generic error recovery.
- **06-build-and-slice-loop** — delete; it adds nothing unique.

---

## 8. Flesch Readability Threshold

INCONSISTENCY: Some files say >= 50, others say >= 60.

| File | Line(s) | Threshold |
|------|---------|-----------|
| `01-operating-system/SKILL.md` | 536, 554 | >= 50 |
| `07-quality-and-verification/SKILL.md` | 466, 476, 692 | >= 50 |
| `09-brand-and-content-system/SKILL.md` | 395, 488 | >= 50 |
| `28-seo-and-keywords/SKILL.md` | 171, 247 | >= 50 |
| `28-seo-and-keywords/SKILL.md` | 472, 558 | **>= 60** |
| `30-ai-native-coding/SKILL.md` | 225, 233-237 | >= 50 (base), >= 55 (user copy), >= 60 (README), >= 70 (errors) |
| `55-chrome-and-browser-workflows/SKILL.md` | 191 | >= 50 |
| `STYLE_GUIDES.md` | 58 | "Flesch 50+" (5th-8th grade) |
| `MASTER_PROMPT.md` | 37, 145, 176, 186 | >= 50 |
| `QUICK_REF.md` | 45 | >= 50 |
| `README.md` | 188 | >= 50 |
| `~/.claude/CLAUDE.md` | 64 | **>= 60** |
| `~/.claude/rules/quality-metrics.md` | 4 | **>= 60 (Yoast GREEN)** |
| `~/.claude/rules/copy-writing.md` | 14 | **>= 60** |

**The Conflict:** Skills (agentskills/) consistently say >= 50. Rules (`.claude/rules/`) and the global CLAUDE.md say >= 60. Skill 28 internally contradicts itself (>= 50 on line 247, >= 60 on line 472). Skill 30 introduces a graduated scale (50-70 depending on content type).

**Root cause:** The skills were written with a >= 50 baseline. Later, the rules and CLAUDE.md were updated to reference Yoast's "GREEN" threshold which is >= 60. Neither was updated to match the other.

**Recommendation:** Adopt Skill 30's graduated approach as canonical:
- Error messages / critical UX text: >= 70
- User-facing copy / marketing: >= 60 (Yoast GREEN)
- Technical docs / CLAUDE.md: >= 50
- Code comments: >= 50

Update CONVENTIONS.md to define this scale. All other files reference CONVENTIONS.md. The blanket ">= 50" and blanket ">= 60" statements should both be replaced with "per CONVENTIONS.md readability scale."

---

## 9. Prompt Re-Synthesis Engine

Logic for re-processing prompts when material changes are detected.

| File | Line(s) | Version |
|------|---------|---------|
| `01-operating-system/SKILL.md` | 172-191 | Full definition: 7 parse steps, 7 mandatory re-synthesis triggers. |
| `53-autonomous-orchestrator/SKILL.md` | 316-330 | Abbreviated duplicate: 5 parse steps, 5 triggers. |

**Strongest version:** 01-operating-system — more triggers, more parse steps.

**Recommendation:** Skill 01 owns this. Skill 53 should replace with: "Prompt re-synthesis per Skill 01. This skill acts on regenerated context."

---

## 10. Completion Criteria / Done Definitions

What constitutes "done" for various task types.

| File | Line(s) | Version |
|------|---------|---------|
| `01-operating-system/SKILL.md` | 223-232 | 6 task types with detailed criteria. |
| `53-autonomous-orchestrator/SKILL.md` | 168-177 | Checklist format (8 items) for completion criteria. |
| `~/.claude/CLAUDE.md` | 46-55 | "Hard Gates" — 9 exit conditions. |
| `README.md` | 168-174 | Done definitions table (3 types). |

**Analysis:** Four slightly different "done" definitions. CLAUDE.md is the most aggressive (requires AI Search and AI Chat deployed). README.md is the simplest. Skill 01 is the most categorized.

**Strongest version:** 01-operating-system — most nuanced (6 task types each with specific criteria).

**Recommendation:** Skill 01 owns the complete taxonomy. CLAUDE.md keeps its "Hard Gates" as the ultra-compact reference (this is what gets loaded into context every session). The discrepancy between them (CLAUDE.md requires AI Search/Chat, Skill 01 does not) should be resolved — CLAUDE.md represents the LATEST user preferences and should win for projectsites.dev projects specifically.

---

## 11. Quality Gate Checklist

The numbered quality checks before deployment.

| File | Line(s) | Version |
|------|---------|---------|
| `07-quality-and-verification/SKILL.md` | 294-308 | "7-Check Quality Gate" (actually 8 items). |
| `01-operating-system/SKILL.md` | 489-503 | "Quality Gate — Full Suite on Every Prompt" (10 items). |

**Analysis:** Skill 07 calls it a "7-Check Quality Gate" but lists 8 items. Skill 01 has a 10-item version with overlapping but different items.

**Recommendation:** Skill 07 owns the quality gate implementation (it's what this skill IS). Skill 01 should reference it: "Run the quality gate per Skill 07." Delete the 10-item list from Skill 01 — it conflicts with 07's authoritative version.

---

## 12. Cross-Skill Coordination / Execution Order

The sequence in which skills activate.

| File | Line(s) | Version |
|------|---------|---------|
| `01-operating-system/SKILL.md` | 196-219 | Full execution order with routing rules. |
| `README.md` | 81-104 | Execution flow diagram + dependency map. |
| `_router.md` | 92-104 | Decision tree for prompt-to-path routing. |

**Analysis:** Three representations of the same concept. README.md has a parallel execution diagram. Skill 01 has a linear sequence. _router.md has a decision tree.

**Recommendation:** These serve different purposes and are acceptable duplicates:
- `_router.md` — the router (which skills to load)
- `01-operating-system` — the sequencer (what order to execute)
- `README.md` — the overview (how to understand the system)

No consolidation needed, but they must stay synchronized when updated.

---

## Summary of Canonical Ownership

| Concept | Canonical Owner | Action for Others |
|---------|----------------|-------------------|
| Zero Recommendations Gate | Skill 01 | Replace with cross-reference |
| Feature Completeness Engine | Skill 01 | Replace grep blocks with cross-reference |
| Emphasis Signal Processing | Skill 01 | Delete from Skill 53 |
| Voice of the Customer | Skill 04 | Delete from Skill 53 |
| Breakpoints | CONVENTIONS.md | Replace code blocks with reference |
| GPT-4o Vision (loop) | Skill 56 | Split ownership: 56=loop, 57=API, 07=criteria |
| GPT-4o Vision (API) | Skill 57 | Others reference |
| Self-Healing (decision tree) | rules/error-recovery.md | Skill 01 references, 07 keeps test-specific only |
| Flesch Threshold | CONVENTIONS.md (new scale) | All files reference the graduated scale |
| Prompt Re-Synthesis | Skill 01 | Skill 53 references |
| Done Definitions | Skill 01 (taxonomy) + CLAUDE.md (compact) | Others reference |
| Quality Gate | Skill 07 | Skill 01 deletes its version |

---

## Token Cost of Duplication

Estimated wasted tokens from loading duplicate content:

| Overlap | Est. Duplicated Tokens | Files Affected |
|---------|----------------------|----------------|
| Breakpoints (6x) | ~600 | 6 |
| FCE grep scans (3x) | ~400 | 3 |
| VoC model (2x) | ~800 | 2 |
| Self-healing (5x) | ~1200 | 5 |
| Zero Recommendations (4x) | ~500 | 4 |
| Emphasis signals (2x) | ~600 | 2 |
| GPT-4o vision (5x) | ~2000 | 5 |
| **Total estimated waste** | **~6,100 tokens** | — |

When all skills are loaded (full project mode), this represents about 3-4% of the total skill content being redundant repetition.
