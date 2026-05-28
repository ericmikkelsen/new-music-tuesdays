# Skills Workflow Map

This guide shows how the nine skills work together in the story/chapter lifecycle. Each skill activates at a specific point in the workflow, and the combination of all nine creates a system optimized for human cognition during code review and maintenance.

## The Story/Chapter Lifecycle

```
┌─ Explore ─────────────────────────────────────────────────────────┐
│ Fuzzy idea or large prototype branch exists                       │
└────────────────────────────────────────────────────────────────┬──┘
                                                                   │
                                                        ┌─────────┴─────────┐
                                                        │                   │
                                    ┌─ OPTION A ───────┴──┐          ┌──────┴─ OPTION B ─────┐
                                    │ Large prototype      │          │ Spec-driven start    │
                                    └────────────┬─────────┘          └──────┬────────────────┘
                                                 │                           │
      ┌─────────────────────┌──────────────────┴──────────────────────────┬─┴──────────────────┐
      │                     │                                              │                    │
      ▼                     ▼                                              ▼                    ▼
┌─────────────────┐    ┌────────────────┐                            ┌──────────────┐    ┌──────────────┐
│ PROTOTYPE       │    │ SPEC-DRIVEN    │                            │ SPEC-DRIVEN  │    │ NARRATIVE    │
│ DECOMPOSITION   │    │ DEVELOPMENT    │                            │ DEVELOPMENT  │    │ BRANCHING    │
└─────────────────┘    └────────────────┘                            └──────────────┘    └──────────────┘
      │                     │                                              │                    │
      │                     │              ┌─────────────────────────────┬┴────────┬───────────┘
      │                     │              │                            │         │
      └─────────────────────┴──────────────┴────────────────────────────┴─────────┘
                                           │
                            ┌──────────────▼──────────────┐
                            │ Create STORY.md             │
                            │ Order chapters              │
                            │ GET HUMAN APPROVAL          │
                            └──────────────┬──────────────┘
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    │                                              │
        ┌───────────▼────────────┐                   ┌────────────▼────────────┐
        │ For each chapter       │                   │ While chapters exist    │
        │ (in reading order)     │                   │                        │
        └───────────┬────────────┘                   └────────────┬───────────┘
                    │                                              │
        ┌───────────▼──────────────────────┐                      │
        │ INCREMENTAL IMPLEMENTATION       │                      │
        │ - Write minimal slice            │                      │
        │ - Test and verify                │                      │
        │ - Repeat until chapter done      │                      │
        └───────────┬──────────────────────┘                      │
                    │                                              │
        ┌───────────▼──────────────────────┐                      │
        │ VISUAL PR COMMUNICATION          │                      │
        │ - Write three-part artifact      │◄─────────────────────┘
        │ - Mermaid diagram                │
        │ - Before/After narrative         │
        │ - User-visible delta             │
        └───────────┬──────────────────────┘
                    │
        ┌───────────▼──────────────────────┐
        │ CODE REVIEW & QUALITY            │
        │ - Review across five axes        │
        │ - Check change size              │
        │ - Verify tests exist             │
        └───────────┬──────────────────────┘
                    │
        ┌───────────▼──────────────────────┐
        │ GIT WORKFLOW & VERSIONING        │
        │ - Conventional commit            │
        │ - Merge to story branch          │
        │ - Delete chapter branch          │
        └───────────┬──────────────────────┘
                    │
                    └───────────┐
                                │
                    ┌───────────▼──────────────┐
                    │ All chapters merged?     │
                    │ No ──► repeat above      │
                    │ Yes ──► continue         │
                    └───────────┬──────────────┘
                                │
                    ┌───────────▼──────────────┐
                    │ VISUAL PR COMMUNICATION  │
                    │ (story-to-main PR)       │
                    │ - Auto-generate summary  │
                    │ - List all chapters      │
                    │ - Acceptance criteria    │
                    └───────────┬──────────────┘
                                │
                    ┌───────────▼──────────────┐
                    │ CODE REVIEW & QUALITY    │
                    │ (story-level review)     │
                    │ - Verify all chapters    │
                    │ - Check totals           │
                    └───────────┬──────────────┘
                                │
                    ┌───────────▼──────────────┐
                    │ GIT WORKFLOW & VERSIONING│
                    │ - Conventional commit    │
                    │ - Merge to main          │
                    │ - Release Please tags    │
                    └───────────┬──────────────┘
                                │
                                ▼
                          ✓ Done
```

---

## Skill Decision Tree

**"My situation is..."**

### Starting a new feature (no code exists yet)

→ **spec-driven-development** — Write the spec before any code. Forces clarity on scope and acceptance criteria before investing in implementation.

### I have a fuzzy idea and want to plan the chapter structure

→ **narrative-branching** — Map out the story and chapters. Forces you to identify concerns and order them correctly. Get human approval before touching code.

### I have a large prototype branch and need to decompose it

→ **prototype-decomposition** (Phase 1) — Analyze and propose chapters. Get human gate approval, then restructure.

### Writing a chapter (code is flowing)

→ **incremental-implementation** — Write one vertical slice, test, verify, commit. Repeat until the chapter is done.

### Finished implementing a chapter

→ **visual-pr-communication** — Write the three-part artifact (Mermaid, Before/After, user delta). Make it durable for future readers.

### About to merge a chapter PR

→ **code-review-and-quality** — Five-axis review. Check change size against budget. Ensure tests exist.

### Committing code or merging PRs

→ **git-workflow-and-versioning** — Conventional commits. Proper branching discipline. Release Please configuration.

### Merging the final chapter, writing the story-to-main PR

→ **visual-pr-communication** (adapted for story scope) — Auto-generate summary from chapter list. Show acceptance criteria completion.

---

## Skill Synergies

| Pair                                                      | How they work together                                                                                                                                                           |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **narrative-branching + incremental-implementation**      | narrative-branching defines the chapters; incremental-implementation shows how to write inside one chapter.                                                                      |
| **incremental-implementation + visual-pr-communication**  | Each small slice stays within working memory; the artifact explains why the slice matters.                                                                                       |
| **visual-pr-communication + code-review-and-quality**     | The artifact is a _canary_ — if you can't write the Before/After in 5 bullets, the scope is too wide. The change-size review enforces the same principle from a different angle. |
| **prototype-decomposition + narrative-branching**         | Decomposition outputs a proposed STORY.md; narrative-branching is how you execute it.                                                                                            |
| **narrative-branching + spec-driven-development**         | Spec-driven-development defines _what_; narrative-branching defines _how to deliver it in chapters_.                                                                             |
| **code-review-and-quality + git-workflow-and-versioning** | Code review is the gate; git workflow carries out the verdict (merge, tag, release).                                                                                             |

---

## Rules of Engagement

### Always start with narrative structure

Before writing code:

1. Define the story (spec-driven-development)
2. Break into chapters (narrative-branching)
3. **Get human approval on the chapter breakdown**

Do not proceed to incremental-implementation until Step 3 is complete.

### Increments stay small

Each increment should pass the four tests from incremental-implementation:

- Compiles
- Tests pass
- One thing at a time
- <100 lines before testing

### Artifacts must be durable

The Before/After narrative in visual-pr-communication is written for _future readers_, not just today's reviewer. No jargon, no file names, no implementation details. Make it readable six months from now.

### Change size is non-negotiable

Code review checks change size against `.github/review-config.json` limits. If a chapter exceeds limits, split it before merging. Do not merge large changes hoping to refactor later.

### Every change follows the same workflow

Whether it's a 30-line bug fix or a 1,000-line feature:

1. Use narrative-branching (one chapter) or story structure (multiple chapters)
2. Use incremental-implementation
3. Use visual-pr-communication
4. Use code-review-and-quality
5. Use git-workflow-and-versioning

Consistency is how the system works.

---

## When a Skill Applies

| Skill                           | Applies when                  | Ask yourself                                            |
| ------------------------------- | ----------------------------- | ------------------------------------------------------- |
| **spec-driven-development**     | Starting something new        | Do I understand _what_ needs to be built?               |
| **narrative-branching**         | Feature will touch >1 concern | Can I list the chapters in order?                       |
| **prototype-decomposition**     | Large prototype exists        | Is my prototype >300 lines or >5 files?                 |
| **incremental-implementation**  | Writing code                  | Am I about to write >100 lines before testing?          |
| **visual-pr-communication**     | Opening a PR                  | Can I explain this change in 30 lines of plain English? |
| **code-review-and-quality**     | Before merging                | Have I reviewed this across five axes?                  |
| **git-workflow-and-versioning** | Making a commit               | Am I using conventional commit format?                  |
| **test-driven-development**     | Building logic or fixing bugs | Do I have a test that fails?                            |
| **ci-cd-and-automation**        | Setting up pipelines          | Are quality gates running on every PR?                  |
