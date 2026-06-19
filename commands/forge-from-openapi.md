---
description: Auto-generate a Claude Code skill (commands + types + client) from any OpenAPI 3.x spec URL or file path
argument-hint: <openapi-url-or-path> <skill-name> [--triggers <t1,t2>] [--base-url <url>]
allowed-tools: Bash, Read, Write, Edit, Glob
---

Auto-forge a complete Claude Code skill from an OpenAPI spec. Generates slash commands (one per endpoint), `types.ts`, `client.ts`, and a `SKILL.md`.

## How to use

```
/forge-from-openapi https://api.stripe.com/openapi.json stripe
/forge-from-openapi https://api.resend.com/openapi.json resend --triggers "send email,resend"
/forge-from-openapi ./local-spec.json my-api --base-url https://api.myapp.com
```

## What gets generated

- `~/.agentskills/<skill-name>/commands/<method>-<path>.md` — one slash command per endpoint
- `~/.agentskills/<skill-name>/types.ts` — TypeScript types from OpenAPI schemas
- `~/.agentskills/<skill-name>/client.ts` — zero-dep typed fetch client
- `~/.agentskills/<skill-name>/SKILL.md` — master skill file with all commands linked

## Execution

Run the forge script against the provided spec and output directory, then review and report results.

```bash
SKILL_NAME="${ARGUMENTS%% *}"
SPEC_URL="${ARGUMENTS#* }"

node ~/.agentskills/bin/forge-skill-from-openapi.mjs \
  $SPEC_URL \
  ~/.agentskills/${SKILL_NAME}-api \
  --name ${SKILL_NAME}-api \
  2>&1
```

After the script completes:

1. **Report the file tree** — run `find ~/.agentskills/${SKILL_NAME}-api -type f | sort` and show results
2. **Spot-check 3 commands** — read 3 generated command files and verify they have valid frontmatter + curl examples
3. **Check types.ts** — confirm it has at least one exported type
4. **Summarize** — report: API name, endpoint count, schema type count, any errors
5. **Offer hand-edit pass** — ask user which high-traffic endpoints to enrich with real examples

## Post-forge cleanup (always do this)

After forge runs, apply these improvements to the 3 most important commands:

- Replace `<value>` placeholders with realistic examples from the API docs
- Add a "Common use" section with 2-3 practical scenarios
- Verify auth header pattern matches the real API (Bearer vs API-Key vs Basic)

## Supported APIs (tested)

- Resend: `https://raw.githubusercontent.com/resend/resend-openapi/refs/heads/main/resend.yaml`
- Cloudflare: `https://raw.githubusercontent.com/cloudflare/api-schemas/main/openapi.json`
- Stripe: `https://raw.githubusercontent.com/stripe/openapi/refs/heads/master/openapi/spec3.json`
- Twilio: `https://raw.githubusercontent.com/twilio/twilio-oai/main/spec/json/twilio_api_v2010.json`
- GitHub: `https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/api.github.com/api.github.com.json`
- Any public OpenAPI 3.0/3.1 JSON spec

## YAML specs

YAML specs require `js-yaml`: `npm i -g js-yaml`. JSON specs work with zero installs.

## Anti-patterns

- Do NOT hand-roll skill commands for APIs that publish OpenAPI specs — forge first
- Do NOT commit generated files — add `~/.agentskills/*/types.ts` and `~/.agentskills/*/client.ts` to `.gitignore` if desired, but keep SKILL.md + commands tracked
