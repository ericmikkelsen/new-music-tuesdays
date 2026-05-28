---
name: code-review-and-quality
description: Conducts multi-axis code review. Use before merging any change. Use when reviewing code written by yourself, another agent, or a human. Use when you need to assess code quality across multiple dimensions before it enters the main branch.
---

# Code Review and Quality

## Overview

Multi-dimensional code review with quality gates. Every change gets reviewed before merge — no exceptions. Review covers five axes: correctness, readability, architecture, security, and performance.

**The approval standard:** Approve a change when it definitely improves overall code health, even if it isn't perfect.

## When to Use

- Before merging any PR or change
- After completing a feature implementation
- When another agent or model produced code you need to evaluate
- After any bug fix

## The Five-Axis Review

### 1. Correctness

Does the code do what it claims to do? Are edge cases handled? Are error paths handled?

### 2. Readability & Simplicity

Can another engineer understand this code without the author explaining it? Are names descriptive? Is the control flow straightforward?

### 3. Architecture

Does the change fit the system's design? Does it follow existing patterns? Are module boundaries clean?

### 4. Security

Is user input validated and sanitized? Are secrets kept out of code? Is authentication/authorization checked where needed?

### 5. Performance

Any N+1 query patterns? Any unbounded loops? Any unnecessary re-renders?

## Change Sizing

```
~100 lines changed   → Good. Reviewable in one sitting.
~500 lines changed   → Acceptable if it's a single logical change.
~1000 lines changed  → Too large. Split it.
```

These thresholds are backed by empirical research: Rigby & Bird (2013) found that defect detection rates decline as change size grows, because reviewers' ability to hold full context in working memory degrades with each additional chunk of change (Sweller, 1988). The file-count limit reflects the same principle from a different angle — "cognitive scatter" across many files imposes the same extraneous load as sheer line volume.

## Reviewability Budget

Team-wide limits are stored in `.github/review-config.json`:

```json
{
	"reviewabilityBudget": {
		"maxLinesPerChapter": 500,
		"maxFilesPerChapter": 5,
		"excludeGlobs": [
			"package-lock.json",
			"src/sanity/extract.json",
			"src/sanity/types.ts"
		]
	}
}
```

**Before finalising any branch**, check the staged diff against both limits:

```bash
git diff --staged --stat
```

- If lines changed exceeds `maxLinesPerChapter` → split the branch.
- If non-deleted files touched exceeds `maxFilesPerChapter` → split the branch.

Both limits matter independently: a 500-line change spread across 15 non-deleted files is just as hard to review as a 1,000-line change in one file. Lines measure volume; files measure cognitive scatter. Deleted-only files are excluded from the file-count budget because they reduce surface area rather than expand it. Files matching `excludeGlobs` are also excluded from budget calculations.

When a limit is exceeded, propose a split _before_ committing — not after. Use the `narrative-branching` skill to structure the split as story chapters.

## Review Feedback Categories

| Prefix        | Meaning         | Author Action                      |
| ------------- | --------------- | ---------------------------------- |
| _(no prefix)_ | Required change | Must address before merge          |
| **Critical:** | Blocks merge    | Security vulnerability, data loss  |
| **Nit:**      | Minor, optional | Author may ignore                  |
| **Consider:** | Suggestion      | Worth considering but not required |
| **FYI**       | Informational   | No action needed                   |

## Verification

Before approving:

- [ ] Tests exist and cover the change
- [ ] All five axes reviewed
- [ ] No secrets in code
- [ ] Change is appropriately sized
- [ ] CI passes
