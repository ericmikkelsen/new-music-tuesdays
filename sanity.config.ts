import { defineConfig } from 'sanity';
import {
	defineLocations,
	presentationTool,
	type PresentationPluginOptions
} from 'sanity/presentation';
import { structureTool } from 'sanity/structure';

import {
	resolveDocumentProductionUrl,
	resolvePreviewSiteUrl
} from './sanity/previewLinks';
import { schemaTypes } from './sanity/schemaTypes';

declare const __SANITY_STUDIO_PROJECT_ID__: string;
declare const __SANITY_STUDIO_DATASET__: string;

type StudioEnvKey = 'PUBLIC_SANITY_PROJECT_ID' | 'PUBLIC_SANITY_DATASET';

/**
 * Injectable sources make this resolver testable in Node while still working in browser bundles.
 */
type ResolveStudioEnvOptions = {
	defineValues?: Record<StudioEnvKey, string | undefined>;
	importMetaEnv?: Record<string, string | undefined>;
	processEnv?: Record<string, string | undefined>;
};

/**
 * Resolves required public Studio env values for embedded Studio runtime.
 *
 * Resolution order intentionally prefers Vite-defined constants first so browser
 * hydration does not depend on Node globals.
 *
 * @param key Required Studio env key.
 * @param options Optional injected sources used primarily by tests.
 * @returns The resolved env value.
 * @throws {Error} When no source provides a required value.
 */
export const resolveStudioEnvValue = (
	key: StudioEnvKey,
	options: ResolveStudioEnvOptions = {}
): string => {
	const defineValues = options.defineValues ?? {
		PUBLIC_SANITY_PROJECT_ID:
			typeof __SANITY_STUDIO_PROJECT_ID__ === 'undefined'
				? undefined
				: __SANITY_STUDIO_PROJECT_ID__,
		PUBLIC_SANITY_DATASET:
			typeof __SANITY_STUDIO_DATASET__ === 'undefined'
				? undefined
				: __SANITY_STUDIO_DATASET__
	};
	if (typeof defineValues[key] === 'string' && defineValues[key]) {
		return defineValues[key];
	}

	const importMetaEnv = options.importMetaEnv ?? import.meta?.env;
	if (typeof importMetaEnv?.[key] === 'string' && importMetaEnv[key]) {
		return importMetaEnv[key];
	}

	const processEnv =
		options.processEnv ??
		(typeof process !== 'undefined' ? process.env : undefined);
	if (typeof processEnv?.[key] === 'string' && processEnv[key]) {
		return processEnv[key];
	}

	throw new Error(
		`Missing required environment variable ${key}. Set it in .env before starting Astro Studio.`
	);
};

const projectId = resolveStudioEnvValue('PUBLIC_SANITY_PROJECT_ID');
const dataset = resolveStudioEnvValue('PUBLIC_SANITY_DATASET');

/**
 * Embedded Studio configuration served through the Astro app.
 *
 * The shared schema type registry is imported from `sanity/schemaTypes` so
/**
 * Maps Sanity document types to their preview routes in the Astro frontend.
 * The Presentation Tool uses this to navigate the iframe when an editor selects a document.
 */
const presentationResolve: PresentationPluginOptions['resolve'] = {
	locations: {
		page: defineLocations({
			select: { title: 'title', slug: 'slug.current' },
			resolve: (doc) => ({
				locations: [
					{
						title: doc?.title ?? 'Untitled',
						href: `/preview/${doc?.slug}`
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
						href: `/preview/blog/${doc?.slug}`
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
		structureTool(),
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
