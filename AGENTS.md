# Repository Agent Assumptions

These assumptions apply to agent-driven work in this repository.

## Comments and JSDoc

- Add descriptive comments and JSDoc where appropriate.
- Prefer comments that explain intent, constraints, or non-obvious behavior.
- Do not add noisy comments that restate obvious code.
- Add JSDoc to public helpers, config surfaces, loaders, and other reusable code when it improves maintainability.

## Commits

- Write small conventional commits.
- Each commit should cover one idea only.
- Keep commit diffs reviewable so opening a single commit in GitHub shows one coherent change.
- Do not mix unrelated behavior, formatting, or refactor work in the same commit.

## Language Scope

- Keep chapter/story sequencing language in Markdown files only.
- Do not add chapter/story wording to non-Markdown files (source code, tests, config, generated artifacts, or inline code comments).

## Review Tools

- Use `scripts/git-diff-summary.sh [target-branch]` to quickly summarize files and lines changed versus another branch.
    - This script automatically skips deleted files, `package-lock.json`, and Sanity typegen files (`src/sanity/extract.json`, `src/sanity/types.ts`).
    - Useful for reviewers to check the true reviewability budget and ignore generated artifacts.
    - Example: `./scripts/git-diff-summary.sh main`

- For reviewability budget details, see `.github/skills/code-review-and-quality/SKILL.md`.

- Always check the diff summary before finalizing a PR or chapter branch.

## Source of Truth

- Keep this file aligned with [.github/copilot-instructions.md](.github/copilot-instructions.md) when shared assumptions change.
