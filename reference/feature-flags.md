# Feature Flags — reference schema

Sourced on demand by `rules/feature-flags.md`. The D1 `feature_flags` table DDL (fallback engine; the rule's Architecture section describes all 3 tables + governance columns + defaults).

## Schema

```sql
CREATE TABLE IF NOT EXISTS feature_flags (
  key             TEXT PRIMARY KEY,
  enabled         INTEGER NOT NULL DEFAULT 0,
  rollout_percent INTEGER NOT NULL DEFAULT 0,
  stage           TEXT NOT NULL DEFAULT 'experimental',
  description     TEXT NOT NULL DEFAULT '',        -- 240-1200 chars prose runbook
  e2e_tests       TEXT NOT NULL DEFAULT '[]',      -- JSON array of test file paths
  smoke_steps     TEXT NOT NULL DEFAULT '',        -- markdown ordered list
  owner_email     TEXT NOT NULL DEFAULT '',
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
```
