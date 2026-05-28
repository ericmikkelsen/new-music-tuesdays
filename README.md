# Astro + Sanity Starter

A production-pattern starter for building Astro sites powered by Sanity content. Built to demonstrate how Sanity and Astro fit together cleanly — content modeling, GROQ queries, visual editing, and draft preview — and to make it easy to scaffold new content types without repeating boilerplate.

**What's included:**

- Sanity Studio integrated at `/studio`
- Block-based page builder and portable-text document types, both wired end-to-end
- Astro Content Layer loaders with draft/preview mode and visual editing (Presentation)
- Studio preview links for supported document types
- Scaffold CLI (`scaffold:web-block`, `scaffold:web-portable`, `scaffold:component`) — generates Sanity schema + Astro content loader + page route in one command ([docs/scaffolds.md](./docs/scaffolds.md))
- Story/chapter branch workflow with conventional commits and quality-gate automation ([docs/developer-workflow.md](./docs/developer-workflow.md))

## How It Works

Content flows: Sanity Studio → GROQ query → Astro Content Layer → Astro page routes.

**Document patterns**

Two reference implementations are included:

- **Block-based (`page`)** — A `blocks` array drives layout via a renderer that maps block types to Astro components (Billboard, ListScroller, PeopleRefs, RichText).
- **Portable-text (`blog`)** — A `richText` field drives a portable-text renderer via `astro-portabletext`.

Shared metadata fields (`title`, `slug`, `description`, `metaImage`) are composed via `WEB_PAGE_FIELDS` to keep schemas consistent.

**Content layer modules**

Each content type follows a three-file pattern:

- `<name>Collection.ts` — GROQ query, result types, and a mapper function.
- `<name>CollectionLoader.ts` — Astro `Loader` that runs the query and populates the content store.
- `src/content.config.ts` — registers all loaders.

The loader handles atomic fallback on fetch failure (keeps the previous store rather than clearing it) and is preview-aware via `src/lib/content/preview.ts`.

**Preview and visual editing**

- Draft preview: enabled via `SANITY_API_READ_TOKEN` + `SANITY_PREVIEW_SECRET`.
- Preview routes: `src/pages/preview/<urlPrefix>/[slug].astro` — opt out of prerendering so drafts load at request time.
- Visual editing: wired via `SanityVisualEditing.tsx` and Sanity Presentation.
- Studio preview links: registered in `sanity/previewLinks.ts`.

## Production Patterns

Key implementation details that may be useful as reference or starting point for your own setup.

**GROQ projections as reusable constants**

Shared field selections are extracted into named constants in `src/lib/content/groqProjections.ts` rather than inlined into every query. Image metadata — deriving `src`, `width`, and `height` from `asset->metadata.dimensions` — is one projection used across multiple document types:

```groq
// SANITY_IMAGE_METADATA_PROJECTION
alt,
"src": asset->url,
"width": asset->metadata.dimensions.width,
"height": asset->metadata.dimensions.height
```

A `projectObjectFields(fieldName, fields)` helper composes these into object projections, so queries stay readable without duplicating field selections.

**Draft vs. published perspective**

The Sanity client in `src/lib/content/preview.ts` switches between `published` and `drafts` perspective based on env flags (`PUBLIC_SANITY_ENABLE_PREVIEW` or `PUBLIC_SANITY_VISUAL_EDITING_ENABLED`). CDN use is also disabled in preview mode to guarantee fresh draft reads. This means the same `loadQuery` helper works for both build-time collection loading and request-time preview routes — no separate code paths.

**Stega encoding for visual editing overlays**

Stega encoding is enabled on the client only when preview mode is active:

```ts
stega: previewEnabled
	? { enabled: true, studioUrl: `${siteUrl}/studio` }
	: false;
```

This keeps production HTML clean while giving the Presentation tool the field-level click targets it needs for overlay navigation.

**Presentation tool + `defineLocations`**

`sanity.config.ts` wires the Presentation tool with a `resolve.locations` map so the iframe navigates correctly when an editor selects a document. Each document type declares which preview URL to open:

```ts
page: defineLocations({
	select: { title: 'title', slug: 'slug.current' },
	resolve: (doc) => ({
		locations: [
			{ title: doc?.title ?? 'Untitled', href: `/preview/${doc?.slug}` }
		]
	})
});
```

**Studio preview links (document actions)**

`sanity/previewLinks.ts` handles the "Open preview" button in the Studio document pane. It resolves a `PUBLIC_SITE_URL` env value (falling back to `localhost:4321`) and maps each `_type` to a URL prefix — keeping the Studio and Astro routing in sync without hardcoding URLs in two places.

**`WEB_PAGE_FIELDS` schema composition**

Shared metadata fields (`title`, `slug`, `description`, `metaImage`, `metaImageAlt`) are defined in `sanity/schemaTypes/webPageFields.ts` as a `WEB_PAGE_FIELDS` object keyed by field name. When composing a document schema, spread `Object.values(WEB_PAGE_FIELDS)` into the schema `fields` array. New document types from the scaffold CLI inherit these fields automatically, so SEO/meta field shape stays consistent across content types.

## Requirements

- Node.js 20+
- npm 10+
- A Sanity account and project

## Quick Start

1. Install dependencies.

```bash
npm install
```

2. Create your environment file.

```bash
cp .env.example .env
```

3. Fill in required environment values in `.env`.

```dotenv
PUBLIC_SANITY_PROJECT_ID=your_project_id
PUBLIC_SANITY_DATASET=production
PUBLIC_SANITY_API_VERSION=2026-01-01
PUBLIC_SITE_URL=http://localhost:4321
SANITY_API_READ_TOKEN=your_read_token_for_preview
SANITY_PREVIEW_SECRET=your_preview_secret
```

`PUBLIC_SITE_URL` is optional in local development, but setting it keeps Studio preview links aligned with the public site URL you expect editors to open.

4. Start development.

```bash
npm run dev
```

5. Visit:

- Site: `http://localhost:4321/`
- Studio: `http://localhost:4321/studio`

## Sanity Token Setup (Concrete UI Steps)

Use a read token for SSR preview and draft-aware queries.

1. Go to `https://www.sanity.io/manage` and sign in.
2. Open the project you are using with this starter.
3. In the project sidebar, click `API`.
4. Open the `Tokens` section.
5. Click `Add API token`.
6. Name it something like `astro-preview-read`.
7. Set permissions to `Viewer` (or lowest read-only scope that supports your queries).
8. Create the token and copy it immediately (Sanity only shows the full value once).
9. Put it in `.env` as `SANITY_API_READ_TOKEN`.
10. Restart the dev server after updating env values.

Security notes:

- Never commit tokens to git.
- Use read-only scope for preview tokens.
- Rotate the token if it is exposed.

## Scripts

- `npm run dev`: Run Astro in development mode.
- `npm run build`: Build the site.
- `npm run preview`: Serve the production build locally.
- `npm test`: Run Node test runner suites.
- `npm run test:dom`: Run DOM tests with Vitest.
- `npm run sanity:typegen`: Generate Sanity static types.

Recommended TypeGen file locations for this starter:

- Schema extract output: `src/sanity/extract.json`
- Generated TypeScript types: `src/sanity/types.ts`

This follows Sanity Learn guidance to keep generated files colocated with Sanity utilities under `src/sanity` rather than writing them to project root.

Generated file policy:

- Do not hand-edit `src/sanity/extract.json` or `src/sanity/types.ts`.
- Regenerate them through scripts whenever schema or GROQ queries change.
- Commit both generated files so CI/reviews use deterministic, versioned types.
- These generated files are excluded from chapter reviewability budget calculations (see [`.github/review-config.json`](.github/review-config.json)).

Recommended script shape:

```json
{
	"scripts": {
		"sanity:schema:extract": "sanity schema extract --enforce-required-fields --path=./src/sanity/extract.json",
		"sanity:typegen": "npm run sanity:schema:extract && sanity typegen generate",
		"predev": "npm run sanity:typegen",
		"prebuild": "npm run sanity:typegen"
	}
}
```

## Story and Chapter Workflow

This repository is organized for narrative branch flow:

- Story branches: `story/<story-slug>`
- Chapter branches: `chapter/<story-slug>/<chapter-slug>`
- Chapter PR target: matching story branch
- Story PR target: `main`

See [docs/story-chapter-branch-policy.md](./docs/story-chapter-branch-policy.md).

## Developer Workflow Docs

If you are using Copilot chat modes and skills:

- [docs/developer-workflow.md](./docs/developer-workflow.md)
- [docs/scaffolds.md](./docs/scaffolds.md) — scaffold command usage, prompts, and wiring steps
- [docs/story-chapter-branch-policy.md](./docs/story-chapter-branch-policy.md) — branch and PR conventions
- `.github/chat-modes/` for mode-specific workflows
- `.github/skills/` for reusable skill references

## Review Tools

Use [`scripts/git-diff-summary.sh`](./scripts/git-diff-summary.sh) to quickly summarize files and lines changed versus another branch.

- Skips deleted files, `package-lock.json`, and Sanity typegen files (`src/sanity/extract.json`, `src/sanity/types.ts`).
- Helps reviewers focus on meaningful changes and ignore generated artifacts.
- Example usage:

```bash
./scripts/git-diff-summary.sh main
```
