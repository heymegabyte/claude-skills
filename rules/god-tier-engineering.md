# God-Tier Engineering Patterns (***SUPREME — apply at every step, every iteration***)

The principle: every iteration must ship at least one move a senior engineer would call "actually that's the right call" — not just feature-completeness. Code that merely works is the floor. Code that makes the next iteration faster, the next bug rarer, the next handoff cleaner — that's the goal.

This rule captures the patterns validated in production across projectsites.dev (2026-05) and other emdash projects. Default-load on every prompt.

## The 10 patterns we keep reaching for

### 1. Cross-iframe pointer sync via RAF-throttled postMessage
**Rule**: when embedding any iframe, the parent's cursor follower (or any pointer-driven UI) MUST keep tracking when the user enters the iframe. Iframes capture mouseevents from the parent by default.
**Why**: jarring "the cursor disappears" UX is a giveaway that the embed isn't a first-class part of the app.
**How**: in the child, `pointermove` → `requestAnimationFrame` → `parent.postMessage({type:'PS_CURSOR', x, y, hover}, PARENT_ORIGIN)`. In the parent, listener translates iframe-viewport coords to parent-viewport via `iframe.getBoundingClientRect()`.
**Reference**: `app/root.tsx` + `apps/project-sites/frontend/src/app/app.component.ts` (projectsites.dev 2026-05-24).

### 2. Master/detail accordion via AG Grid Community `fullWidthCellRenderer`
**Rule**: never pay for AG Grid Enterprise when Community's `isFullWidthRow` + `fullWidthCellRenderer` + synthetic detail rows give you the same UX.
**Why**: Enterprise license is $999+/dev/yr. Community can do everything except virtual scrolling pivot tables.
**How**: insert a synthetic row with `_isDetail: true` after the master row; tell the grid that row is full-width; `getRowHeight` returns the expanded height. Click handler toggles via signal.
**Reference**: `apps/project-sites/frontend/src/app/pages/admin/sections/ai-logs.component.ts` + `audit.component.ts`.

### 3. Signal-driven `effect()` + `afterNextRender` for DOM teleport
**Rule**: never use `MutationObserver` to drive imperative DOM moves of elements you control via a framework. The observer fires on YOUR mutation → infinite loop.
**Why**: classic recursion trap — every fix to "stop the loop" reintroduces it under different conditions.
**How**: drive teleport from an Angular signal `effect()` (or React equivalent). On `open()` true, schedule `afterNextRender` to move the element. On false, remove it. One render per state transition. No observer.
**Reference**: `apps/project-sites/frontend/src/app/components/fullscreen-overlay/fullscreen-overlay.component.ts` (incident 2026-05-24 — observer infinite loop froze entire app when user clicked "Edit Prompt").

### 4. Synthetic placeholder-string test
**Rule**: when a runtime contract depends on a string (e.g. MutationObserver waits for "Build a professional website for…"), ship a Playwright spec that fails the build if the string disappears upstream.
**Why**: upstream merges rename copy without considering downstream consumers. Without the test, the editor's loading veil silently never dismisses.
**How**: `e2e/{contract-name}.spec.ts` → goto, wait for selector or text, fail with a clear message naming the contract.
**Reference**: `apps/project-sites/e2e/bolt-chat-ready.spec.ts` (2026-05-24).

### 5. Per-instance brand-tokens override layer at end of cascade
**Rule**: when re-branding an embedded third-party app (bolt.diy → projectsites brand), override CSS variables in a LAST-LAYER `@layer` block. Never touch component HTML/CSS directly.
**Why**: keeps upstream merges clean. The override is one file you maintain; everything else flows through unchanged.
**How**: `app/styles/index.scss` (or equivalent) ends with a `:root, :root[data-theme='dark']` block remapping every `--vendor-*` variable to `--ps-*` brand tokens. Plus a brand-font `@import url(...)` and selection/scrollbar/focus-ring overrides scoped to the embedded surface.
**Reference**: `/Users/Apple/emdash/repositories/projectsites.dev/app/styles/index.scss` — 360-line override layer rebranded bolt.diy in one file (no upstream forks).

### 6. Computed-signal as event listener
**Rule**: in Angular signals (or any signal-reactive system), `computed()` IS your event listener. Stop wiring `subscribe()` or `valueChanges`.
**Why**: every signal mutation auto-triggers the computed re-eval; the framework's change detection IS the event bus. Less ceremony, no leaked subscriptions.
**How**: instead of `this.filterField.valueChanges.subscribe(...)`, declare `showChip = computed(() => this.scopeSlug() === this.initialScopeSlug)` and gate the template `@if (showChip())`. Updates on every signal write.
**Reference**: `apps/project-sites/frontend/src/app/pages/admin/sections/audit.component.ts` — scope chip auto-removes on any filter change.

### 7. Worker-side encrypted env blob via AES-GCM + per-record IV
**Rule**: any secret a user supplies (API keys, OAuth tokens, third-party creds) MUST be encrypted at rest in D1 via per-record IV + a single account-level master key.
**Why**: a future D1 leak with cleartext credentials is a P0. Encrypted-at-rest with key-rotation support is the only safe pattern.
**How**: `crypto.subtle.importKey('raw', base64Decode(env.MCP_ENCRYPTION_KEY), 'AES-GCM', false, ['encrypt','decrypt'])`. Generate fresh 12-byte IV per write. Store `{ciphertext, iv}` base64.
**Reference**: `apps/project-sites/src/services/ai_crypto.ts` — used by `cf_credentials.ts`, `mcp_oauth.ts`, `app_provisioner.ts`.

### 8. Container DO with auto-restart 3/min + idle 30m hibernation + ring-buffer logs
**Rule**: every Container DO MUST cap auto-restart at 3 per rolling minute, idle-hibernate after 30min of no requests, and persist the last 1000 log lines in a SQLite ring buffer.
**Why**: prevents crash loops from burning compute, saves $$$ during off-hours, and gives operators forensic logs without a separate log infra.
**How**: parent `Container` class exposes `sleepAfter = '30m'` + `onError` hook. Custom subclass adds `restart_count` in SQLite, checks the rolling window before restarting. Ring buffer is `INSERT + DELETE WHERE id NOT IN (last 1000)`.
**Reference**: `apps/project-sites/src/durable_objects/app_runtime.ts`.

### 9. Browser Rendering REST API > Browser binding
**Rule**: when you need a headless browser, reach for Cloudflare's Browser Rendering REST API (`/screenshot`, `/content`, `/snapshot`, `/scrape`) before the binding-based npm package.
**Why**: saves an npm dep, a wrangler binding declaration, and a redeploy. REST endpoint runs against your account credentials only.
**How**: `fetch('https://api.cloudflare.com/client/v4/accounts/{id}/browser-rendering/screenshot', { method:'POST', headers:{'X-Auth-Email','X-Auth-Key','Content-Type:application/json'}, body: JSON.stringify({url, viewport:{width:1920,height:1080}}) })`. Returns the PNG body directly.
**Reference**: `apps/project-sites/src/workflows/snapshot-quality.ts`.

### 10. Regression test for "this model alias must keep existing"
**Rule**: when you depend on a third-party model identifier (Workers AI, OpenAI, Anthropic), ship a unit test that greps the codebase + the provider's API for the alias, fails if either side changes.
**Why**: model retirements silently 400 in production. Test catches it in CI before the regression ships.
**How**: a Vitest spec walks `src/` recursively, grep for the model literal, asserts every match is on an allowlist. Pair with an account-level `GET /accounts/{id}/ai/models` snapshot test to detect deprecated models.
**Reference**: `apps/project-sites/src/__tests__/workers-ai-model-names.test.ts` (incident 2026-05-24 — entire AI chat was returning "service unavailable" because Workers AI retired the bare `@cf/meta/llama-3.3-70b-instruct` alias on our account).

---

## Anti-patterns we ate this turn (don't repeat)

- **BSD `sed -i ''` with `\b` word-boundary** silently matches NOTHING. The substitution looks like it succeeded but no file actually changed. Use Python regex with `(?![A-Za-z0-9_-])` negative-lookahead instead. (2026-05-24: 18 source files reported "patched" by sed but production was still broken; a 30-min mystery until I greppped for the literal.)

- **Backticks inside CSS comments** inside an Angular `styles: [` template literal close the string. The TypeScript parser then sees `state-pretty + .empty-glyph + .glow-h-grad` as bare identifiers and throws `Cannot find name 'state'`. Replace ` `` ` chars in CSS comments with plain text. (2026-05-24 — recurred 3× this session.)

- **`aria-label="{{ }}"` in Angular templates** isn't binding — Angular parses the attribute as a literal string and the build fails with "Can't bind to 'aria-label' since it isn't a known property". Use `[attr.aria-label]="expr"` for any computed aria value. (2026-05-24 — bit me 3 places.)

- **`MutationObserver` watching an element subtree where you ALSO move children programmatically**: classic infinite loop. The observer fires on your own mutation, your handler re-mutates, observer re-fires. Drive from signals + `afterNextRender` instead. (2026-05-24 — froze the entire admin app the first time a fullscreen overlay opened.)

- **`opacity: 0` as a CSS default with NO sibling rule flipping it to `1`**: if you remove the JS binding that was setting `[class.opacity-100]`, the element renders invisible. Always pair: either default `opacity: 1` OR ensure the visibility class sets `opacity: 1` directly inside the same selector. (2026-05-24 — bolt.diy iframe was rendered but visually empty after I removed the editor-ready gate.)

- **`iframe.allow="..."` missing `microphone`** blocks `getUserMedia({audio:true})` inside the iframe even if the worker's Permissions-Policy header allows it. Both gates must allow. (2026-05-24 — Whisper voice input silently failed for 24h until reported.)

- **CFC `*.app.projectsites.dev` wildcard** needs Cloudflare Advanced Certificate Manager (paid line item) because the Universal SSL cert only covers `*.projectsites.dev` single-level. Either use a single-dash pattern (`-app.projectsites.dev`) OR provision ACM up-front. (2026-05-24 — Apps tab launched without DNS, sites stuck in "booting" forever.)

---

## How to apply

- Read this rule before starting any iteration. Pick at least ONE pattern that applies to the current task.
- When you ship a new pattern that proves valuable across ≥2 projects, append it to the "10 patterns" list above (cap at 20; rotate the weakest out).
- When an anti-pattern bites you a second time, append it to the "Anti-patterns" block.
- Cross-reference from PR descriptions when applicable.

## See
- [[always]] — universal must-have surfaces (the floor)
- [[brian-preferences]] — communication + style
- [[verification-loop]] — deploy + E2E mandate (the safety net)
- [[monitor-orchestration]] — multi-faceted brief decomposition
- [[supreme-polish]] — 100-ideas audit pass
- [[cinematic-ui-patterns]] — rolling-counter + appReveal + before-after slider primitives
