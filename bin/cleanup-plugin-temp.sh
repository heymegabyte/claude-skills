#!/bin/bash
# Clean stale temp directories in ~/.claude/plugins/cache/
# Deletes temp_git_* and temp_subdir_*.clone dirs older than 7 days.
# --dry-run: list only, no delete.

DRY_RUN=false
for arg in "$@"; do
  [ "$arg" = "--dry-run" ] && DRY_RUN=true
done

CACHE="$HOME/.claude/plugins/cache"
COUNT=0
BYTES=0

while IFS= read -r -d '' dir; do
  mtime=$(stat -f%m "$dir" 2>/dev/null)
  now=$(date +%s)
  age=$(( (now - mtime) / 86400 ))
  size=$(du -sk "$dir" 2>/dev/null | cut -f1)
  if $DRY_RUN; then
    echo "WOULD DELETE: $dir (${age}d, ${size}K)"
  else
    rm -rf "$dir"
    echo "DELETED: $dir (${age}d, ${size}K)"
  fi
  COUNT=$((COUNT + 1))
  BYTES=$((BYTES + size * 1024))
done < <(find "$CACHE" -maxdepth 2 \( -name 'temp_git_*' -o -name 'temp_subdir_*.clone' \) -type d -mtime +7 -print0 2>/dev/null)

echo "---"
echo "Items: $COUNT | Freed: $(( BYTES / 1024 / 1024 ))M"
