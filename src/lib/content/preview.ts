import { createClient, type QueryParams } from '@sanity/client';

// Supports both Astro runtime (import.meta.env) and Node test runtime (process.env).
const runtimeEnv = ((
	import.meta as { env?: Record<string, string | undefined> }
).env ?? process.env) as Record<string, string | undefined>;

type PreviewRuntimeEnv = Record<string, string | undefined>;

const projectId = runtimeEnv.PUBLIC_SANITY_PROJECT_ID || '3do82whm';
const dataset = runtimeEnv.PUBLIC_SANITY_DATASET || 'production';
const apiVersion = runtimeEnv.PUBLIC_SANITY_API_VERSION || '2026-01-01';

/**
 * Resolves whether draft preview behavior should be active.
 *
 * Either env flag enables preview so visual editing and data perspective stay aligned.
 */
export const resolvePreviewEnabled = (env: PreviewRuntimeEnv): boolean =>
	env.PUBLIC_SANITY_ENABLE_PREVIEW === 'true' ||
	env.PUBLIC_SANITY_VISUAL_EDITING_ENABLED === 'true';

const previewEnabled = resolvePreviewEnabled(runtimeEnv);
const token = runtimeEnv.SANITY_API_READ_TOKEN;
const siteUrl = runtimeEnv.PUBLIC_SITE_URL || 'http://localhost:4321';

const client = createClient({
	projectId,
	dataset,
	apiVersion,
	// Published traffic can use the CDN, but preview must read fresh draft content directly.
	useCdn: !previewEnabled,
	// stega.enabled defaults to false, so it must be explicitly enabled for overlays to work.
	stega: previewEnabled
		? { enabled: true, studioUrl: `${siteUrl}/studio` }
		: false
});

/**
 * Returns whether preview mode is enabled via environment toggle.
 *
 * @returns `true` when preview-specific query behavior should be enabled.
 */
export function isPreviewEnabled(): boolean {
	return previewEnabled;
}

/**
 * Executes a GROQ query using published or drafts perspective based on preview mode.
 *
 * @template QueryResult The expected result shape for the GROQ query.
 * @param query The GROQ query string to execute.
 * @param params Optional named GROQ parameters passed to the query.
 * @returns The typed query result from Sanity.
 * @throws When preview mode is enabled but no read token is configured.
 */
export async function loadQuery<QueryResult>(
	query: string,
	params?: QueryParams
): Promise<QueryResult> {
	if (!previewEnabled) {
		return client.fetch<QueryResult>(query, params ?? {}, {
			perspective: 'published',
			stega: false
		});
	}

	if (!token) {
		// Draft queries require authenticated access, so preview without a token is a configuration error.
		throw new Error(
			'SANITY_API_READ_TOKEN is required when PUBLIC_SANITY_ENABLE_PREVIEW=true or PUBLIC_SANITY_VISUAL_EDITING_ENABLED=true.'
		);
	}

	return client.fetch<QueryResult>(query, params ?? {}, {
		perspective: 'drafts',
		token,
		stega: { enabled: true, studioUrl: `${siteUrl}/studio` }
	});
}
