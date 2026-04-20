# Emdash Operating System v5 — Target Architecture

## 4-Layer Model

```
┌─────────────────────────────────────────────────────────────┐
│ LAYER 1: KERNEL (always loaded, ~5 files)                   │
│ Policy, autonomy, conflict resolution, done definitions     │
│ Files: 01, CONVENTIONS.md, CLAUDE.md, rules/                │
├─────────────────────────────────────────────────────────────┤
│ LAYER 2: PRODUCT COMPILER (loaded per project, ~15 skills)  │
│ Architecture, build, test, deploy, verify                   │
│ Skills: 02,03,04,05,06,07,08,09,10,11,12,21,25,30,53      │
├─────────────────────────────────────────────────────────────┤
│ LAYER 3: CAPABILITY PACKS (loaded per feature need)         │
│ ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────────┐  │
│ │Commerce  │ │Content   │ │Intelligence│ │UX Complete   │  │
│ │18,36,45  │ │28,33,42  │ │14,17,23,37│ │15,20,24,31,32│  │
│ │          │ │29        │ │43,57      │ │41,47,48,49   │  │
│ └──────────┘ └──────────┘ └───────────┘ └──────────────┘  │
│ ┌──────────┐ ┌──────────┐ ┌───────────┐                    │
│ │Infra     │ │Social    │ │Automation │                    │
│ │26,35,38  │ │16,19,27  │ │52,54,55   │                    │
│ │39,40,46  │ │          │ │           │                    │
│ │50        │ │          │ │           │                    │
│ └──────────┘ └──────────┘ └───────────┘                    │
├─────────────────────────────────────────────────────────────┤
│ LAYER 4: RELEASE PIPELINE (post-deploy)                     │
│ Launch, monitor, improve, learn                             │
│ Skills: 22,34,38,13,56 + hooks + session-learning          │
└─────────────────────────────────────────────────────────────┘
```

## Canonical Ownership Map

Each concept has EXACTLY ONE canonical owner. All other files reference, never re-define.

| Concept | Canonical Owner | References From |
|---------|----------------|-----------------|
| Zero Recommendations Gate | Skill 07 | 01, 53, 56 |
| Feature Completeness Engine (grep scan) | Skill 56 | 01, 53 |
| Visual TDD Loop | Skill 57 | 07, 08, 56 |
| Emphasis Signal Processing (***TEXT***) | Skill 01 | 53 |
| Voice of the Customer | Skill 04 | 01, 53 |
| Prompt Re-Synthesis | Skill 01 | 53 |
| Breakpoints (6 viewports) | CONVENTIONS.md | 07, 10, 20, 55 |
| Flesch Threshold (60) | CONVENTIONS.md | 28, rules/copy-writing |
| Brand Colors | CONVENTIONS.md | 10, 12, rules/always |
| Self-Healing Decision Trees | Skill 53 | rules/error-recovery |
| GPT-4o Vision Analysis | Skill 57 | 07, 56 |
| Parallel Agent Spawning | Skill 53 | CLAUDE.md |
| Quality Gate (7 checks) | Skill 07 | 08, 53, 56 |
| Deploy + Verify Loop | Skill 08 | 07, 53 |
| Keyphrase Research | Skill 28 | rules/always |
| AI Search Implementation | Skill 37 | 43 |
| AI Chat Implementation | Skill 43 | 37 |

## Routing Flow

```
Prompt arrives
    │
    ▼
Parse intent (Skill 02: goal-and-brief)
    │
    ▼
Generate product-intent.yaml artifact
    │
    ▼
Match profile (SKILL_PROFILES.md)
    │
    ▼
Load Layer 1 (kernel) + Layer 2 (compiler) + matched packs
    │
    ▼
Orchestrator (Skill 53) decomposes into task-graph.json
    │
    ▼
Spawn agents per task (no upper limit)
    │
    ▼
Build → Deploy → Verify → Fix → Loop
    │
    ▼
Release pipeline (Layer 4) runs
    │
    ▼
Zero Recommendations Gate → DONE or loop back
```

## Artifact Flow

```
One-line prompt
    → product-intent.yaml (Skill 02)
    → brief.md (Skill 02)
    → acceptance-criteria.md (Skill 07)
    → task-graph.json (Skill 53)
    → repo-map.md (Skill 05)
    → [implementation happens]
    → qa-report.json (Skill 56/57)
    → launch-checklist.md (Skill 34)
    → session-learning.md (self-improvement)
```
