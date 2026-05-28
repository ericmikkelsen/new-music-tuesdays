#!/usr/bin/env bash
# validate-branch-flow.sh
#
# Enforces story/chapter PR flow for any story name. Run by the
# "Branch Flow Policy" GitHub Actions workflow on every pull request.
#
# Allowed flows:
#   chapter/<story>/<chapter>  →  story/<story>
#   story/<story>              →  main
#
# Other branch types (feature/*, fix/*, etc.) are not checked and pass freely.

set -euo pipefail

# GitHub Actions populates these for pull_request events.
head_branch="${GITHUB_HEAD_REF:-}"   # source branch of the PR
base_branch="${GITHUB_BASE_REF:-}"   # target branch of the PR
head_repo="${HEAD_REPO_FULL_NAME:-}" # repo the head branch lives in (set by workflow env)
base_repo="${BASE_REPO_FULL_NAME:-}" # repo the base branch lives in (set by workflow env)
this_repo="${GITHUB_REPOSITORY:-}"   # the repo this workflow runs in

# Skip when running outside a pull_request context (e.g. manual workflow_dispatch).
if [[ -z "${head_branch}" || -z "${base_branch}" ]]; then
  echo "No pull_request branch context found. Skipping branch flow validation."
  exit 0
fi

# Returns true if the branch matches story/<slug>
# Slug may contain lowercase alphanumerics, dots, underscores, and hyphens.
is_story_branch() {
  [[ "$1" =~ ^story\/[a-z0-9._-]+$ ]]
}

# Returns true if the branch matches chapter/<story-slug>/<chapter-slug>
is_chapter_branch() {
  [[ "$1" =~ ^chapter\/[a-z0-9._-]+\/[a-z0-9._-]+$ ]]
}

# Extracts the story slug from a chapter branch name.
# e.g. chapter/my-story/01-scaffold  →  my-story
chapter_story_slug() {
  local branch="$1"
  echo "${branch#chapter/}" | cut -d'/' -f1
}

fail() {
  echo "ERROR: $1"
  exit 1
}

echo "Validating branch flow: head=${head_branch} base=${base_branch}"

# Rule 1: chapter branches must target their matching story branch.
# e.g. chapter/foo/01-scaffold must target story/foo, not story/bar or main.
if is_chapter_branch "${head_branch}"; then
  story_slug="$(chapter_story_slug "${head_branch}")"
  expected_base="story/${story_slug}"

  if [[ "${base_branch}" != "${expected_base}" ]]; then
    fail "${head_branch} must target ${expected_base}, but targets ${base_branch}."
  fi
fi

# Rule 2: story branches must target main.
if is_story_branch "${head_branch}"; then
  if [[ "${base_branch}" != "main" ]]; then
    fail "${head_branch} must target main, but targets ${base_branch}."
  fi
fi

# Rule 3: anything targeting a story branch must be a chapter branch from the same story.
# Blocks non-chapter branches (feature/*, hotfix/*, etc.) from merging into a story directly.
# Slug alignment is already enforced by Rule 1.
if is_story_branch "${base_branch}"; then
  if ! is_chapter_branch "${head_branch}"; then
    fail "PRs targeting ${base_branch} must come from chapter/<story>/<chapter> branches."
  fi
fi

# Rule 4: ancestry check — verify the chapter branch is actually based on its target story branch.
# Only runs when the PR involves a story or chapter branch, and only for same-repo PRs
# (forks skip this because remote refs may not be available).
if (is_chapter_branch "${head_branch}" || is_story_branch "${head_branch}" || is_story_branch "${base_branch}") \
  && [[ "${head_repo}" == "${this_repo}" && "${base_repo}" == "${this_repo}" ]]; then
  # Fetch both refs quietly; allow failure in case a branch was just created.
  git fetch --no-tags origin \
    "+refs/heads/${base_branch}:refs/remotes/origin/${base_branch}" \
    "+refs/heads/${head_branch}:refs/remotes/origin/${head_branch}" >/dev/null 2>&1 || true

  if git rev-parse --verify "origin/${base_branch}" >/dev/null 2>&1 \
    && git rev-parse --verify "origin/${head_branch}" >/dev/null 2>&1; then
    # --is-ancestor exits 0 if base is reachable from head, 1 otherwise.
    if ! git merge-base --is-ancestor "origin/${base_branch}" "origin/${head_branch}"; then
      fail "${head_branch} is not based on ${base_branch}. Rebase or branch from the correct base."
    fi
  fi
fi

echo "Branch flow policy checks passed."
