import { resolve } from 'node:path';
import { writeGeneratedFile, toPascalCase } from './scaffold-utils';

/**
 * Generates a preview route for a scaffolded content type.
 *
 * The generated route fetches drafts at request time via `loadQuery` so that
 * unpublished content is visible in Sanity's Presentation tool. It depends only
 * on the exports the scaffold's collection module already provides.
 *
 * @param name       Sanity document type name (e.g. 'article').
 * @param urlPrefix  URL path prefix for generated routes (e.g. 'articles').
 * @param type       'block' | 'portable' — determines which template to use.
 */
export function generatePreviewRoute(
	name: string,
	urlPrefix: string,
	type: 'block' | 'portable'
) {
	const pascal = toPascalCase(name);
	const upper = name.toUpperCase();

	const sharedFrontmatterTop = `import { loadQuery } from '../../../lib/content/preview';
import {
	SANITY_${upper}_PREVIEW_QUERY,
	mapSanity${pascal}ToCollectionEntry,
	type Sanity${pascal}QueryResult
} from '../../../lib/content/${name}Collection';
import HTML from '../../../layouts/html.astro';`;

	const sharedFrontmatterBottom = `export const prerender = false;

const slug = Astro.params.slug;
let entry: ReturnType<typeof mapSanity${pascal}ToCollectionEntry> = null;

if (slug) {
	const result = await loadQuery<Sanity${pascal}QueryResult | null>(
		SANITY_${upper}_PREVIEW_QUERY,
		{ slug }
	);
	entry = result ? mapSanity${pascal}ToCollectionEntry(result) : null;
}

if (!entry) {
	Astro.response.status = 404;
}

const title = entry?.data.title ?? 'Preview not found';
const description =
	entry?.data.description ?? 'The requested preview page was not found.';`;

	if (type === 'block') {
		return `---
${sharedFrontmatterTop}
import BlocksPage from '../../../layouts/BlocksPage.astro';

${sharedFrontmatterBottom}
---

{
	entry ? (
		<BlocksPage
			title={entry.data.title}
			description={entry.data.description}
			page={entry.data}
		/>
	) : (
		<HTML title={title} description={description}>
			<div class="mx-auto max-w-3xl px-6 py-14 text-stone-700">
				Preview page not found.
			</div>
		</HTML>
	)
}
`;
	}

	// Portable text preview route uses shared PortablePage layout.
	return `---
${sharedFrontmatterTop}
import PortablePage from '../../../layouts/PortablePage.astro';

${sharedFrontmatterBottom}
---

{
	entry ? (
		<PortablePage
			title={entry.data.title}
			description={entry.data.description}
			body={entry.data.body}
			urlPrefix="${urlPrefix}"
		/>
	) : (
		<HTML title={title} description={description}>
			<div class="mx-auto max-w-3xl px-6 py-14 text-stone-700">
				Preview page not found.
			</div>
		</HTML>
	)
}
`;
}

/**
 * Writes the preview route file for a scaffolded content type.
 */
export function writePreviewRoute(
	name: string,
	urlPrefix: string,
	type: 'block' | 'portable'
) {
	const previewPath = resolve(`src/pages/preview/${urlPrefix}/[slug].astro`);
	const content = generatePreviewRoute(name, urlPrefix, type);
	writeGeneratedFile(previewPath, content);
}
