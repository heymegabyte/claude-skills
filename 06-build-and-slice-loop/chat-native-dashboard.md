---
name: "Chat-Native Dashboard"
version: "2.0.0"
updated: "2026-04-23"
description: "ChatGPT-style three-column layout as primary interface for all service apps. Login=dashboard with blur overlay. Chat is the operating system — every feature accessible through conversation + inline widgets. CF Agents SDK AIChatAgent for stateful sessions."
---

# Chat-Native Dashboard Pattern

## Architecture

- Three-column layout
  - **Left** — thread history + data editor
  - **Center** — chat with inline widgets
  - **Right** — contextual panel (phone/status/settings)
- Auth overlay = same page with `backdrop-filter: blur(12px)` over dashboard, not a separate route
- `/login` → redirect to `/dashboard`

## Widget System

- Chat messages carry `widget` and `widgetData` fields
- Template uses `@if (msg.widget === 'type')` to render inline interactive components

### Core widgets

- `ssn-auth`, `voice-biometric`, `upload`
- `status-cards`, `quick-actions`
- `video-player`, `application-video`
- `timeline`, `progress`, `confirm`
- `data-view`, `form-wizard`, `document-checklist`
- `notification`, `progress-bar`
- `profile-completion`, `program-card`, `settings`

Every AI response includes contextual action buttons via `buttons[]` array.

## Command Palette (Cmd+K)

- Linear/Notion-style Cmd+K palette
- Fuzzy search across all commands — apply | upload | status | profile | call | notifications | settings | signout
- Keyboard shortcut `Meta+K` toggles
- Styled as glass modal centered at 20vh from top

### Focus contract

- Cmd+K opens AND focuses the chat/palette input on the same frame — caret blinking, ready to type
- `autofocus` attr + `requestAnimationFrame(()=>inputRef.current?.focus({preventScroll:true}))` after open-state flip
- Re-press while open = re-focus + `select()` existing text
- Esc returns focus to trigger
- Build-gated by Playwright `await expect(input).toBeFocused()` after `keyboard.press('Meta+K')`

## Notification System

- Bell icon in header with unread badge
- Dropdown shows time-ordered notifications with read/unread state
- Mark-all-read
- Click notification triggers action
- Notifications generated from — application status changes, document processing, profile completion prompts

## Auth Flow

1. Anonymous
2. SSN entry (overlay)
3. Voice biometric (overlay)
4. Authenticated (blur dissolves)

- **SSN** — AES-256-GCM encrypted, font-mono tracking-wide centered input
- **Voice** — 5-second recording, animated pulse rings, processing spinner, green checkmark on success
- **Skip option** for anonymous browsing

## Data Management

- "Your Data" slides over left sidebar as overlay panel
- All fields needed for government form submissions — `name`, `dob`, `gender`, `phone`, `email`, `address`, `county`, `household`, `income`, `homeless`, `disabled`, `blind`, `deaf`, `veteran`, `children`, `language`
- Save to backend API
- Submission videos listed below profile fields with play buttons

## Real-Time Features

- **Phone panel** — Twilio Voice SDK v2 WebRTC
- Live transcript in right sidebar
- Call duration timer
- Drag-and-drop file upload anywhere on chat window
- Upload progress bar with animation
- Thread history persisted to sessionStorage (future — backend)

## Key Principles

1. Chat = primary interface. Phone calls and web forms are secondary access methods.
2. Every feature is a chat widget. Status checks, file uploads, form reviews — all inline.
3. Auth is a layer, not a page. Dashboard always visible behind blur.
4. Mobile-responsive — sidebars become slide-out drawers with backdrop overlays.
5. Evidence-first — every form submission generates video + screenshots accessible from chat.
