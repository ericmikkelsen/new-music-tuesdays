import type { WebDocumentCore } from './shared';
import type { ArrayPageBuilderBlock } from './pageBuilderTypes';
import {
	projectObjectFields,
	SANITY_IMAGE_ASSET_REF_FIELDS,
	SANITY_IMAGE_METADATA_PROJECTION
} from './groqProjections';
import { normalizePageSlug, toPagePath } from './pageSlug';
import { loadQuery } from './preview';

const PAGE_QUERY = `*[_type == "page" && defined(slug.current)]{
	_type,
  _id,
  title,
  "slug": slug.current,
  description,
	${projectObjectFields('metaImage', SANITY_IMAGE_ASSET_REF_FIELDS)},
  metaImageAlt,
	blocks[]{
		...,
		image {
			${SANITY_IMAGE_METADATA_PROJECTION}
		},
		people[]->{
			_id,
			name
		}
	}
} | order(title asc)`;

const PAGE_BY_SLUG_QUERY = `*[_type == "page" && slug.current == $slug][0]{
	_type,
  _id,
  title,
  "slug": slug.current,
  description,
	${projectObjectFields('metaImage', SANITY_IMAGE_ASSET_REF_FIELDS)},
  metaImageAlt,
	blocks[]{
		...,
		image {
			${SANITY_IMAGE_METADATA_PROJECTION}
		},
		people[]->{
			_id,
			name
		}
	}
}`;

type SanityPageQueryResult = {
	_type?: 'page';
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
	blocks?: ArrayPageBuilderBlock[];
};

export type AstroPage = WebDocumentCore & {
	id: string;
	path: string;
	documentType?: 'page';
	blocks?: ArrayPageBuilderBlock[];
};

/**
 * Maps raw Sanity page query results into the normalized Astro page shape.
 *
 * @param entry The raw page document returned from the Sanity query.
 * @returns A normalized Astro page, or `null` when required values are missing.
 */
export function mapSanityPageToAstroPage(
	entry: SanityPageQueryResult
): AstroPage | null {
	if (!entry.slug || !entry.title) {
		return null;
	}

	const normalizedSlug = normalizePageSlug(entry.slug);
	if (!normalizedSlug) {
		return null;
	}

	return {
		id: entry._id,
		title: entry.title,
		slug: normalizedSlug,
		description: entry.description,
		metaImage: entry.metaImage?.asset?._ref
			? {
					// The frontend only needs the asset reference here so image URL building can stay centralized.
					assetRef: entry.metaImage.asset._ref,
					alt: entry.metaImageAlt
				}
			: undefined,
		metaImageAlt: entry.metaImageAlt,
		documentType: entry._type,
		blocks: entry.blocks,
		// Astro routes are emitted with trailing slashes, so the mapped path mirrors build output.
		path: toPagePath(normalizedSlug)
	};
}

/**
 * Fetches all pages from Sanity and returns only valid mapped entries.
 *
 * @returns The mapped page list, or an empty array when Sanity cannot be queried.
 */
export async function getAstroPages(): Promise<AstroPage[]> {
	try {
		const results = await loadQuery<SanityPageQueryResult[]>(PAGE_QUERY);
		// Invalid records are dropped here so route generation never has to branch on partial data.
		return results
			.map(mapSanityPageToAstroPage)
			.filter((entry): entry is AstroPage => Boolean(entry));
	} catch {
		// Static generation should degrade to no dynamic pages instead of failing the whole build.
		return [];
	}
}

/**
 * Fetches a single page by slug directly from Sanity using a slug-parameterized query.
 * Preferred over `getAstroPageBySlug` for preview routes where fetching the full
 * collection per request would be unnecessarily expensive.
 *
 * @param slug The page slug to fetch.
 * @returns The mapped page, or `undefined` when not found or on error.
 */
export async function getAstroPageBySlugDirect(
	slug: string
): Promise<AstroPage | undefined> {
	const normalizedSlug = normalizePageSlug(slug);
	if (!normalizedSlug) {
		return undefined;
	}

	try {
		const result = await loadQuery<SanityPageQueryResult | null>(
			PAGE_BY_SLUG_QUERY,
			{ slug: normalizedSlug }
		);
		if (!result) return undefined;
		return mapSanityPageToAstroPage(result) ?? undefined;
	} catch {
		return undefined;
	}
}

/**
 * Looks up a single page by slug from the mapped page list.
 *
 * @param slug The page slug to match against the mapped result set.
 * @returns The first page whose slug matches the input, if one exists.
 */
export async function getAstroPageBySlug(
	slug: string
): Promise<AstroPage | undefined> {
	const normalizedSlug = normalizePageSlug(slug);
	if (!normalizedSlug) {
		return undefined;
	}

	const pages = await getAstroPages();
	return pages.find((page) => page.slug === normalizedSlug);
}
