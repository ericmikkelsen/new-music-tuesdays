# Spec: Astro + Sanity Starter

## Objective

Build a single Astro project starter that includes an embedded Sanity Studio, a minimal page pipeline, and SSR preview support:

- Content editors create Page documents in Sanity.
- Astro ingests those Page documents as a typed collection.
- Astro statically generates one route per Page slug.
- The homepage lists links to all generated pages.
- Preview mode uses SSR with a Sanity read token for draft-aware rendering.

Primary goals:

- Remove duplicated schema work between Sanity and Astro where practical.
- Keep the starter simple, reviewable, and easy to extend.
- Prepare for page body support via Portable Text primitives (defined now, rendered later).

ASSUMPTIONS I'M MAKING:

1. The starter targets the latest stable Astro major version available at implementation time.
2. The starter targets the latest stable Sanity Studio and Sanity type generation tooling.
3. One initial document type (page) is sufficient for the first story.
4. SSG is the default output mode; dedicated preview behavior uses SSR.
5. The project remains a single workspace/package (no monorepo split).

## Tech Stack

- Astro (latest stable major)
- Sanity Studio (latest stable)
- TypeScript (strict typing where feasible)
- Astro content collections
- Tailwind CSS for baseline styling
- Sanity static type generation
- Node native test runner (`node --test`) for non-DOM logic
- Vitest for DOM-facing tests (where needed)

## Commands

The implementation should provide and document these commands:

- Install: `npm install`
- Develop app+studio: `npm run dev`
- Build: `npm run build`
- Preview build: `npm run preview`
- Lint (if configured): `npm run lint`
- Type check (if configured): `npm run typecheck`
- Unit tests (node runner): `npm test`
- DOM tests (vitest): `npm run test:dom`
- Generate Sanity types: `npm run sanity:typegen`

Type generation automation requirements:

- `npm run sanity:schema:extract` writes `src/sanity/extract.json`
- `npm run sanity:typegen` runs extract + typegen generate in sequence
- `predev` and `prebuild` run `npm run sanity:typegen` to avoid stale generated types

## Project Structure

Target shape (representative):

- `src/pages/index.astro`:
    - Fetches all page entries and renders a simple links list.
- `src/pages/[slug].astro`:
    - Generates static paths from Sanity-backed entries.
    - Renders title + description for each page.
- `src/pages/api/preview.ts` (or equivalent Astro endpoint):
    - Handles preview activation/validation for SSR preview mode.
- `src/content/`:
    - Astro collection config and shared content typing helpers.
- `sanity.config.ts`:
    - Studio setup and schema registration.
- `sanity.cli.ts`:
    - TypeGen configuration using canonical paths below.
- `sanity/schemas/`:
    - Page schema, reusable web field modules, and future body primitive modules.
- `src/sanity/extract.json`:
    - Generated schema extract used by TypeGen.
- `src/sanity/types.ts`:
    - Generated schema + query TypeScript types for Sanity integration.
- `src/lib/content/` (or similar):
    - Shared shape definitions/utilities used by both schema and ingestion layers.
- `tests/`:
    - Node test runner suites for mapping/validation logic.
- `tests-dom/` (or colocated vitest files):
    - Minimal DOM-render assertions where useful.

## Content Model

Initial page document includes:

- title
- slug
- description

Shared reusable web fields to include now:

- metaImage
- metaImageAlt

Future-ready body primitive model to define now (rendering can follow later):

- heading
- subheading
- bodyText
- link object (`url`, `text`)
- list
- image object (`image`, `alt`, `width`, `height`)

## Code Style

- Keep helpers small and explicit.
- Prefer straightforward data mapping over heavy abstractions.
- Introduce shared modules only when they remove clear duplication between Sanity schema and Astro collection typing.
- Keep starter UI intentionally basic and readable.

Example style:

```ts
export type WebPageCore = {
	title: string;
	slug: string;
	description?: string;
};

export function toPagePath(slug: string): string {
	return `/${slug}/`;
}
```

## Testing Strategy

- TDD for behavior changes and mapping logic.
- Node test runner for:
    - Slug/path mapping helpers
    - Sanity-to-Astro transformation validation
    - Shared field definition normalization logic
    - Preview parameter/guard helper logic
- Vitest for:
    - Minimal DOM assertions on homepage page-link rendering
- Run full checks before merge:
    - tests, lint, typecheck, build

## Boundaries

- Always:
    - Use conventional commits.
    - Keep chapters reviewable and concern-scoped.
    - Keep schema/collection contracts typed.
    - Preserve SSG behavior for public pages.
    - Mount Studio at `/studio`.
- Ask first:
    - Adding new dependencies not already required by Astro/Sanity integration.
    - Changing route conventions (for example, nested paths).
    - Introducing additional content types beyond page.
    - Changing token scope or preview security strategy.
- Never:
    - Manually update version fields or changelog release entries.
    - Commit secrets, API tokens, or environment values.
    - Hand-edit generated Sanity files (`src/sanity/extract.json`, `src/sanity/types.ts`).
    - Mix unrelated refactors with feature behavior.

## Success Criteria

- [ ] Starter boots as a single Astro project with integrated Sanity Studio.
- [ ] Studio is reachable at `/studio`.
- [ ] Sanity page schema includes title, slug, description, meta image, and meta image alt.
- [ ] Astro generates one static route per page slug from Sanity-backed content.
- [ ] Homepage lists links to all generated page routes.
- [ ] Shared typing/utilities reduce duplication between schema and Astro ingestion.
- [ ] SSR preview scaffold is implemented with token-based draft-aware access.
- [ ] README includes concrete Sanity UI steps for generating a read token.
- [ ] Scripts regenerate Sanity extract/types before dev and build.
- [ ] Portable Text primitive types are defined for future body implementation.
- [ ] Project includes baseline Tailwind styling and renders correctly on desktop/mobile.
- [ ] Tests cover core mapping logic and pass in CI/local.
- [ ] Build succeeds in SSG mode.

## Open Questions

- Should preview be protected only by secret + read token, or include additional environment guards?

## Delivery Reconciliation (2026-04-27)

Delivered as specified:

- Single Astro project with embedded Sanity Studio.
- Static route generation from Sanity page documents (`index` and `[slug]` pages).
- Reusable page/web metadata schema fields and future-ready body primitive types.
- Draft-aware query scaffolding with token guard logic in preview helper code.
- Sanity typegen automation integrated into `predev` and `prebuild`.
- Baseline styling, mapping tests, and CI-friendly quality checks.

Implemented differently (intentional):

- Astro content collections were not used for Sanity documents. The implementation uses direct typed Sanity querying/mapping under `src/lib/content/` because Sanity is a remote source, not file-based content.

Deferred or intentionally omitted in this story:

- No dedicated preview activation endpoint (`src/pages/api/preview.ts`) yet.
- No Vitest DOM suite (`npm run test:dom`) yet.
- No explicit `lint` or `typecheck` scripts yet.

These deferred items are intentional scope control for the starter foundation and are candidates for the next content-focused story.
