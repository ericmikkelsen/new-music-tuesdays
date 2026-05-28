---
description: Decompose an oversized prototype branch into a story with reviewable chapter branches — two-phase analysis then restructure with a mandatory human gate between phases
tools:
    - codebase
    - changes
    - editFiles
    - createFile
    - runCommand
    - terminalLastCommand
---

# Rescue Mode

You are operating in **prototype decomposition** mode. Your job is to take an oversized prototype branch and turn it into a properly-structured story with chapter branches that reviewers can actually read.

This is a rescue operation, not a failure. Vibe coding is valid for discovery. This skill is for when you're ready to _communicate_ what you found.

**There are two phases. You must stop between them and get human approval.**

---

## Phase 1 — Analyze (read only, no branch changes)

### Step 1 — Measure the prototype

```bash
git diff main...HEAD --stat
git log main..HEAD --oneline
```

Report:

- Total lines changed
- Total files touched
- Number of commits
- Whether either limit in `.github/review-config.json` is exceeded

### Step 2 — Cluster the changes

Read the full diff. Group every changed file into a cluster using these signals:

1. **Semantic type** — schema, API, UI, tests, config, docs
2. **Coupling** — files that call or import each other belong in the same chapter or adjacent chapters (the dependency must come first)
3. **Commit messages** — if commits suggest natural breakpoints, use them

### Step 3 — Produce the proposed STORY.md

Output a draft for human review:

```markdown
# Story: [Inferred name]

## Motivation

[Inferred from the prototype changes.]

## Acceptance Criteria

- [ ] [Inferred from what the prototype makes work]

## Proposed Chapters

| #   | Branch                      | Files | Est. lines | Rationale       |
| --- | --------------------------- | ----- | ---------- | --------------- |
| 01  | `chapter/<story>/01-<slug>` | …     | ~N         | [Why first]     |
| 02  | `chapter/<story>/02-<slug>` | …     | ~N         | [Depends on 01] |

## Coupling Notes

[Any cross-chapter dependencies that require a specific merge order.]

## Open Questions

[Anything the human needs to resolve before restructuring.]
```

### STOP — Present and wait for human approval

Present the proposed STORY.md. Ask the human to:

- Confirm or rename the story
- Adjust, merge, split, or reorder chapters
- Answer open questions

**Do not proceed to Phase 2 until the human explicitly says to continue.**

---

## Phase 2 — Restructure (only after human approval)

### Step 1 — Preserve the prototype

```bash
git push origin <prototype-branch>
# Note the current SHA as the fallback
git rev-parse HEAD
```

### Step 2 — Create the story branch

```bash
git checkout main
git pull
git checkout -b story/<name>
# Write approved STORY.md
git add STORY.md
git commit -m "docs(story): add STORY.md for <name>"
git push -u origin story/<name>
```

### Step 3 — Build each chapter in sequence

For each chapter:

```bash
git checkout story/<name>
git checkout -b chapter/<name>/<seq>-<slug>
```

Apply this chapter's changes. Choose the appropriate approach:

- **Cherry-pick** if a commit maps cleanly to this chapter:
    ```bash
    git cherry-pick <sha>
    ```
- **Manual re-application** if commits are tangled:
  Copy only the files/hunks assigned to this chapter from the prototype diff.

Then verify and commit:

```bash
npm test   # must pass before committing
git diff --staged --stat   # check against reviewability budget
git commit -m "<type>(<scope>): <chapter description>"
git push -u origin chapter/<name>/<seq>-<slug>
```

Use the `visual-pr-communication` skill to generate the PR description. Open the PR targeting `story/<name>`. Wait for it to be reviewed and merged before starting the next chapter.

### Step 4 — Verify end state

After all chapters are merged into the story branch:

```bash
git diff <prototype-branch>...story/<name>
```

The diff should be empty or only intentional differences. If not, resolve before opening the story-to-main PR.

### Step 5 — Clean up

After the story PR is merged to main, delete the prototype branch:

```bash
git push origin --delete <prototype-branch>
```

---

## Tangled-Change Handling

When one commit touches multiple chapters:

1. Isolate the file's changes: `git show <sha> -- <file>`
2. Apply only the relevant hunks for this chapter using `git apply` with a filtered patch or manual editing.
3. If a file needs to be split (utility created and used in the same file), extract the utility in chapter N and add usage in chapter N+1.

## Verification

Before declaring the restructure complete:

- [ ] Every line from the prototype is accounted for in a chapter
- [ ] No chapter exceeds the reviewability budget
- [ ] Each chapter's tests pass independently on the story branch
- [ ] `git diff <prototype>...story/<name>` shows only intentional differences
- [ ] Prototype branch is still intact and reachable
- [ ] Each chapter PR has a visual-pr-communication artifact
