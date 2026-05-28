import type { Loader } from 'astro/loaders';
import { z } from 'astro/zod';

import {
	mapSanityPageToCollectionEntry,
	SANITY_PAGE_COLLECTION_QUERY,
	type SanityPageQueryResult
} from './pageCollection';
import { isPreviewEnabled, loadQuery } from './preview';

/**
 * Shared schema for published page entries persisted in Astro's content store.
 */
const pageCollectionSchema = z.object({
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
	path: z.string()
});

/**
 * Loads published Sanity pages into Astro's build-time content layer.
 *
 * @returns An Astro build-time loader for the `pages` collection.
 */
export function createSanityPageCollectionLoader() {
	return {
		name: 'sanity-page-collection-loader',
		schema: pageCollectionSchema,
		load: async ({ store, parseData, generateDigest, logger }) => {
			const mode = resolvePageCollectionLoaderMode();
			logger.info(
				`Loading Sanity pages into Astro content layer (mode: ${mode}).`
			);

			let results: SanityPageQueryResult[];
			try {
				results = await loadQuery<SanityPageQueryResult[]>(
					SANITY_PAGE_COLLECTION_QUERY
				);
			} catch (err) {
				// On failure keep the previous store intact so stale data is served rather
				// than an empty collection. Callers can treat this as a warning; a hard
				// build error would hide any previous valid content.
				logger.warn(
					`Failed to load Sanity pages – keeping previous store. Error: ${err instanceof Error ? err.message : String(err)}`
				);
				return;
			}

			// Only clear after a successful fetch so a transient failure cannot leave the
			// store empty when a previous sync had valid entries (atomic-replace strategy).
			store.clear();

			for (const result of results) {
				const mapped = mapSanityPageToCollectionEntry(result);

				if (!mapped) {
					// Invalid records are dropped here so the collection API only exposes typed entries.
					continue;
				}

				const data = await parseData({
					id: mapped.id,
					data: mapped.data
				});

				store.set({
					id: mapped.id,
					data,
					// Digests let Astro skip rewrites when entry data has not changed between syncs.
					digest: generateDigest(data)
				});
			}
		}
	} satisfies Loader;
}

/**
 * Derives loader mode from shared preview configuration.
 *
 * @param previewEnabled Optional override used by tests.
 * @returns `preview` when draft perspective should be used, otherwise `published`.
 */
export function resolvePageCollectionLoaderMode(
	previewEnabled: boolean = isPreviewEnabled()
): 'preview' | 'published' {
	return previewEnabled ? 'preview' : 'published';
}
