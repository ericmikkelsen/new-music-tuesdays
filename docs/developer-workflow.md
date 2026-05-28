# Developer Workflow (Plain Language)

This is a practical day-to-day flow for using the Addy Osmani skills with Copilot.

Use chat modes (from `.github/chat-modes/`) or direct skill prompts. This guide is template-first and does not require a VS Code extension.

Team default: chapters are sequential unless explicitly approved otherwise.

## 1) Start with clarity

Use mode/skill: `spec` / `spec-driven-development`

What you do:

- Describe the feature in plain terms.
- List assumptions and constraints.
- Define success criteria.

Outcome:

- A clear spec exists before code starts.

## 2) Decide whether this needs story mode

Use mode/skill: `story` / `narrative-branching` (for medium/large work)

What you do:

- Break work into chapter branches.
- Get human approval on chapter order.
- Work chapter-by-chapter.

Outcome:

- Reviewable slices instead of a large diff.

## 3) Turn the next chapter into tasks

Use mode/skill: `plan` / `spec-driven-development`, `incremental-implementation`

What you do:

- Create dependency-ordered tasks.
- Add acceptance criteria for each task.
- Keep tasks small and testable.

Outcome:

- A concrete `tasks/plan.md` and `tasks/todo.md` for execution.

## 4) Build one task at a time

Use mode/skill: `build` / `test-driven-development`, `incremental-implementation`

What you do:

- RED: write a failing test.
- GREEN: write the minimum code to pass.
- REFACTOR: clean up while keeping tests green.

Outcome:

- Small, safe commits with proof of behavior.

## 5) Handle bugs with proof

Use mode/skill: `test` / `test-driven-development` (Prove-It pattern)

What you do:

- Reproduce bug with a failing test first.
- Implement fix.
- Run full suite for regressions.

Outcome:

- Fixes are verifiable and durable.

## 6) Run quality review before merge

Use mode/skill: `review` / `code-review-and-quality`

What you do:

- Check correctness, readability, architecture, security, performance.
- Check reviewability budget before finalizing.

Outcome:

- Cleaner PRs and fewer late surprises.

## 7) Make PRs easier to understand

Use mode/skill: `visualize` / `visual-pr-communication`

What you do:

- Generate a Mermaid change map.
- Write Before/After behavior bullets.
- Add one-line user-visible delta.

Outcome:

- Faster reviews and better team alignment.

## 8) Final release gate

Use mode/skill: `ship` / `ci-cd-and-automation`, `code-review-and-quality`

What you do:

- Confirm lint, types, tests, build, and rollback readiness.
- Make GO/NO-GO call.

Outcome:

- Safer launches.

## 9) Simplify after behavior is stable

Use mode/skill: `simplify` / `incremental-implementation` mindset

What you do:

- Remove unnecessary complexity without changing behavior.

Outcome:

- Lower long-term maintenance cost.

## 10) Rescue oversized prototype branches

Use mode/skill: `rescue` / `prototype-decomposition`

What you do:

- Split a large branch into a clean story and chapter sequence.
- Keep phase 1 read-only by default, then proceed with explicit approval.

Outcome:

- Regain reviewability when a branch gets too large.

## Quick Daily Cadence

1. Run `spec` if scope is unclear.
2. Run `story` if work is larger than one reviewable PR.
3. Run `plan` for the current chapter.
4. Run `build` task-by-task.
5. Run `review` and `visualize` before PR.
6. Run `ship` before release.
