# Error Recovery
Transient(rate limit/timeout): retry exponential backoff max 3. Code bug: read→diagnose→fix→test. Config(missing env/binding): .env.local→wrangler.toml→fix. Architecture mismatch: stop→reassess→propose. External down: status→fallback→note.
Self-heal: Read FULL error+stack trace. Check CONVENTIONS.md known fixes. After fix: verify. After 3 fails: escalate with context.
NEVER: retry same failed command|suppress errors without logging|--force/--no-verify to bypass|ignore TypeScript errors
Deploy fail: read error→fix→retry. 3 fails→rollback via `wrangler rollback`→diagnose→deploy. Post-deploy fail→fix→redeploy→retest.
D1 recovery: Time Travel 30-day PIT recovery (`wrangler d1 time-travel restore`). D1→R2 backup for long-term. Batch failures: individual stmt errors in batch response array, check each.
Workers errors: CPU exceeded→split into ctx.waitUntil(). Memory exceeded→stream instead of buffer. Unhandled rejection→ctx.passThroughOnException() for graceful degradation. Binding missing→check wrangler.toml [vars]/[[d1_databases]]/[[kv_namespaces]].
MCP limits: Stripe 25/sec|GitHub 5000/hr|Firecrawl 1/sec/domain|Postiz 100/day. MCP priority: 1.Dedicated MCP 2.Bash+API 3.Computer Use(native only). OAuth expired→re-auth. Rate limited→backoff. Unreachable→check Coolify.
Sentry integration: breadcrumbs before risky ops, capture exception with context tags (worker|route|userId), release tracking via SENTRY_RELEASE env.
