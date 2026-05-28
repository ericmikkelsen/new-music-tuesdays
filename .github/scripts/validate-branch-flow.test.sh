#!/usr/bin/env bash
# validate-branch-flow.test.sh
#
# Unit tests for validate-branch-flow.sh.
# Each test injects env vars that the script reads, runs the script,
# and asserts on exit code and/or output.
#
# Usage:
#   bash .github/scripts/validate-branch-flow.test.sh
#
# Note: Rule 4 (ancestry check) requires live git remote refs so it is
# not covered here. It is tested by actually opening PRs in GitHub.

set -euo pipefail

SCRIPT=".github/scripts/validate-branch-flow.sh"
PASS=0
FAIL=0

# ── helpers ──────────────────────────────────────────────────────────────────

run() {
  # run <head> <base> [head_repo] [base_repo] [this_repo]
  GITHUB_HEAD_REF="${1}" \
  GITHUB_BASE_REF="${2}" \
  HEAD_REPO_FULL_NAME="${3:-}" \
  BASE_REPO_FULL_NAME="${4:-}" \
  GITHUB_REPOSITORY="${5:-}" \
    bash "${SCRIPT}" 2>&1
}

assert_pass() {
  local desc="$1"; shift
  local output exit_code=0
  output=$(run "$@") || exit_code=$?
  if [[ ${exit_code} -eq 0 ]]; then
    echo "  PASS  ${desc}"
    (( PASS++ )) || true
  else
    echo "  FAIL  ${desc}"
    echo "        output: ${output}"
    (( FAIL++ )) || true
  fi
}

assert_fail() {
  local desc="$1"; shift
  local expected_fragment="$2"; shift || true
  local output
  if output=$(run "$@" 2>&1); then
    echo "  FAIL  ${desc} (expected non-zero exit)"
    (( FAIL++ )) || true
  else
    if [[ -n "${expected_fragment}" && "${output}" != *"${expected_fragment}"* ]]; then
      echo "  FAIL  ${desc} (exit was non-zero but message missing: '${expected_fragment}')"
      echo "        output: ${output}"
      (( FAIL++ )) || true
    else
      echo "  PASS  ${desc}"
      (( PASS++ )) || true
    fi
  fi
}

# ── no-context guard ─────────────────────────────────────────────────────────

echo ""
echo "No PR context"

assert_pass "skips when head/base are empty" "" ""

# ── valid flows ───────────────────────────────────────────────────────────────

echo ""
echo "Valid flows"

assert_pass "chapter → matching story"          "chapter/my-story/01-scaffold"  "story/my-story"
assert_pass "story → main"                      "story/my-story"                "main"
assert_pass "feature → main (unrelated branch)" "feature/cool-thing"            "main"
assert_pass "fix → main (unrelated branch)"     "fix/broken-button"             "main"
assert_pass "chapter slug with numbers/dots"    "chapter/api-v2.0/03-handlers"  "story/api-v2.0"

# ── Rule 1: chapter must target its matching story ────────────────────────────

echo ""
echo "Rule 1 — chapter targets wrong story"

assert_fail \
  "chapter/foo → story/bar is rejected" \
  "must target story/foo" \
  "chapter/foo/01-scaffold" "story/bar"

assert_fail \
  "chapter/foo → main is rejected" \
  "must target story/foo" \
  "chapter/foo/01-scaffold" "main"

# ── Rule 2: story must target main ───────────────────────────────────────────

echo ""
echo "Rule 2 — story targets wrong base"

assert_fail \
  "story/foo → story/bar is rejected" \
  "must target main" \
  "story/foo" "story/bar"

assert_fail \
  "story/foo → develop is rejected" \
  "must target main" \
  "story/foo" "develop"

# ── Rule 3: non-chapter branch targeting a story is rejected ─────────────────

echo ""
echo "Rule 3 — non-chapter targeting a story branch"

assert_fail \
  "feature/x → story/foo is rejected" \
  "must come from chapter/" \
  "feature/cool-thing" "story/foo"

assert_fail \
  "fix/x → story/foo is rejected" \
  "must come from chapter/" \
  "fix/oops" "story/foo"

# ── summary ──────────────────────────────────────────────────────────────────

echo ""
echo "Results: ${PASS} passed, ${FAIL} failed"
[[ ${FAIL} -eq 0 ]]
