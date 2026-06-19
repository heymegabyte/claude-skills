# bitwarden-mcp MCP Server

Auto-generated from OpenAPI spec by `forge-skill-from-openapi --target=mcp-server`.
Transport: **stdio**

## Tools (28)

- `list_items` — List all items in the organization vault
- `get_item` — Retrieve a vault item
- `edit_item` — Update a vault item
- `delete_item` — Delete a vault item
- `create_item` — Create a new vault item in an existing collection
- `list_org_collections` — List all collections in the organization
- `create_org_collection` — Create a new collection
- `get_org_collection` — Retrieve a collection
- `edit_org_collection` — Update a collection
- `delete_org_collection` — Delete a collection
- `list_org_members` — List all members of the organization
- `invite_org_member` — Invite a new member to the organization
- `get_org_member` — Retrieve a member of the organization
- `update_org_member` — Update an organization member
- `remove_org_member` — Remove a member from the organization
- `reinvite_org_member` — Re-invite a member to the organization
- `confirm_org_member` — Confirm a member of the organization
- `list_org_groups` — List all groups in the organization
- `create_org_group` — Create a new group
- `get_org_group` — Retrieve a group
- `update_org_group` — Update a group
- `delete_org_group` — Delete a group
- `get_org_group_member_ids` — Get member IDs for a group
- `update_org_group_members` — Update members of a group
- `get_org_events` — List organization event logs
- `list_org_policies` — List all policies for the organization
- `get_org_policy` — Retrieve a policy by type
- `update_org_policy` — Update a policy

## Setup

```bash
npm install
npm run build
# Register in ~/.claude.json or project .claude.json (see below)
```

## .claude.json registration

```json
{
  "mcpServers": {
    "bitwarden-mcp": {
      "command": "node",
      "args": [
        "dist/index.js"
      ],
      "env": {
        "API_KEY": "<your-api-key>"
      }
    }
  }
}
```

## Auth

Set `API_KEY` (env var for stdio, `wrangler secret` for http) to your upstream API token.

## Re-generate

```bash
node ~/.claude/plugins/heymegabyte-claude-skills/bin/forge-skill-from-openapi.mjs \
  <spec-url> <output-dir> --name bitwarden-mcp --target mcp-server --transport stdio
```
