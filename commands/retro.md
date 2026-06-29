# /retro — Auto-generate arc retrospective

Generate a timestamped arc retrospective from the past 7 days of git history in `~/.agentskills`.

## Usage

```
/retro                        # default: 7 days
/retro --since 14             # 14 days
/retro --out ~/Desktop/retro.md
```

## Output

Creates `retrospectives/arc-YYYY-MM-DD-auto.md` in the plugin root with:

```
# Arc Retrospective — YYYY-MM-DD
Generated: <timestamp>
Period: <N> days

## Summary
- <N> commits across <M> files
- +<added> / -<deleted> lines

## By Pack
### 01-operating-system — <N> commits, <±LOC>
  Changes: <1-2 line summary>

### rules/ — <N> commits, <±LOC>
  <patterns observed>

## Files Created
- <path>
- <path>

## Files Deleted
- <path>

## Next Steps
(blank — Brian fills narrative)
```

## Implementation

```bash
# Run from ~/.agentskills
cd ~/.agentskills

DAYS=${1:-7}
OUT="retrospectives/arc-$(date +%Y-%m-%d)-auto.md"
mkdir -p "$(dirname "$OUT")"

cat > "$OUT" << 'HEADER'
# Arc Retrospective — $(date +%Y-%m-%d)
HEADER

echo "Period: $DAYS days" >> "$OUT"
echo "" >> "$OUT"

# Log
echo "## Commits" >> "$OUT"
git log --oneline --since="${DAYS} days ago" --format='- %h %s' >> "$OUT"

# LOC delta
echo "" >> "$OUT"
echo "## Stats" >> "$OUT"
git diff --shortstat $(git rev-list --max-parents=0 HEAD) HEAD --since="${DAYS} days ago" >> "$OUT"

# Files changed
echo "" >> "$OUT"
echo "## Files Changed" >> "$OUT"
git diff --name-status $(git rev-list --max-parents=0 HEAD) HEAD --since="${DAYS} days ago" >> "$OUT"

# By pack
echo "" >> "$OUT"
echo "## By Pack" >> "$OUT"
for pack in rules/ 0[0-9]-*; do
  COUNT=$(git log --oneline --since="${DAYS} days ago" -- "$pack" | wc -l | tr -d ' ')
  [ "$COUNT" = "0" ] && continue
  DELTA=$(git diff --shortstat HEAD --since="${DAYS} days ago" -- "$pack" | tail -1)
  echo "- **${pack%/}** — $COUNT commits, $DELTA" >> "$OUT"
done

echo "" >> "$OUT"
echo "## Narrative (Brian fills)" >> "$OUT"

echo "Wrote $OUT"
```
