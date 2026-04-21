---
name: "goal-and-brief"
description: "Establish the project thesis before the first line of code. Infers product type from domain name, identifies target users and business model, maintains PROJECT_BRIEF.md as single source of truth, and evolves the brief across prompts without losing alignment."
---

# 02 — Goal and Brief

## Goal Brief Structure

Every project brief contains:
1. **Product Thesis** — what this is and why (1-2 sentences)
2. **Target Users** — primary, secondary, anti-persona
3. **Product Category** — SaaS, marketing, dev tool, e-commerce, community, content, portfolio, internal, API, mobile, OSS
4. **Business Model** — free/donation, freemium, subscription, one-time, usage-based, marketplace, ad-supported, OSS+paid
5. **Success Criteria** — primary metric, secondary metrics, quality bar
6. **Non-Goals** — explicit exclusions preventing scope creep
7. **Permanent Constraints** — tech, business, brand, user constraints
8. **Current Truth** — living snapshot updated every session

## Goal Establishment Process

**New projects:** Parse domain → infer category/users/model/criteria → set non-goals → apply constraints from CLAUDE.md → write `PROJECT_BRIEF.md` → build.

**Existing projects:** Read PROJECT_BRIEF.md + CLAUDE.md + README → scan codebase → reconcile with prompt → update if changed → proceed.

**Subsequent prompts:** Load brief → detect direction change → update if changed (announce it) → always update "Current Truth".

## Domain Name Inference

| Pattern | Likely Product |
|---------|---------------|
| *.megabyte.space | Internal Megabyte Labs tool |
| *link / *l.ink | URL shortener / link management |
| install.* | Software distribution |
| editor.* | Online editor |
| fund* | Fundraising / financial |
| Generic .com/.dev/.space | Infer from README/package.json or ask |

## Brief Evolution Rules

**Change without asking:** Current Truth, success criteria refinement, non-goals additions.

**Requires confirmation:** Category change, target user change, business model change, primary metric change, removing constraints.

**Cannot change:** Tech constraints from CLAUDE.md, quality bar (only up), security requirements (only strengthen).

## Goal-Alignment Check

Before major decisions: Is this aligned with thesis? Target users? Business model? Success criteria? Not in non-goals? Within constraints? If any fails → adjust implementation or escalate.

## Storage

Location: `PROJECT_BRIEF.md` in project root. Format: Markdown. Never delete — archive if direction changes fundamentally.
