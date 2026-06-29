# Marketplace Publishing Plan

Five standalone Claude Code plugin packs extracted from the Emdash monorepo, ordered by cheapest/easiest to publish first.

---

## 1. `emdash-core`

**Name:** Emdash Core  
**Pitch:** The foundational operating system for AI-assisted development — autonomous engineering discipline, verification loops, and monitor orchestration in one bundle.  
**Audience:** Solo builders and small teams adopting AI-native workflows.  
**Files:**
- `01-operating-system/`
- `rules/always.md`
- `rules/autonomous-engineering.md`
- `rules/verification-loop.md`
- `rules/monitor-orchestration.md`
- `.claude-plugin/plugin.json` (as scaffold)
**Dependencies:** None (standalone root pack).

---

## 2. `site-generator`

**Name:** Site Generator  
**Pitch:** One-liner marketing sites — competitor research, maximalist design, AI-native features, agent swarm, and deploy in a single slash command.  
**Audience:** Freelancers, agency owners, and indie hackers who build 10+ sites/year.  
**Files:**
- `15-site-generation/`
- `rules/competitor-research.md`
- `rules/source-site-enhancement.md`
- `rules/i18n-by-demographics.md`
**Dependencies:** Requires `emdash-core` (for autonomous-engineering + verification-loop gates).

---

## 3. `cinematic-web`

**Name:** Cinematic Web  
**Pitch:** Pre-hydrated SPAs with View Transitions, bento grids, glass+grain textures, and motion choreography — everything needed for a stunning dark-first brand site.  
**Audience:** Design-forward developers and agencies building premium brand presences.  
**Files:**
- `16-cinematic-website-prime-directive/`
- `rules/image-quality.md`
- `rules/text-contrast.md`
- `rules/logo-contrast.md`
- `rules/timeline-authenticity.md`
- `rules/progressively-gorgeous-ui.md`
**Dependencies:** Requires `site-generator` (which pulls in `emdash-core` transitively).

---

## 4. `mcp-forge`

**Name:** MCP Forge  
**Pitch:** Auto-generate hardened MCP servers from any OpenAPI spec — register, deploy, eval, prune, and maintain with discipline-grade error semantics and mock-mode testing.  
**Audience:** Backend engineers and platform teams shipping API wrappers at scale.  
**Files:**
- `19-mcp-authoring/`
- `rules/mcp-error-semantics.md`
- `rules/eval-mock-mode-discipline.md`
- `rules/forge-from-openapi.md` (from `commands/`)
- `bin/forge-skill-from-openapi.mjs`
- `bin/validate-mcp-tools.mjs`
**Dependencies:** Requires `emdash-core` (for verification-loop gates).

---

## 5. `superpowers-lite`

**Name:** Superpowers Lite  
**Pitch:** The full brainstorm-build-review-finish process chain without cargo-culting the deep-brainstorm cult — perfect for teams who want structured delivery without the ceremony.  
**Audience:** Small engineering teams (2-8 people) wanting structured AI-assisted delivery.  
**Files:**
- `20-superpowers/`
- `rules/multi-harness-portability.md`
- `rules/context-spillover.md`
- `rules/extra-mile.md`
- `rules/auto-integrate-recs.md`
- `commands/process.md`
**Dependencies:** Requires `emdash-core` (for autonomous-engineering + monitor-orchestration).
