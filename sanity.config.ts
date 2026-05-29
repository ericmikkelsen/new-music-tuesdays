import { assist } from '@sanity/assist';
import { defineConfig } from 'sanity';
import {
	defineDocuments,
	defineLocations,
	presentationTool,
	type PresentationPluginOptions
} from 'sanity/presentation';
import { structureTool } from 'sanity/structure';

import {
	resolveDocumentProductionUrl,
	resolvePreviewSiteUrl
} from './sanity/previewLinks';
import { defaultDocumentNode } from './sanity/defaultDocumentNode';
import { resolveStudioEnvValue } from './sanity/resolveStudioEnv';
import { schemaTypes } from './sanity/schemaTypes';

const projectId = resolveStudioEnvValue('PUBLIC_SANITY_PROJECT_ID');
const dataset = resolveStudioEnvValue('PUBLIC_SANITY_DATASET');

const PREVIEW_ROUTE_PREFIX_BY_TYPE = {
	page: '/preview',
	blog: '/preview/blog',
	musicRelease: '/preview/music',
	newMusicTuesday: '/preview/new-music-tuesday'
} as const;

type PreviewableType = keyof typeof PREVIEW_ROUTE_PREFIX_BY_TYPE;

const resolvePreviewPath = (type: PreviewableType, slug?: string): string => {
	const prefix = PREVIEW_ROUTE_PREFIX_BY_TYPE[type];
	const normalizedSlug = slug
		?.trim()
		.replace(/^\/+/u, '')
		.replace(/\/+$/u, '');

	if (!normalizedSlug) {
		return prefix;
	}

	return `${prefix}/${normalizedSlug}`;
};

/**
 * Embedded Studio configuration served through the Astro app.
 *
 * The shared schema type registry is imported from `sanity/schemaTypes` so
/**
 * Maps Sanity document types to their preview routes in the Astro frontend.
 * The Presentation Tool uses this to navigate the iframe when an editor selects a document.
 */
const presentationResolve: PresentationPluginOptions['resolve'] = {
	mainDocuments: defineDocuments([
		{
			route: '/preview/:slug',
			filter: '_type == "page" && slug.current == $slug'
		},
		{
			route: '/preview/blog/:slug',
			filter: '_type == "blog" && slug.current == $slug'
		},
		{
			route: '/preview/music/:slug',
			filter: '_type == "musicRelease" && slug.current == $slug'
		},
		{
			route: '/preview/new-music-tuesday/:slug',
			filter: '_type == "newMusicTuesday" && slug.current == $slug'
		}
	]),
	locations: {
		page: defineLocations({
			select: { title: 'title', slug: 'slug.current' },
			resolve: (doc) => ({
				locations: [
					{
						title: doc?.title ?? 'Untitled',
						href: resolvePreviewPath('page', doc?.slug)
					}
				]
			})
		}),
		blog: defineLocations({
			select: { title: 'title', slug: 'slug.current' },
			resolve: (doc) => ({
				locations: [
					{
						title: doc?.title ?? 'Untitled',
						href: resolvePreviewPath('blog', doc?.slug)
					}
				]
			})
		}),
		musicRelease: defineLocations({
			select: { title: 'title', slug: 'slug.current' },
			resolve: (doc) => ({
				locations: [
					{
						title: doc?.title ?? 'Untitled release',
						href: resolvePreviewPath('musicRelease', doc?.slug)
					}
				]
			})
		}),
		newMusicTuesday: defineLocations({
			select: { title: 'title', slug: 'slug.current' },
			resolve: (doc) => ({
				locations: [
					{
						title: doc?.title ?? 'Untitled issue',
						href: resolvePreviewPath('newMusicTuesday', doc?.slug)
					}
				]
			})
		})
	}
};

/**
 * Embedded Studio configuration served through the Astro app.
 *
 * The shared schema type registry is imported from `sanity/schemaTypes` so
 * document and object definitions are composed in one place.
 */
export default defineConfig({
	name: 'astro-sanity-starter',
	title: 'Astro + Sanity Starter',
	projectId,
	dataset,
	plugins: [
		structureTool({ defaultDocumentNode }),
		assist(),
		presentationTool({
			resolve: presentationResolve,
			previewUrl: {
				// When Studio is embedded in the Astro app, use the current origin;
				// otherwise fall back to PUBLIC_SITE_URL / localhost.
				initial:
					typeof location !== 'undefined'
						? location.origin
						: resolvePreviewSiteUrl(),
				previewMode: {
					enable: '/api/draft-mode/enable'
				}
			}
		})
	],
	document: {
		productionUrl: async (previousUrl, context) =>
			previousUrl ?? resolveDocumentProductionUrl(context.document)
	},
	schema: {
		// Central registry keeps schema composition predictable as new types are added.
		types: schemaTypes
	}
});
