---
last_reviewed: 2026-06-29
superseded_by: null
name: skill-forge-from-api
description: Skill Forge from API
pack: "backend"
priority: 3
triggers:
  - "openapi"
  - "forge"
  - "api skill"
  - "spec"
---

# Skill Forge from API

Auto-generate Claude Code skills from OpenAPI specs. Rule: whenever a new API enters the stack, forge first, hand-edit second.

## The law: forge before you hand-roll

- **Any API with a published OpenAPI spec** → run `forge-skill-from-openapi.mjs` BEFORE touching a text editor.
- Hand-rolled skills for spec-first APIs = wasted effort and outdated documentation risk.
- Forge produces 80% of the value in 30 seconds; humans add the top 20% (examples, auth nuance, business context).

## What forge produces

| File | Contents | Human-edit priority |
|---|---|---|
| `commands/<method>-<path>.md` | Frontmatter + curl example + param table + error guidance | High-traffic endpoints first |
| `types.ts` | TS types from OpenAPI schemas | Low — only if types are wrong |
| `client.ts` | Typed fetch client, Workers-compatible | Medium — add retry/logging |
| `SKILL.md` | Master skill file, command index | Always review description |

## Forge once, evolve manually

1. **Day 0**: `forge-skill-from-openapi.mjs <spec-url> ~/.agentskills/<api>-api`
2. **Day 0 continued**: hand-edit the 3-5 most-used command files with real examples + auth specifics
3. **On spec update**: re-run forge — it overwrites generated files. Move any custom additions to a `commands/_custom/` folder to protect them.
4. **Never**: maintain types.ts or client.ts by hand — they should always be re-forgeable from spec.

## When to re-forge

- API releases a new major version
- Endpoints you use stop working (spec drift)
- You add a new service that uses the same API (need new trigger phrases)

## Anti-patterns

- **Don't hand-roll**: writing `commands/post-messages.md` from memory for Slack API when `https://raw.githubusercontent.com/slackapi/slack-api-specs/master/web-api/slack_web_openapi_v2.json` exists.
- **Don't skip the review**: forged commands have `<value>` placeholders — ship at least one real example per command before using in prod workflows.
- **Don't commit client.ts blindly**: review the generated auth header pattern against the real API docs before trusting it.
- **Don't over-generate**: if an API has 400 endpoints and you use 12, run forge then delete the unused command files. 12 focused commands > 400 noisy ones.

## CLI reference

```bash
# Basic forge
node ~/.agentskills/bin/forge-skill-from-openapi.mjs \
  https://api.resend.com/openapi.json \
  ~/.agentskills/resend-api \
  --name resend-api \
  --triggers "send email,resend,email delivery"

# Local YAML spec (requires: npm i -g js-yaml)
node ~/.agentskills/bin/forge-skill-from-openapi.mjs \
  ./local-spec.yaml \
  ~/.agentskills/my-api \
  --name my-api \
  --base-url https://api.myapp.com
```

## Slash command

`/forge-from-openapi <spec-url> <skill-name>` — AI-assisted wrapper that runs the script, spot-checks output, and prompts for hand-edit priority.

## Known-good spec URLs (Brian's stack)

| API | OpenAPI URL |
|---|---|
| Resend | `https://raw.githubusercontent.com/resend/resend-openapi/refs/heads/main/resend.yaml` |
| Cloudflare | `https://raw.githubusercontent.com/cloudflare/api-schemas/main/openapi.json` |
| Stripe | `https://raw.githubusercontent.com/stripe/openapi/refs/heads/master/openapi/spec3.json` |
| GitHub | `https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/api.github.com/api.github.com.json` |
| Twilio | `https://raw.githubusercontent.com/twilio/twilio-oai/main/spec/json/twilio_api_v2010.json` |
| Anthropic | `https://raw.githubusercontent.com/anthropics/anthropic-sdk-python/refs/heads/main/api.md` (MD not OAS — hand-roll) |

## Source

Pattern inspired by `jeremylongshore/claude-code-plugins-plus-skills` `--forge` CLI.
Implemented 2026-06-18 as `bin/forge-skill-from-openapi.mjs`.
