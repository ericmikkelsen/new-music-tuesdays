---
name: narrative-branching
description: Structures work as a story with chapters. Use when starting any feature that spans more than one concern. Use when you need to organize AI-generated code so that reviewers can read it like a book instead of parsing a wall of diff.
---

# Narrative Branching

## Overview

Treat every feature as a story and every reviewable chunk as a chapter. The story branch is a table of contents; each chapter branch is one page. Reviewers read in order, understand incrementally, and never face a thousand-line diff.

## When to Use

- Starting a feature that will touch more than one concern
- Any time a change would exceed the reviewability budget (see `code-review-and-quality`)
- When an AI agent is about to generate a large body of code
- When a team needs to parallelise work on a single feature

## Why Narrative Works

The chapter structure is not an aesthetic choice — it maps directly to how human brains evolved to receive and retain information.

**Evolved narrative cognition.** For most of human evolutionary history, knowledge was transmitted as sequential story — not as monolithic documents. Archaeological and anthropological evidence shows that social storytelling is at least 300,000 years old and correlates strongly with cooperation and knowledge transfer (Wiessner, 2014; Smith et al., 2017). Our brains developed preferential encoding for narrative structure: setup, problem, resolution. A 2,000-line diff with no arc is the opposite of how humans evolved to absorb new information. Sequential chapters in reading order give reviewers a cognitive structure their brains are optimized to process.

**Schema activation (Bartlett, 1932).** A reviewer who reads STORY.md before any code has an activated schema — a mental model of the feature's goal, the chapter sequence, and each chapter's scope. Schema-activated readers comprehend new material faster and with fewer errors. The human gate at Step 1 is not bureaucracy; it forces a STORY.md to exist before any code is written, ensuring reviewers have that orientating map before they need it.

**Incremental cognitive load (Sweller, 1988).** Each chapter should be fully comprehensible on its own before the next opens. Reading chapter 01 builds a schema; chapter 02 extends it. By the final chapter, the reviewer has incrementally constructed a complete mental model — with far less total effort than reading the equivalent change as a monolith.

## Branch Naming

```
story/<short-name>                        story/user-auth
chapter/<story-name>/<seq>-<slug>         chapter/user-auth/01-add-schema
                                          chapter/user-auth/02-add-api
                                          chapter/user-auth/03-add-ui
```

- Sequence numbers are zero-padded two digits (`01`, `02`, …) so `ls` and GitHub show chapters in reading order.
- Story names and chapter slugs use `kebab-case`.
- Chapter slugs name the _concern_, not the layer: `add-schema` not `backend-changes`.

## The STORY.md File

Create `STORY.md` at the root of the story branch before any chapter branch is created.

```markdown
# Story: [Short Title]

## Motivation

[Why are we doing this? One or two sentences. Link to issue/ticket if available.]

## Acceptance Criteria

- [ ] [Specific, testable condition]
- [ ] [Specific, testable condition]

## Chapters

| #   | Branch                      | One-sentence scope                        |
| --- | --------------------------- | ----------------------------------------- |
| 01  | `chapter/<story>/01-<slug>` | [What this chapter does and nothing more] |
| 02  | `chapter/<story>/02-<slug>` | [What this chapter does and nothing more] |

## Out of Scope

[Anything that is explicitly NOT part of this story. Prevents scope creep.]

## Dependencies

[Other stories or external work this story depends on.]
```

## Workflow

```
main
 │
 └──→ story/<name>          ← created first, holds STORY.md
        │
        ├──→ chapter/<name>/01-…   PR targets story branch, reviewed, merged
        ├──→ chapter/<name>/02-…   PR targets story branch, reviewed, merged
        └──→ chapter/<name>/03-…   PR targets story branch, reviewed, merged
              │
              └──→ story PR to main   Auto-generated summary from STORY.md
```

### Execution Mode

- Default: execute chapters sequentially.
- Async is opt-in: only run work in parallel when the human explicitly marks a story as `async-eligible` and dependencies are clear.
- If unsure, stay sequential.

### Step 1 — Plan the story

1. Identify the complete set of concerns the feature touches.
2. Assign each concern to exactly one chapter — chapters must not overlap.
3. Order chapters so that each one can compile and pass tests independently (no chapter depends on a later chapter).
4. Write `STORY.md` with all chapters listed.
5. Set execution mode (`sequential` by default, `async-eligible` only when approved and dependency-safe).
6. **Present the chapter list to the human for approval before creating any branches.**

### Step 2 — Create story branch

```bash
git checkout -b story/<name>
# create STORY.md
git add STORY.md
git commit -m "docs(story): add STORY.md for <name>"
git push -u origin story/<name>
```

### Step 3 — Work chapter by chapter

For each chapter:

```bash
git checkout story/<name>
git checkout -b chapter/<name>/<seq>-<slug>
# implement only what the chapter title says
# use visual-pr-communication skill to generate PR description
git push -u origin chapter/<name>/<seq>-<slug>
test -n "$(git ls-remote --exit-code --heads origin chapter/<name>/<seq>-<slug>)"
gh pr create --base story/<name> --head chapter/<name>/<seq>-<slug> --title "docs(chapter): <seq>-<slug>" --body "Chapter PR for <name>."
gh pr list --base story/<name> --head chapter/<name>/<seq>-<slug> --state open
```

Do not report a chapter as created unless the `gh pr list` command above returns a non-empty result confirming an open PR with the correct base and head.

**Chapter rules:**

- A chapter must not touch files that belong to a different chapter's concern.
- A chapter must not anticipate or partially implement the next chapter.
- When a chapter is merged, delete its branch.

### Step 4 — Merge story to main

When all chapters are merged into the story branch:

1. Open a PR from `story/<name>` to `main`.
2. Use this template for the story PR description:

```markdown
## Story: [Title]

[Motivation — one or two sentences copied from STORY.md]

### Chapters merged

| #   | PR                            | What it delivered    |
| --- | ----------------------------- | -------------------- |
| 01  | #[pr-number] — [chapter slug] | [one-sentence scope] |
| 02  | #[pr-number] — [chapter slug] | [one-sentence scope] |

### Acceptance criteria

[Paste acceptance criteria from STORY.md with checkboxes filled in]

### Reviewability

- Total lines across all chapters: [sum]
- Largest single chapter: [max]
```

3. This PR should be green — all tests pass. It is a merge commit, not a rebase.

## Slicing a Concern Into Chapters

Slice **horizontally by concern**, not vertically by layer:

| ✅ Good chapter scope             | ❌ Bad chapter scope                       |
| --------------------------------- | ------------------------------------------ |
| `01-add-schema` — data model only | `01-full-stack` — schema + API + UI        |
| `02-add-api` — HTTP handlers only | `02-everything-else` — whatever didn't fit |
| `03-add-ui` — view layer only     |                                            |

When uncertain whether something belongs in this chapter or the next, it goes in the next.

## Verification

Before creating any chapter branch:

- [ ] `STORY.md` exists on the story branch with all chapters listed
- [ ] Human has approved the chapter breakdown
- [ ] Each chapter scope is one sentence and does not overlap with another chapter
- [ ] Chapter sequence is valid — no chapter depends on a later chapter
- [ ] Branch names follow the naming convention

Before reporting completion:

- [ ] Story branch is pushed to origin
- [ ] Each chapter branch is pushed to origin
- [ ] Each chapter PR targets `story/<name>`

## SMART Goals

These targets make story/chapter health measurable so teams can discuss and tune them:

| Goal                                                | Measure                                                 | Default target      |
| --------------------------------------------------- | ------------------------------------------------------- | ------------------- |
| Chapter PRs merged within 1 business day of opening | PR open → merge duration                                | ≤ 1 day             |
| Story branch total lifetime                         | Branch age from first commit                            | ≤ 5 business days   |
| No chapter diff exceeds the reviewability budget    | `git diff --stat` line count and non-deleted file count | 300 lines / 5 files |
| Every chapter PR has a visual artifact              | PR description contains a mermaid block                 | 100%                |

## Handling a Red Chapter

If a chapter PR's CI is red:

1. Fix the failure on the chapter branch before opening the next chapter branch.
2. Do not start chapter N+1 until chapter N is merged — a failing chapter is a broken foundation.
3. If the fix requires changes that logically belong in a later chapter, note that in a PR comment and split the work.
