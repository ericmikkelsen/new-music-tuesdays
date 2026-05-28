import type { Loader } from 'astro/loaders';
import { z } from 'astro/zod';

import {
	mapSanityPersonToCollectionEntry,
	SANITY_PEOPLE_COLLECTION_QUERY,
	type SanityPersonQueryResult
} from './peopleCollection';
import { loadQuery } from './preview';

const peopleCollectionSchema = z.object({
	name: z.string(),
	bio: z.array(z.record(z.string(), z.unknown())),
	image: z.object({
		src: z.string().url(),
		alt: z.string().optional(),
		width: z.number(),
		height: z.number()
	})
});

/**
 * Loads people documents into Astro's build-time content layer.
 */
export function createSanityPeopleCollectionLoader() {
	return {
		name: 'sanity-people-collection-loader',
		schema: peopleCollectionSchema,
		load: async ({ store, parseData, generateDigest, logger }) => {
			logger.info('Loading Sanity people into Astro content layer.');

			let results: SanityPersonQueryResult[];
			try {
				results = await loadQuery<SanityPersonQueryResult[]>(
					SANITY_PEOPLE_COLLECTION_QUERY
				);
			} catch (err) {
				logger.warn(
					`Failed to load Sanity people – keeping previous store. Error: ${err instanceof Error ? err.message : String(err)}`
				);
				return;
			}

			store.clear();

			for (const result of results) {
				const mapped = mapSanityPersonToCollectionEntry(result);
				if (!mapped) {
					continue;
				}

				const data = await parseData({
					id: mapped.id,
					data: mapped.data
				});

				store.set({
					id: mapped.id,
					data,
					digest: generateDigest(data)
				});
			}
		}
	} satisfies Loader;
}
