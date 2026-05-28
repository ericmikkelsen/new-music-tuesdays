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
export { toPascalCase, toStudioTitle, validateScaffoldInputs };

// ---------------------------------------------------------------------------
// Template functions - pure string generators, no I/O, fully testable
// ---------------------------------------------------------------------------

/**
 * Generates a Sanity document schema for a portable-text-based web content type.
 *
 * @param name  Sanity document type name (e.g. 'article').
 * @param title Studio display title (e.g. 'Landing Page').
 * @returns TypeScript source for the schema file.
 */
export function generateSanityPortableSchema(
	name: string,
	title: string
): string {
	return `import { defineField, defineType } from 'sanity';
import { RICH_TEXT_FIELD_ARGS } from '../objects/componentFields';

import { WEB_PAGE_FIELDS } from '../webPageFields';

export const ${name}Type = defineType({
	name: '${name}',
	title: '${title}',
	type: 'document',
	fields: [
		...Object.values(WEB_PAGE_FIELDS),
		defineField({
			...RICH_TEXT_FIELD_ARGS,
			title: 'Body'
		})
	],
	preview: {
		select: {
			title: 'title',
			subtitle: 'slug.current'
		}
	}
});
`;
}

/**
 * Generates the Astro content-layer collection module for a portable document type.
 *
 * @param name       Sanity document type name (e.g. 'article').
 * @param urlPrefix  URL path prefix for generated routes (e.g. 'articles').
 * @returns TypeScript source for the collection module.
 */
export function generatePortableCollectionModule(
	name: string,
	urlPrefix: string
): string {
	const pascal = toPascalCase(name);
	const upper = name.toUpperCase();
	return [
		`import type { WebDocumentCore } from './shared';`,
		`import type { TypedObject } from 'astro-portabletext/types';`,
		`import {`,
		`  projectObjectFields,`,
		`  SANITY_IMAGE_ASSET_REF_FIELDS`,
		`} from './groqProjections';`,
		'',
		`export const SANITY_${upper}_COLLECTION_QUERY = \`*[_type == "${name}" && defined(slug.current)]{`,
		`  _id,`,
		`  title,`,
		`  "slug": slug.current,`,
		`  description,`,
		`  \${projectObjectFields('metaImage', SANITY_IMAGE_ASSET_REF_FIELDS)},`,
		`  metaImageAlt,`,
		`  richText`,
		`} | order(title asc)\`;`,
		'',
		`/** Single-document query for preview routes. Accepts a \\$slug GROQ param. */`,
		`export const SANITY_${upper}_PREVIEW_QUERY = \`*[_type == "${name}" && slug.current == $slug][0]{`,
		`  _id,`,
		`  title,`,
		`  "slug": slug.current,`,
		`  description,`,
		`  \${projectObjectFields('metaImage', SANITY_IMAGE_ASSET_REF_FIELDS)},`,
		`  metaImageAlt,`,
		`  richText`,
		`}\`;`,
		'',
		`export type Sanity${pascal}QueryResult = {`,
		`  _id: string;`,
		`  title?: string;`,
		`  slug?: string;`,
		`  description?: string;`,
		`  metaImage?: {`,
		`    asset?: {`,
		`      _ref?: string;`,
		`    };`,
		`  };`,
		`  metaImageAlt?: unknown;`,
		`  richText?: TypedObject[];`,
		`};`,
		'',
		`export type ${pascal}CollectionEntryData = WebDocumentCore & {`,
		`  body: TypedObject[];`,
		`  path: string;`,
		`};`,
		'',
		`export type ${pascal}CollectionEntry = {`,
		`  id: string;`,
		`  data: ${pascal}CollectionEntryData;`,
		`};`,
		'',
		'/**',
		' * Maps a Sanity document into the generated Astro collection entry contract.',
		' * Invalid records are dropped by returning null when required values are missing.',
		' */',
		`export function mapSanity${pascal}ToCollectionEntry(`,
		`  entry: Sanity${pascal}QueryResult`,
		`): ${pascal}CollectionEntry | null {`,
		`  if (!entry._id || !entry.slug || !entry.title) {`,
		`    return null;`,
		`  }`,
		'',
		`  // Ensure metaImageAlt is always a string (handle object/array/null)`,
		`  let metaImageAlt: string | undefined = undefined;`,
		`  if (typeof entry.metaImageAlt === 'string') {`,
		`    metaImageAlt = entry.metaImageAlt;`,
		`  } else if (entry.metaImageAlt && typeof entry.metaImageAlt === 'object') {`,
		`    metaImageAlt = JSON.stringify(entry.metaImageAlt);`,
		`  } else if (entry.metaImageAlt != null) {`,
		`    metaImageAlt = String(entry.metaImageAlt);`,
		`  }`,
		'',
		`  return {`,
		`    id: entry._id,`,
		`    data: {`,
		`      title: entry.title,`,
		`      slug: entry.slug,`,
		`      description: entry.description,`,
		`      metaImage: (entry.metaImage && entry.metaImage.asset && entry.metaImage.asset._ref) ? { assetRef: entry.metaImage.asset._ref, alt: metaImageAlt } : undefined,`,
		`      metaImageAlt: metaImageAlt,`,
		`      body: entry.richText ?? [],`,
		`      path: '/' + '${urlPrefix}/' + entry.slug + '/'`,
		`    }`,
		`  };`,
		`}`,
		''
	].join('\n');
}

/**
 * Generates the Astro content-layer loader for a portable document type.
 *
 * @param name  Sanity document type name (e.g. 'article').
 * @returns TypeScript source for the loader file.
 */
export function generatePortableCollectionLoader(name: string): string {
	const pascal = toPascalCase(name);
	const upper = name.toUpperCase();
	return `import type { Loader } from 'astro/loaders';
import { z } from 'astro/zod';

import {
	mapSanity${pascal}ToCollectionEntry,
	SANITY_${upper}_COLLECTION_QUERY,
	type Sanity${pascal}QueryResult
} from './${name}Collection';
import { loadQuery } from './preview';

const ${name}CollectionSchema = z.object({
	title: z.string(),
	slug: z.string(),
	description: z.string().optional(),
	metaImage: z
		.object({
			assetRef: z.string(),
			alt: z.string().optional(),
			width: z.number().optional(),
			height: z.number().optional()
		})
		.optional(),
	metaImageAlt: z.string().optional(),
	body: z.array(z.record(z.string(), z.unknown())),
	path: z.string()
});

export function create${pascal}CollectionLoader(): Loader {
	return {
		name: 'sanity-${name}-collection-loader',
		schema: ${name}CollectionSchema,
		load: async ({ store, parseData, generateDigest, logger }) => {
			logger.info('Loading Sanity ${name} entries into Astro content layer.');

			let results: Sanity${pascal}QueryResult[];
			try {
				results = await loadQuery<Sanity${pascal}QueryResult[]>(
					SANITY_${upper}_COLLECTION_QUERY
				);
			} catch (err) {
				logger.warn(
					\`Failed to load Sanity ${name} entries - keeping previous store. Error: \${err instanceof Error ? err.message : String(err)}\`
				);
				return;
			}

			store.clear();

			for (const result of results) {
				const mapped = mapSanity${pascal}ToCollectionEntry(result);
				if (!mapped) continue;

				const data = await parseData({ id: mapped.id, data: mapped.data });
				store.set({ id: mapped.id, data, digest: generateDigest(data) });
			}
		}
	} satisfies Loader;
}
`;
}

/**
 * Generates a slug route page for a scaffolded portable text content type.
 *
 * @param name       Sanity document type name (e.g. 'article').
 * @param title      Studio-facing display name (e.g. 'Article').
 * @param urlPrefix  URL path prefix used in the generated route directory.
 * @returns Astro route source for src/pages/<urlPrefix>/[slug].astro.
 */
export function generatePortablePageRoute(
	name: string,
	title: string,
	urlPrefix: string
): string {
	const pascal = toPascalCase(name);
	return `---
import '../../styles/global.css';
import { getCollection } from 'astro:content';
import PortablePage from '../../layouts/PortablePage.astro';
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

<PortablePage
  title={entry.title}
  description={entry.description}
  body={entry.body}
  urlPrefix="${urlPrefix}"
/> 
`;
}

// ---------------------------------------------------------------------------
// I/O layer - calls templates and writes files to disk
// ---------------------------------------------------------------------------

/**
 * Writes all scaffold files for a portable-text web content type.
 * Does not edit any existing file - prints registration guidance instead.
 *
 * @param name       Sanity document type name (e.g. 'article').
 * @param title      Studio-facing display name (e.g. 'Article').
 * @param urlPrefix  URL path prefix for generated routes (e.g. 'articles').
 */
export function writeScaffoldFiles(
	name: string,
	title: string,
	urlPrefix: string
): void {
	writeGeneratedFile(
		resolve(`sanity/schemaTypes/documents/${name}.ts`),
		generateSanityPortableSchema(name, title)
	);
	writeGeneratedFile(
		resolve(`src/lib/content/${name}Collection.ts`),
		generatePortableCollectionModule(name, urlPrefix)
	);
	writeGeneratedFile(
		resolve(`src/lib/content/${name}CollectionLoader.ts`),
		generatePortableCollectionLoader(name)
	);
	writeGeneratedFile(
		resolve(`src/pages/${urlPrefix}/[slug].astro`),
		generatePortablePageRoute(name, title, urlPrefix)
	);
	writePreviewRoute(name, urlPrefix, 'portable');
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
