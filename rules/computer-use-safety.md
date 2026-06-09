---
name: "computer-use-safety"
priority: 2
pack: "infra"
triggers:
  - "computer use"
  - "desktop control"
  - "screen"
paths:
  - "*"
---

# Computer Use

## Efficiency priority (pick fastest path — ALL tiers fully authorized)

1. Dedicated MCP
2. Playwright MCP
3. Chrome MCP
4. Computer Use

## Access tiers (system defaults — work within them creatively)

- **Browsers** — read tier (screenshot + observe; use Chrome MCP for interaction)
- **Terminals / IDEs** — click tier (click OK; use Bash tool for typing)
- **Everything else** — full tier
- Full control over all applications

## ToolSearch bulk-load

- When computer-use tools are deferred, load ALL at once: `{ query: "computer-use", max_results: 30 }`
- Never load individual tools one by one

## Protocol

- Screenshot before acting
- Chain batch actions via `computer_batch` for efficiency
- Unexpected dialog: assess → handle → continue
- Verify state after multi-step sequences

## Reality check — when desktop Computer Use is the wrong tool

Even with the user's REAL Chrome and live sessions, desktop Computer Use breaks down when ANY of these apply. Pre-check before starting a multi-vendor flow:

- **Active chat client** (Emdash / Claude Desktop / terminal in foreground) intercepts keystrokes — `cmd+l` `type` `Return` lands in chat instead of Chrome's omnibox. Verified incident 2026-05-26: Twilio URL typed during projectsites.dev provisioning landed in Emdash chat buffer twice in a row despite intermediate dock-click focus
- **Vendor 2FA walls** (Mailchimp Authenticator, Stripe mobile-device verification, Twilio 2FA, GCP SSO) require the user's phone or hardware key. Computer Use cannot complete these. Each provider that gates on TOTP/biometric = blocker
- **Page-unload modals** intercept navigation (Stripe "Complete verification on your mobile device" fires on any away-nav from Connect dashboard — Escape doesn't dismiss, only mobile completion does)
- **Multi-vendor batches** compound the failure rate — each provider's 2FA + each focus shift = exponential drop in autonomous-completion probability

When ≥2 of these apply, switch to **paste-collaboration**: generate a tight bulleted list of `{secret_name} ← {vendor_console_URL} ({how_to_locate_value})`, ask the user to paste values back in one message. Per-secret wall-time: 30 sec. Strictly faster than driving the browser at any 2FA-gated vendor.

## Focus discipline

- Keyboard events (`key`, `type`, `cmd+l`, `cmd+t`, `Return`) target the CURRENTLY-FOCUSED window, NOT the window in the last screenshot
- Brian's chat client (Emdash / Claude Desktop / terminal) and his Chrome window are separate windows; my screenshot can show one while keystrokes route to the other
- **Reliable focus-grab (proven 2026-05-26 on the Unsplash provisioning flow)**: shell out to osascript before any keystroke batch

  ```bash
  osascript <<'EOF'
  tell application "Google Chrome"
    activate
    set index of window 1 to 1
  end tell
  tell application "System Events"
    set frontmost of process "Google Chrome" to true
  end tell
  EOF
  ```

  Dock-click alone is unreliable when Emdash is set as always-on-top or has captured a keyboard hook; the AppleScript double-tap (Chrome activate + System Events frontmost) reliably wins focus
- BEFORE sending any keystroke meant for a webpage: force-focus via the osascript snippet above, then screenshot to VERIFY focus before any `cmd+l` / `type` / `Return` sequence
- After EVERY `cmd+l` or address-bar type, screenshot before pressing Return — confirm the URL landed in Chrome's omnibox, not the chat app
- **Reading values from form fields**: prefer click-into-field → `cmd+a` → `cmd+c` → `pbpaste` over OCR'ing the screenshot. The Unsplash access-key extraction (2026-05-26) confirmed pbpaste delivers the exact string while screenshot OCR risks character drift (1/l, 0/O, -/_ confusion)
- Reference incident (2026-05-26, projectsites.dev): typed `https://console.twilio.com/...` after a `cmd+l` while Brian's Emdash chat had focus — URL string + control chars appeared garbled in the chat window, polluting his prompt buffer. Sole prevention: osascript force-focus + screenshot-verify before every keystroke batch.

## Links

- Never click web links with computer-use — use Chrome MCP or WebFetch
- Computer Use is for native-only apps: Finder, System Settings, Preview, Notes, Photos
- **EXCEPTION — session-bound browser flows**: when a task requires the user's REAL browser session (logged-in vendor dashboards: HubSpot/Mailchimp/Stripe/GCP/Twilio/Vercel/AWS console), Chrome MCP + Playwright MCP both spawn FRESH isolated Chromium with zero cookies — they CANNOT complete the task. Desktop Computer Use is the ONLY tool that drives the user's actual Chrome with live sessions. When the user says "Use Computer Use" for OAuth-app registration / vendor-dashboard work, they ALWAYS mean `mcp__desktop-control__computer`, never Chrome MCP. The efficiency-priority list above ranks by speed for stateless work; for session-bound work, Desktop Computer Use is the ONLY path. Cross-link: `secret-auto-provisioning` § Tier 3.

## Creative use

- Automate repetitive GUI tasks
- Fill forms
- Configure app settings
- Manage windows
- Trigger builds
- Cross-app workflows
- Anything that advances the goal
