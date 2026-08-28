#!/usr/bin/env bash
#
# Scan the repository for key-shaped strings.
#
# Exit codes — the difference between "clean" and "did not run" is the whole
# point of this script. A scanner that silently no-ops is worse than no scanner.
#   0  CLEAN       — the scan ran and found nothing
#   1  FOUND       — the scan ran and found at least one candidate secret
#   2  DID NOT RUN — the scan could not run (not a git repo, no files, no grep)
set -uo pipefail

SELF="scripts/check-secrets.sh"

fail_to_run() {
  printf 'check-secrets: DID NOT RUN — %s\n' "$1" >&2
  exit 2
}

command -v git >/dev/null 2>&1 || fail_to_run "git is not on PATH"
command -v grep >/dev/null 2>&1 || fail_to_run "grep is not on PATH"
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || fail_to_run "not inside a git work tree"

# Tracked files plus untracked-but-not-ignored files: an untracked file is one
# `git add` away from being committed, so it is in scope. Gitignored paths
# (.env, node_modules, .next) are excluded — that is what --exclude-standard does.
# This script is skipped because it necessarily contains the patterns themselves.
mapfile -t FILES < <(git ls-files --cached --others --exclude-standard | grep -v -x -F "$SELF")
[ "${#FILES[@]}" -gt 0 ] || fail_to_run "git ls-files returned no files to scan"

# Each pattern is anchored on a real key prefix plus a length floor, so the
# placeholders in .env.example do not trip it.
PATTERNS=(
  'sk-ant-[A-Za-z0-9_-]{20,}'
  're_[A-Za-z0-9]{24,}'
  'sk_(live|test)_[A-Za-z0-9]{16,}'
  'eyJ[A-Za-z0-9_-]{10,}[.]eyJ[A-Za-z0-9_-]{10,}[.][A-Za-z0-9_-]{10,}'
  'sbp_[A-Za-z0-9]{20,}'
  'AKIA[0-9A-Z]{16}'
  'AIza[0-9A-Za-z_-]{35}'
  'ghp_[A-Za-z0-9]{36}'
  '-----BEGIN [A-Z ]*PRIVATE KEY-----'
  '(SUPABASE_SERVICE_ROLE_KEY|ANTHROPIC_API_KEY|RESEND_API_KEY|UPSTASH_REDIS_REST_TOKEN|USDA_FDC_API_KEY)[[:space:]]*=[[:space:]]*.?[A-Za-z0-9_.-]{32,}'
)

# The last pattern above is a length-based backstop, not a prefix match, so it
# needs an escape hatch for the two things that legitimately look like a long
# assignment: a code reference to the variable, and a self-describing
# placeholder in .env.example. Keep this list short — every entry is a hole.
IGNORE='process[.]env|replace-with-your|your-[a-z-]*(key|token|ref|endpoint)|<[a-z-]+>'

findings=0
for pattern in "${PATTERNS[@]}"; do
  if matches=$(grep -n -I -E "$pattern" -- "${FILES[@]}" 2>/dev/null | grep -v -E "$IGNORE"); then
    printf '%s\n' "$matches"
    findings=$((findings + 1))
  fi
done

if [ "$findings" -gt 0 ]; then
  printf 'check-secrets: FOUND — %d pattern(s) matched across %d file(s).\n' \
    "$findings" "${#FILES[@]}" >&2
  printf 'check-secrets: rotate anything real, then remove it from the working tree and history.\n' >&2
  exit 1
fi

printf 'check-secrets: CLEAN — scanned %d file(s) against %d pattern(s), 0 findings.\n' \
  "${#FILES[@]}" "${#PATTERNS[@]}"
exit 0
