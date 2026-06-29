# Visual Companion Guide

Optional browser server for showing mockups, diagrams, and side-by-side options during brainstorming. Implementation lives in `scripts/` (server.cjs, helper.js, frame-template.html) — this guide covers what's non-obvious.

## When to use (per-question, not per-session)

Test: **would the user understand this better seen than read?**

- **Browser** — content that IS visual: UI mockups/wireframes, architecture diagrams, side-by-side layout/color comparisons, look-and-feel/spacing, state machines as diagrams.
- **Terminal** — content that is text: requirements/scope, conceptual A/B/C choices, tradeoff lists, API/data-model decisions, anything answered in words.

A question *about* a UI topic isn't automatically visual. "What kind of wizard?" → terminal. "Which wizard layout?" → browser.

## Start / stop

```bash
scripts/start-server.sh --project-dir /path/to/project --open   # start AFTER user approves
scripts/stop-server.sh $SESSION_DIR                              # stop
```

- Returns JSON with `port`, `url` (carries a `?key=…`), `screen_dir`, `state_dir` — save these. Also written to `$STATE_DIR/server-info` if you backgrounded it without capturing stdout.
- `--project-dir` persists mockups under `.superpowers/brainstorm/` and enables same-port restart; without it files go to `/tmp` and are cleaned on stop. Remind the user to gitignore `.superpowers/`.
- `--open` auto-opens the browser; still share the full `url` as fallback (headless/remote won't auto-open).

### Non-obvious gotchas

- **Always hand out the COMPLETE `url` including `?key=…`** — the server rejects keyless HTTP/WebSocket requests (gates stray tabs / other machines). After first load a cookie remembers it, so reloads and `/files/*` work without the query string.
- **Platform backgrounding** — Claude Code default works (script self-backgrounds). Windows/Codex auto-switch to foreground; Gemini/Copilot need `--foreground` + the platform's background-exec flag so the server survives across turns.
- **Remote/containerized unreachable URL** — bind non-loopback: `--host 0.0.0.0 --url-host localhost`.
- Server auto-exits after 4h idle (`--idle-timeout-minutes`).

## The loop

1. **Confirm server alive** before referring to the URL — `$STATE_DIR/server-info` exists, `$STATE_DIR/server-stopped` does not. If down, restart with the SAME `--project-dir` (reuses port; the user's tab reconnects from its "paused" overlay — no new URL needed).
2. **Write a fresh HTML file** to `screen_dir` — semantic name (`layout.html`), never reuse a filename, iterations get `-v2`. Use your file tool, never cat/heredoc. Server serves the newest by mtime.
3. **End your turn**: remind URL every step, one-line summary of what's on screen, ask them to respond in terminal (clicks optional).
4. **Next turn**: read `$STATE_DIR/events` (JSONL of clicks; cleared on each new screen; absent = no interaction) and merge with their terminal text — terminal is primary.
5. **Unload when leaving the browser** — push a `waiting.html` ("Continuing in terminal…") so they don't stare at a resolved choice.

## Writing content

- **Write content fragments, not full documents.** Anything not starting with `<!DOCTYPE`/`<html>` is auto-wrapped in the frame template (header, theme CSS, connection status, interactivity). Full docs only when you need total control.
- Markup the frame provides — selectable options/cards (`onclick="toggleSelect(this)"`, `data-choice`, `data-multiselect`), `.mockup` / `.split` / `.cards`, `.pros-cons`, mock wireframe elements (`.mock-nav`/`.mock-sidebar`/`.mock-content`/`.mock-button`/`.mock-input`/`.placeholder`), typography (`h2`/`h3`/`.subtitle`/`.section`/`.label`). Full reference: `scripts/frame-template.html`.

## Design tips

- 2-4 options max per screen; scale fidelity to the question (wireframe for layout, polish for polish).
- State the question on every page ("Which feels more professional?" not "Pick one").
- Real content where it matters (real Unsplash images for a photo portfolio) — placeholders hide design issues.
