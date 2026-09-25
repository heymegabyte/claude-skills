# One-Way vs Two-Way Doors — self-argument template

Sourced on demand by `rules/one-way-two-way-doors.md`. Fill this before proceeding through a one-way (irreversible) door. Fields: Decision · Type · For · Against · Counterargument-defeated? · Confidence (≥0.7 to proceed) · Proceed. Write it in the commit message, or `docs/decisions/NNN-title.md` for anything larger than a 2-file change.

## Worked example

```
Decision: Switch from local KV rate limiting to Durable Objects for rate limiting.
Type: ONE-WAY (requires Worker + wrangler.toml change; existing KV rate limit data lost)

For:
- DOs give per-user global rate limit (KV is per-isolate, broken under concurrency)
- Eliminates the bug class described in [[state-is-the-enemy]]
- DO storage is transactional; KV writes are eventually consistent

Against:
- DO activation cost (~1ms) added to every rate-limited request
- Requires new DO class + bindings + wrangler.toml update
- Cannot be rolled back without redeploying

Counterargument defeated? YES — the per-isolate bug is a correctness issue, not a perf
question. The 1ms DO activation is negligible vs the correctness gain.

Confidence: 0.9 (above 0.7 threshold per [[autonomous-engineering]])
Proceed: Y
```
