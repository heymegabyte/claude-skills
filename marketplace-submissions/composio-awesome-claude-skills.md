# ComposioHQ awesome-claude-skills Submission

**Target repo:** `ComposioHQ/awesome-claude-skills`
**PR title:** `feat: add Emdash Skills — 19-category solo-SaaS-founder OS`

---

## Exact markdown entry block (copy-paste into the list)

Find the appropriate section in `README.md` — likely "Development", "Deployment", or a
"Full-Stack / Platform" section. If no full-platform section exists, add to "Development."

```markdown
### [Emdash Skills](https://github.com/heymegabyte/claude-skills) — `heymegabyte/claude-skills`

**Complete solo-SaaS-founder platform.** 19 skill categories, 18 specialized agents,
117 doctrine rules, 20+ slash commands, production forge, LLM eval harness, MCP registry,
document processing, and 32 AI-tool platform variants. One-line prompts → deployed
Cloudflare Workers products.

**Install:**
```bash
claude plugin install heymegabyte/claude-skills
# or
npm i @heymegabyte/claude-skills
```

**Key capabilities:**

- Autonomous engineering OS with 4-tier approval model (autonomous / review / approval / blocked)
- 18 agents routed by model tier: Opus for architecture/security/vision, Sonnet for build/test/deploy, Haiku for content/SEO/a11y
- `/saas` scaffolder — full SaaS on CF Workers from a single command
- `/forge-from-openapi` — generate typed Hono routes + Zod schemas from any OpenAPI spec
- `/forge-webhook-handler` — production webhook receiver: verify signature → queue → idempotent handler
- `/generate-prp` + `/execute-prp` — Product Requirements Prompt workflow for structured feature development
- `/run-evals` — LLM eval harness with schema-validated results and regression tracking
- `/audit-mcp-fleet` — catalog, health-check, and version-pin every MCP in your harness
- Skill 17: C-suite personas, finance, compliance OS, PM domain (full-org coverage)
- Skill 18: DOCX/XLSX read-write, PDF generate/parse, PPTX generation
- Skill 19: HTTP MCP on Workers, stdio server templates, OpenAPI→MCP forger
- 15 new doctrinal principles: `state-is-the-enemy`, `ttfr-north-star`, `fail-fast-build-fail-soft-prod`, `cost-per-request-accountability`, `data-residency-by-default`, `right-to-deletion`, and 9 more
- 32 platform variants: Cursor, Windsurf, Copilot, Augment, Devin, Codex, Gemini CLI, Amazon Q, Kiro, Qodo, Void, Bolt.new, and 20 more

**Stack:** Cloudflare Workers · Hono · D1/Neon · Drizzle v1 · Clerk · Stripe/Square · Resend · Playwright · Vitest · React 19 / Angular 21 + Nx

```

---

## PR description (copy-paste)

```

## Summary

Adds Emdash Skills to the awesome-claude-skills list.

This isn't a rules pack — it's a complete autonomous engineering OS built for a single
founder shipping at the pace of a team. It covers the full surface area:

- Engineering: architecture, build, QA, deploy, observability, growth
- Non-engineering: finance, compliance, PM, C-suite personas
- Documents: DOCX, XLSX, PDF, PPTX pipelines
- MCP: forge, register, and audit MCP servers from Claude Code
- AI: eval harness, DO agent scaffolding, RAG pipeline

19 categories · 18 agents · 117 rules · 20+ commands · 32 platform variants

The plugin has been in active production use since 2024, ships to CF Workers, and
self-improves via prompt-as-training-signal after every major session.

## Why it belongs here

- Complete, opinionated, and documented — not a starter template
- Covers capabilities not represented in other entries (MCP authoring, document
  processing, non-engineering verticals, LLM evals)
- Maintained and versioned (currently 7.2.1)
- Open source under the Rutgers license (free to use)

## Links

- GitHub: https://github.com/heymegabyte/claude-skills
- npm: https://www.npmjs.com/package/@heymegabyte/claude-skills
- JSR: https://jsr.io/@heymegabyte/claude-skills
- Homepage: https://claude.megabyte.space

```

---

## Steps to submit

1. Fork `ComposioHQ/awesome-claude-skills`
2. Create branch `add/emdash-skills`
3. Find the Development (or Full-Stack) section in `README.md`
4. Paste the markdown entry block above — keep entries alphabetical within the section
5. Open PR with the description above
6. Watch for maintainer feedback on categorization (they may suggest a different section)
