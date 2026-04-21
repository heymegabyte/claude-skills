---
name: "preference-and-memory"
description: "Captures and evolves user preferences with confidence levels. Maintains Voice of the Customer model with exact language, dissatisfaction and aspiration signals. Handles promotion/demotion of preferences, global vs project scoping, and Omi wearable data integration."
submodules:
  - wisdom-and-human-psychology.md
  - brian-voc-data.md
  - brian-decision-model.md
---

## Submodules

| File | Description |
|------|-------------|
| wisdom-and-human-psychology.md | Timeless principles from behavioral psychology, philosophy, and self-help classics applied to product building. Ethical persuasion only. |
| brian-voc-data.md | Voice of the Customer data from 3,102 ChatGPT conversations — exact language, dissatisfaction signals, interaction velocity, prompt patterns. |

# 04 — Preference and Memory

## Voice of the Customer (VoC)

Captures exact language, frustrations, ambitions, standards:
- What they consider weak/shallow/slow/ugly/incomplete/unacceptable
- What they consider elite/complete/beautiful/fast/worth shipping
- Repeated phrases signaling deep preferences, emotional intensity markers

### VoC Model Structure
Desired Outcome → Dissatisfaction Signals (exact quotes) → Aspiration Signals (praise/standards) → Implications for: Product, UX, Copy, Architecture, Completeness, Speed, Refinement

### VoC Rules
- Capture exact language when specific; infer implications but label them
- Never fabricate; distinguish literal from inferred
- Update on: priority changes, corrections, redefined "done", strong emphasis, ***PROCESS THIS***

### VoC Storage
- Global: `/Users/apple/.claude/projects/-Users-apple-emdash-projects-megabyte-space/memory/voc_global.md`
- Project: `PROJECT_BRIEF.md` VoC section or `VOC.md`

## Preference Taxonomy

| Confidence | Treatment |
|-----------|-----------|
| Confirmed (explicitly stated/demonstrated) | Always follow |
| Strong (confirmed without pushback) | Follow by default |
| Inferred (consistent pattern) | Follow, verify if high stakes |
| Weak (single observation) | Note, don't rely on |
| Experimental (trying, uncommitted) | Apply in context, don't propagate |

| Scope | Storage |
|-------|---------|
| Global | Memory system |
| Project | Project CLAUDE.md or brief |
| Session | In-context only |
| Experimental | Memory with expiry note |

## Preference Evolution

**Promotion:** Weak → repeated → Inferred → user confirmation → Confirmed. User explicit statement → immediately Confirmed. Accepted non-obvious choice → Strong.

**Demotion:** User contradicts → re-evaluate. Context changes → scope-check. Long since last observed → note staleness.

**Never promote without explicit statement:** tech choices, design aesthetics, business models, feature scope.

**Can promote on pattern alone:** code style, communication style, review depth, testing thoroughness.

## Capture Triggers

Capture when: user corrects, confirms, expresses frustration/delight, uses ***TEXT***, writes ***PROCESS THIS***, asks to remember.

Capture: the rule + why + how to apply + scope + confidence.

Don't capture: one-time debug decisions, derivable tech details, temporary workarounds, info already in CLAUDE.md.

## Memory Integration

**Reading:** Check memory for preferences, VoC, project history. Apply confirmed/strong automatically. Note inferred for context-aware use.

**Writing:** New preferences → write. Confirmed → update confidence. Contradicted → update/remove. VoC signals → update model.

**Hygiene:** Remove stale (30+ days unobserved). Merge duplicates. Verify paths before recommending from memory. Distinguish "memory says existed" from "exists now."

**Cross-project:** Scan 3 most recent project MEMORYs for reusable patterns, avoided mistakes, preference drift.

### MEMORY.md Template
```
## Confirmed Preferences
## Patterns That Worked
## Mistakes to Avoid
## Pending Skill Updates (YYYY-MM-DD Skill##: desc — priority)
## Skill Usage Heatmap
```

## Omi Wearable Integration

Brian uses Omi AI wearable. Key people: Katie (SJSK), Michael/Mikwel (Penn Station), Nick Buckwick.

When `~/Downloads/omi-export.json` exists, scan for: action items (build/create/deploy), product memories, people to feature, new product ideas.

Products used daily: Square Terminal, Omi, Home Assistant, GQ EMF-390, AI coding tools, Cloudflare, Stripe, Resend, Ideogram.
