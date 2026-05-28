---
name: prototype-decomposition
description: Converts an oversized prototype branch into a story with properly-scoped chapter branches. Use when a vibe-coded or exploratory branch has grown too large to review. Use when you need to communicate discovered work, not just deliver it.
---

# Prototype Decomposition

## Overview

Vibe coding and exploratory prototyping are legitimate discovery tools. But a 2,000-line prototype diff is not a pull request — it's a dump. A monolithic diff exceeds working memory capacity, eliminates the primacy cues reviewers rely on to orient themselves, and makes meaningful review cognitively impossible (Sweller, 1988; Rigby & Bird, 2013). This skill turns a prototype branch into a story with chapters: structured, reviewable, and understandable by a fresh reader.

The process has two phases with a mandatory human gate in between. The original branch is never touched until restructuring is verified.

## When to Use

- A branch has grown beyond the reviewability budget (see `.github/review-config.json`)
- An exploratory or AI-generated branch has accumulated mixed concerns
- You have working code but no clear way to communicate it for review
- A branch has been open for more than a few days without merging

## Two-Phase Workflow

```
Phase 1: ANALYZE ──→ Human gate ──→ Phase 2: RESTRUCTURE
```

**The human gate is mandatory.** Do not begin Phase 2 until the human has reviewed and approved the proposed chapter breakdown.

---

## Phase 1 — Analyze

### 1.1 Measure the prototype

```bash
git diff main...HEAD --stat
git log main..HEAD --oneline
```

Report:

- Total lines changed (added + removed)
- Total files touched
- Number of commits on the branch
- Whether the branch exceeds the reviewability budget

### 1.2 Cluster the changes

Read the full diff and group changes into clusters. Apply these signals in order:

**Semantic signal** — What kind of change is it?

- Schema / data model changes
- API / service layer changes
- UI / view layer changes
- Tests
- Configuration / environment
- Documentation

**Coupling signal** — Which changes call or depend on each other?

- If function A is new and function B calls A, they are coupled. A must land before B.
- Migrations must land before the code that uses the new columns.
- Types must land before the code that uses the types.

**Commit signal** — If the branch has multiple commits, do the commit messages suggest natural boundaries?

### 1.3 Produce the proposed STORY.md

Output a draft `STORY.md` that proposes the chapter breakdown:

```markdown
# Story: [Derive a name from the prototype branch purpose]

## Motivation

[One or two sentences inferred from the prototype's changes.]

## Acceptance Criteria

[Inferred from the prototype's behavior — what did it make work?]

## Proposed Chapters

| #   | Suggested branch name       | Files              | Est. lines | Rationale                                                        |
| --- | --------------------------- | ------------------ | ---------- | ---------------------------------------------------------------- |
| 01  | `chapter/<story>/01-<slug>` | file1.ts, file2.ts | ~80        | Foundation — must land first because chapters 02–03 depend on it |
| 02  | `chapter/<story>/02-<slug>` | file3.ts, file4.ts | ~120       | API layer — depends on 01                                        |
| 03  | `chapter/<story>/03-<slug>` | file5.ts           | ~60        | UI — depends on 02                                               |

## Coupling Notes

[Any cross-chapter dependencies that require a specific merge order.]

## Open Questions

[Anything ambiguous that the human should resolve before restructuring begins.]
```

### 1.4 Present to human — STOP HERE

Present the proposed `STORY.md` and ask the human to:

1. Confirm or rename the story
2. Adjust chapter boundaries (merge, split, reorder)
3. Resolve any open questions
4. Explicitly approve restructuring

**Do not proceed to Phase 2 until the human explicitly approves.**

---

## Phase 2 — Restructure

Only begin after human approval of the Phase 1 output.

### 2.1 Preserve the prototype

```bash
# Confirm prototype branch is pushed and safe
git push origin <prototype-branch>
# Record the prototype SHA as the fallback
git rev-parse HEAD  # save this value
```

### 2.2 Create the story branch

```bash
git checkout main
git checkout -b story/<name>
# Create approved STORY.md
git add STORY.md
git commit -m "docs(story): add STORY.md for <name>"
git push -u origin story/<name>
```

### 2.3 Build each chapter

For each chapter in sequence:

```bash
git checkout story/<name>
git checkout -b chapter/<name>/<seq>-<slug>
```

Apply the changes belonging to this chapter. There are two approaches:

**Cherry-pick approach** (when commits map cleanly to chapters):

```bash
git cherry-pick <commit-sha>
```

**Manual re-application** (when commits are tangled):

- Copy only the files and hunks assigned to this chapter from the prototype diff.
- Apply them cleanly on top of the story branch.
- Run tests before committing.

After applying:

```bash
npm test   # must pass before committing
git commit -m "<type>(<scope>): <chapter description>"
git push -u origin chapter/<name>/<seq>-<slug>
# Open PR targeting story/<name>
# Use visual-pr-communication skill to write the PR description
```

Wait for each chapter to be reviewed and merged before starting the next.

### 2.4 Verify and clean up

After all chapters are merged into the story branch:

```bash
# Confirm the story branch produces the same end state as the prototype
git diff <prototype-branch>...story/<name>
```

If the diff shows unexpected differences, resolve before opening the story-to-main PR.

Once the story PR is merged to main, the prototype branch can be deleted:

```bash
git push origin --delete <prototype-branch>
```

---

## Conflict and Tangle Handling

Prototype branches often have tangled changes (one commit touches three concerns). When restructuring tangled commits:

1. For each target chapter, use `git diff <prototype-branch> -- <file>` to isolate the relevant hunks.
2. Apply only those hunks using `git apply --include=<file>` or manual editing.
3. If a file belongs to two chapters (e.g., a shared utility is created and used in the same file), split the file's changes: extract the utility to a new file in chapter N, then add its usage in chapter N+1.

## Verification

Before declaring the restructure complete:

- [ ] Every line from the prototype is accounted for in some chapter
- [ ] No chapter exceeds the reviewability budget (300 lines / 5 non-deleted files per `.github/review-config.json`)
- [ ] Each chapter's tests pass independently
- [ ] The story branch end state matches the prototype end state (`git diff` is empty or intentional)
- [ ] The prototype branch is still intact and reachable (fallback available)
- [ ] Each chapter PR has a visual-pr-communication artifact

## SMART Goals

| Goal                                                  | Measure                                                                     | Target              |
| ----------------------------------------------------- | --------------------------------------------------------------------------- | ------------------- |
| Complete Phase 1 (analysis + proposal)                | Time from `/rescue` invocation to human gate                                | ≤ 2 hours           |
| Complete Phase 2 (restructure) after approval         | Time from approval to all chapter PRs open                                  | ≤ 2 business days   |
| No chapter exceeds the reviewability budget           | `git diff --stat` per chapter, excluding deleted-only files from file count | 300 lines / 5 files |
| Prototype branch preserved until story merges to main | Branch still exists in `git branch -r`                                      | 100%                |
| All proposed chapters have a rationale                | "Rationale" column filled in proposed STORY.md table                        | 100% of chapters    |
