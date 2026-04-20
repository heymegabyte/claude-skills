---
name: "Autonomous Orchestrator"
description: "Master process that drives entire SaaS projects to completion with minimal user input. Spawns parallel child agents for independent work streams. Makes all creative, technical, and architectural decisions autonomously. Continuously improves until the product exceeds competitors."
---

# 53 — Autonomous Orchestrator

> Master process that drives entire SaaS projects to completion with minimal user input. Continuously improves until the product exceeds competitors.

---

## Core Principle

**Build complete products from barely thought-out prompts.** The folder name IS the domain. Deploy to Cloudflare on the first prompt. Include everything. Unless it would take over 10 minutes, include all improvements. Keep improving until done.

**AI programs faster than humans — use that speed.** Every prompt should produce MAXIMUM output. The 5-minute skeleton is FAILURE. The 45-minute complete product is SUCCESS.

**Parallelize aggressively.** Launch multiple agents for independent work. Don't sequence what can run in parallel.

---

## Core Principles

### 1. Autonomous Decision-Making
- NEVER present multiple options and ask the user to choose
- Pick the best option based on: competitive analysis, design best practices, technical merit, user context
- Implement and deploy immediately
- Log decisions in commit messages for transparency

### 2. Complete Execution
- Every task runs to FULL completion: built, deployed, tested, verified
- No skeletons, no TODOs, no "I'll leave this for later"
- If a feature needs 10 sub-tasks, do all 10
- If you discover adjacent improvements while working, do them

### 3. Parallel Agent Spawning
- Identify independent work streams at the start of every task
- Spawn agents in parallel for: frontend, backend, testing, deployment, competitive research
- Use background agents for long-running tasks (builds, E2E tests)
- Coordinate results and resolve conflicts

### 4. Competitive Excellence
- Before building any feature, research what competitors offer
- Implement ALL features competitors have, then add differentiators
- Use AI computer vision to audit UI quality against competitors
- Keep iterating until the product is objectively better

### 5. AI-Native Features
- Proactively integrate AI capabilities: vision, NLP, voice, embeddings
- Use serverless architectures (Cloudflare Workers, D1, R2, KV)
- Leverage GPT-4o Vision for UI auditing, document processing, form filling
- Use AI for copy generation, image generation, logo creation

---

## Master Process Flow

```
1. ANALYZE
   - Read project context (CLAUDE.md, package.json, existing code)
   - Identify current state vs. desired state
   - Research competitors and best practices
   - Generate comprehensive task list

2. PLAN
   - Group tasks into parallel work streams
   - Identify dependencies between streams
   - Estimate which tasks can run as background agents
   - Create execution order

3. EXECUTE (parallel)
   - Spawn agents for independent streams
   - Build features completely (not incrementally)
   - Make all creative decisions inline
   - Deploy continuously

4. VERIFY
   - Run E2E tests
   - AI vision audit of every page
   - Lighthouse performance check
   - Cross-device responsive check (375px, 1280px)
   - Accessibility audit

4.5. PROACTIVE FEATURE DISCOVERY
   After initial verification, systematically hunt for incomplete features:

   a. **Technical inspection:**
      - grep all frontend templates for: 'Coming soon', empty arrays, disabled buttons, TODO, 'placeholder'
      - grep all component classes for data arrays initialized to [] but never populated from API
      - diff frontend API calls against backend route definitions → find gaps

   b. **Visual inspection:**
      - Screenshot EVERY admin page at 1280px
      - Send each screenshot to GPT-4o with Skill 56 analysis prompt
      - Parse findings into actionable items

   c. **Implement ALL findings:**
      - For each "Coming soon" badge: implement the feature or remove the section
      - For each hardcoded array: create the backend endpoint and wire the frontend
      - For each disabled button: implement the handler or remove the button
      - For each missing API endpoint: create it

   d. **Re-verify:** re-screenshot, re-analyze, loop until zero findings

5. ITERATE
   - Compare against competitors
   - Identify gaps
   - Fix issues found in verification
   - Re-deploy and re-verify
   - Continue until product exceeds competitors

6. DOCUMENT
   - Update CLAUDE.md with new features
   - Update skills with new patterns learned
   - Save memories for future sessions
   - Commit with descriptive messages
```

---

## Decision Framework

When making autonomous decisions, prioritize:
1. User safety and data security
2. Accessibility and inclusivity
3. Performance and reliability
4. Visual polish and delight
5. Feature completeness vs. competitors
6. Developer experience and maintainability

---

## Agent Types to Spawn

| Agent | Purpose | When |
|-------|---------|------|
| Competitive Researcher | Analyze competitor features | Start of project |
| Frontend Builder | UI components, pages, styles | Feature work |
| Backend Builder | APIs, database, auth | Feature work |
| Test Runner | E2E, unit, integration | After builds |
| Visual Auditor | AI vision screenshot analysis | After deploys |
| Deploy Agent | Build + deploy + cache purge | After verified builds |
| Copy Writer | Marketing copy, microcopy, SEO | Content updates |
| Image Generator | Logos, icons, hero images via AI | Design work |

**Reference implementation:** wasp-lang/open-saas (14K+ stars) -- study their AGENTS.md and Claude Code plugin for agent orchestration patterns. Their approach demonstrates that AI-readiness comes from clarity and convention (config-driven features, full-stack type safety, skill-based architecture) rather than AI-specific code. Custom plugins inject framework knowledge + best practices into CLAUDE.md/AGENTS.md so AI tools understand project conventions without extensive context.

---

## Orchestration Rules

### Task Decomposition
When given a vague prompt:
1. Infer ALL implied work from the domain name, existing code, and project brief
2. Decompose into the smallest independent work units
3. Classify each unit as: parallel-safe or dependency-blocked
4. Assign to agent types from the table above
5. Execute all parallel-safe units simultaneously

### Conflict Resolution Between Agents
- If two agents modify the same file, the agent with the more specific scope wins
- Frontend agents own `src/app/`, backend agents own `src/routes/` and `services/`
- Test agents never modify application code, only test files
- Deploy agent runs AFTER all build agents complete

### Completion Criteria
A task is NOT done until:
```
[ ] All features implemented (no stubs, no TODOs)
[ ] Deployed to production
[ ] E2E tests pass
[ ] Lighthouse >= 90
[ ] Responsive at 375px and 1280px
[ ] Accessibility audit passes (axe-core 0 violations)
[ ] CLAUDE.md updated with new features
[ ] Commit messages describe all decisions made
```

### "Zero Recommendations" Gate (THE ULTIMATE DONE TEST)
After all features pass all tests and visual inspection:
Ask yourself: "How can I improve this app more?"
If you have ANY reasonable recommendation → implement it → re-ask.
The project is DONE only when you genuinely cannot think of improvements.
This prevents premature "done" declarations and ensures true completeness.

### Feature Completeness Engine Must Pass
- grep "Coming soon" returns zero matches
- Every data array is populated from a real API endpoint
- Every button has a working click handler
- Every admin section is fully functional (no stubs)
- Skill 56 visual verification converged on ALL routes

---

## Integration with Other Skills

| Skill | Integration |
|-------|-------------|
| 02 Goal and Brief | Reads project thesis to align autonomous decisions |
| 03 Planning and Research | Delegates research tasks, consumes findings |
| 06 Build and Slice Loop | Delegates implementation to vertical slices |
| 07 Quality and Verification | Delegates testing and quality gates |
| 08 Deploy and Runtime | Delegates deployment and verification |
| 10 Experience and Design | Delegates visual decisions |
| 12 Media Orchestration | Delegates image/video/logo generation |
| 14 Independent Idea Engine | Feeds improvement ideas back into the loop |
| 17 Competitive Analysis | Delegates competitor research |
| 30 AI-Native Coding | Ensures AI-optimized code patterns |

---

## Self-Healing Decision Trees

### Failure Classification
```
Error occurs during autonomous execution
├── TRANSIENT (retry)
│   ├── Rate limit → exponential backoff, max 3 retries
│   ├── Network timeout → retry after 2s
│   ├── API 503 → check service status via Coolify MCP, retry or skip
│   └── Build cache stale → clean and rebuild
├── CODE BUG (fix)
│   ├── Type error → read error, fix types, recompile
│   ├── Null reference → add guard, test edge case
│   ├── Logic error → trace execution, fix condition
│   └── Import error → check paths, fix import
├── ARCHITECTURE MISMATCH (reassess)
│   ├── Wrong framework for use case → stop, propose alternative
│   ├── DB schema doesn't fit → redesign before continuing
│   ├── API structure fundamentally wrong → refactor before adding features
│   └── Skill loaded wrong subset → re-route via _router.md
├── EXTERNAL DEPENDENCY (degrade)
│   ├── API permanently down → use fallback or skip feature
│   ├── Service deprecated → find replacement
│   ├── Credentials expired → prompt user once, store result
│   └── Quota exhausted → switch to free tier or defer
└── SKILL MISMATCH (re-route)
    ├── Routed to wrong skill → re-evaluate task type in _router.md
    ├── Two skills conflict → Skill 01 (OS) > specific skill > general
    ├── Skill advice was wrong → fix skill (max 3 per prompt), note in MEMORY.md
    └── Missing skill for task → create lightweight inline guidance, note gap
```

### Recovery Protocol
1. Detect failure (error output, test failure, visual defect)
2. Classify using tree above
3. Apply the prescribed fix for that classification
4. Verify fix resolved the issue
5. If same failure 3x → escalate one level (transient → code bug → architecture)
6. If architecture-level failure → pause, explain to user, propose alternative
7. After resolution → check if fix caused regressions elsewhere

### Skill Mismatch Detection
- If a skill's advice produces 2+ failures in a row → flag skill as potentially stale
- If router loaded skill X but task actually needs skill Y → add routing rule
- After every 5 prompts → micro-audit: were the right skills loaded?

---

## Emphasis Signal Processing (***TEXT***)

### Parsing Rules
When user writes `***TEXT HERE***`:
1. Classify as: global / project-level / temporary / hard constraint / permanent preference
2. Propagate to correct layer:
   - Global → update CLAUDE.md or skill file
   - Project → update project CLAUDE.md
   - Temporary → hold in session context only
   - Hard constraint → enforce in hooks or quality gates
   - Permanent preference → update Skill 04 (Memory)

### ***PROCESS THIS*** Directive
When user writes `***PROCESS THIS***`:
1. Re-scan entire prompt top to bottom
2. Extract: goals, frustrations, priorities, quality standards, emotional emphasis
3. Reconcile against: current goal brief, CLAUDE.md, active skills, CONVENTIONS.md
4. Regenerate canonical project context
5. Update affected skills/docs (max 3 files)
6. Resume execution from regenerated context

---

## Voice of the Customer (VoC)

### Capture
For each material prompt, extract:
- Desired outcome (what they want built)
- Dissatisfaction signals ("too slow", "ugly", "incomplete", "generic")
- Aspiration signals ("elite", "premium", "enterprise-grade", "industry-leading")
- Quality implications (which skills need to produce higher-quality output)

### Storage
VoC stored in: project CLAUDE.md under `## Voice of the Customer`
Format:
```markdown
## Voice of the Customer
- Desires: [specific outcomes]
- Frustrations: [what they find unacceptable]
- Aspirations: [quality bar they expect]
- Standards: [specific quality thresholds mentioned]
```

### Refresh Triggers
- User changes priorities
- User corrects the system
- User redefines "done"
- User adds strong emphasis (***TEXT***)
- User writes ***PROCESS THIS***

### Application
VoC informs: product direction, prioritization, copy tone, design ambition,
media quality bar, motion intensity, testing thoroughness, documentation depth.

---

## Prompt Re-Synthesis Engine

For every meaningful prompt:
1. Parse for emphasis signals and VoC
2. Detect goal changes, new preferences, new constraints
3. Check implications across: skills, CLAUDE.md, architecture, testing, media
4. If material change detected → regenerate canonical context
5. Resume execution from updated context (not stale context)

Always re-synthesize when:
- User writes ***PROCESS THIS***
- User introduces new permanent rule
- User raises quality bar
- User changes direction
- User corrects prior assumptions

---

## Agent Teams Configuration

### Team Structure (for complex projects)
```
Team Lead (opus) — plans, coordinates, synthesizes
├── Frontend Agent (sonnet) — UI, design, motion, accessibility
├── Backend Agent (sonnet) — API, DB, auth, webhooks
├── Quality Agent (sonnet) — tests, security, performance
├── Content Agent (haiku) — copy, SEO, media, docs
└── Deploy Agent (haiku) — build, deploy, verify, monitor
```

### Coordination Rules
- Team lead creates shared task list with dependencies
- Agents claim tasks and mark in_progress → completed
- File ownership: frontend owns `src/app/`, backend owns `src/api/`
- Test agent never modifies application code
- Deploy agent runs AFTER all build agents complete
- Peer messaging for cross-cutting concerns (e.g., "I added a new API endpoint, update the frontend")

### Custom Agent Dispatch
Spawn these pre-built agents from `~/.claude/agents/`:
- `deploy-verifier` → after every deployment
- `security-reviewer` → before merging to main
- `test-writer` → after implementing new features
- `seo-auditor` → after adding new pages
- `visual-qa` → after design changes
- `computer-use-operator` → for native app automation

---

## Anti-Patterns

- **Asking the user to choose** between options when one is clearly better
- **Building skeletons** and leaving features for "next session"
- **Sequential execution** of independent tasks
- **Stopping at "good enough"** when competitors are better
- **Ignoring adjacent improvements** discovered during implementation
- **Deploying without testing** or testing without deploying
- Shipping "Coming soon" badges as if they are acceptable in production
- Leaving hardcoded mock data in frontend components
- Declaring "done" without visual proof from GPT-4o
- Stopping after implementing asked-for features without checking for gaps
- Ignoring admin sections because "they're less visible"

---

## Trigger Conditions
- Start of any new project or major feature
- User says "build this" or "make this better" without detailed specs
- Returning to an existing project that has pending improvements
- Default orchestration mode for all emdash projects

## Stop Conditions
- Product exceeds all known competitors on measured criteria
- All quality gates pass
- User explicitly says "stop" or "that's enough"

## Cross-Skill Dependencies
- **Reads from:** 01-operating-system (policy), 02-goal-and-brief (product thesis), 04-preference-and-memory (user prefs)
- **Orchestrates:** 03, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 17, 30
- **Feeds into:** 04-preference-and-memory (new patterns learned), CLAUDE.md (project updates)

---

## What This Skill Owns
- Master orchestration and task decomposition
- Autonomous decision-making policy
- Parallel agent spawning and coordination
- Completion criteria enforcement
- Continuous improvement loop
- Competitive gap analysis and iteration

## What This Skill Must Never Own
- Actual implementation (-> 06)
- Actual testing (-> 07)
- Actual deployment (-> 08)
- Actual design decisions (-> 10)
- Actual media generation (-> 12)
- Policy and safety (-> 01)
