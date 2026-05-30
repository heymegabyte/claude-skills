# Collaboration + Sync Supervisor (***SUPREME — only when realtime is genuinely needed, every large app***)

Collaboration is added ONLY when realtime, multiplayer, offline, or conflict-safe editing is actually required — never speculatively. When it is needed, state is versioned, validated, and recoverable. The collaboration arm of the supervisor system.

## When this fires
- A feature genuinely needs: multiple users editing the same thing live, offline-first with sync, or conflict-free merge

## When this does NOT fire (the brakes)
- Single-user editing → no CRDT, no realtime room. Plain save + optimistic update per [[rxjs-first-angular]] is enough.
- "It might be collaborative someday" → defer until the requirement is real (avoid bloat per [[package-preference-registry]])

## Tooling + when to use
- **Yjs** — mature collaborative editing (rich text, structured docs); pairs with Lexical/Monaco per [[forms-editors-content-supervisor]]
- **Automerge** — local-first, conflict-resistant state where offline-first matters more than live cursors
- **PartyKit** / **partyserver** / **partysocket** — realtime rooms (presence, cursors, broadcast)

## Rules
- **Version** collaborative state (schema version) and **Zod-validate** it on load per [[validation-error-handling-supervisor]]
- **Recover** — every collaborative doc has a snapshot/restore path; never an unrecoverable merge
- Tenant-scope every room/doc per [[auth-permissions-security-supervisor]]
- Realtime transport behind an adapter (Cloudflare Durable Objects are the CF-native room host per [[cloudflare-hostable-supervisor]]; partyserver runs on Workers)
- Server still validates every mutation — CRDT convergence is not authorization

## See
- [[package-preference-registry]] · [[forms-editors-content-supervisor]] · [[validation-error-handling-supervisor]] · [[auth-permissions-security-supervisor]] · [[cloudflare-hostable-supervisor]] · [[rxjs-first-angular]]

## Reference incident (***2026-05-29 — supervisor knowledge-system upgrade, wave 2***)
Brief: add collaboration only when realtime/multiplayer/offline/conflict-safe is actually needed; Yjs for mature collab editing, Automerge for local-first, PartyKit/partyserver/partysocket for realtime rooms; version/validate/recover collaborative state. Authored wave 2; package decisions in [[package-preference-registry]].
