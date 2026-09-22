---
name: {{SKILL_NAME}}
description: "{{API_TITLE}} API skill — auto-forged from OpenAPI {{API_VERSION}}. {{API_DESCRIPTION}}"
triggers: [{{TRIGGERS}}]
version: 1.0.0
forged-from: openapi
api-title: {{API_TITLE}}
api-version: {{API_VERSION}}
---

# {{API_TITLE}} API Skill

Auto-forged from the {{API_TITLE}} OpenAPI spec (v{{API_VERSION}}).

## What this skill provides

- **{{COMMAND_COUNT}} slash commands** — one per API endpoint, with curl examples and typed guidance
- **`types.ts`** — TypeScript types auto-generated from OpenAPI schemas ({{SCHEMA_COUNT}} types)
- **`client.ts`** — Typed fetch-based API client (zero deps, Workers-compatible)

## Slash Commands

{{COMMAND_LIST}}

## Usage

```ts
import { {{CLIENT_CLASS_NAME}}Client } from './{{SKILL_NAME}}/client.js';

const client = new {{CLIENT_CLASS_NAME}}Client(process.env.{{ENV_VAR_NAME}}_API_TOKEN!);
```

## Auth pattern

Set `{{ENV_VAR_NAME}}_API_TOKEN` before running any command.
All generated curl examples use `-H "Authorization: Bearer $API_TOKEN"`.

## Maintenance

- **Re-forge**: `node ~/.agentskills/bin/forge-skill-from-openapi.mjs {{SPEC_URL}} {{OUTPUT_DIR}} --name {{SKILL_NAME}}`
- **Hand-edit**: add examples, tweak descriptions, add business-context to commands.
- **Spec drift**: re-running forge overwrites generated files; custom edits survive if you rename the file.

## Source

Generated {{GENERATED_DATE}} by forge-skill-from-openapi.
Spec: {{SPEC_URL}}
