#!/bin/bash
# Analyze a single screenshot with GPT-4o Vision
# Usage: ./gpt4o-vision-analyze.sh <image_path> [prompt]
# Returns JSON analysis of visual issues

set -euo pipefail

IMAGE_PATH="${1:?Usage: gpt4o-vision-analyze.sh <image_path> [prompt]}"
CUSTOM_PROMPT="${2:-}"
ENV_LOCAL="/Users/apple/emdash-projects/worktrees/rare-chefs-film-8op/.env.local"

if [ -f "$ENV_LOCAL" ]; then
  OPENAI_API_KEY=$(grep '^OPENAI_API_KEY=' "$ENV_LOCAL" | cut -d= -f2)
fi
: "${OPENAI_API_KEY:?OPENAI_API_KEY not found}"

BASE64_IMAGE=$(base64 -i "$IMAGE_PATH")

DEFAULT_PROMPT="You are a senior UI/UX engineer. Analyze this screenshot and report:
1. Layout issues (overflow, misalignment, overlap, gaps)
2. Typography issues (too small, truncated, wrong font, poor contrast)
3. Image issues (broken, stretched, missing alt text placeholders)
4. Interactive issues (buttons too small, links not visible, missing states)
5. Brand consistency (colors, fonts, spacing)
6. Accessibility (contrast ratio, touch target size, focus indicators)

Rate overall quality 1-10. List specific fixes needed.
Format as JSON: {score: number, issues: [{severity, element, description, fix}], summary: string}"

PROMPT="${CUSTOM_PROMPT:-$DEFAULT_PROMPT}"

curl -s "https://api.openai.com/v1/chat/completions" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"model\": \"gpt-4o\",
    \"max_tokens\": 2000,
    \"messages\": [{
      \"role\": \"user\",
      \"content\": [
        {\"type\": \"text\", \"text\": $(echo "$PROMPT" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))')},
        {\"type\": \"image_url\", \"image_url\": {\"url\": \"data:image/png;base64,$BASE64_IMAGE\"}}
      ]
    }]
  }" | python3 -c "import sys,json; r=json.load(sys.stdin); print(r['choices'][0]['message']['content'])"
