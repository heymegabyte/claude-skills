#!/bin/bash
# Shared charmbracelet styling for all Emdash hooks and scripts
# Tools: gum (styling), glow (markdown rendering), freeze (screenshots), mods (AI), vhs (recordings)
# Source this: . ~/.claude/hooks/style.sh

export CYAN="#00E5FF"
export BLUE="#50AAE3"
export PURPLE="#7C3AED"
export BLACK="#060610"
export GREEN="#2ECC40"
export YELLOW="#FFDC00"
export RED="#FF4136"

# ── Core Styled Output ──
emdash_header() { gum style --foreground "$CYAN" --border-foreground "$BLUE" --border double --padding "1 3" --margin "1 0" --width 72 --align center "$@" >&2; }
emdash_section() { echo "" >&2; gum style --foreground "$CYAN" --bold "━━━ $* ━━━" >&2; }
emdash_info() { gum log -sl info "$@" >&2; }
emdash_warn() { gum log -sl warn "$@" >&2; }
emdash_error() { gum log -sl error "$@" >&2; }
emdash_debug() { gum log -sl debug "$@" >&2; }
emdash_success() { gum style --foreground "$GREEN" --bold "✓ $*" >&2; }
emdash_fail() { gum style --foreground "$RED" --bold "✗ $*" >&2; }
emdash_item() { printf "  $(gum style --foreground "$BLUE" '▸') %s\n" "$*" >&2; }
emdash_bullet() { printf "  $(gum style --foreground "$GREEN" '●') %s\n" "$*" >&2; }
emdash_next() { printf "  $(gum style --foreground "$YELLOW" '→') %s\n" "$*" >&2; }
emdash_rec() { printf "  $(gum style --foreground "$PURPLE" '◆') %s\n" "$*" >&2; }
emdash_kv() { printf "  %-20s %s\n" "$1:" "$(gum style --foreground "$BLUE" "$2")" >&2; }
emdash_spin() { local msg="$1"; shift; gum spin --spinner dot --title "$msg" -- "$@"; }

emdash_footer() {
  echo "" >&2
  gum style --foreground "$PURPLE" --border-foreground "$PURPLE" --border rounded --padding "0 2" --width 72 "$@" >&2
  echo "" >&2
}

# ── Markdown Rendering (glow) ──
emdash_markdown() { glow -s dark -w 72 "$@" >&2; }
emdash_markdown_string() { echo "$*" | glow -s dark -w 72 >&2; }

# ── Code Screenshot (freeze) ──
emdash_freeze() {
  # Usage: emdash_freeze output.png < file.ts
  # or: echo "code" | emdash_freeze output.png
  freeze -o "${1:-screenshot.png}" --theme "dracula" --padding 20 --margin 20 --border.radius 8 --shadow.blur 10 --window
}

# ── Progress Bar ──
emdash_progress() {
  local done=$1 total=$2 label="${3:-Progress}"
  local pct=$((done * 100 / total))
  local filled=$((pct / 5))
  local empty=$((20 - filled))
  local bar=$(printf "%${filled}s" | tr ' ' '█')$(printf "%${empty}s" | tr ' ' '░')
  printf "  %-16s %s %s\n" "$label:" "$(gum style --foreground "$CYAN" "$bar")" "$(gum style --foreground "$BLUE" "$done/$total ($pct%)")" >&2
}

# ── Status Indicator ──
emdash_status() {
  local label=$1 status=$2
  local color="$BLUE"
  local icon="●"
  case "$status" in
    pass|green|ok|live|running) color="$GREEN"; icon="✓";;
    fail|red|error|down) color="$RED"; icon="✗";;
    warn|yellow|pending) color="$YELLOW"; icon="⚠";;
    skip|gray|disabled) color="#666666"; icon="○";;
  esac
  printf "  %-30s %s\n" "$label" "$(gum style --foreground "$color" "$icon $status")" >&2
}

# ── Deploy Check ──
emdash_check_url() {
  local url=$1
  local code=$(curl -so /dev/null -w "%{http_code}" --connect-timeout 5 "$url" 2>/dev/null)
  local time=$(curl -so /dev/null -w "%{time_total}" --connect-timeout 5 "$url" 2>/dev/null)
  if [ "$code" = "200" ]; then
    emdash_status "$url" "live"
    printf "  %-30s %s\n" "" "$(gum style --foreground "$BLUE" "${time}s response")" >&2
  else
    emdash_status "$url" "fail"
    printf "  %-30s %s\n" "" "$(gum style --foreground "$RED" "HTTP $code")" >&2
  fi
}
