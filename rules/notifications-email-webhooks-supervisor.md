# Notifications + Email + Webhooks Supervisor (***SUPREME — Novu across the whole process, every app, every future app***)

Novu is THE notification backbone for every emdash app — not a bolt-on, not a single toast call. Wherever a user should be informed of something — a build finished, a deploy failed, a domain went live, a payment succeeded, a teammate invited them, an AI job completed, a quota neared — it flows through Novu. This is permanent doctrine: every current AND future app integrates Novu **fully** (inbox + center + preferences + multi-channel) from the first notification surface. Webhooks flow through Svix (managed, signed, tracked). Every notification is tenant-aware, actionable, and enriched.

## When this fires
- Any in-app / email / push notification, or any inbound/outbound webhook, in any app

## The mandate (non-negotiable)
- **Novu is the only notification layer.** No ad-hoc email sends, no scattered toast-only events, no per-feature notification tables. Every user-relevant event is a Novu workflow trigger.
- **Integrate FULLY, not a widget:** ship the **inbox** (bell + unread count + grouped feed), the **notification center** (full history, filter, mark-read, archive), and **preferences** (per-channel, per-category opt-in/out). All three, every app.
- **One trigger, three channels via clean adapters:** in-app (Novu Inbox), email (Resend/SendGrid as the Novu email provider, behind an adapter), push (web-push / FCM). App code triggers ONE workflow; Novu fans out per the user's channel preferences — swap a channel without touching product code.
- **Tenant-aware always.** Every trigger carries `{ tenantId, userId, featureSlug }`; subscribers namespaced per tenant; zero cross-tenant leakage.
- Toasts are for ephemeral feedback; the notification center is the durable record.

## Where Novu fires (the "across the whole process" rule)
Wire a workflow at every meaningful state transition, not just errors:
- **Build/deploy pipeline:** `build.started` · `build.failed` (error + deep link to logs) · `publish.completed` (live URL). Pairs with [[event-sourced-build-progress]].
- **Domains:** `domain.verifying` · `domain.active` · `domain.failed`.
- **AI jobs:** `ai.job.completed` / `ai.job.failed` (with trace id) per [[ai-agent-supervisor]].
- **Billing:** `payment.succeeded` · `payment.failed` · `quota.near_limit` · `trial.ending`.
- **Team/auth:** `member.invited` · `member.joined` · `sensitive.action` per [[auth-permissions-security-supervisor]].
- **Workflows:** any [[workflow-automation-supervisor]] run with user-facing progress emits Novu updates.
- **Content/editor:** `draft.published` · `review.requested`.

## Architecture (per app)
- `libs/core/notifications/` — a `NotifyService` wrapping `@novu/api` (server trigger) + the Inbox component (Angular: `@novu/js` headless rendered through Spartan `hlmCard`/`hlmBadge` per [[spartan-ui-design-system]]; React: `@novu/react`).
- **Triggers are typed + Zod-validated** — `notify(workflowId, { to, payload })` where `payload` is a Zod contract per [[contract-first-ai]]/[[zod-everywhere]]. No free-form payloads.
- **Subscribers** synced on user create/update (id, email, phone, locale, tenant).
- **Preferences** surfaced in app settings; Novu stores them; the app never hard-codes channel routing.
- **Cloudflare-hostable** per [[cloudflare-hostable-supervisor]]: Novu Cloud or self-hosted; `NotifyService` is the adapter so the backend is swappable. Resend stays the email provider behind Novu.

## Tooling + when to use
- **Novu** — the backbone (inbox, center, preferences, multi-channel adapters). Install when the first notification surface lands per [[package-preference-registry]].
- **svix** — productized OUTBOUND webhooks (let customers subscribe to your events): signed payloads, delivery tracking, retries, replay, customer-facing endpoint manager. Verify signatures before parsing.
- **postal-mime** — inbound email parsing.
- **web-push** — browser push payloads (push channel when not via Novu's provider).
- **react-email** — email templates ONLY in a React context (NOT inside the Angular app per [[stack-selector]]); Angular uses Novu templating / MJML.
- **Resend** — transactional email ONLY behind the Novu email adapter per [[secret-provisioning]].

## Inbound webhooks
- Verify signature → dedupe by event id → route → handle; often trigger a Novu workflow. Idempotency per [[error-recovery]].

## Anti-patterns (build fail)
- ❌ A feature emitting a user-relevant event but only `console.warn`/toast (no Novu workflow).
- ❌ Direct Resend/SendGrid calls outside the Novu provider adapter.
- ❌ A per-feature `notifications` table reinventing the inbox.
- ❌ Untyped Novu payloads · cross-tenant subscriber bleed · notifications with no deep link / no "what to do next" per [[auto-meta-work]] § notifications.
- ❌ react-email in an Angular app.

## ProjectSites.dev relevance
The build pipeline, domain provisioning, AI generation, and billing all have rich state transitions that today surface only as polled UI/toasts. Wave: add `libs/core/notifications/`, a Spartan Inbox in the v2 shell topbar (bell), preferences in settings, Novu triggers on the build/deploy/domain/AI/billing events above.

## Reference incident (***2026-05-29***)
Brian: *"Novu should be integrated across the whole process and fully integrated into the app and all future apps via ~/.agentskills."* Elevated from the wave-2 supervisor stub to this full SUPREME every-app doctrine — Novu is now permanent. Pairs with [[package-preference-registry]] + [[supervisor-skills-index]] #11.

## See
- [[supervisor-skills-index]] · [[package-preference-registry]] · [[spartan-ui-design-system]] · [[stack-selector]]
- [[event-sourced-build-progress]] · [[workflow-automation-supervisor]] · [[ai-agent-supervisor]] · [[auth-permissions-security-supervisor]] · [[validation-error-handling-supervisor]] · [[media-file-document-supervisor]]
- [[contract-first-ai]] · [[zod-everywhere]] · [[cloudflare-hostable-supervisor]] · [[auto-meta-work]] · [[secret-provisioning]]
