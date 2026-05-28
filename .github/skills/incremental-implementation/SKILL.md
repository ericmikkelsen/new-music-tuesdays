---
name: incremental-implementation
description: Delivers changes incrementally. Use when implementing any feature or change that touches more than one file. Use when you're about to write a large amount of code at once, or when a task feels too big to land in one step.
---

# Incremental Implementation

## Overview

Build in thin vertical slices — implement one piece, test it, verify it, then expand. Each increment should leave the system in a working, testable state.

## Why Incremental Works

Incremental development is not just a productivity habit — it is a cognitive necessity.

**Working memory limits (Sweller, 1988; Miller, 1956).** Writing 300 lines of code before testing exceeds working memory capacity. Reviewers cannot hold all of it in mind at once. But small, testable increments stay within cognitive limits — each one is fully comprehensible before the next builds on it.

**Spaced practice (Cepeda et al., 2006).** Testing after each small slice is a form of spaced practice: you encode understanding of slice 1, then extend it with slice 2, then extend again with slice 3. This repeated encoding is how human memory works. Writing 300 lines, then testing once, encodes much less reliably.

**Rollback cost.** A 300-line change that fails tests is expensive to debug: was the bug in lines 1–50, 51–100, or 150–300? A 30-line slice is cheap to revert and restart. Cheap rollback means developers take smart risks and recover fast.

## When to Use

- Implementing any multi-file change
- Building a new feature from a task breakdown
- Refactoring existing code
- Any time you're tempted to write more than ~100 lines before testing

## The Increment Cycle

```
Implement ──→ Test ──→ Verify ──→ Commit ──→ Next slice
```

For each slice:

1. **Implement** the smallest complete piece of functionality
2. **Test** — run the test suite (or write a test if none exists)
3. **Verify** — confirm the slice works (tests pass, build succeeds)
4. **Commit** — save progress with a conventional commit message
5. **Move to the next slice**

## Slicing Strategies

### Vertical Slices (Preferred)

Build one complete path through the stack per slice. Each slice delivers working end-to-end functionality.

### Risk-First Slicing

Tackle the riskiest or most uncertain piece first. If it fails, you discover it before investing in the rest.

## Implementation Rules

### Rule 0: Simplicity First

Ask: "What is the simplest thing that could work?" Implement the naive, obviously-correct version first. Optimize only after correctness is proven with tests.

### Rule 0.5: Scope Discipline

Touch only what the task requires. If you notice something worth improving outside your task scope, note it — don't fix it:

```
NOTICED BUT NOT TOUCHING:
- src/utils/format.ts has an unused import (unrelated to this task)
→ Want me to create a task for this?
```

### Rule 1: One Thing at a Time

Each increment changes one logical thing. Don't mix concerns.

### Rule 2: Keep It Compilable

After each increment, the project must build and existing tests must pass.

### Rule 3: Feature Flags for Incomplete Features

If a feature isn't ready for users but you need to merge increments, put it behind a feature flag.

### Rule 4: Rollback-Friendly

Each increment should be independently revertable. Additive changes (new files, new functions) are easiest to revert.

## Increment Checklist

After each increment, verify:

- [ ] The change does one thing and does it completely
- [ ] All existing tests still pass (`npm test`)
- [ ] The build succeeds (`npm run build`)
- [ ] Type checking passes (`npx tsc --noEmit`)
- [ ] Linting passes (`npm run lint`)
- [ ] The change is committed with a descriptive conventional commit message

## Red Flags

- More than 100 lines written without running tests
- Multiple unrelated changes in a single increment
- Build or tests broken between increments
- Building abstractions before the third use case demands it
- Touching files outside the task scope "while I'm here"
