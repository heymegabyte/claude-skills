#!/bin/bash
# Emdash Secret Discovery Script
# Scans all known locations and outputs available keys as KEY=VALUE pairs
# Usage: source <(~/.agentskills/scripts/discover-secrets.sh)
# Or:    ~/.agentskills/scripts/discover-secrets.sh --check KEY_NAME

set -euo pipefail

CHEZMOI_SECRETS="$HOME/.local/share/chezmoi/home/.chezmoitemplates/secrets"
EMDASH_CONFIG="$HOME/.config/emdash"

# Dynamic .env.local discovery — search current dir, parent, home, then CLAUDE_ENV_FILE
ENV_LOCAL=""
for _candidate in ".env.local" "../.env.local" "$HOME/.env.local"; do
  [ -f "$_candidate" ] && { ENV_LOCAL="$_candidate"; break; }
done
[ -z "$ENV_LOCAL" ] && [ -n "${CLAUDE_ENV_FILE:-}" ] && [ -f "$CLAUDE_ENV_FILE" ] && ENV_LOCAL="$CLAUDE_ENV_FILE"

# Check mode: just verify a single key exists
if [ "${1:-}" = "--check" ] && [ -n "${2:-}" ]; then
  # Try chezmoi first
  if get-secret "$2" >/dev/null 2>&1; then
    echo "found:chezmoi"
    exit 0
  fi
  # Try .env.local
  if grep -q "^${2}=" "$ENV_LOCAL" 2>/dev/null; then
    echo "found:env-local"
    exit 0
  fi
  # Try emdash config
  if [ -f "$EMDASH_CONFIG/$2" ] || [ -f "$EMDASH_CONFIG/$(echo "$2" | tr '[:upper:]' '[:lower:]' | tr '_' '-')" ]; then
    echo "found:emdash-config"
    exit 0
  fi
  echo "not-found"
  exit 1
fi

# Full discovery mode
echo "=== Emdash Secret Discovery ==="
echo ""

# Priority services for product building
PRIORITY_KEYS=(
  # AI
  OPENAI_API_KEY ANTHROPIC_API_KEY GEMINI_API_KEY DEEPGRAM_API_KEY
  ELEVENLABS_API_KEY REPLICATE_API_KEY MISTRAL_API_KEY CEREBRAS_API_KEY
  # Cloud
  CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID CLOUDFLARE_API_KEY
  # Payments
  STRIPE_API_KEY STRIPE_SECRET_KEY
  # Email
  RESEND_API_KEY SENDGRID_API_KEY
  # Media
  PEXELS_API_KEY UNSPLASH_ACCESS_KEY IDEOGRAM_API_KEY
  # Social
  SLACK_WEBHOOK_URL SLACK_API_TOKEN DISCORD_BOT_TOKEN
  POSTIZ_API_KEY TWITTER_BEARER_TOKEN
  # Communication
  TWILIO_ACCOUNT_SID TWILIO_AUTH_TOKEN
  TELEGRAM_BOT_TOKEN
  # Dev
  GITHUB_TOKEN
  # Search
  GOOGLE_SEARCH_API_KEY SERP_API_KEY TAVILY_API_KEY
  # Self-hosted
  HASS_TOKEN
)

echo "Priority keys:"
for key in "${PRIORITY_KEYS[@]}"; do
  if get-secret "$key" >/dev/null 2>&1; then
    echo "  ✅ $key (chezmoi)"
  elif grep -q "^${key}=" "$ENV_LOCAL" 2>/dev/null; then
    echo "  ✅ $key (env-local)"
  else
    echo "  ❌ $key"
  fi
done

echo ""
echo "Coolify token: $([ -f "$EMDASH_CONFIG/coolify-token" ] && echo '✅' || echo '❌')"
echo "GCP service account: $([ -f "$EMDASH_CONFIG/gcp-service-account.json" ] && echo '✅' || echo '❌')"
