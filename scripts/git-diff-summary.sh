#!/bin/bash
# Usage: ./git-diff-summary.sh [target-branch]
# Outputs: number of files changed, lines added, lines deleted (vs. target branch)


TARGET=${1:-main}

# Exclude deleted files and generated files
EXCLUDES=(
  ':(exclude)package-lock.json'
  ':(exclude)src/sanity/extract.json'
  ':(exclude)src/sanity/types.ts'
)

# Get diff summary (vs. merge-base), skipping deleted and generated files
DIFF_STAT=$(git diff --stat --diff-filter=ACMRT "$TARGET..." "${EXCLUDES[@]}")
SHORTSTAT=$(git diff --shortstat --diff-filter=ACMRT "$TARGET..." "${EXCLUDES[@]}")


# Count files changed
FILES_CHANGED=$(echo "$DIFF_STAT" | grep 'files changed' | awk '{print $1}')
if [[ -z "$FILES_CHANGED" ]]; then
  # If only one file changed, --stat omits the summary line
  FILES_CHANGED=$(echo "$DIFF_STAT" | grep -c '|')
fi


# Parse lines added and deleted
ADDED=$(echo "$SHORTSTAT" | grep -oE '[0-9]+ insertions?' | grep -oE '[0-9]+' || echo 0)
DELETED=$(echo "$SHORTSTAT" | grep -oE '[0-9]+ deletions?' | grep -oE '[0-9]+' || echo 0)

# Output
echo "- Files changed: $FILES_CHANGED"
echo "- Lines added: ${ADDED:-0}"
NET=$(( ${ADDED:-0} - ${DELETED:-0} ))
echo "Net lines changed: $NET"
