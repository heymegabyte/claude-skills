---
name: "god-tier-engineering"
priority: 3
pack: "core"
triggers: []
paths:
  - "*"
---

# God-Tier Engineering Patterns

Every iteration ships ≥1 move a senior would call "right call." Code that works = floor. Code that makes next iteration faster, next bug rarer, next handoff cleaner = goal.

## The 10 patterns

### 1. Cross-iframe pointer sync via RAF-throttled postMessage

Parent's cursor follower keeps tracking inside iframe via `pointermove` → `requestAnimationFrame` → `parent.postMessage({type:'PS_CURSOR', x, y, hover}, PARENT_ORIGIN)`. Parent translates iframe-viewport coords via `iframe.getBoundingClientRect()`.

### 2. Master/detail accordion via AG Grid Community `fullWidthCellRenderer`

Never pay for AG Grid Enterprise. Insert synthetic row w/ `_isDetail: true` after master; `isFullWidthRow` + `fullWidthCellRenderer` + `getRowHeight` toggles via signal.

### 3. Signal-driven `effect()` + `afterNextRender` for DOM teleport

Drive teleport from Angular signal `effect()`, NEVER `MutationObserver` on subtree you also mutate (infinite loop trap). On open→`afterNextRender` to move element; on close→remove. One render per state transition.

### 4. Synthetic placeholder-string test

String-based runtime contract (e.g., MutationObserver waiting for "Build a professional website for…") gets `e2e/{contract-name}.spec.ts` that fails build if string disappears upstream.

### 5. Per-instance brand-tokens override layer at end of cascade

Rebrand embedded third-party app via last-`@layer` `:root, :root[data-theme='dark']` block remapping every `--vendor-*` to `--brand-*`. Plus brand-font import + selection/scrollbar/focus-ring overrides scoped to embed.

### 6. Computed-signal as event listener

`computed()` IS the event listener. Stop wiring `subscribe()` / `valueChanges`. `showChip = computed(() => this.scopeSlug() === this.initialScopeSlug)` + template `@if (showChip())`.

### 7. Worker-side encrypted env blob via AES-GCM + per-record IV

User-supplied secrets in D1: `crypto.subtle.importKey('raw', base64Decode(env.MCP_ENCRYPTION_KEY), 'AES-GCM', false, ['encrypt','decrypt'])`. Fresh 12-byte IV per write. Store `{ciphertext, iv}` base64.

### 8. Container DO w/ auto-restart 3/min + idle 30m hibernation + ring-buffer logs

Every Container DO caps restart at 3/rolling-minute, idle-hibernates after 30min, persists last 1000 log lines in SQLite ring buffer. Parent `Container` exposes `sleepAfter = '30m'`. Custom subclass adds `restart_count` + rolling-window check.

### 9. Browser Rendering REST API > Browser binding

Reach for CF's REST API (`/screenshot`, `/content`, `/snapshot`, `/scrape`) before binding-based npm package. Saves npm dep + binding declaration + redeploy. `fetch('https://api.cloudflare.com/client/v4/accounts/{id}/browser-rendering/screenshot', { method:'POST', headers: {...}, body: JSON.stringify({url, viewport:{width:1920,height:1080}}) })`.

### 10. Regression test for "this model alias must keep existing"

Vitest spec walks `src/` recursively, greps model literal, asserts every match is on allowlist. Pair w/ account-level `GET /accounts/{id}/ai/models` snapshot test.

## Anti-patterns (don't repeat)

- **BSD `sed -i ''` with `\b`** silently matches NOTHING. Use Python `(?![A-Za-z0-9_-])` negative-lookahead.
- **Backticks inside CSS comments** inside Angular `styles: [` template literal close the string. Replace `` ` `` chars in CSS comments w/ plain text.
- **`aria-label="{{ }}"` in Angular** parses as literal string. Use `[attr.aria-label]="expr"`.
- **`MutationObserver` watching subtree you mutate** = infinite loop. Drive from signals + `afterNextRender`.
- **`opacity: 0` default w/ NO sibling rule flipping to `1`** renders invisible.
- **`iframe.allow="..."` missing `microphone`** blocks `getUserMedia({audio:true})` even if Permissions-Policy allows.
- **CFC `*.app.projectsites.dev` wildcard** needs Advanced Certificate Manager (paid). Use single-dash (`-app.projectsites.dev`) OR provision ACM up-front.

## How to apply

- Read this rule before any iteration. Pick ≥1 pattern that applies.
- Ship new pattern across ≥2 projects → append to "10 patterns" (cap 20; rotate weakest out).
- Anti-pattern bites twice → append to "Anti-patterns".
- Cross-reference in PR descriptions when applicable.
