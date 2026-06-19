---
name: rollback-all-to-original
description: Panic-rollback button — reverses /migrate-all-to-hardened by restoring every MCP server from its archived original. Sequential to avoid ~/.claude.json collisions.
---

# /rollback-all-to-original [--dry-run] [--skip=<csv>] [--continue-on-failure]

Mirrors `/migrate-all-to-hardened` but in reverse. Finds every post-migration archive
(`mcp-servers/*-mcp.archived-*`), invokes `/migrate-to-hardened <base-name> --rollback`
for each, and prints a progress + summary table.

**This is the panic button.** Use when hardened MCPs misbehave in prod and you need
to instantly restore the original server configs without debugging.

## Usage

```
/rollback-all-to-original --dry-run
/rollback-all-to-original
/rollback-all-to-original --skip=stripe-mcp,resend-mcp
/rollback-all-to-original --continue-on-failure
```

## Arguments

| Flag | Default | Description |
|------|---------|-------------|
| `--dry-run` | off | Print what would be rolled back; make no changes |
| `--skip=<csv>` | none | Comma-separated base-names to skip (e.g. `stripe-mcp,github-mcp`) |
| `--continue-on-failure` | off | Don't abort on a failed rollback; log and continue |

## Logic

1. **Glob archives** — find `mcp-servers/*-mcp.archived-*` (any timestamp suffix).
   Derive base-name: strip `.archived-<timestamp>` suffix → `<name>-mcp`.
2. **Apply --skip** — filter out any base-names in the CSV list.
3. **Dry-run gate** — if `--dry-run`: print the plan table and exit 0.
4. **Sequential rollback loop** — for each archive (sorted by base-name for determinism):
   a. Print `[N/M] Rolling back <base-name>...`
   b. Invoke `/migrate-to-hardened <base-name> --rollback`.
   c. Capture exit code.
   d. On failure: if `--continue-on-failure` → log FAIL + continue; else → abort with summary.
5. **Print summary table** (see Output format).
6. **Emit post-rollback reminder** — tell user to restart Claude Code so `~/.claude.json`
   changes take effect.

## Output format

### Dry-run plan

```
DRY RUN — no changes will be made.

Rollback plan (9 servers):
  1. github-mcp          ← mcp-servers/github-mcp.archived-20260601T1430Z
  2. stripe-mcp          ← mcp-servers/stripe-mcp.archived-20260601T1430Z
  3. resend-mcp          ← mcp-servers/resend-mcp.archived-20260601T1430Z
  ...

Skipped: (none)

Run without --dry-run to execute.
```

### Live run progress

```
[1/9] Rolling back github-mcp...     ✓  2.1s
[2/9] Rolling back stripe-mcp...     ✓  1.8s
[3/9] Rolling back resend-mcp...     ✗  FAILED — see error above
[4/9] Aborting (use --continue-on-failure to skip failures)
```

### Summary table

```
┌─────────────────┬────────┬──────────┐
│ Server          │ Status │ Duration │
├─────────────────┼────────┼──────────┤
│ github-mcp      │ OK     │ 2.1s     │
│ stripe-mcp      │ OK     │ 1.8s     │
│ resend-mcp      │ FAIL   │ —        │
└─────────────────┴────────┴──────────┘

Rolled back: 2 / 3  |  Failed: 1  |  Skipped: 0

⚠ Restart Claude Code for ~/.claude.json changes to take effect.
```

## Execution script

```bash
DRY_RUN=false
SKIP_CSV=""
CONTINUE_ON_FAILURE=false

for arg in "$@"; do
  case "$arg" in
    --dry-run)              DRY_RUN=true ;;
    --skip=*)               SKIP_CSV="${arg#*=}" ;;
    --continue-on-failure)  CONTINUE_ON_FAILURE=true ;;
    *)
      echo "Unknown flag: $arg"
      echo "Usage: /rollback-all-to-original [--dry-run] [--skip=<csv>] [--continue-on-failure]"
      exit 1
      ;;
  esac
done

MCP_DIR="${HOME}/.claude/mcp-servers"

# Build skip set
declare -A SKIP_SET
IFS=',' read -ra SKIP_LIST <<< "$SKIP_CSV"
for s in "${SKIP_LIST[@]}"; do
  [[ -n "$s" ]] && SKIP_SET["$s"]=1
done

# Glob archives
mapfile -t ARCHIVES < <(
  find "$MCP_DIR" -maxdepth 1 -name '*-mcp.archived-*' -type d 2>/dev/null \
  | sort
)

if [[ ${#ARCHIVES[@]} -eq 0 ]]; then
  echo "No archived MCP servers found in $MCP_DIR"
  echo "Nothing to roll back."
  exit 0
fi

# Derive base-names
declare -a TARGETS
for archive in "${ARCHIVES[@]}"; do
  basename_full=$(basename "$archive")
  # Strip .archived-<anything>
  base="${basename_full%.archived-*}"
  [[ -z "${SKIP_SET[$base]}" ]] && TARGETS+=("$base")
done

TOTAL=${#TARGETS[@]}

if $DRY_RUN; then
  echo "DRY RUN — no changes will be made."
  echo ""
  echo "Rollback plan ($TOTAL servers):"
  for i in "${!TARGETS[@]}"; do
    archive=$(find "$MCP_DIR" -maxdepth 1 -name "${TARGETS[$i]}.archived-*" -type d | head -1)
    printf "  %2d. %-24s ← %s\n" $((i+1)) "${TARGETS[$i]}" "$(basename "$archive")"
  done
  echo ""
  [[ ${#SKIP_LIST[@]} -gt 0 ]] && echo "Skipped: ${SKIP_CSV}" || echo "Skipped: (none)"
  echo ""
  echo "Run without --dry-run to execute."
  exit 0
fi

OK=0
FAIL=0
FAILED_NAMES=()

for i in "${!TARGETS[@]}"; do
  base="${TARGETS[$i]}"
  printf "[%d/%d] Rolling back %-20s" $((i+1)) "$TOTAL" "${base}..."
  START=$(date +%s%N)

  # Invoke the per-server rollback (delegate to /migrate-to-hardened --rollback)
  # In practice Claude executes this as a Skill or Bash call; script form shown here.
  if claude-skill migrate-to-hardened "$base" --rollback 2>&1; then
    END=$(date +%s%N)
    ELAPSED=$(( (END - START) / 1000000 ))
    printf "  ✓  %dms\n" "$ELAPSED"
    ((OK++))
  else
    printf "  ✗  FAILED\n"
    ((FAIL++))
    FAILED_NAMES+=("$base")
    if ! $CONTINUE_ON_FAILURE; then
      echo ""
      echo "Aborting after failure on $base."
      echo "Run with --continue-on-failure to skip failures."
      break
    fi
  fi
done

echo ""
echo "Rolled back: $OK / $TOTAL  |  Failed: $FAIL  |  Skipped: ${#SKIP_LIST[@]}"

if [[ $FAIL -gt 0 ]]; then
  echo "Failed servers: ${FAILED_NAMES[*]}"
fi

echo ""
echo "⚠ Restart Claude Code for ~/.claude.json changes to take effect."
```

## Safety notes

- Sequential (never parallel) — `~/.claude.json` is a single JSON file; concurrent writes corrupt it.
- This command is idempotent: running it twice is safe (second run finds no archives to restore).
- After rollback, re-run `/audit-mcp-fleet` to verify config integrity.
- To re-harden after rollback: `/migrate-all-to-hardened`.
