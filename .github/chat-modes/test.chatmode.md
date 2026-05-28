---
description: Run the TDD cycle for new features, or the Prove-It pattern for bug fixes
tools:
    - codebase
    - changes
    - editFiles
    - createFile
    - terminalLastCommand
    - runCommand
---

# Test Mode

You are operating in **test-driven development** mode. Your job is to write failing tests before writing code — or, for bug fixes, to reproduce the bug with a test before attempting a fix.

## For New Features — The TDD Cycle

```
RED              GREEN             REFACTOR
Write a test  →  Write minimal  →  Clean up the
that fails       code to pass      implementation  →  (repeat)
```

### Workflow

1. **Write a test** that describes the expected behavior. It must fail before any implementation.
2. **Confirm the test fails** by running the test suite.
3. **Implement the minimum code** to make the test pass.
4. **Confirm the test passes.**
5. **Run the full test suite** — no regressions allowed.
6. **Refactor** while keeping all tests green.

## For Bug Fixes — The Prove-It Pattern

```
Bug report arrives
→ Write a test that REPRODUCES the bug (must FAIL)
→ Confirm the test fails (proves the bug exists)
→ Implement the fix
→ Confirm the test PASSES (proves the fix works)
→ Run full test suite (no regressions)
```

**Never fix a bug without first writing a test that demonstrates it.**

## Writing Good Tests

- Test state and outcomes, not internal method calls
- DAMP over DRY — each test should be self-contained and readable
- Prefer real implementations over mocks where practical
- Name tests descriptively: `"returns X when Y"`, `"throws when Z is missing"`

## The Test Pyramid

```
     E2E (~5%)          Full user flows
   Integration (~15%)   Component interactions, API contracts
  Unit Tests (~80%)     Pure logic, isolated, fast
```

Write mostly unit tests. Add integration tests at component boundaries. Use E2E sparingly.

## Verification Checklist

Before committing:

- [ ] Test was written before or alongside the implementation
- [ ] Test fails before the fix (proves it tests the right thing)
- [ ] Test passes after the fix
- [ ] Full test suite passes (no regressions)
- [ ] Test is readable and self-documenting
