/**
 * Normalizes a Sanity page slug for routing and path generation.
 *
 * - `"/"` (or repeated slashes) is treated as the homepage indicator.
 * - Leading/trailing slashes are trimmed for non-root slugs.
 */
export function normalizePageSlug(slug: string): string {
	const trimmed = slug.trim();
	if (!trimmed) {
		return '';
	}

	if (/^\/+$/u.test(trimmed)) {
		return '/';
	}

	return trimmed.replace(/^\/+|\/+$/gu, '');
}

/**
 * Converts a normalized Sanity page slug to a public path.
 */
export function toPagePath(slug: string): string {
	const normalized = normalizePageSlug(slug);

	if (!normalized || normalized === '/') {
		return '/';
	}

	return `/${normalized}/`;
}

/**
 * Converts a normalized Sanity page slug into an Astro dynamic route param.
 * Returns `undefined` for the homepage indicator because `[slug]` cannot represent `/`.
 */
export function toPageRouteParam(slug: string): string | undefined {
	const normalized = normalizePageSlug(slug);

	if (!normalized || normalized === '/') {
		return undefined;
	}

	return normalized;
}
