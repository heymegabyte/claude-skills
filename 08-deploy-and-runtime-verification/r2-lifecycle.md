# R2 Lifecycle Management (***UNIVERSAL — EVERY CLOUDFLARE WORKER WITH R2***)
R2 buckets accumulate stale deploy artifacts (Angular chunks, source-map files, old marketing builds) at one generation per deploy. Without lifecycle hygiene a 200-route site bucket bloats to 4,000+ objects in 6 months, $0.015/GB/month adds up, and audit/cleanup work explodes. **Wrangler v4 does NOT list R2 objects** (`wrangler r2 object` = get|put|delete only) — use REST API or S3-compat CLI for inventory, wrangler for delete.

## Inventory (***THREE CANONICAL PATHS — PICK FIRST AVAILABLE***)
```bash
# (A) S3-compat CLI — preferred when aws-cli or rclone installed. Set ~/.aws/credentials [r2] profile with R2 access-key-id+secret from CF dashboard r2 API tokens page.
aws s3 ls "s3://project-sites-production/marketing/" --recursive \
  --endpoint-url "https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com" --profile r2 > /tmp/r2-marketing.txt

# (B) REST list — works with GLOBAL KEY, no install. Cursor pagination in 6 lines of bash.
ACCOUNT=84fa0d1b16ff8086dd958c468ce7fd59 BUCKET=project-sites-production PREFIX=marketing/
CURSOR=""; > /tmp/r2-marketing.json
echo "[" > /tmp/r2-marketing.json
FIRST=1
while :; do
  RESP=$(curl -s "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT/r2/buckets/$BUCKET/objects?per_page=1000&prefix=$PREFIX${CURSOR:+&cursor=$CURSOR}" \
    -H "X-Auth-Email: $CLOUDFLARE_EMAIL" -H "X-Auth-Key: $CLOUDFLARE_API_KEY")
  KEYS=$(echo "$RESP" | jq -c '.result[]')
  [ -n "$KEYS" ] && { [ $FIRST -eq 0 ] && echo ","; echo "$KEYS" | paste -sd ',' -; FIRST=0; } >> /tmp/r2-marketing.json
  CURSOR=$(echo "$RESP" | jq -r 'if .result_info.is_truncated then .result_info.cursor else empty end')
  [ -z "$CURSOR" ] && break
done
echo "]" >> /tmp/r2-marketing.json

# (C) Quick key-only inventory (no metadata)
ACCOUNT=84fa0d1b16ff8086dd958c468ce7fd59 BUCKET=project-sites-production PREFIX=marketing/
CURSOR=""; > /tmp/r2-keys.txt
while :; do
  RESP=$(curl -s "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT/r2/buckets/$BUCKET/objects?per_page=1000&prefix=$PREFIX${CURSOR:+&cursor=$CURSOR}" \
    -H "X-Auth-Email: $CLOUDFLARE_EMAIL" -H "X-Auth-Key: $CLOUDFLARE_API_KEY")
  echo "$RESP" | jq -r '.result[].key' >> /tmp/r2-keys.txt
  CURSOR=$(echo "$RESP" | jq -r 'if .result_info.is_truncated then .result_info.cursor else empty end')
  [ -z "$CURSOR" ] && break
done
wc -l /tmp/r2-keys.txt
```
Common prefixes in `project-sites-production`: `sites/<slug>/` (client data — PRESERVE) | `marketing/` (homepage assets) | `templates/<category>/` | `app/` (legacy admin SPA) | `container/` (build artifacts) | `retrospectives/` (debug dumps) | `test/` (probes).

## Stale-asset classification (***Angular/Vite hash-named chunks accumulate fastest***)
```bash
# Identify hash-named build artifacts: chunk-ABC123.js, main-XYZ456.js, polyfills-DEF.js
grep -E "/(chunk|main|polyfills)-[A-Z0-9]+\.js$" /tmp/r2-keys.txt > /tmp/stale-chunks.txt
# Identify all CSS bundles (Angular/Vite generate one per deploy)
grep -E "\.css$" /tmp/r2-keys.txt > /tmp/stale-css.txt
# Cross-reference against the LIVE homepage references — anything live = preserve
curl -fsSL https://projectsites.dev/ > /tmp/live-homepage.html
grep -oE 'src="[^"]+"|href="[^"]+"' /tmp/live-homepage.html | sed 's/^[^"]*"//; s/"$//' | sort -u > /tmp/live-refs.txt
# Final delete list = stale candidates MINUS live refs
comm -23 <(sort /tmp/stale-chunks.txt) <(sort /tmp/live-refs.txt) > /tmp/r2-delete.txt
```

## Batch delete (***ONLY AFTER USER CONFIRMATION on production buckets***)
```bash
# Dry-run first
wc -l /tmp/r2-delete.txt # confirm count matches expectation
head -10 /tmp/r2-delete.txt # confirm pattern matches expectation
# Execute with parallel concurrency. wrangler r2 object delete IS native (verified v4.63.0).
# P=4 safe, P=8 OK, never >P=16 — R2 rate-limits at 1000 ops/s/bucket
xargs -I{} -P 4 npx wrangler r2 object delete "<bucket>/{}" --remote < /tmp/r2-delete.txt
# Verify post-delete by re-listing
# (re-run inventory script above)
```

## Lifecycle policy (***SHIP WITH EVERY NEW BUCKET***)
Cloudflare R2 supports object lifecycle rules via `wrangler r2 bucket lifecycle`. Apply at bucket creation:
```bash
# Auto-delete deploy artifacts older than 30 days
npx wrangler r2 bucket lifecycle add <bucket> --prefix marketing/ --age-days 30 --action delete --remote
# Preserve client data (sites/) — no lifecycle rule, manual purge only on subscription end
# Transition rarely-accessed templates to Infrequent Access tier after 60 days
npx wrangler r2 bucket lifecycle add <bucket> --prefix templates/ --age-days 60 --action transition-ia --remote
```
Without lifecycle rules every deploy is a permanent cost. **Verify with**: `npx wrangler r2 bucket lifecycle list <bucket> --remote`.

## Prevention (***BUILD-CONFIG CHANGES***)
- Vite/Angular `outDir` should write to a versioned subdirectory (`marketing/v<commit-sha>/`), with the worker resolving `marketing/index.html` → latest version. Old versions become trivially purgeable by directory.
- Worker upload script (`scripts/deploy-r2.mjs`) MUST delete old artifacts before uploading new ones — never just `--no-prefix` upload that accumulates.
- Per `~/.claude/rules/builtin-tools-first.md`: probe `wrangler <subcommand> --help` before citing — wrangler v4 r2 object has no `list`. REST endpoint or `aws s3 ls --endpoint-url` are the real list paths.

## Reference incident (2026-05-16 — `project-sites-production`)
4,746 objects total. `marketing/` had 1,160 objects of which 1,132 (97.5%) were stale Angular SPA hash-named chunks accumulated over ~138 deploy generations — the live homepage is now vanilla HTML and references none of them. Root cause: Angular admin SPA was previously deployed to `marketing/` prefix instead of `app/`, and deploy script didn't purge before upload. Fix bundle: (1) one-time delete per pattern above, (2) bucket lifecycle rule `--prefix marketing/ --age-days 30 --action delete`, (3) deploy script clean-before-upload step. Net: bucket from 4,746 → 3,543 objects (-25%). Side lesson during the cleanup: the rule first written for this incident prescribed `wrangler r2 object list` — does NOT exist (only get|put|delete). Always probe CLIs before citing them.

## See Also
`~/.claude/rules/builtin-tools-first.md` (universal vendor-CLI-first rule) | `~/.agentskills/08-deploy-and-runtime-verification/SKILL.md` (deploy gate) | `migrations/_applied.md` (wrangler global-key rejection on D1 migrations only — does NOT extend to R2).
