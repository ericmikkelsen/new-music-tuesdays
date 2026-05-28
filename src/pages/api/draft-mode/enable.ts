import type { APIRoute } from 'astro';
import { validatePreviewUrl } from '@sanity/preview-url-secret';
import { perspectiveCookieName } from '@sanity/preview-url-secret/constants';
import { createClient } from '@sanity/client';

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = import.meta.env.PUBLIC_SANITY_DATASET;
const apiVersion = import.meta.env.PUBLIC_SANITY_API_VERSION || '2026-01-01';

/**
 * Activated by the Sanity Presentation Tool when an editor opens the preview pane.
 *
 * Validates the signed secret from the Studio, sets the perspective cookie, and
 * redirects to the requested page so the iframe loads draft content with stega
 * encoding enabled.
 */
export const GET: APIRoute = async ({ request, cookies, redirect }) => {
	const token = import.meta.env.SANITY_API_READ_TOKEN;

	if (!token) {
		return new Response(
			'Server misconfigured: missing SANITY_API_READ_TOKEN',
			{
				status: 500
			}
		);
	}

	const clientWithToken = createClient({
		projectId,
		dataset,
		apiVersion,
		useCdn: false,
		token
	});

	const {
		isValid,
		redirectTo = '/',
		studioPreviewPerspective
	} = await validatePreviewUrl(clientWithToken, request.url);

	if (!isValid) {
		return new Response('Invalid secret', { status: 401 });
	}

	const isSecure = new URL(request.url).protocol === 'https:';
	cookies.set(perspectiveCookieName, studioPreviewPerspective ?? 'drafts', {
		httpOnly: false,
		sameSite: isSecure ? 'none' : 'lax',
		secure: isSecure,
		path: '/'
	});

	return redirect(redirectTo, 307);
};
