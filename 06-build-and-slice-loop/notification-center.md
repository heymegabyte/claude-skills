---
name: "Notification Center"
version: "3.0.0"
updated: "2026-09-25"
description: "Build the notification feature on psnotify (our DO-backed engine): in-app bell + unread badge, notification center (history/filter/mark-read), per-channel/per-category preferences, web-push (permission after value moment), Amazon SES email, digest/batching, and Angular 21 integration. When product has returning users who benefit from updates."
---

# Notification Center

> **Doctrine (SoT): `rules/notifications-email-webhooks-supervisor`.** psnotify — our in-house, Durable-Object-backed engine — is THE notification layer for every app (in-app inbox + center + preferences + multi-channel). Novu and OneSignal are removed vendors — never reintroduce (`@novu/*`, `NOVU_SECRET_KEY`, OneSignal SDK). The durable record is the psnotify DO, **NOT** a D1 `notifications` table. This skill is the build HOW; the rule owns the architecture + the state-transition trigger map.

## When to include

- SaaS products where users return regularly
- Donation campaigns with milestones · products with content updates (blog, features)
- **NOT for** simple marketing sites with no return visitors

## Architecture

```
Event occurs → NotifyService.notify(eventId, {to, payload})
             → psnotify DO persists (append-only durable record) + fans out per stored prefs
             → in-app bell (/api/notifications) · web-push · Amazon SES email
```

- Triggers are typed + Zod-validated (`contract-first-ai` / `zod-everywhere`); every payload carries `{ orgId, userId, featureSlug }`.
- Example events (full map in the rule): `payment.succeeded` · `build.failed` · `domain.active` · `ai.job.completed` · `member.invited` · `draft.published`.

## Hono routes (vendor-neutral — the bell reads these)

```typescript
// src/routes/notifications.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const notifications = new Hono<{ Bindings: Env }>();

// List for the signed-in user (feed + unread count) — served by the psnotify DO
notifications.get('/', async (c) => {
  const userId = c.get('userId'); // from auth middleware
  const { items, unreadCount } = await c.env.NOTIFY.list(userId, { limit: 20 });
  return c.json({ notifications: items, unreadCount });
});

notifications.post('/:id/read', async (c) => {
  await c.env.NOTIFY.markRead(c.get('userId'), c.req.param('id'));
  return c.json({ success: true });
});

notifications.post('/read-all', async (c) => {
  await c.env.NOTIFY.markAllRead(c.get('userId'));
  return c.json({ success: true });
});

// Per-channel / per-category preferences (stored in the DO, never hard-coded routing)
notifications.patch('/preferences', zValidator('json', z.object({
  category: z.enum(['milestones', 'content', 'account', 'digest']),
  channel: z.object({ inApp: z.boolean().optional(), email: z.boolean().optional(), push: z.boolean().optional() }),
})), async (c) => {
  await c.env.NOTIFY.setPreference(c.get('userId'), c.req.valid('json'));
  return c.json({ updated: true });
});

export { notifications };
```

`c.env.NOTIFY` is the psnotify DO binding wrapped by `NotifyService` (see the rule). No third-party notification SDK.

## Angular in-app notification bell

```typescript
// notification-bell.component.ts
import { Component, OnInit, signal, computed } from '@angular/core';

interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  cta?: { url: string; label: string };
}

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  template: `
    <button (click)="toggle()" class="bell-btn" [attr.aria-label]="'Notifications (' + unreadCount() + ' unread)'">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      @if (unreadCount() > 0) {
        <span class="badge">{{ unreadCount() > 99 ? '99+' : unreadCount() }}</span>
      }
    </button>
    @if (open()) {
      <div class="notification-panel" role="dialog" aria-label="Notifications">
        <div class="panel-header">
          <h3>Notifications</h3>
          <button (click)="markAllRead()">Mark all read</button>
        </div>
        <div class="panel-body">
          @for (n of notifications(); track n.id) {
            <div class="notification-item" [class.unread]="!n.read" (click)="onNotificationClick(n)">
              <strong>{{ n.title }}</strong>
              <p>{{ n.body }}</p>
              <time>{{ n.createdAt | date:'short' }}</time>
            </div>
          } @empty {
            <p class="empty">No notifications yet</p>
          }
        </div>
      </div>
    }
  `,
})
export class NotificationBellComponent implements OnInit {
  notifications = signal<Notification[]>([]);
  open = signal(false);
  unreadCount = computed(() => this.notifications().filter((n) => !n.read).length);

  async ngOnInit(): Promise<void> {
    await this.fetchNotifications();
    setInterval(() => this.fetchNotifications(), 30000); // or a WebSocket from the realtime skill
  }

  toggle(): void { this.open.update((v) => !v); }

  async markAllRead(): Promise<void> {
    await fetch('/api/notifications/read-all', { method: 'POST' });
    this.notifications.update((list) => list.map((n) => ({ ...n, read: true })));
  }

  onNotificationClick(n: Notification): void {
    if (n.cta?.url) window.location.href = n.cta.url;
    if (!n.read) this.markRead(n.id);
  }

  private async fetchNotifications(): Promise<void> {
    const res = await fetch('/api/notifications');
    const data = await res.json();
    this.notifications.set(data.notifications);
  }

  private async markRead(id: string): Promise<void> {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
    this.notifications.update((list) => list.map((n) => n.id === id ? { ...n, read: true } : n));
  }
}
```

## Web push — request permission AFTER the value moment

Never ask on first visit. Ask after the user gets value (first donation, first feature use, 3rd visit). psnotify's push channel uses standard **web-push** (service worker + `PushManager`) — no third-party push SDK.

```javascript
// Show a custom value-framed prompt, then register the browser push subscription
async function requestPushAfterValue() {
  if (Notification.permission !== 'default') return; // already granted/denied
  showPushPrompt(); // custom UI explaining the value ("donation milestones + new features")
}

async function enablePush() {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: window.VAPID_PUBLIC_KEY, // psnotify VAPID key
  });
  await fetch('/api/notifications/push/subscribe', { method: 'POST', body: JSON.stringify(sub) });
}
```

## Notification types (channel matrix)

| Event | Push | In-App | Email |
|-------|------|--------|-------|
| Donation goal reached | Yes | Yes | Yes |
| New blog post | Yes | Yes | No |
| Feature update | Yes | Yes | No |
| Account activity | No | Yes | Yes |
| Weekly digest | No | No | Yes |
| Testimonial approved | No | Yes | Yes |

## Preferences (stored in the psnotify DO)

Per-channel × per-category, surfaced in app settings; the DO stores them and the fan-out reads them — the app never hard-codes routing.

```typescript
interface NotificationPreferences {
  push: boolean;   email: boolean;        // channel master switches
  milestones: boolean; content: boolean;  // category opt-in/out
  account: boolean;    digest: boolean;
}
```

## Digest / batching

- Collect per-item events over a window (e.g. each comment) → emit ONE grouped notification: "You have 5 new comments on Project X".
- psnotify digest step: trigger fires per-item → digest collects for the window (e.g. 1 hour) → single fan-out with the collected events in the payload.

## Best practices

- Never ask for push on first visit — ask after a value moment.
- Limit to 2–3 pushes per week max · always include a preferences/unsubscribe link.
- In-app notifications clear on click · badge updates in real-time (or on page load).
- Amazon SES email fallback for critical notifications when push is disabled.
- Toasts are ephemeral; the notification center is the durable record (the DO).
