---
name: test-driven-development
description: Drives development with tests. Use when implementing any logic, fixing any bug, or changing any behavior. Use when you need to prove that code works, when a bug report arrives, or when you're about to modify existing functionality.
---

# Test-Driven Development

## Overview

Write a failing test before writing the code that makes it pass. For bug fixes, reproduce the bug with a test before attempting a fix. Tests are proof — "seems right" is not done.

## When to Use

- Implementing any new logic or behavior
- Fixing any bug (the Prove-It Pattern)
- Modifying existing functionality
- Adding edge case handling

## The TDD Cycle

```
    RED                GREEN              REFACTOR
 Write a test    Write minimal code    Clean up the
 that fails  ──→  to make it pass  ──→  implementation  ──→  (repeat)
```

## The Prove-It Pattern (Bug Fixes)

```
Bug report arrives → Write a test that demonstrates the bug
→ Test FAILS (confirming the bug exists)
→ Implement the fix
→ Test PASSES (proving the fix works)
→ Run full test suite (no regressions)
```

## The Test Pyramid

```
     E2E (~5%)          Full user flows
   Integration (~15%)   Component interactions, API boundaries
  Unit Tests (~80%)     Pure logic, isolated, fast
```

## Writing Good Tests

- Test state/outcomes, not internal method calls
- DAMP over DRY — each test should be self-contained and readable
- Prefer real implementations over mocks where practical
- Name tests descriptively: "returns X when Y"

## Verification

Before committing a fix or feature:

- [ ] Test was written before or alongside the implementation
- [ ] Test fails before the fix (proves it tests the right thing)
- [ ] Test passes after the fix
- [ ] Full test suite passes (no regressions)
