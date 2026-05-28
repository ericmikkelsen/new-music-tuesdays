# Plan: Example Workflow Tasks

This file is a starter example. Copy and adapt it for your feature.

## Motivation

Use this plan to translate a feature spec into small, reviewable tasks with
clear acceptance criteria.

## Acceptance Criteria

- [ ] Every task has clear, testable acceptance criteria
- [ ] Tasks are ordered by dependency and can be implemented incrementally
- [ ] Task status is tracked in `tasks/todo.md`
- [ ] Scope notes capture non-goals and out-of-scope items

## Tasks

## Notes For Next Story (Content-Focused)

### Astro content collections

- Astro content collections are file-based (`src/content/**`), while Sanity is a remote API source.
- For the next content-heavy story, evaluate Astro Content Layer API with a custom Sanity loader.
- Goal: keep Sanity as the source of truth while gaining collection-style ergonomics and typed content access.
- Preserve preview behavior (draft perspective + token requirements) when designing the loader workflow.

### Decisions from latest spec answers

- Generate practical starter Astro templates with default props and conditional rendering patterns.
- Make `body` field type prompt-selectable in component scaffold.
- Use fixed component output folders by type:
    - `src/components/atoms`
    - `src/components/molecules`
    - `src/components/organisms`
    - `src/components/blocks`
- Keep a post-core idea in backlog for Sanity Agent Actions: “Make me a page like X”.

### Known follow-up from chapter 01 review

- Consolidate duplicated page query/mapping logic between legacy fetch helpers and content-layer helpers to prevent contract drift.

### Task 1: Define scope and constraints

**Acceptance:**

- Capture user problem, goals, and non-goals
- List technical constraints and assumptions
- Confirm dependencies on existing components or services

### Task 2: Implement smallest vertical slice

**Acceptance:**

- Deliver the smallest end-to-end path that proves the approach
- Add or update tests for expected behavior
- Keep the change reviewable and focused

### Task 3: Add quality gates and checks

**Acceptance:**

- Ensure lint, type-check, tests, and build steps are defined
- Verify local checks match CI expectations
- Document any required environment setup

### Task 4: Prepare PR communication

**Acceptance:**

- Summarize what changed and why
- Include validation evidence (tests, screenshots, or logs)
- Highlight risks, rollback notes, and follow-up tasks
