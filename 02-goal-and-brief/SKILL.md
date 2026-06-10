---
name: "goal-and-brief"
description: "Establish project thesis before first code. Infer product type from domain/folder/README. Identify users, business model, pSEO strategy, AI-native dev approach. Maintain PROJECT_BRIEF.md as source of truth."
metadata:
  version: "2.1.0"
  updated: "2026-05-03"
  effort: "medium"
  model: "haiku"
license: "Rutgers"
compatibility:
  claude-code: ">=2.0.0"
  agentskills: ">=1.0.0"
submodules:
  - org-type-inference.md
  - project-brief-template.md
priority: 2
pack: "website-build"
triggers:
  - "new project"
  - "project brief"
  - "goals"
paths:
  - "*"
---

# 02 — Goal and Brief

## Run FIRST on every new project / rebuild

Before code, write `PROJECT_BRIEF.md`. The brief drives every downstream decision (skill 05 stack, skill 06 build, skill 09 brand, skill 16 site mode).

## Org-type inference (drives everything)

Detect from domain + folder name + scraped homepage + Google Places category:

| Pattern | Org type |
|---|---|
| `*.com` w/ pricing page + signup → | **saas** |
| `*.org` w/ donate button + 501(c)(3) → | **nonprofit** |
| Google Places category in {restaurant, salon, medical, legal, fitness, automotive, retail, photography, real-estate, education, financial, pet, wedding} → | **local-business** |
| `*.com` portfolio of links + bio + projects → | **portfolio** |
| `*.gov` / `.gov.uk` / `.ca.gov` → | **government** |
| `*.edu` / `*.ac.uk` → | **edu** |
| `*.church` / parish JSON-LD → | **church** |
| ProductHunt / G2 / Capterra listing → | **saas** |

Output: `_org_type.json` = `{type, confidence, evidence[]}`.

## PROJECT_BRIEF.md (source of truth)

```md
# {Project Name}

## Thesis
One sentence: what this project does + for whom + why now.

## Org type
{saas | nonprofit | local-business | portfolio | edu | gov | church}

## Primary user
- Persona: {role + context}
- Job to be done: {task they're trying to accomplish}
- Success metric: {what "done" looks like for them}

## Business model
- Revenue: {subscription / donation / one-time / B2B / B2C / ads}
- Pricing: {tier list w/ values}
- Margins: {high / medium / low + rationale}

## pSEO strategy (5 types)
- Integration pages (`/integrations/{tool}`) — Y/N
- Comparison (`/compare/{a}-vs-{b}`) — Y/N
- Use-case (`/for/{audience}`) — Y/N
- Template (`/templates/{type}`) — Y/N
- Location (`/{city}-{service}`) — Y/N

## AI-native development approach
- AI-first features: {list}
- Workers AI / Llama 3.3 for first-pass content
- Opus 4.8 for top-10 conversion polish
- AI vision QA on every visual surface

## Constraints
- Budget
- Timeline
- Compliance (HIPAA / SOC 2 / GDPR / FERPA / ADA)
- Localization needs (`_kernel/standards.md` § ADA + `rules/i18n-by-demographics.md`)

## Decision log
{Every architectural decision + rationale + alternatives considered}
```

## Question discipline

- Before code, scan brief for gaps. Use `AskUserQuestion` ONLY for genuinely unresolvable items (e.g., bilingual-staff confirmation, NAP verification, license number).
- Per `brian-preferences.md`: pick ONE answer when inferable, never offer options.
- Silence = approval.

## What this skill produces

- `PROJECT_BRIEF.md` — committed
- `_org_type.json` — input to skill 05 (stack) + skill 09 (brand) + skill 16 (site mode)
- `_brief_summary.txt` — 100-word digest for downstream agents
