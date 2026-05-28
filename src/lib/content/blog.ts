import type { WebDocumentCore } from './shared';
import type { TypedObject } from 'astro-portabletext/types';
import {
	projectObjectFields,
	SANITY_IMAGE_ASSET_REF_FIELDS
} from './groqProjections';
import { loadQuery } from './preview';

const BLOG_QUERY = `*[_type == "blog" && defined(slug.current)]{
  _id,
  title,
  "slug": slug.current,
  description,
  ${projectObjectFields('metaImage', SANITY_IMAGE_ASSET_REF_FIELDS)},
  metaImageAlt,
  richText
} | order(title asc)`;

const BLOG_BY_SLUG_QUERY = `*[_type == "blog" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  description,
  ${projectObjectFields('metaImage', SANITY_IMAGE_ASSET_REF_FIELDS)},
  metaImageAlt,
  richText
}`;

type SanityBlogQueryResult = {
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
	richText?: TypedObject[];
};

export type AstroBlogPost = WebDocumentCore & {
	id: string;
	path: string;
	body: TypedObject[];
};

/**
 * Maps a raw Sanity blog query result to the normalized Astro blog post shape.
 *
 * @param entry The raw blog document returned from the Sanity query.
 * @returns A normalized Astro blog post, or `null` when required values are missing.
 */
export function mapSanityBlogToAstroPost(
	entry: SanityBlogQueryResult
): AstroBlogPost | null {
	if (!entry.slug || !entry.title) {
		return null;
	}

	return {
		id: entry._id,
		title: entry.title,
		slug: entry.slug,
		description: entry.description,
		metaImage: entry.metaImage?.asset?._ref
			? {
					assetRef: entry.metaImage.asset._ref,
					alt: entry.metaImageAlt
				}
			: undefined,
		metaImageAlt: entry.metaImageAlt,
		// Astro routes are emitted with trailing slashes, so the mapped path mirrors build output.
		path: `/blog/${entry.slug}/`,
		body: entry.richText ?? []
	};
}

/**
 * Fetches all blog posts from Sanity and returns only valid mapped entries.
 *
 * @returns The mapped post list, or an empty array when Sanity cannot be queried.
 */
export async function getAstroBlogPosts(): Promise<AstroBlogPost[]> {
	try {
		const results = await loadQuery<SanityBlogQueryResult[]>(BLOG_QUERY);
		// Invalid records are dropped here so route generation never has to branch on partial data.
		return results
			.map(mapSanityBlogToAstroPost)
			.filter((entry): entry is AstroBlogPost => Boolean(entry));
	} catch {
		// Static generation should degrade to no dynamic pages instead of failing the whole build.
		return [];
	}
}

/**
 * Fetches a single blog post by slug directly from Sanity using a slug-parameterized query.
 * Preferred over `getAstroBlogPostBySlug` for preview routes where fetching the full
 * collection per request would be unnecessarily expensive.
 *
 * @param slug The blog slug to fetch.
 * @returns The mapped post, or `undefined` when not found or on error.
 */
export async function getAstroBlogPostBySlugDirect(
	slug: string
): Promise<AstroBlogPost | undefined> {
	try {
		const result = await loadQuery<SanityBlogQueryResult | null>(
			BLOG_BY_SLUG_QUERY,
			{ slug }
		);
		if (!result) return undefined;
		return mapSanityBlogToAstroPost(result) ?? undefined;
	} catch {
		return undefined;
	}
}

/**
 * Looks up a single blog post by slug from the mapped post list.
 *
 * @param slug The blog slug to match against the mapped result set.
 * @returns The first post whose slug matches the input, if one exists.
 */
export async function getAstroBlogPostBySlug(
	slug: string
): Promise<AstroBlogPost | undefined> {
	const posts = await getAstroBlogPosts();
	return posts.find((post) => post.slug === slug);
}
