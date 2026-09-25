---
last_reviewed: 2026-09-25
superseded_by: null
name: "notifications-email-webhooks-supervisor"
priority: 3
pack: "backend"
triggers:
  - "psnotify"
  - "notification"
  - "webhook"
  - "email"
paths:
  - "concern:email"
---

# Notifications + Email + Webhooks Supervisor

**psnotify** — our custom, Durable-Object-backed notification engine — is THE notification layer for every emdash app (current AND future), not a bolt-on and not a single toast call. Wherever a user should be informed of something — a build finished, a deploy failed, a domain went live, a payment succeeded, a teammate invited them, an AI job completed, a quota neared — it flows through psnotify. This is permanent doctrine: every app owns the notification layer in-house (inbox + center + preferences + multi-channel) from the first notification surface, with no external notification vendor and no vendor secret to rotate. Webhooks flow through Svix (managed, signed, tracked). Every notification is tenant-aware, actionable, and enriched.

**Novu is removed — never reintroduce** (Brian, absolute). No `@novu/*` deps, no `NOVU_SECRET_KEY`, no `api.novu.co` / `socket.novu.co`. psnotify replicates the full Novu feature set, owned and tailored to our tenant/feature model.

## When this fires

- Any in-app / email / push notification, or any inbound/outbound webhook, in any app

## The mandate (non-negotiable)

- **psnotify is the only notification layer.** No ad-hoc email sends, no scattered toast-only events, no per-feature notification tables. Every user-relevant event is a psnotify trigger.
- **Integrate FULLY, not a widget:** ship the **inbox** (bell + unread count + grouped feed), the **notification center** (full history, filter, mark-read, archive), and **preferences** (per-channel, per-category opt-in/out). All three, every app.
- **One trigger, three channels via clean adapters:** in-app (psnotify inbox, DO-backed), email (Amazon SES behind an adapter; listmonk for bulk), push (web-push / FCM). App code triggers ONE workflow; psnotify fans out per the user's channel preferences — swap a channel without touching product code.
- **Tenant-aware always.** Every trigger carries `{ orgId, userId, featureSlug }`; subscribers namespaced per tenant; zero cross-tenant leakage.
- **Durable record.** psnotify's DO is the append-only source of truth — NOT a D1 `notifications` table. Toasts are for ephemeral feedback; the notification center is the durable record.

## Where psnotify fires (the "across the whole process" rule)

Wire a trigger at every meaningful state transition, not just errors:

- **Build/deploy pipeline:** `build.started` · `build.failed` (error + deep link to logs) · `publish.completed` (live URL). Pairs with `event-sourced-build-progress`.
- **Domains:** `domain.verifying` · `domain.active` · `domain.failed`.
- **AI jobs:** `ai.job.completed` / `ai.job.failed` (with trace id) per `ai-agent-supervisor`.
- **Billing:** `payment.succeeded` · `payment.failed` · `quota.near_limit` · `trial.ending`.
- **Team/auth:** `member.invited` · `member.joined` · `sensitive.action` per `auth-permissions-security-supervisor`.
- **Workflows:** any `workflow-automation-supervisor` run with user-facing progress emits psnotify updates.
- **Content/editor:** `draft.published` · `review.requested`.

## Architecture (per app)

- `libs/core/notifications/` — a `NotifyService` wrapping the psnotify engine (a Durable Object exposing `/api/notifications`) + the Inbox component (Angular: our own bell rendered through Spartan `hlmCard`/`hlmBadge` per `spartan-ui-design-system`; React: our own hook/component). No third-party notification SDK.
- **Triggers are typed + Zod-validated** — `notify(eventId, { to, payload })` where `payload` is a Zod contract per `contract-first-ai`/`zod-everywhere`. No free-form payloads.
- **Subscribers** synced on user create/update (id, email, phone, locale, tenant) into the psnotify DO.
- **Preferences** surfaced in app settings; the psnotify DO stores them; the app never hard-codes channel routing.
- **Cloudflare-native** per `cloudflare-hostable-supervisor`: psnotify IS a Durable Object — maximally CF-native, no external service, no self-host to operate. Amazon SES is the email channel behind the adapter (listmonk for bulk/newsletters).

## Tooling + when to use

- **psnotify** — the backbone (DO-backed inbox, center, preferences, multi-channel adapters), built in-house. Stand it up when the first notification surface lands per `package-preference-registry`.
- **svix** — productized OUTBOUND webhooks (let customers subscribe to your events): signed payloads, delivery tracking, retries, replay, customer-facing endpoint manager. Verify signatures before parsing.
- **postal-mime** — inbound email parsing.
- **web-push** — browser push payloads (push channel).
- **react-email** (`@react-email/components` + `render()`) — ACCEPTED for React surfaces (the generated React/Vite sites) AND **server-side transactional email templating**: `render(<Email/>)` returns an HTML string in the Worker, framework-agnostic output, never imported into the Angular admin bundle. Use it to author email bodies that the SES/listmonk send path (behind the psnotify email adapter) delivers. Angular admin UI uses MJML/HTML templating — react-email is for email HTML + React sites, not the admin SPA.
- **Amazon SES** — the SOLE transactional email rail behind the psnotify email adapter per `secret-provisioning` (SendGrid break-glass only, ADR-0019); **listmonk** (self-hosted) for newsletters via SES SMTP relay. Resend removed 2026-06-19.

## Inbound webhooks

- Verify signature → dedupe by event id → route → handle; often trigger a psnotify event. Idempotency per `error-recovery`.

## Anti-patterns (build fail)

- ❌ Reintroducing Novu — any `@novu/*` dep, `NOVU_SECRET_KEY`, or `api.novu.co` call.
- ❌ A feature emitting a user-relevant event but only `console.warn`/toast (no psnotify trigger).
- ❌ Direct Amazon SES/SendGrid calls outside the psnotify email adapter.
- ❌ A per-feature `notifications` D1 table reinventing the inbox (psnotify's DO is the record).
- ❌ Untyped psnotify payloads · cross-tenant subscriber bleed · notifications with no deep link / no "what to do next" per `auto-meta-work` § notifications.
- ❌ react-email imported into the **Angular admin SPA bundle** (accepted for React sites + server-side email HTML rendering — just never in the Angular bundle).

## ProjectSites.dev relevance

The build pipeline, domain provisioning, AI generation, and billing all have rich state transitions that today surface only as polled UI/toasts. Wire `libs/core/notifications/` (the psnotify DO), a Spartan Inbox in the v2 shell topbar (bell), preferences in settings, and psnotify triggers on the build/deploy/domain/AI/billing events above. Reference: `notification-source-is-psnotify-do-not-d1-notifications-table` memory.

## First live wiring

- **No vendor credential.** psnotify is our own DO — there is no public app id and no vendor secret. Tenant scoping and auth ride the app's existing session/JWT, not a notification-vendor key.
- **Frontend bell:** reads our own `/api/notifications` (list + unread count + mark-read) served by the psnotify DO. Render a Spartan bell + dropdown; toasts stay ephemeral, the center is durable.
- **Server triggers:** the Worker calls `NotifyService.notify(eventId, { to, payload })`; the psnotify DO persists + fans out per stored preferences. Verify the bell by asserting the `/api/notifications` calls and a seeded event, not a third-party inbox.
