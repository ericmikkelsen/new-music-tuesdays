---
name: git-workflow-and-versioning
description: Structures git workflow practices. Use when making any code change. Use when committing, branching, resolving conflicts, or when you need to organize work across multiple parallel streams.
---

# Git Workflow and Versioning

## Overview

Git is your safety net. Treat commits as save points, branches as sandboxes, and history as documentation. With AI agents generating code at high speed, disciplined version control is the mechanism that keeps changes manageable, reviewable, and reversible.

## When to Use

Always. Every code change flows through git.

## Core Principles

### Trunk-Based Development (Recommended)

Keep `main` always deployable. Work in short-lived feature branches that merge back within 1-3 days.

### 1. Commit Early, Commit Often

Each successful increment gets its own commit. Don't accumulate large uncommitted changes.

### 2. Atomic Commits

Each commit does one logical thing.

### 3. Descriptive Messages (Conventional Commits)

**Format:**

```
<type>(<optional scope>): <short description>

<optional body explaining why, not what>
```

**Types:**

- `feat` — New feature (triggers minor version bump)
- `fix` — Bug fix (triggers patch version bump)
- `refactor` — Code change that neither fixes a bug nor adds a feature
- `test` — Adding or updating tests
- `docs` — Documentation only
- `chore` — Tooling, dependencies, config
- `perf` — Performance improvement
- `ci` — CI/CD changes
- `build` — Build system changes
- `style` — Formatting, whitespace (no behavior change)

**Breaking changes:** Append `!` after the type or add `BREAKING CHANGE:` in the footer to trigger a major version bump.

```
feat!: remove deprecated API endpoint

BREAKING CHANGE: The /v1/tasks endpoint has been removed. Use /v2/tasks instead.
```

### 4. Keep Concerns Separate

Don't combine formatting changes with behavior changes.

### 5. Size Your Changes

Target ~100 lines per commit/PR.

## Branch Naming

```
feature/<short-description>   → feature/task-creation
fix/<short-description>       → fix/duplicate-tasks
chore/<short-description>     → chore/update-deps
refactor/<short-description>  → refactor/auth-module
```

## Versioning

This project uses [Conventional Commits](https://www.conventionalcommits.org/) with automated versioning via [semantic-release](https://semantic-release.gitbook.io/semantic-release/):

- `fix:` → patch bump (1.0.0 → 1.0.1)
- `feat:` → minor bump (1.0.0 → 1.1.0)
- `feat!:` or `BREAKING CHANGE:` → major bump (1.0.0 → 2.0.0)

Every push to `main` is evaluated immediately; semantic-release tags the release and updates `CHANGELOG.md` automatically.

## Pre-Commit Hygiene

Before every commit:

```bash
git diff --staged          # Check what you're committing
npm test                   # Run tests
npm run lint               # Run linting
```

## Verification

For every commit:

- [ ] Commit does one logical thing
- [ ] Message follows conventional commit format (`type: description`)
- [ ] Tests pass before committing
- [ ] No secrets in the diff
- [ ] `.gitignore` covers standard exclusions
