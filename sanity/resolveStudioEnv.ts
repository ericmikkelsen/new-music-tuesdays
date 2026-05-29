declare const __SANITY_STUDIO_PROJECT_ID__: string;
declare const __SANITY_STUDIO_DATASET__: string;

export type StudioEnvKey = 'PUBLIC_SANITY_PROJECT_ID' | 'PUBLIC_SANITY_DATASET';

/**
 * Injectable sources make this resolver testable in Node while still working in browser bundles.
 */
export type ResolveStudioEnvOptions = {
	defineValues?: Record<StudioEnvKey, string | undefined>;
	importMetaEnv?: Record<string, string | undefined>;
	processEnv?: Record<string, string | undefined>;
};

/**
 * Resolves required public Studio env values for embedded Studio runtime.
 *
 * Resolution order intentionally prefers Vite-defined constants first so browser
 * hydration does not depend on Node globals.
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
