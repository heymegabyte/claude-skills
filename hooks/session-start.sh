#!/bin/bash
# SessionStart: load env, detect context, print compact status
source "$HOME/.claude/hooks/style.sh" 2>/dev/null || true

# Load secrets: project .env.local → CLAUDE_ENV_FILE → master .env.local (superset)
MASTER_ENV="$HOME/emdash-projects/worktrees/rare-chefs-film-8op/.env.local"
[ -f "$MASTER_ENV" ] && { set -a; source "$MASTER_ENV" 2>/dev/null; set +a; }
ENV_LOCAL="${CLAUDE_ENV_FILE:-$(pwd)/.env.local}"
[ -f "$ENV_LOCAL" ] && { set -a; source "$ENV_LOCAL" 2>/dev/null; set +a; }

BRANCH=$(git branch --show-current 2>/dev/null || echo "no-git")
PROJECT=$(basename "$(pwd)")
MEMORY_DIR=$(find "$HOME/.claude/projects" -maxdepth 2 -name "memory" -type d 2>/dev/null | head -1)
MEMORY_CT=$(ls "$MEMORY_DIR"/*.md 2>/dev/null | wc -l | tr -d ' ')
SKILLS_CT=$(find "$HOME/.agentskills" -name "*.md" -not -path "*/.git/*" -not -name "MEMORY.md" 2>/dev/null | wc -l | tr -d ' ')
AGENTS_CT=$(ls "$HOME/.agentskills/agents/"*.md 2>/dev/null | wc -l | tr -d ' ')
PROJECTS_CT=$(ls -d "$HOME/emdash-projects"/*/ 2>/dev/null | wc -l | tr -d ' ')
DOMAINS_CT=$(grep -c "^Active\|^Dormant" "$MEMORY_DIR/user_domain_portfolio.md" 2>/dev/null || echo "?")
HOSTNAME_SHORT=$(hostname -s 2>/dev/null)
CHEZMOI_DIR="$HOME/.local/share/chezmoi/home/.chezmoitemplates/secrets-$HOSTNAME_SHORT"
SECRETS_CT=$(ls "$CHEZMOI_DIR" 2>/dev/null | wc -l | tr -d ' ')

# Project type detection
if [ -f "wrangler.toml" ] || [ -f "wrangler.jsonc" ]; then TYPE="cf-worker"
elif [ -f "angular.json" ]; then TYPE="angular"
elif [ -f "package.json" ] && grep -q "hono" package.json 2>/dev/null; then TYPE="hono-api"
elif [ -f "docker-compose.yml" ]; then TYPE="docker"
elif [ -f "package.json" ]; then TYPE="node"
else TYPE="unknown"; fi

gum style --foreground "#00E5FF" --border-foreground "#50AAE3" --border rounded --padding "0 1" --margin "0" --width 72 \
  "⚡ Emdash OS v6.0 | $PROJECT ($TYPE) | $BRANCH" \
  "$(gum style --foreground '#50AAE3' "memory:$MEMORY_CT | skills:$SKILLS_CT | agents:$AGENTS_CT | projects:$PROJECTS_CT | secrets:$SECRETS_CT keys")" >&2

exit 0
