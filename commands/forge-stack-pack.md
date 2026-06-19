---
description: Batch-forge Brian's entire stack as skills + MCP servers in one prompt; skips already-forged entries; applies automatic pruning when tool count >100
argument-hint: [--target=skill|mcp-server|both] [--dry-run] [--only=<api-name>]
allowed-tools: Bash, Read, Write, Edit, Glob
---

Batch-forge every API in Brian's stack that doesn't yet have a skill or MCP server. Runs `bin/forge-skill-from-openapi.mjs` for each eligible target, prunes oversized MCP servers, and emits a summary table.

**When to use** — fresh machine setup; after adding a new API; to fill gaps after `/audit-mcp-fleet`.

**Inputs** (all optional)

- `--target=skill|mcp-server|both` — what to generate (default: `both`)
- `--dry-run` — preview work plan without executing
- `--only=<name>` — forge a single API (e.g. `--only=resend`)

---

## Stack manifest (hardcoded)

```
API           | OpenAPI URL                                                                              | skill-dir                          | mcp-dir
--------------|------------------------------------------------------------------------------------------|-------------------------------------|-----------------------------------
stripe        | skip — already forged                                                                    | skills/stripe                       | mcp-servers/stripe-mcp
github        | skip — already forged                                                                    | skills/github                       | mcp-servers/github-mcp
square        | skip — already forged                                                                    | skills/square                       | mcp-servers/square-mcp
twilio        | skip — already forged                                                                    | skills/twilio                       | mcp-servers/twilio-mcp
resend        | https://raw.githubusercontent.com/resend/resend-api-docs/main/openapi.yaml               | skills/resend                       | mcp-servers/resend-mcp
bitwarden     | https://api.bitwarden.com/openapi.json                                                   | skills/bitwarden                    | mcp-servers/bitwarden-mcp
openai        | https://github.com/openai/openai-openapi/raw/master/openapi.yaml                         | skills/openai                       | mcp-servers/openai-mcp
anthropic     | skip — no public OpenAPI                                                                  | —                                   | —
posthog       | https://posthog.com/openapi.json                                                         | skills/posthog                      | mcp-servers/posthog-mcp
cloudflare    | skip — mcp-servers/cloudflare-mcp exists (partial batch 3)                               | skills/cloudflare                   | mcp-servers/cloudflare-mcp
```

**Curated prune allowlists** (auto-applied when tool count > 100 after forge):

- **resend**: keep `send_email, send_batch_emails, create_broadcast, send_broadcast, get_email, list_emails, create_contact, update_contact, delete_contact, list_contacts, create_audience, list_audiences, get_domain, list_domains, cancel_email`
- **bitwarden**: keep `list_items, get_item, create_item, edit_item, delete_item, lock, unlock, sync, generate, status, list_org_members, get_org_member, list_org_collections`
- **openai**: keep `create_chat_completion, create_completion, create_embedding, create_image, create_moderation, list_models, get_model, create_file, list_files, delete_file, create_fine_tuning_job, list_fine_tuning_jobs`
- **posthog**: keep `list_events, query, create_feature_flag, get_feature_flag, list_feature_flags, update_feature_flag, create_insight, list_insights, list_persons, create_experiment, list_experiments, create_cohort, list_dashboards`

---

## Step 1 — Parse args + resolve targets

```bash
TARGET=$(echo "$ARGUMENTS" | grep -oP '(?<=--target=)\w+' || echo "both")
DRY_RUN=$(echo "$ARGUMENTS" | grep -q '\-\-dry-run' && echo "true" || echo "false")
ONLY=$(echo "$ARGUMENTS" | grep -oP '(?<=--only=)\S+' || echo "")
```

For each non-`skip` API in the manifest:

1. Check skill dir: `ls skills/<api-name> 2>/dev/null`
2. Check MCP dir: `ls mcp-servers/<api-name>-mcp 2>/dev/null`
3. Determine missing targets per `--target` flag.
4. If `--only=<name>` set, filter to that API; unknown name → error + stop.

Emit work plan:

```
Forge Stack Pack — work plan
══════════════════════════════════════════════════════════
API         skill exists  mcp exists  action
resend      ✗             ✗           forge skill + mcp-server
bitwarden   ✗             ✗           forge skill + mcp-server
openai      ✗             ✗           forge skill + mcp-server
posthog     ✗             ✗           forge skill + mcp-server
cloudflare  ✓             ✓           skip (already forged)
stripe      ✓             ✓           skip (already forged)
github      ✓             ✓           skip (already forged)
square      ✓             ✓           skip (already forged)
twilio      ✓             ✓           skip (already forged)
anthropic   —             —           skip (no public OpenAPI)
══════════════════════════════════════════════════════════
Total to forge: 4 APIs · 4 skills · 4 mcp-servers
```

If `--dry-run`: print table and stop.

---

## Step 2 — Forge loop (per eligible API)

Process APIs **sequentially** (not parallel) to avoid wrangler + npm contention.

### 2a — Fetch + validate the OpenAPI spec

```bash
API_NAME="<api-name>"
SPEC_URL="<url-from-manifest>"
SPEC_FILE="/tmp/forge-stack-${API_NAME}-spec.json"

curl -fsSL "$SPEC_URL" -o "$SPEC_FILE" 2>&1
```

- Fetch failure → emit `✗ <api-name> — spec fetch failed: <error>. Skipping.`, record `fetch_failed`, continue.
- YAML spec (`.yaml`/`.yml` URL): convert to JSON first:

```bash
node -e "const y=require('js-yaml');const fs=require('fs');fs.writeFileSync('$SPEC_FILE'.replace('.json','-orig.yaml'),fs.readFileSync('$SPEC_FILE'));fs.writeFileSync('$SPEC_FILE',JSON.stringify(y.load(fs.readFileSync('$SPEC_FILE','utf8'))))" 2>/dev/null \
  || npx --yes js-yaml "$SPEC_FILE" > "${SPEC_FILE%.json}.tmp.json" && mv "${SPEC_FILE%.json}.tmp.json" "$SPEC_FILE"
```

### 2b — Forge skill (when target includes `skill`)

```bash
node bin/forge-skill-from-openapi.mjs \
  "$SPEC_FILE" \
  "skills/${API_NAME}" \
  --name "${API_NAME}" \
  --target skill \
  2>&1
```

Record `skill_emitted`, `skill_loc` (`wc -l < skills/${API_NAME}/SKILL.md`).

### 2c — Forge MCP server (when target includes `mcp-server`)

```bash
node bin/forge-skill-from-openapi.mjs \
  "$SPEC_FILE" \
  "mcp-servers/${API_NAME}-mcp" \
  --name "${API_NAME}-mcp" \
  --target mcp-server \
  2>&1
```

Record `mcp_emitted`, `tool_count` (`grep -c "server\.tool(" mcp-servers/${API_NAME}-mcp/src/index.ts`), `mcp_loc`.

### 2d — Apply hardening (when MCP server was forged)

1. Add `.strict()` to every `z.object(` missing it (sed in-place).
2. Inject `logToolCall` stub comment at top of tool dispatch section.
3. Verify every tool has a non-empty description (second string arg to `server.tool(`).

```bash
# Add .strict() to bare z.object({...}) schemas
sed -i '' 's/z\.object({/z.object({/g; s/)\.describe\b/\0/g' \
  "mcp-servers/${API_NAME}-mcp/src/index.ts"

# Count tools missing descriptions (second arg is empty or missing)
MISSING_DESC=$(grep -cP "server\.tool\s*\(\s*'[^']+'\s*,\s*[^'\"z]" \
  "mcp-servers/${API_NAME}-mcp/src/index.ts" 2>/dev/null || echo 0)
[ "$MISSING_DESC" -eq 0 ] \
  || echo "  ⚠ ${MISSING_DESC} tools missing descriptions in ${API_NAME}-mcp — add before /deploy-forged-mcp"
```

### 2e — Auto-prune when tool count > 100

```bash
ALLOWLIST="<comma-separated keep list from manifest above>"
node bin/prune-mcp-tools.mjs \
  "mcp-servers/${API_NAME}-mcp" \
  --by=name \
  --keep-pattern="$ALLOWLIST" \
  2>&1
```

If `bin/prune-mcp-tools.mjs` absent, emit:

```
  ⚠ Tool count ${tool_count} > 100 — run: /prune-mcp-tools mcp-servers/${API_NAME}-mcp --by=name
```

Record `pruned_tool_count` after pruning.

---

## Step 3 — Emit summary table

```
Forge Stack Pack — summary
══════════════════════════════════════════════════════════════════════════════
API        skill emitted  MCP emitted  tools (raw→kept)  total LOC  status
resend     ✓              ✓            18                 1,240      ✓ complete
bitwarden  ✓              ✓            13                 980        ✓ complete
openai     ✓              ✓            312 → 12           8,400      ✓ pruned
posthog    ✗              ✓            87                 3,100      ⚠ skill failed
stripe     —              —            —                  —          skip (exists)
github     —              —            —                  —          skip (exists)
square     —              —            —                  —          skip (exists)
twilio     —              —            —                  —          skip (exists)
anthropic  —              —            —                  —          skip (no spec)
cloudflare —              —            —                  —          skip (exists)
══════════════════════════════════════════════════════════════════════════════
Forged: 4 APIs (3 fully complete · 1 partial)
Skills: 3 emitted
MCP servers: 4 emitted (1 pruned from 312 → 12 tools)
Total new LOC: ~13,720
```

Each `✗`/`⚠` row gets an action line:

```
Action required:
  posthog skill — re-run: /forge-from-openapi https://posthog.com/openapi.json posthog --target=skill
  openai mcp — verify prune list covers your use cases: /prune-mcp-tools mcp-servers/openai-mcp --reverse
```

---

## Step 4 — Post-forge next steps

Emit after at least 1 API fully forged:

```
Next steps:
  1. Review hardening gaps: each mcp-servers/*-mcp needs DO rate limiter + D1 audit table wired (rules/mcp-server-hardening.md)
  2. Deploy MCP servers: /deploy-forged-mcp mcp-servers/resend-mcp
  3. Register in ~/.claude.json: add mcpServers entries per /deploy-forged-mcp output
  4. Fleet healthcheck: /audit-mcp-fleet --tier experimental
  5. Promote to supporting tier after 1 smoke-test-clean session
```

---

## Edge cases

- **Spec returns HTML** — detect via `Content-Type` or leading `<!DOCTYPE`; emit `✗ <api> — spec URL returned HTML, not OpenAPI. URL may require auth or has changed.`
- **`js-yaml` not installed** — emit `npm i -g js-yaml` hint and skip that API.
- **`bin/forge-skill-from-openapi.mjs` not found** — emit `✗ forge script missing at bin/forge-skill-from-openapi.mjs — run from repo root`.
- **Partial output dir exists** — if `mcp-servers/<api>-mcp/src/index.ts` absent, treat as "not forged" (incomplete prior run).
- **All APIs already forged** — emit `Nothing to do — all stack APIs are already forged. Use --only=<name> to re-forge a specific API.` and exit 0.

---

## Example sessions

```bash
# Forge everything missing (default):
/forge-stack-pack

# Preview without running:
/forge-stack-pack --dry-run

# Skills only (no MCP servers):
/forge-stack-pack --target=skill

# Re-forge a single API:
/forge-stack-pack --only=resend

# MCP servers only for posthog:
/forge-stack-pack --only=posthog --target=mcp-server
```

---

## See also

- `/forge-from-openapi` — single-API forge (this command calls it in a loop)
- `/deploy-forged-mcp` — deploy each MCP server after forge
- `/prune-mcp-tools` — reduce tool surface on oversized MCP servers
- `/audit-mcp-fleet` — healthcheck all registered servers
- `rules/mcp-server-hardening.md` — hardening checklist every forged server must pass
- `19-mcp-authoring/` — MCP server authoring patterns and CF Workers transport
