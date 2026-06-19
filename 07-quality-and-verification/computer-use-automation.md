---
name: "Computer Use Automation"
description: "Desktop automation via Anthropic Computer Use MCP. Native macOS app control, visual QA workflows, screenshot-verify loops, cross-app orchestration. Teaches Claude when and how to use Computer Use vs dedicated MCPs."
updated: "2026-04-23"
allowed-tools: "mcp__computer-use__*, Read, Bash"
---

# Computer Use Automation

## Tool Selection Hierarchy (MANDATORY)

Priority order — use the first that fits:

1. **Dedicated MCP** — app has its own MCP (Slack, Gmail, Stripe, GitHub, etc.) — fastest
2. **Chrome MCP** — web app, no dedicated MCP — fast
3. **Playwright MCP** — web testing, form filling, screenshots — fast
4. **Computer Use** — native macOS apps, cross-app workflows, visual QA — slow

Never use Computer Use when a faster tool exists — it is the last resort for web tasks.

## Tiered Access Model

### Browsers (Chrome, Safari, Arc) — **read** tier

- Can: see screenshots
- Cannot: click, type, scroll

### Terminals / IDEs (VS Code, iTerm) — **click** tier

- Can: click buttons, scroll
- Cannot: type, right-click, drag

### Everything else — **full** tier

- All actions available

### Implications

- Web tasks → Chrome MCP or Playwright MCP
- Terminal commands → Bash tool
- IDE editing → Edit/Write tools
- Native apps (Finder, System Settings, Photos, Maps, Notes, Preview, Keynote) → Computer Use full-tier

## Core Workflow: Screenshot-Verify-Act Loop

1. `request_access` → list apps needed
2. `screenshot` → understand current state
3. Plan actions
4. Execute one action at a time
5. `screenshot` → verify action succeeded
6. Repeat or report

- Take a fresh screenshot before every action sequence — never assume screen state
- Execute one action, verify, then proceed — no blind chaining
- On unexpected dialog/popup: screenshot → dismiss (Escape/Cancel) → re-screenshot → resume

## App-Specific Playbooks

### Finder (File Management)

- **Purpose:** Move, rename, organize files when visual verification is needed
- **Access:** Full tier
- `open_application "Finder"` → `left_click` sidebar items to navigate → `right_click` for context menu → `Space` for Quick Look → `Enter` to rename
- Prefer Bash for simple file ops; use Finder only when visual verification is needed

### System Settings (macOS Configuration)

- **Purpose:** Change system preferences, network settings, display configs
- **Access:** Full tier
- `open_application "System Settings"` → `left_click` sidebar categories → `left_click` toggles → `triple_click` text fields to replace

### Preview (PDF/Image Inspection)

- **Purpose:** View PDFs, inspect images, visual verification of generated assets
- **Access:** Full tier
- `open_application "Preview"` with file path → zoom `cmd+=`/`cmd+-` → pages `cmd+right`/`cmd+left` → annotations `cmd+shift+a`

### Notes (Quick Documentation)

- **Purpose:** Read/write Apple Notes for personal context
- **Access:** Full tier
- `open_application "Notes"` → new note `cmd+n` → search `cmd+f` → bold `cmd+b` / italic `cmd+i`

### Maps (Location Verification)

- **Purpose:** Verify addresses, check distances, screenshot maps for content
- **Access:** Full tier
- `open_application "Maps"` → click search bar, type address → screenshot for content embedding

### Keynote / Pages

- Use sparingly — prefer generating HTML/PDF via code unless native format required

## Visual QA Workflow (Primary Use Case)

Computer Use handles visual QA that Playwright cannot:

- Native macOS dialogs and alerts
- System-level notifications
- Font rendering at subpixel level
- Color accuracy on actual display
- Cross-app clipboard operations
- File download verification in Finder
- Print preview layouts
- macOS accessibility features (VoiceOver behavior)

### Visual QA Protocol

1. Deploy site
2. Use Playwright for web content screenshots
3. Use Computer Use for: downloaded files in Finder, system notifications, native share sheet, PWA install behavior, print layout (File > Print > Preview), clipboard paste into native apps

## Cross-App Workflows

### Copy from Web App to Native App

1. Chrome MCP → navigate to source page and copy content
2. Computer Use → open target native app
3. Computer Use → paste (`cmd+v`) → screenshot to verify

### Screenshot-Based Content Pipeline

1. Computer Use → screenshot native app state
2. Read tool → view screenshot
3. AI vision → analyze content
4. Implement with appropriate tool

## Security Rules (NON-NEGOTIABLE)

1. Never click web links via Computer Use — use Chrome MCP
2. Never type passwords into apps via Computer Use
3. Never execute financial transactions (trades, transfers, purchases)
4. Always verify URLs before opening — hover first, check domain
5. Suspicious links from email/messages — ask user before proceeding
6. Never grant access to apps not needed for the current task
7. Private network URLs (localhost, 10.x, 192.168.x) — ask before accessing

## Batch Operations

Use `computer_batch` to reduce round-trips when actions are predictable:

```json
{
  "actions": [
    {"type": "screenshot"},
    {"type": "left_click", "x": 100, "y": 200},
    {"type": "wait", "duration": 500},
    {"type": "screenshot"}
  ]
}
```

## MCP Tool Reference

- `screenshot` — capture current screen state
- `left_click` — click at coordinates
- `right_click` — context menu (full-tier apps only)
- `double_click` — open files, select words
- `type` — type text (full-tier apps only)
- `key` — press keyboard shortcut
- `scroll` — scroll up/down
- `left_click_drag` — drag operations
- `open_application` — launch/focus an app
- `cursor_position` — get current cursor location
- `computer_batch` — multiple actions in sequence
- `request_access` — request permission for apps
- `list_granted_applications` — check current permissions
- `read_clipboard` — read clipboard contents
- `write_clipboard` — set clipboard contents
- `hold_key` — hold modifier key during action
- `switch_display` — switch between monitors

## What This Skill Owns

- Desktop automation decision-making (when to use Computer Use vs alternatives)
- Native macOS app control patterns
- Visual QA workflows beyond Playwright's reach
- Cross-app orchestration
- Computer Use security enforcement
