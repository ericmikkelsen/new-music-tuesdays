import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

import {
	toPascalCase,
	toStudioTitle,
	toDocumentTypeName,
	toUrlPrefix,
	validateScaffoldInputs,
	printScaffoldGuidance,
	createPromptSession,
	writeGeneratedFile
} from './scaffold-utils';
import { writePreviewRoute } from './scaffold-preview-route';

// Re-export shared utilities so tests and consumers can import them
// from this module without needing to know they live in scaffold-utils.
export { toPascalCase, validateScaffoldInputs };

// ---------------------------------------------------------------------------
// Template functions — pure string generators, no I/O, fully testable
// ---------------------------------------------------------------------------

/**
 * Generates a Sanity document schema for a block-based web content type.
 *
 * @param name  Sanity document type name (e.g. 'campaign').
 * @param title Studio display title (e.g. 'Campaign').
 * @returns TypeScript source for the schema file.
 */
export function generateSanityBlockSchema(name: string, title: string): string {
	return `import { defineArrayMember, defineField, defineType } from 'sanity';

import { WEB_PAGE_FIELDS } from '../webPageFields';

export const ${name}Type = defineType({
\tname: '${name}',
\ttitle: '${title}',
\ttype: 'document',
\tfields: [
\t\t...Object.values(WEB_PAGE_FIELDS),
\t\tdefineField({
\t\t\tname: 'blocks',
\t\t\ttitle: 'Blocks',
\t\t\ttype: 'array',
\t\t\tof: [
\t\t\t\tdefineArrayMember({ type: 'billboard' }),
\t\t\t\tdefineArrayMember({ type: 'listScroller' }),
\t\t\t\tdefineArrayMember({ type: 'peopleRefs' }),
\t\t\t\tdefineArrayMember({ type: 'richText' })
\t\t\t],
\t\t\tvalidation: (rule) => rule.required().min(1)
\t\t})
\t],
\tpreview: {
\t\tselect: {
\t\t\ttitle: 'title',
\t\t\tsubtitle: 'slug.current'
\t\t}
\t}
});
`;
}

/**
 * Generates the Astro content-layer collection module for a block document type.
 *
 * @param name       Sanity document type name (e.g. 'campaign').
 * @param urlPrefix  URL path prefix for generated routes (e.g. 'campaigns').
 * @returns TypeScript source for the collection module.
 */
export function generateBlockCollectionModule(
	name: string,
	urlPrefix: string
): string {
	const pascal = toPascalCase(name);
	const upper = name.toUpperCase();
	return `import type { WebDocumentCore } from './shared';
import type { Page as SanityPage } from '../../sanity/types';
import {
	projectObjectFields,
	SANITY_IMAGE_ASSET_REF_FIELDS
} from './groqProjections';

type SanityPageBuilderBlock = SanityPage['blocks'][number];

type ArrayPageBuilderBlock =
	| (Omit<Extract<SanityPageBuilderBlock, { _type: 'billboard' }>, 'image'> & {
			image?: {
				alt?: string;
				src?: string;
				width?: number;
				height?: number;
			};
	  })
	| Extract<SanityPageBuilderBlock, { _type: 'listScroller' }>
	| (Omit<Extract<SanityPageBuilderBlock, { _type: 'peopleRefs' }>, 'people'> & {
			people?: Array<{ _id: string; name?: string }>;
	  })
	| Extract<SanityPageBuilderBlock, { _type: 'richText' }>;

export const SANITY_${upper}_COLLECTION_QUERY = \`*[_type == "${name}" && defined(slug.current)]{
  _id,
  title,
  "slug": slug.current,
  description,
  \${projectObjectFields('metaImage', SANITY_IMAGE_ASSET_REF_FIELDS)},
  metaImageAlt,
  blocks[]{
    _type,
    heading,
    body,
    richText,
    items,
    image {
      alt,
      "src": asset->url,
      "width": asset->metadata.dimensions.width,
      "height": asset->metadata.dimensions.height
    },
    people[]->{
      _id,
      name
    }
  }
} | order(title asc)\`;

/** Single-document query for preview routes. Accepts a $slug GROQ param. */
export const SANITY_${upper}_PREVIEW_QUERY = \`*[_type == "${name}" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  description,
  \${projectObjectFields('metaImage', SANITY_IMAGE_ASSET_REF_FIELDS)},
  metaImageAlt,
  blocks[]{
    _type,
    heading,
    body,
    richText,
    items,
    image {
      alt,
      "src": asset->url,
      "width": asset->metadata.dimensions.width,
      "height": asset->metadata.dimensions.height
    },
    people[]->{
      _id,
      name
    }
  }
}\`;

export type Sanity${pascal}QueryResult = {
\t_id: string;
\ttitle?: string;
\tslug?: string;
\tdescription?: string;
\tmetaImage?: {
\t\tasset?: {
\t\t\t_ref?: string;
\t\t};
\t};
\tmetaImageAlt?: string;
\tblocks?: ArrayPageBuilderBlock[];
};

export type ${pascal}CollectionEntryData = WebDocumentCore & {
\tblocks?: ArrayPageBuilderBlock[];
\tpath: string;
};

export type ${pascal}CollectionEntry = {
\tid: string;
\tdata: ${pascal}CollectionEntryData;
};

export function mapSanity${pascal}ToCollectionEntry(
\tentry: Sanity${pascal}QueryResult
): ${pascal}CollectionEntry | null {
\tif (!entry._id || !entry.slug || !entry.title) {
\t\treturn null;
\t}

\treturn {
\t\tid: entry._id,
\t\tdata: {
\t\t\ttitle: entry.title,
\t\t\tslug: entry.slug,
\t\t\tdescription: entry.description,
\t\t\tmetaImage: entry.metaImage?.asset?._ref
\t\t\t\t? {
\t\t\t\t\t\tassetRef: entry.metaImage.asset._ref,
\t\t\t\t\t\talt: entry.metaImageAlt
\t\t\t\t\t}
\t\t\t\t: undefined,
\t\t\tmetaImageAlt: entry.metaImageAlt,
\t\t\tblocks: entry.blocks,
\t\t\tpath: \`/${urlPrefix}/\${entry.slug}/\`
\t\t}
\t};
}
`;
}

/**
 * Generates the Astro content-layer loader for a block document type.
 *
 * @param name  Sanity document type name (e.g. 'campaign').
 * @returns TypeScript source for the loader file.
 */
export function generateBlockCollectionLoader(name: string): string {
	const pascal = toPascalCase(name);
	const upper = name.toUpperCase();
	return `import type { Loader } from 'astro/loaders';
import { z } from 'astro/zod';

import {
\tmapSanity${pascal}ToCollectionEntry,
\tSANITY_${upper}_COLLECTION_QUERY,
\ttype Sanity${pascal}QueryResult
} from './${name}Collection';
import { loadQuery } from './preview';

const ${name}CollectionSchema = z.object({
\ttitle: z.string(),
\tslug: z.string(),
\tdescription: z.string().optional(),
\tmetaImage: z
\t\t.object({
\t\t\tassetRef: z.string(),
\t\t\talt: z.string().optional(),
\t\t\twidth: z.number().optional(),
\t\t\theight: z.number().optional()
\t\t})
\t\t.optional(),
\tmetaImageAlt: z.string().optional(),
	blocks: z.array(z.record(z.string(), z.unknown())).optional(),
\tpath: z.string()
});

export function create${pascal}CollectionLoader(): Loader {
\treturn {
\t\tname: 'sanity-${name}-collection-loader',
\t\tschema: ${name}CollectionSchema,
\t\tload: async ({ store, parseData, generateDigest, logger }) => {
\t\t\tlogger.info('Loading Sanity ${name} entries into Astro content layer.');

\t\t\tlet results: Sanity${pascal}QueryResult[];
\t\t\ttry {
\t\t\t\tresults = await loadQuery<Sanity${pascal}QueryResult[]>(
\t\t\t\t\tSANITY_${upper}_COLLECTION_QUERY
\t\t\t\t);
\t\t\t} catch (err) {
\t\t\t\tlogger.warn(
\t\t\t\t\t\`Failed to load Sanity ${name} entries – keeping previous store. Error: \${err instanceof Error ? err.message : String(err)}\`
\t\t\t\t);
\t\t\t\treturn;
\t\t\t}

\t\t\tstore.clear();

\t\t\tfor (const result of results) {
\t\t\t\tconst mapped = mapSanity${pascal}ToCollectionEntry(result);
\t\t\t\tif (!mapped) continue;

\t\t\t\tconst data = await parseData({ id: mapped.id, data: mapped.data });
\t\t\t\tstore.set({ id: mapped.id, data, digest: generateDigest(data) });
\t\t\t}
\t\t}
\t} satisfies Loader;
}
`;
}

/**
 * Generates a slug route page for a scaffolded block content type.
 *
 * @param name       Sanity document type name (e.g. 'campaign').
 * @param title      PascalCase display name (e.g. 'Campaign').
 * @param urlPrefix  URL path prefix used in the generated route directory.
 * @returns Astro route source for src/pages/<urlPrefix>/[slug].astro.
 */
export function generateBlockPageRoute(
	name: string,
	title: string,
	urlPrefix: string
): string {
	const pascal = toPascalCase(name);
	return `---
import '../../styles/global.css';
import { getCollection } from 'astro:content';
import BlocksPage from '../../layouts/BlocksPage.astro';
import type { ${pascal}CollectionEntryData } from '../../lib/content/${name}Collection';

interface Props {
	entry: ${pascal}CollectionEntryData;
	title?: string;
	description?: string;
}

export async function getStaticPaths() {
	const entries = await getCollection('${name}');
	return entries.map((entry) => ({
		params: { slug: entry.data.slug },
		props: {
			entry: entry.data,
			title: entry.data.title,
			description: entry.data.description
		}
	}));
}

const { entry } = Astro.props as Props;
---

	<BlocksPage
	title={entry.title}
	description={entry.description}
	page={entry}
/>
`;
}

// ---------------------------------------------------------------------------
// I/O layer — calls templates and writes files to disk
// ---------------------------------------------------------------------------

/**
 * Writes all four scaffold files for a block web content type.
 * Does not edit any existing file — prints registration guidance instead.
 *
 * @param name       Sanity document type name (e.g. 'campaign').
 * @param title      PascalCase display name (e.g. 'Campaign').
 * @param urlPrefix  URL path prefix for generated routes (e.g. 'campaigns').
 */
export function writeScaffoldFiles(
	name: string,
	title: string,
	urlPrefix: string
): void {
	writeGeneratedFile(
		resolve(`sanity/schemaTypes/documents/${name}.ts`),
		generateSanityBlockSchema(name, title)
	);
	writeGeneratedFile(
		resolve(`src/lib/content/${name}Collection.ts`),
		generateBlockCollectionModule(name, urlPrefix)
	);
	writeGeneratedFile(
		resolve(`src/lib/content/${name}CollectionLoader.ts`),
		generateBlockCollectionLoader(name)
	);
	writeGeneratedFile(
		resolve(`src/pages/${urlPrefix}/[slug].astro`),
		generateBlockPageRoute(name, title, urlPrefix)
	);
	writePreviewRoute(name, urlPrefix, 'block');
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
	const prompter = createPromptSession();
	const label = await prompter.ask('Name (e.g. Campaign Page): ');
	const defaultName = toDocumentTypeName(label);
	const defaultUrlPrefix = toUrlPrefix(defaultName);
	const name = await prompter.askWithDefault(
		'  Document type name',
		defaultName
	);
	const urlPrefix = await prompter.askWithDefault(
		'  URL prefix',
		defaultUrlPrefix
	);
	prompter.close();

	validateScaffoldInputs(name, urlPrefix);

	const title = toStudioTitle(name);
	writeScaffoldFiles(name, title, urlPrefix);

	printScaffoldGuidance(name, urlPrefix);
}

const isMain =
	typeof process !== 'undefined' &&
	process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
	main().catch((error) => {
		console.error(error);
		process.exitCode = 1;
	});
}
