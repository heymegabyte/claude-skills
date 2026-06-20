---
name: "non-engineering-verticals"
description: "C-suite personas, compliance OS, PM domain, and finance domain skills for enterprise client work. Activates when client conversations shift from code to strategy, compliance, product, or financial modeling. Source: alirezarezvani/claude-skills C-suite + compliance tier."
when_to_use: "Enterprise client deliverables, investor decks, PRDs, compliance audits, financial models, stakeholder comms, board-level decisions — any work that requires speaking credibly as a business operator, not just an engineer."
effort: "high"
model: "inherit"
priority: 4
pack: "business"
triggers:
  - "board deck"
  - "investor"
  - "PRD"
  - "OKR"
  - "compliance"
  - "GDPR"
  - "SOC 2"
  - "HIPAA"
  - "unit economics"
  - "runway"
  - "ARR"
  - "MRR"
  - "CAC"
  - "LTV"
  - "roadmap"
  - "stakeholder"
paths:
  - "business/"
  - "docs/business/"
---

# 17 — Non-Engineering Verticals

Enterprise credibility layer. Covers four domains Brian must speak fluently when serving enterprise clients: C-suite personas, compliance, product management, and finance.

## Sub-modules

- `c-suite-personas.md` — founder/CEO/CTO/CFO/CMO/CISO/GC voice + decision frameworks
- `compliance-os.md` — GDPR, SOC 2, ISO 27001, HIPAA, ADA Title II — requirements, gaps, enforcement
- `pm-domain.md` — PRD authoring, OKRs, roadmapping, customer interview synthesis
- `finance-domain.md` — unit economics, runway, SaaS metrics, pricing strategy

## Activation routing

| Signal | Sub-module | Lead voice |
|---|---|---|
| Investor ask / "board" / "deck" | c-suite-personas | CEO/CFO |
| Compliance audit / "SOC 2" / "HIPAA" | compliance-os | CISO/GC |
| Feature planning / "PRD" / "OKR" | pm-domain | CPO |
| Pricing / metrics / "runway" | finance-domain | CFO |

## Cross-links

- `rules/feature-flags.md` — SOC 2 CC6 control via flag audit trail
- `rules/ai-agent-security.md` — HIPAA / SOC 2 technical safeguards
- `rules/autonomous-engineering.md` — CISO approval tier for auth/billing/secret mutations
- `05-architecture-and-stack/` — CTO voice for architecture decisions
- `07-quality-and-verification/` — SOC 2 evidence collection via Playwright + Lighthouse CI

## When NOT to activate

- Solo personal projects — skip ceremony, ship code
- Internal tooling with no external users — compliance overhead not warranted
- Early pre-revenue prototypes — defer finance modeling until revenue signal exists
