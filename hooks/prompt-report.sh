#!/bin/bash
# End-of-prompt report: compact one-line format + config/repos detail
source "$HOME/.claude/hooks/style.sh" 2>/dev/null || true

emdash_report() {
  local project="${1:-$(basename "$(pwd)")}"
  local branch="${2:-$(git branch --show-current 2>/dev/null || echo 'none')}"

  # Gather state
  local memory_dir
  memory_dir=$(find "$HOME/.claude/projects" -maxdepth 2 -name "memory" -type d 2>/dev/null | head -1)
  local memory_count=$(ls "$memory_dir"/*.md 2>/dev/null | wc -l | tr -d ' ')
  local test_files=$(find . -name "*.spec.ts" -o -name "*.test.ts" 2>/dev/null | wc -l | tr -d ' ')
  local git_uncommitted=$(git status --short 2>/dev/null | wc -l | tr -d ' ')
  local recent_commits=$(git log --oneline --since="1 hour ago" 2>/dev/null | wc -l | tr -d ' ')
  local gh_repo=$(git remote get-url origin 2>/dev/null | sed 's|.*github.com[:/]||;s|\.git$||')
  local prod_url=$(grep -rE "PROD_URL|homepage" wrangler.toml package.json 2>/dev/null | head -1 | grep -oE 'https?://[^ "]+' | head -1)

  # Config files changed (last 30 min)
  local config_changes=""
  for f in $(find "$HOME/.claude" "$HOME/.agentskills" -name "*.md" -o -name "*.sh" -o -name "*.json" 2>/dev/null | xargs stat -f "%m %N" 2>/dev/null | awk -v cutoff="$(date -v-30M +%s 2>/dev/null || date -d '30 min ago' +%s 2>/dev/null)" '$1 > cutoff {print $2}'); do
    local short=$(echo "$f" | sed "s|$HOME/||")
    config_changes="${config_changes:+$config_changes, }$short"
  done

  # Memory files changed (last 30 min)
  local memory_changes=""
  for f in $(find "$memory_dir" -name "*.md" -mmin -30 2>/dev/null); do
    memory_changes="${memory_changes:+$memory_changes, }$(basename "$f")"
  done

  # Skills changes
  local skills_changed=$(cd "$HOME/.agentskills" && git diff --name-only HEAD~1 2>/dev/null | wc -l | tr -d ' ')

  # Print compact report
  echo "" >&2
  gum style --foreground "$CYAN" --bold "⚡ $project • $branch • $(date '+%H:%M') | git:${recent_commits}c/${git_uncommitted}u | mem:$memory_count | tests:$test_files | skills:$skills_changed△" >&2

  if [ -n "$config_changes" ]; then
    gum style --foreground "$BLUE" "Config: $config_changes" >&2
  else
    gum style --foreground "#666666" "Config: none" >&2
  fi

  if [ -n "$memory_changes" ]; then
    gum style --foreground "$PURPLE" "Memory: $memory_changes" >&2
  fi

  # Links
  local links=""
  [ -n "$gh_repo" ] && links="[Repo](https://github.com/$gh_repo)"
  [ -n "$prod_url" ] && links="$links | [Prod]($prod_url)"
  links="$links | [CF](https://dash.cloudflare.com) | [Skills](https://github.com/megabytespace/claude-skills)"
  gum style --foreground "#666666" "$links" >&2

  # Save to reports dir
  local report_dir="$HOME/.claude/reports"
  mkdir -p "$report_dir"
  printf '%s | %s | %s | git:%sc/%su | mem:%s | tests:%s\n' \
    "$(date '+%Y-%m-%d %H:%M')" "$project" "$branch" "$recent_commits" "$git_uncommitted" "$memory_count" "$test_files" \
    >> "$report_dir/session-log.txt"
}

export -f emdash_report 2>/dev/null || true
