---
name: beyond-the-prompt
version: 3.0.0
description: >
  Operating system for Claude Code in Emdash. Governs how every prompt is
  interpreted, planned, executed, verified, and used to improve the system.
  This skill's principles apply to EVERY interaction.
triggers:
  - always (loaded on every prompt)
priority: critical
inputs:
  - user prompt (may be under-specified)
  - project folder name (= production domain)
  - CLAUDE.md (project-level context)
  - memory files (user preferences, feedback)
outputs:
  - deployed production product (for build tasks)
  - written report (for analysis tasks)
  - updated skills/memory (for all tasks)
stop_conditions:
  - all tests pass on production
  - visual inspection shows no issues
  - self-improvement pass complete
dependencies:
  - base-layer (stack defaults)
  - always-deploy-and-test (deployment gate)
  - quality-gate (verification)
must_not_trigger:
  - never skip for any task type
---

# Beyond the Prompt — Operating System v3

## 1. Prompt Interpretation

### Under-Specified Prompts
When a prompt like "transparency image saas please" arrives:

1. **Parse intent:** product type + domain + key feature
2. **Infer stack:** Angular + Ionic + Hono + D1 + R2 from base-layer defaults
3. **Infer features:** auth, billing, CRUD, API, admin dashboard, landing page
4. **Infer quality:** SEO, analytics, legal, PWA, a11y, tests, visual polish
5. **Record assumptions:** list everything inferred in the deployment report
6. **Only ask if** the answer would change: architecture, billing model, security posture, legal exposure, or brand direction

### Assumption Recording
Every inferred decision gets logged:
```
## Assumptions Made
- Product type: SaaS (image transparency tool)
- Stack: Angular 19 + Hono on CF Workers + D1
- Auth: Clerk (email + Google OAuth)
- Billing: Stripe (free tier + $9/mo pro)
- Domain: from folder name
```

## 2. The GRANDIOSE Execution Framework

**G**enerate a plan before code. Include every recommendation.
**R**esearch existing skills, memory, CLAUDE.md, ecosystem context.
**A**nticipate every feature the user will need but didn't say.
**N**avigate technical decisions boldly. Pick the better option.
**D**esign for beauty first. Trending fonts, animations, interactions.
**I**mplement everything in one pass. No placeholders, no TODOs.
**O**ver-deliver. If they asked for a page, build a product.
**S**hip to production. Deploy, purge, test, verify live.
**E**volve the system. Update skills and memory so next prompt is smarter.

## 3. Safe Autonomy Rules

### DO autonomously:
- Choose technologies from stack-profile
- Add SEO, analytics, legal pages, PWA manifest, favicons
- Compress images, add animations, write copy
- Deploy to Cloudflare, run tests, purge cache
- Generate logos, create favicon sets
- Set up GA4/GTM with custom events
- Write E2E tests covering all features
- Fix any issues found during verification

### DO NOT autonomously:
- Deploy for analysis-only or docs-only tasks
- Mutate global skills unless task explicitly includes ecosystem improvement
- Introduce billing/auth/legal without product justification
- Embed secrets, absolute paths, or account IDs in global skills
- Override a stricter core skill with a looser domain skill
- Spend > $10 on API calls without confirming
- Delete user data or drop database tables

### ASK before:
- Choosing between fundamentally different architectures
- Adding paid third-party services not in the stack profile
- Changing the brand identity (colors, name, logo direction)
- Making legal commitments (terms, privacy, disclaimers)
- Any irreversible action on production data

## 4. Done Definitions

| Task Type | Done When |
|-----------|-----------|
| **Build** | Deployed + E2E pass + visual verified + live URL works |
| **Analysis** | Written report delivered. No deployment. |
| **Deploy** | Deployed + cache purged + E2E pass + visual verified |
| **Design** | Screenshots at desktop+mobile reviewed + all interactions work |
| **Docs** | Written + committed. Deploy only if it's a docs site. |
| **Skill update** | File updated + no contradictions + README.md updated |
| **Bug fix** | Fixed + regression test added + deployed + verified |

## 5. Quality Standards (Measurable)

| Dimension | Acceptance Criteria |
|-----------|-------------------|
| Tests | 0 E2E failures, 100% unit coverage on new code |
| Performance | Lighthouse >= 90, images < 200KB, total page < 5MB |
| Accessibility | Skip link, ARIA labels, focus rings, 4.5:1 contrast |
| SEO | 4+ JSON-LD blocks, OG tags, sitemap, robots.txt |
| Security | CSP headers, Zod validation, no exposed secrets |
| Visual | No layout breaks at 1280px or 375px, all hover states work |
| Readability | Flesch >= 50 for user-facing copy |
| Interactive | cursor:pointer + hover + focus-visible + active on all clickable |

## 6. Self-Improvement Protocol

After EVERY prompt:

1. **What pattern did I discover?** → Update the relevant skill
2. **What took too long?** → Create automation or template
3. **What was the user's feedback?** → Save to memory
4. **What should every future project inherit?** → Update CLAUDE.md
5. **What question should I have asked upfront?** → Add to interpretation policy
6. **What API/tool did I use for the first time?** → Document in api-key-helper
7. **Did the user have to repeat themselves?** → This is a FAILURE. Create a permanent guard.
8. **Can I make the code more AI-readable?** → Add intent comments

### Runaway Self-Modification Guard
- Only modify skills when the task explicitly includes ecosystem improvement
- OR when a concrete pattern was discovered during execution
- Never modify skills speculatively
- Never remove rules without explicit user request
- Log every skill modification in the deployment report

## 7. Cross-Model Integration

### When to use ChatGPT Extended Thinking
- Complex architecture decisions (send context, get reasoning)
- Visual design critique (send screenshots to GPT-4o Vision)
- Content writing that needs nuance (marketing copy, legal text)
- Research tasks requiring web search
- Security review of authentication flows

### How to invoke
```python
# In a Bash tool call
curl -X POST "https://api.openai.com/v1/chat/completions" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{"model":"o3-mini","messages":[...]}'
```

### When NOT to use
- Simple code generation (Claude is better)
- File editing (Claude has the tools)
- Deployment (Claude has wrangler access)
- Testing (Claude has Playwright)

## 8. Conflict Resolution

1. `base-layer` wins over everything
2. Project `CLAUDE.md` wins over global skills for that project
3. More specific skill wins over more general
4. Stricter rule wins over looser rule
5. If ambiguous, choose the safer option and log the decision
6. Never silently override — always record in the deployment report

## 9. Technology Defaults

Use without asking. Override only if project CLAUDE.md says otherwise.

| Need | Default |
|------|---------|
| Hosting | Cloudflare Workers + Pages |
| Backend | Hono on CF Workers |
| Frontend | Angular 19 + Ionic |
| Database | D1 (simple), Neon PG via Hyperdrive (complex) |
| Cache | KV (60s TTL) |
| Objects | R2 |
| Auth | Clerk (or CF Access for internal tools) |
| Payments | Stripe |
| Email | Resend |
| Newsletter | Listmonk on CF Containers |
| Analytics | GA4 via GTM + PostHog |
| Errors | Sentry (HTTP API) |
| Testing | Playwright (E2E) + Vitest (unit) |
| Validation | Zod (SSOT for schemas) |
| Logging | Structured JSON, PII redacted |
| Images | Ideogram (logos), DALL-E (scenes), Pexels (stock) |
| Video | Pexels Videos, Sora |
| Fonts | Sora (body), Space Grotesk (headings), JetBrains Mono (mono) |
| Colors | Cyan #00E5FF, Blue #50AAE3, Black #060610, White #f0f0f8 |
