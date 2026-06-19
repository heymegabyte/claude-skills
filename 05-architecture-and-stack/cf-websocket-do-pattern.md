---
skill: cf-websocket-do-pattern
version: 1.0.0
tags: [cloudflare, durable-objects, websocket, realtime, hibernation]
cross-links: [cf-agents-do-pattern, hono-api]
---

# CF WebSocket + Durable Objects Pattern

## Hibernation API

- `acceptWebSocket(server)` inside `fetch()` — NOT `ws.accept()` (legacy keeps DO awake $)
- DO handlers on the class: `webSocketMessage(ws, msg)`, `webSocketClose(ws, code, reason, wasClean)`, `webSocketError(ws, error)`
- DO sleeps between messages, wakes on next — zero idle billing
- `ctx.getWebSockets()` to enumerate all active sockets after cold wake
- Tag sockets: `acceptWebSocket(server, ['room:xyz', 'user:abc'])` — query with `ctx.getWebSockets('room:xyz')`
- Tags are durable across hibernation — stored by the runtime, not your code

```ts
import { DurableObject } from 'cloudflare:workers';

interface ConnMeta {
  userId: string;
  roomId: string;
  joinedAt: number;
  lastSeen: number;
  windowStart: number;
  msgCount: number;
}

export class RoomDO extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }
    const [client, server] = Object.values(new WebSocketPair()) as [WebSocket, WebSocket];
    const userId = new URL(request.url).searchParams.get('userId') ?? 'anon';
    const roomId = new URL(request.url).searchParams.get('roomId') ?? 'default';
    this.ctx.acceptWebSocket(server, [`room:${roomId}`, `user:${userId}`]);
    server.serializeAttachment({ userId, roomId, joinedAt: Date.now(), lastSeen: Date.now(), windowStart: Date.now(), msgCount: 0 });
    this.broadcast({ type: 'presence:join', userId, ts: Date.now() }, server);
    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void {
    const meta = ws.deserializeAttachment() as ConnMeta;
    const now = Date.now();
    if (now - meta.windowStart > 10_000) { meta.windowStart = now; meta.msgCount = 0; }
    meta.lastSeen = now;
    if (++meta.msgCount > 50) {
      ws.send(JSON.stringify({ type: 'error', code: 'RATE_LIMITED' }));
      ws.close(1008, 'rate limited');
      return;
    }
    if (meta.msgCount > 40) ws.send(JSON.stringify({ type: 'warn', msg: 'approaching rate limit' }));
    ws.serializeAttachment(meta);
    let data: Record<string, unknown>;
    try { data = JSON.parse(typeof message === 'string' ? message : new TextDecoder().decode(message)); }
    catch { ws.send(JSON.stringify({ type: 'error', code: 'bad_json' })); return; }
    if (data.type === 'ping') { ws.send(JSON.stringify({ type: 'pong', ts: Date.now() })); return; }
    this.broadcast({ type: 'message', from: meta.userId, payload: data }, ws);
  }

  webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): void {
    const meta = ws.deserializeAttachment() as ConnMeta;
    this.broadcast({ type: 'presence:leave', userId: meta.userId, ts: Date.now() });
  }

  webSocketError(ws: WebSocket, error: unknown): void {
    console.error('ws error', error); // webSocketClose fires after this
  }

  broadcast(message: unknown, exclude?: WebSocket): void {
    const payload = JSON.stringify(message);
    for (const ws of this.ctx.getWebSockets()) {
      if (ws !== exclude) { try { ws.send(payload); } catch { /* already closed */ } }
    }
  }
}
```

## Connection Metadata (Attachment API)

- Never trust in-memory Map across hibernation — use `ws.serializeAttachment(meta)` / `ws.deserializeAttachment()`
- Rebuild session info from attachment on each handler invocation
- Attachment is JSON-serializable; store `{ userId, roomId, joinedAt, windowStart, msgCount }`
- `ctx.getWebSockets()` returns live sockets even after DO hibernated and woke
- Attachment size limit ~1 KB per socket — store IDs and timestamps, not payloads
- For large per-user state: write to `this.ctx.storage` keyed by userId on each update

```ts
// Hydrate presence from all live sockets after cold wake
async getPresence(): Promise<ConnMeta[]> {
  return this.ctx.getWebSockets().map((ws) => ws.deserializeAttachment() as ConnMeta);
}
```

## Broadcast Pattern

Real TypeScript broadcast methods:

```ts
broadcast(message: unknown, exclude?: WebSocket) {
  const payload = JSON.stringify(message);
  for (const ws of this.ctx.getWebSockets()) {
    if (ws !== exclude) {
      try { ws.send(payload); } catch { /* already closed */ }
    }
  }
}

broadcastToRoom(roomId: string, message: unknown, exclude?: WebSocket) {
  const payload = JSON.stringify(message);
  for (const ws of this.ctx.getWebSockets(`room:${roomId}`)) {
    if (ws !== exclude) {
      try { ws.send(payload); } catch {}
    }
  }
}
```

- Tag-scoped broadcast avoids iterating all sockets in multi-room DOs
- Always wrap `ws.send()` in try/catch — sockets can close between `getWebSockets()` and send

## Presence Tracking

- JOIN: on `fetch()` → broadcast `{ type: 'presence:join', userId, ts }` to room tag after accepting
- LEAVE: in `webSocketClose` → broadcast `{ type: 'presence:leave', userId, ts }`
- Persist presence to DO Storage: `await this.ctx.storage.put('presence', serialized)`; restore on wake
- Heartbeat: client sends `{ type: 'ping' }` every 30s; DO responds `{ type: 'pong', ts: Date.now() }`
- Stale detection: Alarm every 60s, iterate `ctx.getWebSockets()`, check `deserializeAttachment().lastSeen`, force-close if > 90s
- New joiners hydrate from storage snapshot, not by querying live sockets

```ts
async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
  // ... after handling ping/pong, schedule stale sweep
  if (!await this.ctx.storage.get('alarmSet')) {
    await this.ctx.storage.setAlarm(Date.now() + 60_000);
    await this.ctx.storage.put('alarmSet', true);
  }
}

async alarm() {
  const now = Date.now();
  for (const ws of this.ctx.getWebSockets()) {
    const meta = ws.deserializeAttachment() as ConnMeta;
    if (now - meta.lastSeen > 90_000) ws.close(1001, 'idle timeout');
  }
  await this.ctx.storage.delete('alarmSet');
  if (this.ctx.getWebSockets().length > 0) {
    await this.ctx.storage.setAlarm(Date.now() + 60_000);
    await this.ctx.storage.put('alarmSet', true);
  }
}
```

## Message Rate Limiting Per Connection

Real TypeScript inside `webSocketMessage`:

```ts
webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
  const meta = ws.deserializeAttachment() as ConnMeta;
  const now = Date.now();
  if (now - meta.windowStart > 10_000) {
    meta.windowStart = now;
    meta.msgCount = 0;
  }
  meta.lastSeen = now;
  if (++meta.msgCount > 50) {
    ws.send(JSON.stringify({ type: 'error', code: 'RATE_LIMITED' }));
    ws.close(1008, 'rate limited');
    return;
  }
  if (meta.msgCount > 40) {
    ws.send(JSON.stringify({ type: 'warn', msg: 'approaching rate limit' }));
  }
  ws.serializeAttachment(meta);
  // handle message...
}
```

- 50 msgs / 10s window per connection; soft warn at 40; hard close + 1008 at 51
- Per-connection window, not global DO-level
- Tune per use-case: cursor sync 120/s, chat 10/s, commands 5/s

## Client-Side Reconnection Backoff

Real TypeScript:

```ts
let attempt = 0;
function connect(url: string) {
  const ws = new WebSocket(url);
  ws.onopen = () => { attempt = 0; };
  ws.onclose = (e) => {
    if (e.code === 1008 || e.code === 4001) return; // no retry
    const delay = Math.min(30_000, 500 * 2 ** attempt + Math.random() * 500);
    attempt++;
    setTimeout(() => connect(url), delay);
  };
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.type === 'pong') return;
    handleMessage(msg);
  };
  return ws;
}
```

- Jittered exponential: 500ms → 1s → 2s → ... → 30s cap
- Hard stop on 1008 (rate limited), 4001 (auth failed), 4003 (banned)
- Client sends ping every 30s to keep connection alive through proxies
- Show "Reconnecting…" in UI after attempt 2, "Check connection" after attempt 5

## Hono Entry Point Wiring

```ts
// worker entry
app.get('/ws/:roomId', async (c) => {
  const upgrade = c.req.header('Upgrade');
  if (upgrade !== 'websocket') return c.text('Expected websocket', 426);
  const roomId = c.req.param('roomId');
  const id = c.env.ROOM.idFromName(roomId);
  const stub = c.env.ROOM.get(id);
  return stub.fetch(c.req.raw);
});

// inside DO fetch()
async fetch(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === '/connect') {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const userId = await this.authenticate(request);
    if (!userId) return new Response('Unauthorized', { status: 401 });
    this.ctx.acceptWebSocket(server, [`room:${this.roomId}`, `user:${userId}`]);
    server.serializeAttachment({ userId, roomId: this.roomId, joinedAt: Date.now(), windowStart: Date.now(), msgCount: 0, lastSeen: Date.now() });
    this.broadcast({ type: 'presence:join', userId }, server);
    return new Response(null, { status: 101, webSocket: client });
  }
  return new Response('Not found', { status: 404 });
}
```

- `idFromName(roomId)` = deterministic DO per room — never `newUniqueId()` for shared resources
- Auth in the Worker before forwarding — DO trusts the stub, not the raw client
- Pass userId in URL params so DO can extract without re-parsing auth headers

## wrangler.toml Config

```toml
[[durable_objects.bindings]]
name = "ROOM"
class_name = "RoomDO"

[[migrations]]
tag = "v1"
new_sqlite_classes = ["RoomDO"]
```

- `new_sqlite_classes` required for hibernation + built-in SQLite storage
- Set `max_hibernatable_event_time_ms = 10000` in DO options if heavy per-message compute
- Export the DO class from the worker entry file: `export { RoomDO }`
- `[[migrations]]` tag must be unique per entry — increment tag on schema changes

## Use Cases

- **Chat**: DO name = room ID; circular buffer last 100 msgs in Storage (`storage.put('msgs', ring)`)
- **Live cursors**: client throttles to 30fps before sending; DO broadcasts position diffs (not absolute coords)
- **Multiplayer state**: last-write-wins for simple state; for text use Yjs updates over WS, DO as relay only
- **Real-time collab**: operational transforms in a separate Worker; DO handles transport only
- **Live presence feeds**: `getWebSockets().map(ws => ws.deserializeAttachment())` → users online list

## Production Checklist

- Never store `WebSocket` refs in class properties — they don't survive hibernation
- Always wrap `ws.send()` in try/catch — socket may close between `getWebSockets()` and send
- Use `idFromName(roomId)` not `idFromString()` — deterministic, no storage overhead
- Cap rooms: enforce max 1000 connections per DO (check `ctx.getWebSockets().length` on join)
- Alarm for cleanup: purge stale presence + emit analytics event per room
- Test hibernation locally: `wrangler dev` does NOT simulate hibernation — test on deployed preview
- `webSocketError` must be implemented — missing it causes unhandled rejection
- Auth validated in Worker BEFORE forwarding to DO — never in DO unless also in Worker
- `[[migrations]]` entry present — omitting silently skips storage provisioning on deploy

---

See `[[cf-agents-do-pattern]]` for AI agent + DO integration. See `[[hono-api]]` for Hono routing patterns.
