# Story and Chapter Branch Policy

This repository includes a GitHub Action that enforces generic, reusable story/chapter branch flow.

## Branch Naming

- Story branches: `story/<story-slug>`
- Chapter branches: `chapter/<story-slug>/<chapter-slug>`

## Enforced Rules

- `story/<story-slug>` pull requests must target `main`
- `chapter/<story-slug>/<chapter-slug>` pull requests must target `story/<story-slug>` (this implicitly blocks chapters targeting `main` directly)
- Story slugs must match between chapter and story branches
- For same-repo pull requests, chapter branches must be based on their target story branch

Workflow file: `.github/workflows/branch-flow-policy.yml`

## Required GitHub Settings

Add branch protections or rulesets so this check is required before merge:

- Require status check: `Validate story/chapter PR flow`
- Protect `main` from direct pushes
- Limit direct pushes to `story/*` and `chapter/*` to trusted automation/accounts only

Note: GitHub permissions are pattern-based, not branch-lineage based. Lineage is validated by the workflow using git ancestry checks.
