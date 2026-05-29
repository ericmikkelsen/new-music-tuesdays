import { Iframe } from 'sanity-plugin-iframe-pane';
import type { DefaultDocumentNodeResolver } from 'sanity/structure';

const previewPathBySchemaType: Record<string, (slug: string) => string> = {
	page: (slug) => `/preview/${slug}`,
	blog: (slug) => `/preview/blog/${slug}`,
	musicRelease: (slug) => `/preview/music/${slug}`,
	newMusicTuesday: (slug) => `/preview/new-music-tuesday/${slug}`
};

export const defaultDocumentNode: DefaultDocumentNodeResolver = (
	S,
	{ schemaType }
) => {
	const resolvePath = previewPathBySchemaType[schemaType];
	if (!resolvePath) {
		return S.document().views([S.view.form()]);
	}

	return S.document().views([
		S.view.form(),
		S.view
			.component(Iframe)
			.options({
				url: (doc: { slug?: { current?: string } }) => {
					const slug = doc?.slug?.current;
					if (!slug) {
						return new Error('Missing slug');
					}
					return resolvePath(slug);
				}
			})
			.title('Preview')
	]);
};
