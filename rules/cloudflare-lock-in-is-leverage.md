---
name: "cloudflare-lock-in-is-leverage"
priority: 2
pack: "backend"
triggers:
  - "cloudflare"
  - "workers"
paths:
  - "concern:cloudflare-workers"
---

# Cloudflare Lock-In Is Leverage

"Avoid vendor lock-in" is wisdom written for teams that have ten engineers and three years to migrate. The solo + AI shop has one builder and zero appetite for refactor projects that produce no customer value. Deep Cloudflare lock-in saves more wall-time than migration optionality ever pays back — every single time. The lock-in IS the leverage.

This is heretical to every senior architect's training. It is correct for THIS stack.

## The math (why this is right)

- **Abstraction tax compounds.** Every "data access layer" that wraps `env.DB` to "stay portable" adds friction to every feature, on every commit, forever.
- **Migration tax is theoretical.** You never migrate. Multi-cloud projects launched to "avoid lock-in" almost always pick a primary cloud and treat the other as a hot fallback nobody tests. The fallback rots; the primary becomes the stack anyway. You paid the abstraction tax for years and got no portability.
- **Lock-in cost is bounded.** Worst case: rewrite to AWS in the same number of weeks the abstraction layer would have cost over its life. Best case (the normal case): never rewrite, save those weeks, ship faster forever.
- **Cloudflare's primitives are uniquely productive.** Workers + D1 + DO + R2 + KV + Workflows + Vectorize + Container DOs + Hyperdrive + AI Gateway + Sessions API + Time Travel. The combined primitive surface is faster to ship against than any equivalent assembled across AWS/GCP. The lock-in IS the productivity.

## Do

- Reach for CF primitives first per `05-architecture-and-stack` decision tree. Workers, D1, R2, KV, DO, Queues, Vectorize, AI, Workflows v2, Containers, Sessions API, Hyperdrive.
- Type bindings via `wrangler types` per `code-style` § Runtime — call `env.DB` / `env.SITES_BUCKET` directly. No data-access abstraction layer.
- Use CF-specific patterns proudly: `ctx.waitUntil`, `ctx.passThroughOnException`, JSRPC entrypoints, Sessions API bookmarks, D1 Time Travel, R2 lifecycle Standard→IA. These are leverage, not lock-in liabilities.
- Build the stack assuming Cloudflare is the substrate forever per `god-tier-engineering`.

## Don't

- ❌ Wrap `env.DB` in a `Database` interface "in case we switch to Neon later." If you actually switch, swap at that point.
- ❌ Add a "storage provider" abstraction over R2 to "support S3 too." You don't need S3.
- ❌ Use a portability ORM layer over Drizzle+D1's CF specifics. Drizzle RQBv2 + D1 Sessions API is the sweet spot per `code-style`.
- ❌ Build a "queue abstraction" over CF Queues + Workflows v2 because "what if we move to SQS." You won't.
- ❌ Architect "to be cloud-agnostic." Architect to be Cloudflare-native.

## Allowed exceptions (the actual genuine fallbacks)

- **Neon Postgres** when CF D1 cannot meet the requirement (advanced SQL, RLS-as-tenant-isolation, OLAP) per `05-architecture-and-stack` § fallback decision tree. Front with **Hyperdrive** — still CF-native.
- **Upstash Redis** when CF KV/DO cannot meet a specific need (Redis primitives at scale). Both Hyperdrive and Upstash are CF *partners*; they're not "multi-cloud," they're CF-extending.
- **Sentry / PostHog / Stripe / Resend / Clerk** — third-party SaaS for problems outside CF's surface. Not lock-in exits; CF is the substrate, these are the integrations.

## What the team-shop wisdom got right (and doesn't apply here)

- "Vendor lock-in" wisdom assumes: (a) you have the headcount to migrate, (b) you'll outgrow the vendor's pricing, (c) the vendor's roadmap may diverge from yours. For a solo SaaS at <$100k/mo on CF Workers, none of those hold. CF stays 10-100× cheaper than AWS-equivalent through the lifetime of the platform.

## Tension partner — `cloudflare-hostable-supervisor`

These two rules look contradictory but compose cleanly:

- **This rule** (`lock-in-is-leverage`) is the DEFAULT — reach for raw `env.DB` / `env.SITES_BUCKET` / `env.QUEUE.send()` first. Reject premature abstraction.
- **`cloudflare-hostable-supervisor`** defines adapter ports (`StoragePort`, `KvPort`, `SqlPort`, `QueuePort`, `AiPort`, `VectorPort`) that apply ONLY when one of the `Allowed exceptions` above (Neon via Hyperdrive, Upstash, third-party SaaS) is genuinely needed.

Resolution: never wrap a CF primitive "just in case". Only introduce an adapter port when a real Allowed-exception dependency is being added. The default never pays the abstraction tax.
