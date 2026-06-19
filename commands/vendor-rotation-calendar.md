---
description: Generate a quarterly vendor secret-rotation calendar for all load-bearing vendors; emit .ics + ROTATIONS-DUE-NEXT-30-DAYS table; optionally create Google Calendar events
argument-hint: [--project-dir <path>] [--gcal] [--out <path/to/output.ics>]
---

<!-- <SUBAGENT-STOP>: skip this skill when running inside a subagent. Meta-skills must not leak into spawned subagent contexts. -->
<SUBAGENT-STOP/>

Generate a quarterly rotation calendar for every load-bearing vendor per [[vendor-risk-tiering]].

**Purpose** — make secret-rotation dates visible, durable, and actionable. A vendor secret that expired silently is a P0 incident. Calendar events block the date before the key expires.

**When to use** — after onboarding a new load-bearing vendor; quarterly rotation reminder; after running `/audit-mcp-fleet` to pick up rotation-due MCP servers; on demand.

**Inputs**

- `--project-dir <path>` — path to a project dir containing `_research.json`; defaults to cwd
- `--gcal` — after emitting the .ics, call the Google Calendar MCP to create events directly in the primary calendar
- `--out <path>` — write the .ics file to this path; defaults to `~/vendor-rotation-calendar.ics`

---

## Step 1 — Load vendor sources

Collect load-bearing vendors from two places in parallel:

**A. MCP registry** (`~/.claude/mcp-registry.json`)

- If the file does not exist, skip this source (no error — registry is optional).
- For each entry where `tier === 'load-bearing'` and `secret_rotation_days` is set:
  - Extract: `id`, `secret_keys[]`, `secret_rotation_days`, `last_rotated` (or `last_healthy` as fallback).
  - Compute `next_rotation = last_rotated + secret_rotation_days days`.

**B. Project `_research.json`** (optional, project-specific)

- Look for `_research.json` in `--project-dir` (default: cwd).
- If found, read `vendors[]` array. For each entry:
  - Required fields: `name`, `tier: 'load-bearing'`, `secret_keys[]`, `rotation_cadence_days`, `last_rotated` (ISO-8601 date string).
  - Skip entries where `tier !== 'load-bearing'` — replaceable vendors need no schedule.
  - Compute `next_rotation = last_rotated + rotation_cadence_days days`.

**C. Built-in defaults** — if neither source lists a vendor that IS clearly load-bearing (Clerk, Stripe, Square, Resend), surface a warning:

```
WARN: No rotation record found for well-known load-bearing vendor <name>.
      Add it to ~/.claude/mcp-registry.json or _research.json to track rotation.
```

---

## Step 2 — Build the vendor rotation table

For each vendor collected in Step 1, compute:

| Field | Derivation |
|---|---|
| `vendor` | `id` or `name` |
| `secret_keys` | `secret_keys[]` joined with `,` |
| `last_rotated` | ISO-8601 date |
| `cadence_days` | `secret_rotation_days` or `rotation_cadence_days` |
| `next_rotation` | `last_rotated + cadence_days` |
| `days_until_due` | `next_rotation - today` |
| `urgency` | OVERDUE (<0) / URGENT (0-7) / SOON (8-30) / OK (>30) |

Sort by `days_until_due` ascending (most urgent first).

---

## Step 3 — Emit ROTATIONS-DUE-NEXT-30-DAYS report

Print a markdown table to the terminal covering vendors where `days_until_due <= 30`:

```
ROTATIONS DUE IN NEXT 30 DAYS — 2026-06-18
═══════════════════════════════════════════

| Urgency  | Vendor      | Keys                          | Due Date   | Days Left |
|----------|-------------|-------------------------------|------------|-----------|
| OVERDUE  | clerk       | CLERK_SECRET_KEY              | 2026-06-10 | -8        |
| URGENT   | stripe      | STRIPE_SECRET_KEY             | 2026-06-22 | 4         |
| SOON     | resend      | RESEND_API_KEY                | 2026-07-05 | 17        |

Vendors with no rotation due in 30 days: square (next: 2026-08-14, 57 days)

Action: rotate OVERDUE + URGENT secrets NOW via `get-secret KEY` → wrangler secret put
```

If no vendors are due in 30 days, emit:

```
All load-bearing vendor secrets are current. Next rotation: <vendor> on <date> (<N> days).
```

---

## Step 4 — Generate .ics calendar file

Build an RFC 5545-compliant iCalendar file. One `VEVENT` per vendor rotation:

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Megabyte Labs//Vendor Rotation Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Vendor Secret Rotations
X-WR-TIMEZONE:America/New_York

BEGIN:VEVENT
UID:vendor-rotation-<vendor>-<next_rotation-YYYYMMDD>@megabyte.space
DTSTART;VALUE=DATE:<next_rotation-YYYYMMDD>
DTEND;VALUE=DATE:<next_rotation+1-YYYYMMDD>
SUMMARY:[ROTATE] <vendor> — <secret_keys>
DESCRIPTION:Rotate load-bearing vendor secrets per rules/vendor-risk-tiering.md.\n
  Vendor: <vendor>\n
  Keys to rotate: <secret_keys>\n
  Cadence: every <cadence_days> days\n
  Last rotated: <last_rotated>\n
  How: get-secret KEY → wrangler secret put KEY
CATEGORIES:VENDOR-ROTATION,SECURITY
PRIORITY:1
BEGIN:VALARM
TRIGGER:-P7D
ACTION:DISPLAY
DESCRIPTION:7-day warning: rotate <vendor> secrets this week
END:VALARM
BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:Tomorrow: rotate <vendor> — <secret_keys>
END:VALARM
END:VEVENT
```

Write the full file to `--out` path (default: `~/vendor-rotation-calendar.ics`).

Emit: `Calendar written → <path>  (N vendors, N events)`

---

## Step 5 — Google Calendar MCP (--gcal flag only)

If `--gcal` is passed AND the Google Calendar MCP is available in the current session:

For each vendor rotation event:

1. Call `mcp__claude_ai_Google_Calendar__create_event` with:
   - `summary`: `[ROTATE] <vendor> — <secret_keys>`
   - `start`: `{ date: "<next_rotation-YYYY-MM-DD>" }` (all-day event)
   - `end`: `{ date: "<next_rotation+1-YYYY-MM-DD>" }`
   - `description`: same multi-line description as the VEVENT
   - `reminders`: `{ useDefault: false, overrides: [{ method: 'popup', minutes: 10080 }, { method: 'email', minutes: 1440 }] }` (7-day popup + 1-day email)
2. On success, emit: `✓ GCal event created: <vendor> on <date>`
3. On error (MCP unavailable or auth failure), emit: `✗ GCal skipped: <error>. Import vendor-rotation-calendar.ics manually.`

If `--gcal` is NOT passed and rotation-due vendors exist:

```
TIP: Run with --gcal to create these events in Google Calendar automatically.
     Or import ~/vendor-rotation-calendar.ics into any calendar app.
```

---

## Step 6 — Add missing vendors to registry (advisory)

If vendors were found in `_research.json` but are absent from `~/.claude/mcp-registry.json`, emit:

```
ADVISORY: Add these to ~/.claude/mcp-registry.json to enable /audit-mcp-fleet rotation tracking:
  - clerk     (secret_rotation_days: 90, secret_keys: ["CLERK_SECRET_KEY"])
  - resend    (secret_rotation_days: 90, secret_keys: ["RESEND_API_KEY"])
```

Do NOT auto-write the registry — user approves edits to `~/.claude/mcp-registry.json`.

---

**Verification** — After .ics is written, confirm the file exists and is non-empty:

```sh
wc -l ~/vendor-rotation-calendar.ics   # should be > 10 lines
grep "VEVENT" ~/vendor-rotation-calendar.ics | wc -l   # should equal vendor count
```

**See**

- `rules/vendor-risk-tiering.md` — load-bearing classification + rotation cadence
- `rules/secret-provisioning.md` — rotation cadence by secret class (≤90 days for load-bearing)
- `rules/secret-auto-provisioning.md` — automated rotation flows
- `13-observability-and-growth/mcp-server-registry.md` — registry schema + `secret_rotation_days` field
- `/audit-mcp-fleet` — live healthcheck + rotation-due detection across MCP servers
