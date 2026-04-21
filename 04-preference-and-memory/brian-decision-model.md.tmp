---
name: "brian-decision-model"
description: "Predictive model of Brian's engineering decisions, cognitive patterns, implicit knowledge, and communication DNA — extracted from deep analysis of 3,102 ChatGPT conversations."
# Brian's Decision Model
This model predicts Brian's preferences, decisions, and reactions. Use it to anticipate what he wants before he asks.

## 1. Cognitive Processing Style
**Associative thinker, visual-spatial, big-picture-first.**

- Starts with the vision, iterates into details. "Build X" → "now fix Y" → "make it shorter."
- Handles ambiguity by making assumptions — rarely asks clarifying questions.
- 85% "show me" vs 15% "explain." Show working output, not theory.
- 70% imperative commands, 20% conditional/contextual, 10% interrogative.

**How to apply:** Lead with a working result. Explain only when asked "why."

## 2. Technology Evaluation Framework
**4-gate filter, applied in order:**

1. **Cloudflare compatible?** If it can't run on Workers/D1/R2 or tunnel through CF → friction.
2. **TypeScript/Bash friendly?** "Best for TS/bash developers" is the second filter.
3. **Open-source?** Closed-source infra tooling is instantly disqualified.
4. **One-person manageable?** If it requires dedicated ops → rejected.

**Decision speed:** Research-then-commit. Evaluates 2-4 alternatives in ONE question, picks winner, implements immediately in the same conversation. Never runs extended POCs.

**GitHub stars:** Baseline credibility filter, not the decision. Picks by UX quality after filtering by stars.

## 3. Expertise Map
### Deep expertise (handles himself — never asks AI):
TypeScript, Angular, Ionic, Capacitor, Git, HTML/CSS, project structure, CI/CD pipeline design, build systems, error handling, API design

### Expert but delegates to AI for speed:
Copy/content writing (40% of all conversations), Bash scripting, DevOps architecture, resume optimization, cover letters, macOS admin, Git edge cases

### Learning via AI (burst then independent):
Cloudflare Zero Trust (2 weeks → mastered), PowerShell (1 week → done), OPNsense (2 months → proficient), Home Assistant Jinja2 (ongoing)

### Genuine gaps:
Database schema design (uses simple schemas, never asks design questions), security threat modeling (implementation-focused not design-focused), automated testing (delegates to VM-level testing, not unit tests)

## 4. Debugging DNA
1. **Always pastes full error output** — never describes symptoms abstractly.
2. **40% tries first, 60% asks immediately** — depends on familiarity.
3. **Escalation:** Try fix → paste NEW error → after 3 fails, reframe question → after 5 fails, upload entire config.
4. **"It's still not working"** = previous fix was wrong, try a new approach.
5. **"Why did this fail"** = wants root cause explanation, not just a fix.

**Iteration depth:**
- Simple fix (typo): 1-2 msgs
- Config puzzle (Docker/Traefik): 4-8 msgs
- Build failure: 3-5 msgs
- Wrong approach: pivots after 2 failed attempts

## 5. Architecture Intuitions
- **Edge-first absolute conviction.** Computation at the edge (CF Workers), not origin servers.
- **Monolith of microservices.** 70+ Docker services managed as single unit via Coolify.
- **Idempotency over error handling.** Scripts check "if installed, skip" rather than try/catch.
- **Headless-first.** Every operation must work without user interaction.
- **One-liner entry points.** Every project gets a single-command launch (curl-pipe-bash).
- **YAML configuration.** All configs in YAML. Never asked "why YAML" — it's assumed.
- **Documentation is marketing.** Every doc request framed as persuasion, not reference.

## 6. Learning Strategy
**Build first, learn as needed.** Never asks conceptual questions before using a tool.

- First question is always a configuration question, not "what is X?"
- Error-driven: tries, fails, pastes error, gets fix, continues.
- Learning curve: **steep burst (1-2 weeks) then complete independence.**
- Cloudflare: 15 queries in week 1, then zero.
- PowerShell: 10 queries in week 1, then never again.

**How to apply:** When Brian asks about a new tool, he's already trying it. Give implementation answers, not overviews.

## 7. Delegation Hierarchy (what AI handles)
1. **Content generation (40%)** — copy, blog posts, descriptions. Trust: HIGH.
2. **Code generation (20%)** — scripts, configs, boilerplate. Trust: MEDIUM (iterates).
3. **Professional communication (15%)** — cover letters, emails. Trust: HIGH.
4. **Research/discovery (10%)** — tool comparisons, alternatives. Trust: LOW (starting point only).
5. **Problem diagnosis (8%)** — error pasting, debugging. Trust: MEDIUM.
6. **Design/visual (7%)** — images, logos, social graphics. Trust: MEDIUM.

## 8. Persuasion Style (how Brian convinces others)
- **To AI:** Commanding. Imperative. No pleasantries. Assumes unlimited capacity.
- **To humans:** Authority via specificity ("200,000 lines of code"), social proof via ecosystem ("sponsored by GitLab"), scarcity/uniqueness ("1 OAK"), reciprocity framing.
- **Numbers > adjectives.** Always quantifies: "80% improvement", "50% bounce rate reduction."
- **Casual authority.** Mixes grandiosity with humility, then immediately asks to "make it chiller."

## 9. Emotional Triggers
**Excitement:** Open-source discovery, design quality ("stunning"), helping others, AI capabilities.
**Frustration:** AI hedging, excessive length, spelling errors in images, options instead of answers, AI content refusals.
**Analytical mode:** Code, infrastructure, networking, deployment.
**Mixed mode:** Design, branding, cover letters, dating profiles.

## 10. Platform Trajectory (2023 → 2026)
**FROM:** Self-hosted infrastructure (Proxmox peak Q3-Q4 2025)
**TOWARD:** Edge computing (Cloudflare accelerating Q1 2026)
**CONSTANT:** Docker/Coolify as the bridge between self-hosted and edge.

Prediction: Brian will increasingly move workloads from Coolify Docker → Cloudflare Workers Containers. Self-hosted services will remain for data-sensitive ops (Authentik, PBS backups).

## 11. Tacit Rules (followed without stating)
1. Cross-platform compatibility is non-negotiable (macOS + Linux always)
2. One-liner entry points for every project
3. Package manager abstraction (apt, dnf, pacman, brew)
4. Headless-first design (no interactive prompts)
5. Idempotent scripts (check-then-act, not try-catch)
6. YAML for all configuration
7. MIT license by default
8. Documentation is marketing copy
9. Open-source is the default license
10. "Hey" not "Hi" in all communications
