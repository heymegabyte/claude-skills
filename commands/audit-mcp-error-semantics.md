---
description: Catch Resend-class bug (isError: false on HTTP 4xx/5xx) across all MCP server tool handlers
argument-hint: [--server=<name>] [--fix]
---

<!-- <SUBAGENT-STOP>: skip this skill when running inside a subagent. Meta-skills must not leak into spawned subagent contexts. -->
<SUBAGENT-STOP/>

Audit every MCP server tool handler for the silent-failure anti-pattern: `fetch()` calls that return HTTP 4xx/5xx but still resolve `isError: false`, so Claude reads a garbage success instead of a typed error. Catches the Resend-class bug. [[mcp-error-semantics]] [[mcp-server-hardening]] [[verification-loop]]

**When to use** — after adding a new MCP server; after any fetch-heavy handler ships; before a load-bearing session; CI gate (wire as pre-deploy check).

**Inputs**

- `--server=<name>` — audit only the named server directory under `~/.claude/mcp-servers/`
- `--fix` — rewrite each violation in-place using the `mcpHttpError` helper (shows diff preview, writes after confirmation)

---

## Step 1 — Discover server source files

Glob in order of precedence:

```
~/.claude/mcp-servers/*/mcp-server/src/index.ts
~/.claude/mcp-servers/*/src/index.ts
~/.claude/mcp-servers/*/index.ts
```

Apply `--server=<name>` filter if provided (match the directory one level below `mcp-servers/`).

If no files found, emit:

```
No MCP server source trees found under ~/.claude/mcp-servers/
Nothing to audit.
```

Exit 0.

Also read the helper reference — do not fail if absent:

```
~/.claude/mcp-servers/template/utils/mcp-error-response.ts
```

If that file exists, capture the exported function signature (name, parameters, return type) for use in `--fix` mode rewrites.

---

## Step 2 — Parse tool handlers for fetch calls

For each source file, extract **tool handler functions** — the callback body passed to `server.tool(...)`, `server.addTool(...)`, or `tool(...)`.

Within each handler body, locate every `fetch(` call. For each `fetch` call, capture:

- The variable the result is bound to (e.g. `const res = await fetch(...)` → variable is `res`)
- All subsequent `return { ... }` statements that reference `content:` (MCP response shape)
- Whether an `ok` check appears between the `fetch` call and each `return` (patterns: `res.ok`, `response.ok`, `!res.ok`, `res.status`, `if (res.status`)

---

## Step 3 — Detect anti-patterns

**Anti-pattern A — Missing ok check:** `fetch()` result bound to a variable, followed by a `return { content: [...] }` with no `res.ok` guard on any code path between them.

**Anti-pattern B — Unconditional isError: false:** Handler that always returns `{ isError: false }` (or omits `isError` which defaults false) regardless of HTTP status. Catch with regex:

```
return \{[^}]*content:[^}]*\}
```

where no `isError: true` branch exists in the same function scope.

**Anti-pattern C — Swallowed status in text:** Handler that reads `await res.text()` or `await res.json()` and returns the body as content text regardless of `res.ok`. The HTTP error message becomes Claude's "success" response.

For each hit, record:

```
{
  server: string          // directory name
  file: string            // absolute path
  line: number            // line of the return statement (not the fetch call)
  fetch_line: number      // line of the fetch() call
  pattern: 'A' | 'B' | 'C'
  snippet: string         // 3-line context around the return
}
```

---

## Step 4 — Output per-server violation table

Print a table grouped by server:

```
Server: resend-mcp  (src: ~/.claude/mcp-servers/resend-mcp/mcp-server/src/index.ts)
────────────────────────────────────────────────────────────────────────
 #  Pattern  Line   Fetch@  Violation
 1  A        L142   L138    return { content } with no res.ok guard
 2  C        L201   L197    await res.text() returned as content regardless of status
────────────────────────────────────────────────────────────────────────
2 violations

Server: stripe-mcp  (src: ~/.claude/mcp-servers/stripe-mcp/src/index.ts)
────────────────────────────────────────────────────────────────────────
 #  Pattern  Line   Fetch@  Violation
 1  A        L89    L85     return { content } with no res.ok guard
────────────────────────────────────────────────────────────────────────
1 violation

SUMMARY
  Servers audited : 8
  Servers clean   : 6
  Total violations: 3
```

If zero violations found, print:

```
All MCP server tool handlers check res.ok before returning content.
No error-semantics violations found.
```

Exit 0 either way.

---

## Step 5 — Diff preview per violation

For each violation, print a before/after diff block (even without `--fix`):

```diff
// ~/.claude/mcp-servers/resend-mcp/mcp-server/src/index.ts  L138-L145

-  const res = await fetch(url, opts)
-  const body = await res.json()
-  return { content: [{ type: 'text', text: JSON.stringify(body) }] }

+  const res = await fetch(url, opts)
+  if (!res.ok) return mcpHttpError(res.status, await res.text())
+  const body = await res.json()
+  return { content: [{ type: 'text', text: JSON.stringify(body) }] }
```

If `template/utils/mcp-error-response.ts` was not found, use this inline fallback in diffs:

```typescript
// inline fallback — copy to a shared utils file and import
function mcpHttpError(status: number, body: string) {
  return {
    isError: true,
    content: [{ type: 'text' as const, text: `HTTP ${status}: ${body}` }],
  }
}
```

---

## Step 6 — `--fix` mode rewrites

Only runs when `--fix` is passed.

For each violation:

1. Show the diff from Step 5.
2. Ask: `Apply fix to <file>:<line>? [y/N]`
3. On `y`:
   - If `mcpHttpError` is importable from the template util, add the import at the top of the file (deduplicated).
   - Insert the `if (!res.ok) return mcpHttpError(...)` guard immediately after the `fetch` await on `fetch_line + 1`.
   - If the body is already consumed before the guard can be inserted (`await res.json()` before the check), restructure to: `const raw = await res.text(); if (!res.ok) return mcpHttpError(res.status, raw); const body = JSON.parse(raw)`.
4. After each write, re-read the modified lines and print confirmation: `Fixed: <file>:<line>`.

After all fixes applied, print:

```
Fixed N violations across M servers.
Re-run /audit-mcp-error-semantics to confirm zero violations.
```

Do NOT run the audit again automatically — leave confirmation to the user.

---

## Notes for the executor

- Parse TypeScript source as text (regex + line-count), not via AST compilation. Tolerate syntax edge cases gracefully; when uncertain, flag as `needs-manual-review` rather than emitting a false positive.
- Multi-fetch handlers (multiple `fetch` calls in one tool): audit each independently. A handler with one guarded fetch and one unguarded fetch still has a violation.
- `--fix` is irreversible on disk; the diff preview in Step 5 is the user's only review gate before writing.
- Weekly CI candidate: wire as `node scripts/audit-mcp-error-semantics.js --ci` that exits 1 on any violation count > 0.
