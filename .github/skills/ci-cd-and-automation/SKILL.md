---
name: ci-cd-and-automation
description: Automates CI/CD pipeline setup. Use when setting up or modifying build and deployment pipelines. Use when you need to automate quality gates, configure test runners in CI, or establish deployment strategies.
---

# CI/CD and Automation

## Overview

Automate quality gates so that no change reaches production without passing tests, lint, type checking, and build. CI/CD is the enforcement mechanism for every other skill — it catches what humans and agents miss, and it does so consistently on every single change.

**Shift Left:** Catch problems as early in the pipeline as possible.

**Faster is Safer:** Smaller batches and more frequent releases reduce risk.

## When to Use

- Setting up a new project's CI pipeline
- Adding or modifying automated checks
- Configuring deployment pipelines
- Debugging CI failures

## The Quality Gate Pipeline

Every change goes through these gates before merge:

```
Pull Request Opened → Lint → Type Check → Tests → Build → Security Audit → Ready for review
```

**No gate can be skipped.** If lint fails, fix lint — don't disable the rule.

## GitHub Actions Configuration

### Basic CI Pipeline

```yaml
name: CI
on:
    pull_request:
        branches: [main]
    push:
        branches: [main]

jobs:
    quality:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - uses: actions/setup-node@v4
              with:
                  node-version: '22'
                  cache: 'npm'
            - run: npm ci
            - run: npm run lint
            - run: npx tsc --noEmit
            - run: npm test -- --coverage
            - run: npm run build
            - run: npm audit --audit-level=high
```

## Conventional Commits + Release Automation

This project uses [semantic-release](https://semantic-release.gitbook.io/semantic-release/) for automated releases triggered by conventional commits. The workflow is in `.github/workflows/semantic-release.yml`.

## Dependabot

Dependency updates are automated via `.github/dependabot.yml` with weekly npm updates.

## Environment Management

```
.env.example       → Committed (template)
.env               → NOT committed (local)
CI secrets         → Stored in GitHub Secrets
```

## Verification

After setting up or modifying CI:

- [ ] All quality gates present (lint, types, tests, build, audit)
- [ ] Pipeline runs on every PR and push to main
- [ ] Failures block merge (branch protection configured)
- [ ] Secrets stored in secrets manager, not in code
