import type { WebDocumentCore } from './shared';
import {
	projectObjectFields,
	SANITY_IMAGE_ASSET_REF_FIELDS
} from './groqProjections';
import { normalizePageSlug, toPagePath } from './pageSlug';

/**
 * Canonical published-page query used by the build-time Astro content loader.
 */
export const SANITY_PAGE_COLLECTION_QUERY = `*[_type == "page" && defined(slug.current)]{
  _id,
  title,
  "slug": slug.current,
  description,
	${projectObjectFields('metaImage', SANITY_IMAGE_ASSET_REF_FIELDS)},
  metaImageAlt
} | order(title asc)`;

/**
 * Minimal Sanity page shape required to normalize a page into the content layer.
 */
export type SanityPageQueryResult = {
	_id: string;
	title?: string;
	slug?: string;
	description?: string;
	metaImage?: {
		asset?: {
			_ref?: string;
		};
	};
	metaImageAlt?: string;
};

/**
 * Data persisted for each page entry inside Astro's content layer store.
 */
export type PageCollectionEntryData = WebDocumentCore & {
	path: string;
};

/**
 * Content-layer entry wrapper pairing a stable entry id with validated page data.
 */
export type PageCollectionEntry = {
	id: string;
	data: PageCollectionEntryData;
};

/**
 * Maps a Sanity page document into the normalized shape stored in Astro's content layer.
 *
 * @param entry The raw Sanity page document returned from the published query.
 * @returns A content-layer entry, or `null` when required fields are missing.
 */
export function mapSanityPageToCollectionEntry(
	entry: SanityPageQueryResult
): PageCollectionEntry | null {
	if (!entry._id || !entry.slug || !entry.title) {
		return null;
	}

	const normalizedSlug = normalizePageSlug(entry.slug);
	if (!normalizedSlug) {
		return null;
	}

	return {
		id: entry._id,
		data: {
			title: entry.title,
			slug: normalizedSlug,
			description: entry.description,
			// The content layer stores only the image fields current routes/renderers need.
			metaImage: entry.metaImage?.asset?._ref
				? {
						assetRef: entry.metaImage.asset._ref,
						alt: entry.metaImageAlt
					}
				: undefined,
			metaImageAlt: entry.metaImageAlt,
			// Route parity matters so existing page URLs keep matching the earlier fetch path.
			path: toPagePath(normalizedSlug)
		}
	};
}
