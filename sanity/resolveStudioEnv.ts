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

const ENV_KEY_ALIASES: Record<StudioEnvKey, string[]> = {
	PUBLIC_SANITY_PROJECT_ID: [
		'PUBLIC_SANITY_PROJECT_ID',
		'SANITY_STUDIO_PROJECT_ID'
	],
	PUBLIC_SANITY_DATASET: ['PUBLIC_SANITY_DATASET', 'SANITY_STUDIO_DATASET']
};

const readFirstEnvValue = (
	env: Record<string, string | undefined> | undefined,
	keys: string[]
): string | undefined => {
	if (!env) {
		return undefined;
	}

	for (const envKey of keys) {
		const value = env[envKey];
		if (typeof value === 'string' && value) {
			return value;
		}
	}

	return undefined;
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
	const importMetaEnvValue = readFirstEnvValue(
		importMetaEnv,
		ENV_KEY_ALIASES[key]
	);
	if (importMetaEnvValue) {
		return importMetaEnvValue;
	}

	const processEnv =
		options.processEnv ??
		(typeof process !== 'undefined' ? process.env : undefined);
	const processEnvValue = readFirstEnvValue(processEnv, ENV_KEY_ALIASES[key]);
	if (processEnvValue) {
		return processEnvValue;
	}

	throw new Error(
		`Missing required environment variable ${key}. Checked aliases: ${ENV_KEY_ALIASES[key].join(', ')}.`
	);
};
