# Scaffold Generators

Adding a new content type to this project involves touching Sanity (schema), Astro (content loader, page route), and a couple of config files. The scaffold commands handle the repetitive file generation so you can focus on the actual content model. Each command is interactive — it asks you a few questions, writes the files, and then prints the exact snippets you need to paste into your config files.

This page is a reference for each scaffold: what it does, how to run it, and exactly what to do when it finishes.

> **Note:** Scaffold commands never edit existing config files. They generate new files only and print instructions for the manual wiring steps. If you close the terminal before copying the snippets, the steps are all documented below.

---

## Component Scaffold

### What it does

Creates a new reusable Sanity **object** type and a matching Astro component. Use this for content pieces that appear inside other documents — things like a card, a callout, a testimonial, or a feature row. This does **not** create a new document type, page route, or content collection. It's purely for schema objects and their UI components.

### How to use it

Run the command and answer the prompts:

```
npm run scaffold:component
```

- **name** — a camelCase identifier for the component, e.g. `callout` or `featureCard`
- **category** — which subfolder to place the Astro component in: `atoms`, `molecules`, or `blocks`
- **fields** — which optional fields to include, e.g. eyebrow text, image, link button
- **body type** — whether the body field should be plain text or rich portable text (with headings, links, etc.)

The command creates:

- `sanity/schemaTypes/objects/<name>.ts` — the Sanity object schema definition
- `src/components/<category>/<PascalName>.astro` — the Astro component to render it

### After it runs

Open `sanity/schemaTypes/index.ts` and add:

```ts
import { <name>Type } from './objects/<name>';
// add <name>Type to the types array
```

That's it — the component is now available to reference from other schemas.

---

## Block-based Webpage Scaffold

### What it does

Creates a new Sanity **document** type whose pages are assembled from an array of composable blocks. Use this for flexible page types like landing pages, product pages, or general content pages — anywhere an editor should be able to stack and reorder sections. This is the "page builder" pattern.

Along with the schema, it generates everything needed to load that content in Astro: a GROQ query, a content loader, and a page route.

### How to use it

Run the command and answer the prompts:

```
npm run scaffold:web-block
```

- **name** — a camelCase identifier for the document type, e.g. `landingPage` or `caseStudy`
- **urlPrefix** — the URL path segment where these pages will live, e.g. `case-studies` (produces `/case-studies/[slug]`)

The command creates:

- `sanity/schemaTypes/documents/<name>.ts` — the Sanity document schema
- `src/lib/content/<name>Collection.ts` — GROQ query, TypeScript result types, and a mapper function
- `src/lib/content/<name>CollectionLoader.ts` — an Astro Content Layer loader that runs the query
- `src/pages/<urlPrefix>/[slug].astro` — the public-facing page route
- `src/pages/preview/<urlPrefix>/[slug].astro` — the draft preview route

### After it runs

**1. Register the schema** — open `sanity/schemaTypes/index.ts` and add:

```ts
import { <name>Type } from './documents/<name>';
// add <name>Type to the types array
```

**2. Register the collection** — open `src/content.config.ts` and add:

```ts
import { create<PascalName>CollectionLoader } from './lib/content/<name>CollectionLoader';
const <name> = defineCollection({ loader: create<PascalName>CollectionLoader() });
// add <name> to the collections export
```

**3. Add a Studio preview link** — open `sanity/previewLinks.ts` so the "Open preview" button works in Sanity Studio:

```ts
const DOCUMENT_ROUTE_PREFIXES: Record<string, string> = {
  page: '/preview',
  blog: '/preview/blog',
  <name>: '/preview/<urlPrefix>', // ← add this line
};
```

---

## Portable-text-based Webpage Scaffold

### What it does

Creates a new Sanity **document** type whose pages are driven by rich text (portable text). Use this for authored content like blog posts, news articles, or documentation pages — anywhere the body is a flowing text document rather than a block array.

Along with the schema, it generates everything needed to load that content in Astro: a GROQ query, a content loader, and a page route.

### How to use it

Run the command and answer the prompts:

```
npm run scaffold:web-portable
```

- **name** — a camelCase identifier for the document type, e.g. `article` or `newsItem`
- **urlPrefix** — the URL path segment where these pages will live, e.g. `articles` (produces `/articles/[slug]`)

The command creates:

- `sanity/schemaTypes/documents/<name>.ts` — the Sanity document schema
- `src/lib/content/<name>Collection.ts` — GROQ query, TypeScript result types, and a mapper function
- `src/lib/content/<name>CollectionLoader.ts` — an Astro Content Layer loader that runs the query
- `src/pages/<urlPrefix>/[slug].astro` — the public-facing page route
- `src/pages/preview/<urlPrefix>/[slug].astro` — the draft preview route

### After it runs

**1. Register the schema** — open `sanity/schemaTypes/index.ts` and add:

```ts
import { <name>Type } from './documents/<name>';
// add <name>Type to the types array
```

**2. Register the collection** — open `src/content.config.ts` and add:

```ts
import { create<PascalName>CollectionLoader } from './lib/content/<name>CollectionLoader';
const <name> = defineCollection({ loader: create<PascalName>CollectionLoader() });
// add <name> to the collections export
```

**3. Add a Studio preview link** — open `sanity/previewLinks.ts` so the "Open preview" button works in Sanity Studio:

```ts
const DOCUMENT_ROUTE_PREFIXES: Record<string, string> = {
  page: '/preview',
  blog: '/preview/blog',
  <name>: '/preview/<urlPrefix>', // ← add this line
};
```

---

## Preview Routes

### What it does

Draft preview routes are generated automatically by the Web Block and Web Portable scaffolds. A preview route is a special Astro page that loads unpublished draft content at request time instead of at build time — it's what powers the "Open preview" button in Sanity Studio.

There is currently no standalone `npm run scaffold:preview-route` command. The reusable helper lives in `scripts/scaffold-preview-route.ts` and is called by the document scaffolds.

### How to use it

Generate a preview route by running one of the document scaffolds:

```
npm run scaffold:web-block
npm run scaffold:web-portable
```

Each command asks for the document `name` and `urlPrefix`, then creates the matching preview route automatically.

Those commands create:

- `src/pages/preview/<urlPrefix>/[slug].astro` — the draft preview page

### After it runs

No extra preview-specific config files need updating beyond the normal scaffold wiring. Before testing the preview, double-check that:

1. The collection and loader are registered in `src/content.config.ts` (see the wiring steps in Web Block or Web Portable above).
2. The document type is added to `DOCUMENT_ROUTE_PREFIXES` in `sanity/previewLinks.ts` (also in the wiring steps above).

---

## Notes

**The CLI always reprints the wiring steps** when a scaffold finishes. This page exists so you have a reference if that terminal output is gone.

**Tests** for all generators live in `tests/` — `scaffold-web-block.test.ts`, `scaffold-web-portable.test.ts`, `scaffold-component.test.ts`, `scaffold-preview-route.test.ts`, and `scaffold-utils.test.ts`. They cover input validation, generated file shape, GROQ queries, loader and preview integration, and guidance output.
