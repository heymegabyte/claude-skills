---
name: "collaboration-sync-supervisor"
priority: 4
pack: "backend"
triggers:
  - "yjs"
  - "automerge"
  - "collab"
  - "multiplayer"
paths:
  - "*"
---

# Collaboration + Sync Supervisor

Collaboration is added ONLY when realtime, multiplayer, offline, or conflict-safe editing is actually required — never speculatively. When it is needed, state is versioned, validated, and recoverable. The collaboration arm of the supervisor system.

## When this fires

- A feature genuinely needs: multiple users editing the same thing live, offline-first with sync, or conflict-free merge

## Tooling + when to use

- **Yjs** — mature collaborative editing (rich text, structured docs); pairs with Lexical/Monaco per `forms-editors-content-supervisor`
- **Automerge** — local-first, conflict-resistant state where offline-first matters more than live cursors
- **PartyKit** / **partyserver** / **partysocket** — realtime rooms (presence, cursors, broadcast)

## Rules

- **Version** collaborative state (schema version) and **Zod-validate** it on load per `validation-error-handling-supervisor`
- **Recover** — every collaborative doc has a snapshot/restore path; never an unrecoverable merge
- Tenant-scope every room/doc per `auth-permissions-security-supervisor`
- Realtime transport behind an adapter (Cloudflare Durable Objects are the CF-native room host per `cloudflare-hostable-supervisor`; partyserver runs on Workers)
- Server still validates every mutation — CRDT convergence is not authorization
