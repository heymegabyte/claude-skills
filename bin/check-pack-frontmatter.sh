#!/usr/bin/env bash
# check-pack-frontmatter.sh — verify each rule's frontmatter `pack:` declaration
# matches an actual `_packs/*.yml` membership. Catches the pass-66-class drift
# where the rule claims pack X but pack X doesn't list it (or doesn't exist).
#
# Complements scripts/validate-packs.mjs (which enforces existence + ≥1-pack-
# membership but NOT frontmatter-pack-claim consistency).
#
# Usage:
#   bash ~/.agentskills/bin/check-pack-frontmatter.sh [--json]
#
# --json: uniform envelope per rules/uniform-json-output.md (8th caller of
#         bin/lib/emit-json.sh).

set -uo pipefail

JSON=0
for arg in "$@"; do
  case "$arg" in
    --json) JSON=1 ;;
  esac
done

SKILLS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SKILLS_ROOT" || exit 1

# shellcheck source=lib/emit-json.sh
. "$SKILLS_ROOT/bin/lib/emit-json.sh"

# Python does the heavy lifting — bash regex on YAML frontmatter is fragile.
RESULT=$(
  python3 <<'PY'
import os, re, glob, json
rules = {}
for f in glob.glob('rules/*.md'):
    name = os.path.basename(f).replace('.md','')
    txt = open(f).read()
    m = re.search(r'^pack:\s*"?([\w-]+)"?\s*$', txt, re.M)
    if m:
        rules[name] = m.group(1)
packs = {}
for f in glob.glob('_packs/*.yml'):
    name = os.path.basename(f).replace('.yml','')
    members = set(re.findall(r'^\s*-\s+rules/([\w-]+)', open(f).read(), re.M))
    packs[name] = members
drift = []
for rule, claimed in sorted(rules.items()):
    actual = sorted(p for p, ms in packs.items() if rule in ms)
    if claimed not in packs:
        drift.append({"rule": rule, "claimed_pack": claimed, "actual_packs": actual, "kind": "pack_file_missing"})
    elif rule not in packs[claimed]:
        drift.append({"rule": rule, "claimed_pack": claimed, "actual_packs": actual, "kind": "rule_not_in_claimed_pack"})
print(json.dumps({"drift": drift, "total_rules": len(rules), "total_packs": len(packs)}))
PY
)

DRIFT_COUNT=$(printf '%s' "$RESULT" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['drift']))")
TOTAL_RULES=$(printf '%s' "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['total_rules'])")
TOTAL_PACKS=$(printf '%s' "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['total_packs'])")

EXIT=0
[ "$DRIFT_COUNT" -gt 0 ] && EXIT=1

if [ "$JSON" = "0" ]; then
  printf '▸ Checking rule frontmatter pack: claims vs _packs/*.yml membership...\n' >&2
  printf '  Rules with pack: frontmatter: %d · Total pack files: %d\n' "$TOTAL_RULES" "$TOTAL_PACKS" >&2
  if [ "$DRIFT_COUNT" -gt 0 ]; then
    printf '%s' "$RESULT" | python3 -c '
import sys, json
d = json.load(sys.stdin)["drift"]
for x in d:
    actual = ", ".join(x["actual_packs"]) if x["actual_packs"] else "NONE"
    rule = x["rule"]
    claimed = x["claimed_pack"]
    print(f"  ✗ {rule:<40s} claimed→{claimed:<10s} actual→{actual}")
' >&2
    printf '\n━━━ SUMMARY: %d total rules · %d drift\n' "$TOTAL_RULES" "$DRIFT_COUNT" >&2
    printf '✗ frontmatter-pack drift detected — fix the rule frontmatter or add it to the claimed pack\n' >&2
  else
    printf '\n━━━ SUMMARY: %d total rules · 0 drift\n' "$TOTAL_RULES" >&2
    printf '✓ all rule frontmatter pack: claims match _packs/*.yml membership\n' >&2
  fi
fi

if [ "$JSON" = "1" ]; then
  META_TS=$(emit_iso_ts)
  META_GIT_SHA=$(emit_git_sha "$SKILLS_ROOT")
  META_BLOCK=$(emit_meta_block "$SKILLS_ROOT" "$META_TS" "$META_GIT_SHA" "default")
  DRIFT_JSON=$(printf '%s' "$RESULT" | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin)['drift']))")
  printf '{%s,"drift":%s,"summary":{"total_rules":%d,"total_packs":%d,"drift_count":%d,"exit":%d}}\n' \
    "$META_BLOCK" "$DRIFT_JSON" "$TOTAL_RULES" "$TOTAL_PACKS" "$DRIFT_COUNT" "$EXIT"
fi

exit "$EXIT"
