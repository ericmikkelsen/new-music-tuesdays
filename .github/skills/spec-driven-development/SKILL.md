---
name: spec-driven-development
description: Creates specs before coding. Use when starting a new project, feature, or significant change and no specification exists yet. Use when requirements are unclear, ambiguous, or only exist as a vague idea.
---

# Spec-Driven Development

## Overview

Write a structured specification before writing any code. The spec is the shared source of truth between you and the human engineer — it defines what we're building, why, and how we'll know it's done. Code without a spec is guessing.

## When to Use

- Starting a new project or feature
- Requirements are ambiguous or incomplete
- The change touches multiple files or modules
- The task would take more than 30 minutes to implement

## The Gated Workflow

```
SPECIFY ──→ PLAN ──→ TASKS ──→ IMPLEMENT
   │          │        │          │
   ▼          ▼        ▼          ▼
 Human      Human    Human      Human
 reviews    reviews  reviews    reviews
```

## Spec Template

```markdown
# Spec: [Project/Feature Name]

## Objective

[What we're building and why. User stories or acceptance criteria.]

## Tech Stack

[Framework, language, key dependencies with versions]

## Commands

[Build, test, lint, dev — full commands]

## Project Structure

[Directory layout with descriptions]

## Code Style

[Example snippet + key conventions]

## Testing Strategy

[Framework, test locations, coverage requirements]

## Boundaries

- Always: [...]
- Ask first: [...]
- Never: [...]

## Success Criteria

[How we'll know this is done — specific, testable conditions]

## Open Questions

[Anything unresolved that needs human input]
```

## Surface Assumptions Immediately

Before writing any spec content, list what you're assuming:

```
ASSUMPTIONS I'M MAKING:
1. This is a web application (not native mobile)
2. Authentication uses session-based cookies
3. The database is PostgreSQL
→ Correct me now or I'll proceed with these.
```

## Verification

Before proceeding to implementation, confirm:

- [ ] The spec covers all core areas
- [ ] The human has reviewed and approved the spec
- [ ] Success criteria are specific and testable
- [ ] Boundaries (Always/Ask First/Never) are defined
- [ ] The spec is saved to a file in the repository
