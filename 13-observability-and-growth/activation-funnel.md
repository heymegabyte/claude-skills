---
name: "Activation Funnel"
description: "PostHog event taxonomy for PLG SaaS funnels: first-magic-moment definition, 5-stage activation funnel (visit→signup→core-action→second-session→paid), cohort SQL, milestone tracking, in-app upgrade prompts without dark patterns."
updated: "2026-06-18"
always-load: false
---

# Activation Funnel

PLG lives and dies on activation. Define ONE north-star activation metric — the moment a user experiences undeniable value — then instrument everything upstream and downstream of it.

## Magic-Moment Definition

The magic moment = the single action after which paid conversion probability jumps >3× above baseline. Pick it empirically:

1. Pull cohorts of users who converted to paid in the last 90 days.
2. Run `correlation_score` across every `feature_activated` event against `subscription_started` within 14 days.
3. The event with highest correlation AND >30% frequency IS your magic moment (e.g. `project_first_published`, `integration_connected`, `report_generated`).
4. Hard-code as `MAGIC_MOMENT_EVENT = 'your_event'` in `worker/activation.ts`; never change without repeating this analysis.

## 5-Stage Funnel

```
visit → signup → core_action → second_session → paid
```

| Stage | Definition | Target Conversion |
|-------|-----------|------------------|
| `visit` | `page_viewed` on any marketing page | — |
| `signup` | `signup_completed` (account created) | ≥3% visit→signup |
| `core_action` | Magic-moment event fired ≤24h after signup | ≥40% signup→core |
| `second_session` | Session started ≥24h after signup | ≥30% core→second |
| `paid` | `subscription_started` or `purchase_completed` | ≥8% second→paid |

If any stage is below target, that stage owns the sprint — not the one after it.

## PostHog Event Taxonomy

### Acquisition Events

```typescript
// Every marketing page load
posthog.capture('page_viewed', {
  path: window.location.pathname,
  title: document.title,
  referrer: document.referrer,
  utm_source: params.get('utm_source'),
  utm_campaign: params.get('utm_campaign'),
})

// CTA engagement
posthog.capture('cta_clicked', {
  cta_text: el.innerText,
  cta_location: 'hero' | 'pricing' | 'nav' | 'footer',
  destination: el.href,
})
```

### Activation Events

```typescript
// Account created
posthog.capture('signup_completed', {
  method: 'google' | 'email' | 'github',
  plan: 'free',
  referral_code: code ?? null,
})

// First-run milestone (fire once, idempotently)
posthog.capture('onboarding_step_completed', {
  step: 'profile' | 'invite' | 'integration' | 'first_action',
  step_index: 1 | 2 | 3 | 4,
  time_since_signup_s: Math.floor((Date.now() - signupTs) / 1000),
})

// Magic moment
posthog.capture(MAGIC_MOMENT_EVENT, {
  context: 'onboarding' | 'organic',
  time_since_signup_s: elapsed,
})

// Identify at signup + enrich on magic moment
posthog.identify(userId, {
  email: user.email,
  plan: 'free',
  signup_method: method,
})
posthog.group('company', orgId, { name: org.name, plan: org.plan })
```

### Engagement Events

```typescript
posthog.capture('feature_activated', { feature_name: 'csv_export', context: 'dashboard' })
posthog.capture('session_started', { session_number: n, days_since_signup: d })
posthog.capture('search_performed', { query_length: q.length, results_count: n })
posthog.capture('error_displayed', { error_type: 'validation' | 'server', page: path })
```

### Revenue Events

```typescript
posthog.capture('upgrade_prompt_shown', { trigger: 'feature_gate' | 'usage_limit' | 'milestone', plan_suggested: 'pro' })
posthog.capture('pricing_page_viewed', { source: 'nav' | 'upgrade_prompt' | 'direct' })
posthog.capture('checkout_started', { plan: 'pro', billing: 'monthly' | 'annual' })
posthog.capture('subscription_started', { plan: 'pro', billing: 'annual', mrr: 29 })
posthog.capture('subscription_cancelled', { plan: 'pro', reason: surveyAnswer, days_active: n })
```

## PostHog Funnel Queries

### Full Activation Funnel (HogQL)

```sql
SELECT
  countIf(event = 'page_viewed')                              AS visits,
  countIf(event = 'signup_completed')                         AS signups,
  countIf(event = 'project_first_published')                  AS magic_moment,
  countIf(event = 'session_started' AND properties.session_number >= 2) AS second_session,
  countIf(event = 'subscription_started')                     AS paid,
  round(countIf(event = 'signup_completed') * 100.0
        / nullIf(countIf(event = 'page_viewed'), 0), 2)      AS visit_to_signup_pct,
  round(countIf(event = 'project_first_published') * 100.0
        / nullIf(countIf(event = 'signup_completed'), 0), 2) AS signup_to_magic_pct,
  round(countIf(event = 'subscription_started') * 100.0
        / nullIf(countIf(event = 'session_started'
          AND properties.session_number >= 2), 0), 2)        AS second_to_paid_pct
FROM events
WHERE timestamp >= now() - interval 30 day
```

### Time-to-Activation Cohort (HogQL)

```sql
-- Distribution of minutes to magic moment, segmented by signup method
SELECT
  person.properties.signup_method AS method,
  histogram(
    toUInt32(dateDiff('minute',
      minIf(timestamp, event = 'signup_completed'),
      minIf(timestamp, event = 'project_first_published')
    )),
    10
  ) AS activation_time_histogram
FROM events
WHERE event IN ('signup_completed', 'project_first_published')
  AND timestamp >= now() - interval 90 day
GROUP BY method
```

### Weekly Activation Rate Trend

```sql
SELECT
  toMonday(timestamp)                                          AS week,
  countIf(event = 'signup_completed')                         AS new_signups,
  countIf(event = 'project_first_published')                  AS activated,
  round(countIf(event = 'project_first_published') * 100.0
        / nullIf(countIf(event = 'signup_completed'), 0), 1) AS activation_rate_pct
FROM events
WHERE timestamp >= now() - interval 12 week
GROUP BY week
ORDER BY week
```

### Users Who Signed Up But Never Hit Magic Moment (D1 equivalent for Workers)

```sql
-- D1 query — find stale free users for nudge campaign
SELECT u.id, u.email, u.created_at,
       MAX(e.occurred_at) AS last_event,
       julianday('now') - julianday(u.created_at) AS days_since_signup
FROM users u
LEFT JOIN events e ON e.user_id = u.id
WHERE u.plan = 'free'
  AND u.magic_moment_at IS NULL
  AND julianday('now') - julianday(u.created_at) BETWEEN 1 AND 7
GROUP BY u.id
ORDER BY days_since_signup DESC
LIMIT 500
```

## Cohort Analysis: Retention by Activation Status

In PostHog UI: Retention → breakdown by `$feature/activated` (custom property set on magic-moment).

Workers-side: set a PostHog person property at magic-moment:

```typescript
await posthog.groupIdentify({ groupType: 'company', groupKey: orgId,
  properties: { activated: true, activated_at: new Date().toISOString() } })
```

Target: activated cohort retains 2× better at 7-day / 30-day.

## First-Run Experience (FRE) Patterns

### Onboarding Checklist (Worker-backed, D1-persisted)

```typescript
// worker/onboarding.ts
const STEPS: OnboardingStep[] = [
  { key: 'profile',      label: 'Complete your profile',     required: true  },
  { key: 'integration',  label: 'Connect your first tool',   required: true  },
  { key: 'first_action', label: 'Create your first project', required: true  },
  { key: 'invite',       label: 'Invite a teammate',         required: false },
]

// Persist completion to D1 + fire PostHog event
export async function markStep(env: Env, userId: string, step: string) {
  await env.DB.prepare(
    `INSERT OR IGNORE INTO onboarding_completions (user_id, step, completed_at)
     VALUES (?, ?, datetime('now'))`
  ).bind(userId, step).run()
  await posthog.capture({ distinctId: userId, event: 'onboarding_step_completed',
    properties: { step, completed_all: await allStepsDone(env, userId) } })
}
```

### Empty States as Action Prompts

Every empty state is an activation hook — never "No data yet":

```tsx
// ✅
<EmptyState
  icon={<FolderIcon />}
  title="Create your first project"
  body="Projects are where your work lives. Most teams activate in under 2 minutes."
  cta={<Button onClick={createProject}>Create project</Button>}
/>
// ❌ never:
<p>No projects yet.</p>
```

### Progress Indicator

Show milestone language: "2 of 4 steps to full access." Not a percentage bar (users abandon bars).

## In-App Upgrade Prompts (Anti-Dark-Pattern)

### Triggers (when to show)

| Trigger | Event | Condition |
|---------|-------|-----------|
| Feature gate | `feature_gate_hit` | User clicks locked feature |
| Usage limit | `usage_limit_approached` | ≥80% of free quota consumed |
| Milestone | `team_member_invited` | Free plan hits seat limit |
| Value moment | Magic-moment event | User just hit the magic moment (positive state) |

Never show:

- On first session before magic moment
- More than once per 48h per trigger type
- After a payment error
- In the middle of a user flow

### Prompt Shape

```tsx
<UpgradePrompt
  trigger="feature_gate"           // logged to PostHog
  feature="csv_export"
  headline="Export your data"      // value-forward, not fear
  body="CSV export is on Pro. All your data, your way."
  cta="Upgrade to Pro"
  dismissible                      // ALWAYS dismissible
  onUpgrade={() => posthog.capture('upgrade_prompt_accepted', { trigger, feature })}
  onDismiss={() => posthog.capture('upgrade_prompt_dismissed', { trigger, feature })}
/>
```

### Suppression Logic (Worker-side)

```typescript
async function shouldShowUpgradePrompt(env: Env, userId: string, trigger: string): Promise<boolean> {
  const row = await env.DB.prepare(
    `SELECT shown_at FROM upgrade_prompts_shown
     WHERE user_id = ? AND trigger = ?
     ORDER BY shown_at DESC LIMIT 1`
  ).bind(userId, trigger).first<{ shown_at: string }>()
  if (!row) return true
  const hoursSince = (Date.now() - new Date(row.shown_at).getTime()) / 3_600_000
  return hoursSince >= 48
}
```

## Milestone Tracking (D1 Schema)

```sql
CREATE TABLE IF NOT EXISTS user_milestones (
  user_id       TEXT NOT NULL,
  milestone     TEXT NOT NULL,  -- 'signup','magic_moment','second_session','paid','churned'
  achieved_at   TEXT NOT NULL DEFAULT (datetime('now')),
  metadata      TEXT,           -- JSON blob
  PRIMARY KEY (user_id, milestone)
);

CREATE TABLE IF NOT EXISTS upgrade_prompts_shown (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT NOT NULL,
  trigger    TEXT NOT NULL,
  feature    TEXT,
  shown_at   TEXT NOT NULL DEFAULT (datetime('now')),
  dismissed  INTEGER NOT NULL DEFAULT 0,
  converted  INTEGER NOT NULL DEFAULT 0
);
```

## Activation Dashboard (PostHog)

Build one insight per funnel stage + pin to "Activation" dashboard:

1. **Funnel chart** — 5 stages, weekly trend, segment by signup method
2. **Retention table** — activated vs. not, 7/14/30 day columns
3. **Time-to-activation histogram** — p50/p90 in minutes
4. **Upgrade prompt conversion rate** — by trigger type
5. **Magic-moment correlation heatmap** — which events precede paid conversion

## See

- `analytics-configuration` — PostHog init + standard events
- `feature-flags-and-experiments` — A/B test upgrade prompts
- `conversion-optimization` — landing page + CTA patterns
- `stripe-billing` / `square-payments` — subscription_started → revenue
