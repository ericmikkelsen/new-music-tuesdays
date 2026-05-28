# Story: Astro Sanity Starter Foundation

## Motivation

Create a clean starter that proves a real content loop from Sanity to Astro pages, while setting up a reusable path for future content types with less schema/type duplication.

## Acceptance Criteria

- [ ] Story branch uses chapter PR flow (`chapter/<story>/<chapter-slug>` into `story/<story>`).
- [ ] Starter integrates Sanity Studio at `/studio` inside a single Astro project.
- [ ] Page schema and Astro page generation are wired end-to-end.
- [ ] Homepage lists all generated page routes.
- [ ] Shared schema/type utilities and reusable web metadata fields are introduced for reduced duplication.
- [ ] SSR preview flow is scaffolded with token-based draft-aware behavior.
- [ ] Future-ready body primitive types are defined (heading, subheading, bodyText, link, list, image object).
- [ ] README includes concrete Sanity UI steps to create the required read token.
- [ ] Typegen automation scripts regenerate Sanity types before dev/build to prevent stale generated files.
- [ ] Baseline tests and quality gates pass.
- [ ] PR review noise is reduced via generated-file collapsing and explicit review-budget exclusions.

## Chapters

| #   | Branch                                                                   | Scope (one sentence)                                                                                                                                 |
| --- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | `chapter/astro-sanity-starter-foundation/01-bootstrap-astro-sanity`      | Bootstrap latest Astro + Sanity + Tailwind project shape with SSG defaults and Studio mounted at `/studio`.                                          |
| 02  | `chapter/astro-sanity-starter-foundation/02-page-schema-and-shared-core` | Add page schema with metadata fields plus shared core field/type helpers and future-ready body primitive type modules.                               |
| 03  | `chapter/astro-sanity-starter-foundation/03-astro-pages-from-sanity`     | Implement content fetch/mapping and static route generation so each Sanity page creates one Astro page route.                                        |
| 04  | `chapter/astro-sanity-starter-foundation/04-homepage-preview-and-styles` | Build homepage link list with responsive Tailwind styling and add SSR preview scaffolding for draft-aware rendering.                                 |
| 05  | `chapter/astro-sanity-starter-foundation/05-tests-typegen-and-docs`      | Add node/vitest tests, configure Sanity static type generation with predev/prebuild automation, and update README with setup/token steps.            |
| 06  | `chapter/astro-sanity-starter-foundation/06-epilogue-review-cleanup`     | Finalize PR review hygiene by marking generated artifacts for collapse, aligning budget exclusions, and closing leftover cleanup/documentation gaps. |

## Out of Scope

- Rich body rendering with Portable Text components.
- Authenticated preview flows and draft token management.
- Multiple document types beyond page.
- Advanced SEO component system beyond starter-level fields.

## Dependencies

- Sanity account/project provisioning details (projectId, dataset, API version).
- Preview secret and read token are provisioned for local validation.

## Delivery Reconciliation (2026-04-27)

Status against acceptance criteria:

- Met: chapter PR flow was used for implementation.
- Met: Sanity Studio is integrated at `/studio`.
- Met: page schema and Astro page generation are wired end-to-end.
- Met: homepage lists generated page routes.
- Met: shared schema/type utilities and reusable web metadata fields were introduced.
- Met: SSR preview behavior is scaffolded with draft-aware token checks in the content query layer.
- Met: future-ready body primitive types are defined.
- Met: README includes concrete Sanity UI token setup steps.
- Met: typegen automation is wired through `predev` and `prebuild`.
- Met: baseline tests and quality gates are in place and passing.
- Met: generated-file review noise reduction is configured (`.gitattributes` and review-budget exclusions).

Intentional boundaries held:

- Out of scope items in this story remained out of scope (Portable Text rendering, authenticated preview activation flow, extra content types, advanced SEO system).
