#!/usr/bin/env bash
# provision-analytics.sh — auto-provision GA4 + GTM + PostHog + Sentry for any project.
# Usage: provision-analytics.sh <project_slug> <primary_domain> [worker_name]
#   project_slug   — kebab-case identifier (e.g. labor-megabyte-space)
#   primary_domain — naked domain (e.g. labor.megabyte.space)
#   worker_name    — wrangler worker name, defaults to project_slug
# Idempotent: re-runs against existing resources return their existing IDs.
# Master tokens required (load order: env → chezmoi via get-secret):
#   POSTHOG_PERSONAL_API_KEY   https://us.posthog.com/settings/user-api-keys (scopes: project:write, organization:read)
#   SENTRY_AUTH_TOKEN          https://sentry.io/settings/account/api/auth-tokens/ (scopes: project:admin, project:write, project:read, org:read, team:read)
#   GCP ADC                    gcloud auth application-default login --scopes=...analytics.edit,...tagmanager.edit.containers,...tagmanager.publish
# Output: KEY=value lines on stdout (consumable by `eval $(provision-analytics.sh ...)` or source).

set -euo pipefail

PROJECT="${1:?Usage: provision-analytics.sh <project_slug> <primary_domain> [worker_name]}"
DOMAIN="${2:?Usage: provision-analytics.sh <project_slug> <primary_domain> [worker_name]}"
WORKER="${3:-$PROJECT}"
ROOT_URL="https://${DOMAIN}"

# Style helpers — degrade gracefully if not loaded
source "$HOME/.claude/hooks/style.sh" 2>/dev/null || true
log()  { emdash_log    "$@" 2>/dev/null || echo "[analytics] $*" >&2; }
ok()   { emdash_log    "$@" 2>/dev/null || echo "[analytics][ok] $*" >&2; }
warn() { emdash_warn   "$@" 2>/dev/null || echo "[analytics][WARN] $*" >&2; }
fail() { emdash_error  "$@" 2>/dev/null || echo "[analytics][ERR] $*" >&2; }

# Secret loader: env first, then chezmoi via get-secret
load_secret() {
  local name="$1"; local val
  val="${!name:-}"
  if [ -z "$val" ] && command -v get-secret >/dev/null 2>&1; then
    val="$(get-secret "$name" 2>/dev/null || true)"
  fi
  printf '%s' "$val"
}

POSTHOG_TOKEN="$(load_secret POSTHOG_PERSONAL_API_KEY)"
SENTRY_TOKEN="$(load_secret SENTRY_AUTH_TOKEN)"
SENTRY_ORG="${SENTRY_ORG:-megabyte-labs}"
SENTRY_TEAM="${SENTRY_TEAM:-megabyte-labs}"
POSTHOG_HOST="${POSTHOG_HOST:-https://us.posthog.com}"
GA4_TIMEZONE="${GA4_TIMEZONE:-America/New_York}"
GA4_CURRENCY="${GA4_CURRENCY:-USD}"

OUT_DIR="${TMPDIR:-/tmp}/provision-analytics-${PROJECT}"
mkdir -p "$OUT_DIR"

# ──────────────────────────────────────────────────────────────────────
# GA4 — Analytics Admin API v1beta
# ──────────────────────────────────────────────────────────────────────
provision_ga4() {
  local token property_id stream_id measurement_id account_id existing
  if ! command -v gcloud >/dev/null 2>&1; then warn "gcloud missing — skipping GA4"; return; fi
  token="$(gcloud auth application-default print-access-token 2>/dev/null || true)"
  if [ -z "$token" ]; then warn "no GCP ADC — skipping GA4 (run: gcloud auth application-default login --scopes=...analytics.edit)"; return; fi

  account_id="$(curl -sf -H "Authorization: Bearer $token" \
    "https://analyticsadmin.googleapis.com/v1beta/accounts" 2>/dev/null \
    | python3 -c "import sys,json; d=json.load(sys.stdin); a=d.get('accounts',[]); print(a[0]['name'].split('/')[-1] if a else '')" 2>/dev/null || true)"
  if [ -z "$account_id" ]; then warn "no GA4 account found — create one at https://analytics.google.com first"; return; fi

  existing="$(curl -sf -H "Authorization: Bearer $token" \
    "https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent:accounts/${account_id}" 2>/dev/null \
    | python3 -c "
import sys,json
d=json.load(sys.stdin);
for p in d.get('properties',[]):
    if p.get('displayName')=='${DOMAIN}': print(p['name'].split('/')[-1]); break" 2>/dev/null || true)"

  if [ -n "$existing" ]; then
    property_id="$existing"; log "GA4 property exists: properties/$property_id"
  else
    log "Creating GA4 property for $DOMAIN"
    property_id="$(curl -sf -X POST -H "Authorization: Bearer $token" -H "Content-Type: application/json" \
      "https://analyticsadmin.googleapis.com/v1beta/properties" \
      -d "{\"parent\":\"accounts/${account_id}\",\"displayName\":\"${DOMAIN}\",\"timeZone\":\"${GA4_TIMEZONE}\",\"currencyCode\":\"${GA4_CURRENCY}\",\"industryCategory\":\"BUSINESS_AND_INDUSTRIAL_MARKETS\"}" \
      | python3 -c "import sys,json; print(json.load(sys.stdin)['name'].split('/')[-1])")"
    ok "GA4 property: properties/$property_id"
    # Data retention 14mo
    curl -sf -X PATCH -H "Authorization: Bearer $token" -H "Content-Type: application/json" \
      "https://analyticsadmin.googleapis.com/v1beta/properties/${property_id}/dataRetentionSettings?updateMask=eventDataRetention" \
      -d '{"eventDataRetention":"FOURTEEN_MONTHS"}' >/dev/null 2>&1 || true
  fi

  measurement_id="$(curl -sf -H "Authorization: Bearer $token" \
    "https://analyticsadmin.googleapis.com/v1beta/properties/${property_id}/dataStreams" \
    | python3 -c "
import sys,json
d=json.load(sys.stdin)
for s in d.get('dataStreams',[]):
    if s.get('type')=='WEB_DATA_STREAM' and s.get('webStreamData',{}).get('defaultUri')=='${ROOT_URL}':
        print(s['webStreamData']['measurementId']); break" 2>/dev/null || true)"
  if [ -z "$measurement_id" ]; then
    log "Creating GA4 web data stream"
    measurement_id="$(curl -sf -X POST -H "Authorization: Bearer $token" -H "Content-Type: application/json" \
      "https://analyticsadmin.googleapis.com/v1beta/properties/${property_id}/dataStreams" \
      -d "{\"displayName\":\"Web — ${DOMAIN}\",\"type\":\"WEB_DATA_STREAM\",\"webStreamData\":{\"defaultUri\":\"${ROOT_URL}\"}}" \
      | python3 -c "import sys,json; print(json.load(sys.stdin)['webStreamData']['measurementId'])")"
    ok "GA4 measurement ID: $measurement_id"
  fi
  echo "VITE_GA4_ID=${measurement_id}"
  echo "GA4_PROPERTY_ID=${property_id}"
}

# ──────────────────────────────────────────────────────────────────────
# GTM — Tag Manager API v2
# ──────────────────────────────────────────────────────────────────────
provision_gtm() {
  local token account_id container_id public_id existing
  if ! command -v gcloud >/dev/null 2>&1; then warn "gcloud missing — skipping GTM"; return; fi
  token="$(gcloud auth application-default print-access-token 2>/dev/null || true)"
  if [ -z "$token" ]; then warn "no GCP ADC — skipping GTM"; return; fi

  account_id="$(curl -sf -H "Authorization: Bearer $token" \
    "https://tagmanager.googleapis.com/tagmanager/v2/accounts" 2>/dev/null \
    | python3 -c "import sys,json; a=json.load(sys.stdin).get('account',[]); print(a[0]['accountId'] if a else '')" 2>/dev/null || true)"
  if [ -z "$account_id" ]; then warn "no GTM account — create one at https://tagmanager.google.com first"; return; fi

  existing="$(curl -sf -H "Authorization: Bearer $token" \
    "https://tagmanager.googleapis.com/tagmanager/v2/accounts/${account_id}/containers" 2>/dev/null \
    | python3 -c "
import sys,json
d=json.load(sys.stdin)
for c in d.get('container',[]):
    if c.get('name')=='${DOMAIN}': print(c['containerId']+'|'+c['publicId']); break" 2>/dev/null || true)"

  if [ -n "$existing" ]; then
    container_id="${existing%|*}"; public_id="${existing#*|}"
    log "GTM container exists: $public_id"
  else
    log "Creating GTM container for $DOMAIN"
    local resp
    resp="$(curl -sf -X POST -H "Authorization: Bearer $token" -H "Content-Type: application/json" \
      "https://tagmanager.googleapis.com/tagmanager/v2/accounts/${account_id}/containers" \
      -d "{\"name\":\"${DOMAIN}\",\"domainName\":[\"${DOMAIN}\"],\"usageContext\":[\"web\"]}")"
    container_id="$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin)['containerId'])")"
    public_id="$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin)['publicId'])")"
    ok "GTM container: $public_id"
  fi
  echo "VITE_GTM_ID=${public_id}"
  echo "GTM_CONTAINER_ID=${container_id}"
}

# ──────────────────────────────────────────────────────────────────────
# PostHog — Cloud REST API
# ──────────────────────────────────────────────────────────────────────
provision_posthog() {
  local org_id existing project_key
  if [ -z "$POSTHOG_TOKEN" ]; then warn "POSTHOG_PERSONAL_API_KEY missing — skipping PostHog (mint at https://us.posthog.com/settings/user-api-keys)"; return; fi

  org_id="$(curl -sf -H "Authorization: Bearer $POSTHOG_TOKEN" \
    "${POSTHOG_HOST}/api/organizations/@current/" 2>/dev/null \
    | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null || true)"
  if [ -z "$org_id" ]; then fail "PostHog auth failed"; return; fi

  existing="$(curl -sf -H "Authorization: Bearer $POSTHOG_TOKEN" \
    "${POSTHOG_HOST}/api/organizations/${org_id}/projects/" 2>/dev/null \
    | python3 -c "
import sys,json
d=json.load(sys.stdin)
for p in d.get('results',[]):
    if p.get('name')=='${DOMAIN}': print(p.get('api_token','')); break" 2>/dev/null || true)"

  if [ -n "$existing" ]; then
    project_key="$existing"; log "PostHog project exists"
  else
    log "Creating PostHog project for $DOMAIN"
    project_key="$(curl -sf -X POST -H "Authorization: Bearer $POSTHOG_TOKEN" -H "Content-Type: application/json" \
      "${POSTHOG_HOST}/api/organizations/${org_id}/projects/" \
      -d "{\"name\":\"${DOMAIN}\"}" \
      | python3 -c "import sys,json; print(json.load(sys.stdin)['api_token'])")"
    ok "PostHog project key minted"
  fi
  echo "VITE_POSTHOG_KEY=${project_key}"
  echo "VITE_POSTHOG_HOST=${POSTHOG_HOST}"
}

# ──────────────────────────────────────────────────────────────────────
# Sentry — REST API v0
# ──────────────────────────────────────────────────────────────────────
provision_sentry() {
  local slug existing dsn
  if [ -z "$SENTRY_TOKEN" ]; then warn "SENTRY_AUTH_TOKEN missing — skipping Sentry (mint at https://sentry.io/settings/account/api/auth-tokens/)"; return; fi
  slug="${PROJECT}"

  existing="$(curl -sf -H "Authorization: Bearer $SENTRY_TOKEN" \
    "https://sentry.io/api/0/projects/${SENTRY_ORG}/${slug}/keys/" 2>/dev/null \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['dsn']['public'] if d else '')" 2>/dev/null || true)"

  if [ -n "$existing" ]; then
    dsn="$existing"; log "Sentry project exists: $slug"
  else
    log "Creating Sentry project: $slug"
    curl -sf -X POST -H "Authorization: Bearer $SENTRY_TOKEN" -H "Content-Type: application/json" \
      "https://sentry.io/api/0/teams/${SENTRY_ORG}/${SENTRY_TEAM}/projects/" \
      -d "{\"name\":\"${DOMAIN}\",\"slug\":\"${slug}\",\"platform\":\"javascript-cloudflare-workers\"}" >/dev/null 2>&1 || true
    sleep 1
    dsn="$(curl -sf -H "Authorization: Bearer $SENTRY_TOKEN" \
      "https://sentry.io/api/0/projects/${SENTRY_ORG}/${slug}/keys/" \
      | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['dsn']['public'])")"
    ok "Sentry DSN minted"
  fi
  echo "SENTRY_DSN=${dsn}"
  echo "VITE_SENTRY_DSN=${dsn}"
}

# ──────────────────────────────────────────────────────────────────────
# Main — provision all four, write env file, optionally push wrangler secrets
# ──────────────────────────────────────────────────────────────────────
OUTPUT_ENV="${OUT_DIR}/analytics.env"
: > "$OUTPUT_ENV"

provision_ga4     >> "$OUTPUT_ENV"
provision_gtm     >> "$OUTPUT_ENV"
provision_posthog >> "$OUTPUT_ENV"
provision_sentry  >> "$OUTPUT_ENV"

cat "$OUTPUT_ENV"

# If WRANGLER_PUSH=1 + worker known, push SENTRY_DSN to worker secrets
if [ "${WRANGLER_PUSH:-0}" = "1" ] && grep -q "^SENTRY_DSN=" "$OUTPUT_ENV"; then
  log "Pushing SENTRY_DSN to worker '$WORKER'"
  DSN="$(grep '^SENTRY_DSN=' "$OUTPUT_ENV" | cut -d= -f2-)"
  echo -n "$DSN" | npx wrangler secret put SENTRY_DSN --name "$WORKER" >/dev/null 2>&1 \
    && ok "Wrangler secret SENTRY_DSN set on $WORKER" \
    || warn "Wrangler secret push failed (auth?)"
fi

# If LOCAL_ENV=path-to-.env.local, append VITE_* + SENTRY vars idempotently
if [ -n "${LOCAL_ENV:-}" ] && [ -f "$LOCAL_ENV" ]; then
  log "Updating $LOCAL_ENV"
  while IFS= read -r line; do
    [ -z "$line" ] && continue
    key="${line%%=*}"
    if grep -qE "^${key}=" "$LOCAL_ENV"; then
      sed -i.bak "s|^${key}=.*|${line}|" "$LOCAL_ENV" && rm -f "${LOCAL_ENV}.bak"
    else
      echo "$line" >> "$LOCAL_ENV"
    fi
  done < "$OUTPUT_ENV"
  ok ".env.local updated"
fi

log "Done. Output: $OUTPUT_ENV"
