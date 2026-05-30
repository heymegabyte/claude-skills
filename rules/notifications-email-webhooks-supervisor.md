# Notifications + Email + Webhooks Supervisor (***SUPREME — tenant-aware, delivery-tracked, every large app***)

Notifications flow through Novu (inbox + center + preferences), webhooks through Svix (managed + signed + tracked). Every notification is tenant-aware, actionable, and enriched. The notifications arm of the supervisor system.

## When this fires
- Any in-app / email / push notification, or any inbound/outbound webhook

## Tooling + when to use
- **Novu** — the notification backbone: in-app inbox, notification center, per-user preferences, multi-channel (in-app + email + push) via clean adapters
- **svix** — webhook management (endpoints, retries, signature verification, delivery dashboard) where webhooks are a product surface
- **postal-mime** — inbound email parsing
- **web-push** — browser push payloads
- **react-email** — email templates ONLY in a React context (NOT inside the Angular app — see [[stack-selector]]); Angular sends via the email adapter
- **Resend** — transactional email ONLY where business-required, behind the email adapter per [[secret-provisioning]]

## Rules
- **Integrate Novu fully** wherever notifications exist — build the inbox, the center, and the preferences UI (not a one-off toast)
- Support **in-app + email + push** through clean adapters (swap a channel without touching product code)
- **Svix** for webhook productization — **verify signatures** before parsing, **track delivery status**, add **retries + failure states**
- Every notification is **tenant-aware** (scoped to org/user) and **actionable** (what happened · why it matters · what to do next · deep link) per [[always]]
- Toasts are for ephemeral feedback; the notification center is the durable record

## See
- [[package-preference-registry]] · [[auth-permissions-security-supervisor]] · [[validation-error-handling-supervisor]] · [[media-file-document-supervisor]] · [[secret-provisioning]] · [[workflow-automation-supervisor]] · [[spartan-ui-design-system]]

## Reference incident (***2026-05-29 — supervisor knowledge-system upgrade, wave 2***)
Brief: integrate Novu wherever notifications exist (inbox + center + preferences, multi-channel adapters); Svix for webhook management (verify sigs, track delivery, retries, failure states); make notifications tenant-aware. Authored wave 2; package decisions in [[package-preference-registry]].
