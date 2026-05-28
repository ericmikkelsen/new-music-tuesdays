import type { APIRoute } from 'astro';
import { perspectiveCookieName } from '@sanity/preview-url-secret/constants';

/**
 * Exits draft mode by clearing the perspective cookie and redirecting home.
 * Called by the DisableDraftMode button rendered in the layout.
 */
export const GET: APIRoute = ({ cookies, redirect }) => {
	cookies.delete(perspectiveCookieName, { path: '/' });
	return redirect('/', 307);
};
