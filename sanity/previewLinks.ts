type PreviewEnvOptions = {
	importMetaEnv?: Record<string, string | undefined>;
	processEnv?: Record<string, string | undefined>;
};

type PreviewableDocument = {
	_type?: string;
	slug?: string | { current?: string } | null;
};

const PREVIEW_SITE_URL_ENV_KEY = 'PUBLIC_SITE_URL';
const DEFAULT_PREVIEW_SITE_URL = 'http://localhost:4321';

const DOCUMENT_ROUTE_PREFIXES: Record<string, string> = {
	page: '/preview',
	blog: '/preview/blog'
};

/**
 * Resolves the public site URL used by Studio preview links.
 */
export const resolvePreviewSiteUrl = (
	options: PreviewEnvOptions = {}
): string => {
	const importMetaEnv = options.importMetaEnv ?? import.meta?.env;
	const processEnv =
		options.processEnv ??
		(typeof process !== 'undefined' ? process.env : undefined);

	const rawSiteUrl =
		importMetaEnv?.[PREVIEW_SITE_URL_ENV_KEY] ??
		processEnv?.[PREVIEW_SITE_URL_ENV_KEY] ??
		DEFAULT_PREVIEW_SITE_URL;
	const normalizedSiteUrl = rawSiteUrl.trim();

	if (!normalizedSiteUrl) {
		return DEFAULT_PREVIEW_SITE_URL;
	}

	return normalizedSiteUrl.replace(/\/+$/, '');
};

const resolveDocumentSlug = (
	document: PreviewableDocument
): string | undefined => {
	const slugValue = document.slug;

	if (typeof slugValue === 'string' && slugValue) {
		return slugValue;
	}

	if (
		typeof slugValue === 'object' &&
		slugValue !== null &&
		typeof slugValue.current === 'string' &&
		slugValue.current
	) {
		return slugValue.current;
	}

	return undefined;
};

const normalizePreviewSlug = (slug: string): string => {
	const trimmed = slug.trim();
	if (!trimmed) {
		return '';
	}

	if (/^\/+$/u.test(trimmed)) {
		return '/';
	}

	return trimmed.replace(/^\/+|\/+$/gu, '');
};

/**
 * Resolves the production preview URL for supported routable document types.
 */
export const resolveDocumentProductionUrl = (
	document: PreviewableDocument,
	options: PreviewEnvOptions = {}
): string | undefined => {
	if (!document._type || !(document._type in DOCUMENT_ROUTE_PREFIXES)) {
		return undefined;
	}

	const slug = resolveDocumentSlug(document);
	if (!slug) {
		return undefined;
	}

	const normalizedSlug = normalizePreviewSlug(slug);
	if (!normalizedSlug) {
		return undefined;
	}

	const baseUrl = resolvePreviewSiteUrl(options);
	const routePrefix = DOCUMENT_ROUTE_PREFIXES[document._type];

	return normalizedSlug === '/'
		? `${baseUrl}${routePrefix}`
		: `${baseUrl}${routePrefix}/${normalizedSlug}`;
};
