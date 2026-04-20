#!/bin/bash
# Visual TDD Loop: Screenshot → GPT-4o Vision Analysis → Fix → Redeploy → Repeat
# Usage: ./visual-tdd-loop.sh <URL> [max_iterations]
#
# Requires: OPENAI_API_KEY in .env.local
# Outputs: screenshots to .playwright-screenshots/, analysis to stdout

set -euo pipefail

URL="${1:?Usage: visual-tdd-loop.sh <URL> [max_iterations]}"
MAX_ITER="${2:-5}"
SCREENSHOT_DIR=".playwright-screenshots"
ENV_LOCAL="/Users/apple/emdash-projects/worktrees/rare-chefs-film-8op/.env.local"

# Load API key
if [ -f "$ENV_LOCAL" ]; then
  OPENAI_API_KEY=$(grep '^OPENAI_API_KEY=' "$ENV_LOCAL" | cut -d= -f2)
fi
: "${OPENAI_API_KEY:?OPENAI_API_KEY not found}"

mkdir -p "$SCREENSHOT_DIR"

BREAKPOINTS=(
  "375:667:iPhone-SE"
  "390:844:iPhone-14"
  "768:1024:iPad"
  "1024:768:iPad-Landscape"
  "1280:720:Laptop"
  "1920:1080:Desktop"
)

screenshot_all_breakpoints() {
  local iter=$1
  for bp in "${BREAKPOINTS[@]}"; do
    IFS=: read -r w h name <<< "$bp"
    npx playwright screenshot \
      --viewport-size="${w},${h}" \
      "$URL" \
      "${SCREENSHOT_DIR}/iter${iter}-${name}.png" 2>/dev/null || true
  done
}

analyze_screenshot() {
  local image_path=$1
  local base64_image
  base64_image=$(base64 -i "$image_path")

  curl -s "https://api.openai.com/v1/chat/completions" \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"model\": \"gpt-4o\",
      \"max_tokens\": 1000,
      \"messages\": [{
        \"role\": \"user\",
        \"content\": [
          {\"type\": \"text\", \"text\": \"You are a senior UI/UX engineer doing visual QA. Analyze this screenshot for defects. Report ONLY actual problems — not subjective preferences. Check for: layout breaks, text overflow, broken images, misalignment, poor contrast, missing content, horizontal scroll on mobile, buttons too small for touch (<44px), broken responsive design. Format: JSON array of objects with fields: severity (critical/high/medium), element (what's broken), description (what's wrong), fix (how to fix it). Return empty array [] if no issues found.\"},
          {\"type\": \"image_url\", \"image_url\": {\"url\": \"data:image/png;base64,$base64_image\"}}
        ]
      }]
    }" | python3 -c "import sys,json; r=json.load(sys.stdin); print(r['choices'][0]['message']['content'])" 2>/dev/null
}

echo "=== Visual TDD Loop: $URL ==="
echo "Max iterations: $MAX_ITER"
echo ""

for ((i=1; i<=MAX_ITER; i++)); do
  echo "--- Iteration $i ---"
  echo "Screenshotting at 6 breakpoints..."
  screenshot_all_breakpoints "$i"

  ALL_CLEAN=true
  for bp in "${BREAKPOINTS[@]}"; do
    IFS=: read -r w h name <<< "$bp"
    SCREENSHOT="${SCREENSHOT_DIR}/iter${i}-${name}.png"
    if [ -f "$SCREENSHOT" ]; then
      echo "Analyzing ${name} (${w}x${h})..."
      RESULT=$(analyze_screenshot "$SCREENSHOT")
      if [ "$RESULT" != "[]" ] && [ -n "$RESULT" ]; then
        echo "ISSUES at ${name}:"
        echo "$RESULT"
        ALL_CLEAN=false
      else
        echo "  ${name}: CLEAN"
      fi
    fi
  done

  if $ALL_CLEAN; then
    echo ""
    echo "=== ALL BREAKPOINTS CLEAN at iteration $i ==="
    exit 0
  fi

  echo ""
  echo "Issues found. Fix and redeploy, then re-run or continue to iteration $((i+1))."
  echo ""
done

echo "=== Max iterations ($MAX_ITER) reached. Manual review needed. ==="
exit 1
