# Story: The Big Content Story

## Motivation

Evolve the starter from a single-page-content pipeline into a reusable content platform.
This story adds two real content models plus scaffolding workflows so new content types
and reusable components can be created quickly with aligned Sanity + Astro contracts.

## Acceptance Criteria

- [ ] Array-based page-builder document type works end-to-end.
- [ ] Portable-text blog document type works end-to-end.
- [ ] `npm run scaffold:web-block` generates schema + content-layer module + Astro template.
- [ ] `npm run scaffold:web-portable` generates schema + content-layer module + Astro template.
- [ ] `npm run scaffold:component` generates Sanity object schema + Astro component.
- [ ] Scaffold CLI prompts include URL prefix handling for document routes.
- [ ] Scaffolds print one-line import/registration instructions after generation.
- [ ] Visual editing works for both array-based and portable-text flows.
- [ ] Studio preview links are available for supported documents.
- [ ] `docs/scaffolds.md` documents usage, prompts, outputs, and required wiring.

## Execution Mode

- Sequential (default): chapters are dependency-ordered and should land in order.

## Chapters

| #   | Branch                                                                  | Scope (one sentence)                                                                                         |
| --- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 01  | `chapter/the-big-content-story/01-content-layer-loader-core`            | Add Astro Content Layer Sanity loader core path for published content and typed result contracts.            |
| 02  | `chapter/the-big-content-story/02-content-layer-preview-mode`           | Add draft/preview loader behavior parity with token guardrails.                                              |
| 03  | `chapter/the-big-content-story/03-array-block-primitives-schema`        | Add array block primitive schema modules (Billboard, List Scroller, People refs, RichText).                  |
| 04  | `chapter/the-big-content-story/04-array-page-builder-document`          | Add array-based page-builder document schema and registration wiring.                                        |
| 05  | `chapter/the-big-content-story/05-block-renderer-foundation`            | Add reusable block renderer primitives, shared block types, and baseline block components.                   |
| 06  | `chapter/the-big-content-story/06-blocks-page-template-routes`          | Add block-aware page template and route/query wiring for rendering page blocks.                              |
| 07  | `chapter/the-big-content-story/07-page-schema-consolidate-to-blocks`    | Consolidate web page schema to a single `page` document with `blocks` and remove `arrayPage`.                |
| 08  | `chapter/the-big-content-story/08-image-metadata-normalization`         | Normalize Sanity image authoring to upload+alt and derive dimensions/URL from metadata in content mapping.   |
| 09  | `chapter/the-big-content-story/09-block-preview-subtitles`              | Add Studio block preview subtitles so editors can identify block types quickly in arrays.                    |
| 10  | `chapter/the-big-content-story/10-portable-text-document-schema`        | Add portable-text-first blog document schema and registration wiring.                                        |
| 11  | `chapter/the-big-content-story/11-portable-text-routes`                 | Add route/query mapping and rendering path for portable-text blog documents.                                 |
| 12  | `chapter/the-big-content-story/12-shared-rendering-primitives`          | Add shared Astro rendering primitives and stable prop contracts for generated templates/components.          |
| 13  | `chapter/the-big-content-story/13-scaffold-web-block`                   | Implement block web-content scaffold command with URL-prefix prompt and post-run registration guidance.      |
| 14  | `chapter/the-big-content-story/14-scaffold-web-portable`                | Implement portable-text web-content scaffold command with matching output conventions and guidance line.     |
| 15  | `chapter/the-big-content-story/15-scaffold-component`                   | Implement component scaffold with prompt-selectable body type and fixed output dirs (`atom`/`molecule`/etc). |
| 16  | `chapter/the-big-content-story/16-studio-preview-links`                 | Add Studio preview link generation for supported document types.                                             |
| 17  | `chapter/the-big-content-story/17-visual-editing-integration`           | Wire visual editing behavior for array-based and portable-text content types.                                |
| 18  | chapter/the-big-content-story/18-scaffolded-preview-routes              | Scaffolded content types generate a working preview route/component for visual editing.                      |
| 19  | `chapter/the-big-content-story/19-docs-and-generator-contract-tests`    | Add `docs/scaffolds.md` plus tests for scaffold outputs, route-prefix behavior, and loader preview behavior. |
| 20  | `chapter/the-big-content-story/20-story-hardening-and-regression-guard` | Add final polish, migration-safety checks, and regression validation for existing page behavior.             |

## Out of Scope

- Full design-system polish for generated templates/components.
- New auth models beyond existing preview-token strategy.
- Agent Action production rollout (only backlog candidate capture in this story).

## Dependencies

- Existing Astro + Sanity starter foundation remains intact and passing.
- Sanity project credentials and preview token values available for local validation.
- Astro Content Layer API available in current project version.

## Rescue Notes

- Chapter 05 prototype work exceeded review budget, so it is decomposed into chapters 05-09.
- Existing chapter intent is preserved and renumbered starting at chapter 10.
