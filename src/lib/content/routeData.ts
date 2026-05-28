import { getAstroBlogPosts, type AstroBlogPost } from './blog';
import { getAstroPages, type AstroPage } from './pages';
import { toPageRouteParam } from './pageSlug';

type SlugRouteParams = {
	slug: string;
};

export type PageRouteProps = {
	page: AstroPage;
	title: string;
	description?: string;
};

export type BlogRouteProps = {
	post: AstroBlogPost;
	title: string;
	description?: string;
};

/**
 * Reused by both public and preview page routes to keep route props in sync.
 */
export async function getPageStaticPaths() {
	const pages = await getAstroPages();

	return pages.flatMap((page) => {
		const slug = toPageRouteParam(page.slug);
		if (!slug) {
			return [];
		}

		return [
			{
				params: { slug } satisfies SlugRouteParams,
				props: {
					page,
					title: page.title,
					description: page.description
				} satisfies PageRouteProps
			}
		];
	});
}

/**
 * Reused by both public and preview blog routes to keep route props in sync.
 */
export async function getBlogStaticPaths() {
	const posts = await getAstroBlogPosts();

	return posts.map((post) => ({
		params: { slug: post.slug } satisfies SlugRouteParams,
		props: {
			post,
			title: post.title,
			description: post.description
		} satisfies BlogRouteProps
	}));
}
