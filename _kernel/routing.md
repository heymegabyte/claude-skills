# Skill Routing — 10 Improvement Ideas

How to load the IDEAL set of skills/rules for each task without overloading the preamble.

## 1. Embedding-Based Semantic Routing (Tier-S — recommended)

- Precompute a 1536-dim OpenAI/Cohere embedding for every skill's `description` + `when_to_use` + first 200 lines of body
- Store in Vectorize / local SQLite
- On each prompt, embed the user prompt → ANN top-K (K=5-8) most similar skills load full content
- Rest are stub-only (name + description only)
- **Why** — beats keyword matching; understands "rebuild njsk.org" maps to website-build-doctrine + competitor-research + source-site-enhancement without any phrase trigger
- **Cost** — one embedding API call per prompt (~$0.0001); offline ANN over ~75 skills is microseconds
- **Implementation** — `~/.claude/hooks/UserPromptSubmit` shells out to `~/.claude/bin/route-skills.py` which returns the manifest

## 2. Project-Fingerprint Auto-Detection

- On SessionStart, inspect cwd: `package.json` + `wrangler.toml` + framework imports + folder structure + git remote
- Generate `_project-fingerprint.json` = `{stack: "react-vite" | "angular-nx" | "hono-only" | "python-fastapi", concerns: ["payments", "auth", "billing"], scale: "solo" | "team"}`
- Load only matching skill set (Angular project → skip React-only rules; nonprofit project → skip SaaS-billing skills)
- **Why** — pdf.megabyte.space doesn't need website-build-doctrine + competitor-research loaded (saves ~10k tokens)
- **Implementation** — `~/.claude/hooks/session-start-fingerprint.py` writes fingerprint; `~/.claude/CLAUDE.md` conditionally `@`-imports based on it via templating

## 3. Phrase-Trigger Lazy Load

- Each rule frontmatter declares `triggers: ["rebuild X.com", "make a website", "audit 100 ideas"]`
- Harness scans prompt for phrase patterns FIRST; matched skills load
- Skills not matched stay at stub-level (name + description only, ~30 tokens vs ~5000)
- **Why** — most prompts target a narrow domain; loading the whole mesh "just in case" is the failure mode
- **Implementation** — settings.json gains `skills.triggerMode: "lazy"`; harness watches for `frontmatter.triggers[]` matches

## 4. Tiered Priority + Token Budget

- Every skill declares `priority: 1-5` in frontmatter (1 = always load, 5 = rarely)
- Orchestrator allocates ~40k tokens to preamble; fills by priority ascending
- Tier-1: `01-operating-system`, `brian-preferences`, `always`, `verification-loop` (~10k)
- Tier-2: Active project's stack rules (~10k)
- Tier-3: Domain skills triggered by prompt (~10k)
- Tier-4: Reference material (loaded on-demand via WebFetch)
- Tier-5: Archive (link only)
- **Why** — bounded preamble cost; no more 175k-token boots
- **Implementation** — `frontmatter.priority` field + harness budget check at SessionStart

## 5. Hierarchical Skill Packs

- Group related skills into packs (`website-build-pack`, `saas-pack`, `local-business-pack`, `nonprofit-pack`)
- Each pack declares its `members` + a single `pack-summary.md`
- Loading one pack loads the whole graph deterministically
- Tier-5 pack-summary is always available; full member content only on pack activation
- **Why** — a website build needs 5-6 skills together; loading them individually misses cross-references
- **Implementation** — `_packs/website-build.yml` lists members; skill resolver expands at load time

## 6. Per-Tool Skill Activation

- When prompt triggers Playwright tool use → load testing-specific skills (`e2e-tdd-organization`, `e2e-visual-inspection`, `07-quality-and-verification`)
- When triggers WebFetch → load research skills (`03-planning-and-research`, `competitor-research`)
- When triggers Bash on `wrangler` → load CF skills (`05-architecture-and-stack`, `cloudflare-hostable-supervisor`)
- **Why** — most session segments use ~3 tools; skills relevant to other 17 are dead weight
- **Implementation** — `~/.claude/hooks/PreToolUse` triggers conditional skill load

## 7. Shared Kernel Reference Layer (this just shipped)

- Common standards (WCAG, OWASP, CWV, breakpoints, asset budgets, brand tokens, banned-word list) live ONCE in `_kernel/standards.md`
- Other files cite by anchor: `per _kernel/standards.md#wcag22`
- Eliminates 40+ duplicate definitions across mesh
- **Why** — same WCAG criteria were defined in 6 files; one canonical source = -3k tokens
- **Status** — shipped this turn; need to migrate remaining files to citations

## 8. Skill Stubs + On-Demand WebFetch Expand

- Replace each skill's content w/ 100-word stub + canonical URL (`https://github.com/heymegabyte/claude-skills/blob/main/SKILL.md`)
- When orchestrator needs full content, fetches via WebFetch (cached 1hr in KV)
- Cuts ~80% of preamble; adds 1-2s latency on first use
- **Why** — most skills aren't fully needed in any given prompt; full text is reference material
- **Trade-off** — latency on use vs constant preamble cost; net win for long-running sessions
- **Implementation** — harness frontmatter flag `stub: true` + WebFetch on call

## 9. Conversation-Aware Skill Caching

- After first turn, model identifies which skills it actually used (via tool log + content references)
- Persist to `~/.claude/sessions/<id>/active-skills.json`
- Subsequent turns load only that subset (+ tier-1 always)
- New domain trigger → expand cache
- **Why** — a 30-turn coding session uses ~8 skills consistently; loading all 80 every turn is waste
- **Implementation** — `~/.claude/hooks/Stop` updates cache; SessionStart reads it

## 10. Embedding-Compressed Skill Storage

- Beyond top-K loading, store skill BODIES as embedding sequences instead of raw text
- Retrieval = decoding the top-K most-similar chunks
- Like RAG but the corpus IS the skill mesh
- 75% compression via embedding deduplication of common phrases
- **Why** — most skill text repeats common patterns; embedding similarity collapses them
- **Trade-off** — complexity; needs offline decoder
- **Status** — speculative; would require harness changes

---

## Implementation priority (Brian's solo + AI constraints)

| Idea | Cost (hrs) | Token saving | Risk | Order |
|---|---|---|---|---|
| 2. Project-fingerprint | 2 | 30-50% on non-website projects | Low | **DO FIRST** |
| 7. Shared kernel | 1 (mostly done) | 5-10% | Zero | **DO 2ND** |
| 3. Phrase-trigger | 3 | 40-60% | Low | **DO 3RD** |
| 1. Embedding routing | 6 | 50-70% | Medium | DO 4th |
| 4. Tiered priority | 4 | 30-40% | Low | DO 5th |
| 9. Session caching | 4 | 40-60% over session | Medium | DO 6th |
| 5. Skill packs | 3 | 10-20% | Low | DO 7th |
| 6. Per-tool activation | 5 | 20-30% | Medium | DO 8th |
| 8. WebFetch stubs | 6 | 80% but +latency | High | LATER |
| 10. Embedding storage | 20+ | 75% but complex | Very high | RESEARCH |

## Quick win combo

**Ideas 2 + 3 + 7 together (~6 hours work) → ~60% token reduction with zero quality loss.**

That brings the ~133k preamble to ~50k, well under any subagent input limit. Subagent fan-out works again.
