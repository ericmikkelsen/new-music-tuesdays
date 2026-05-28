import { defineCliConfig } from 'sanity/cli';

// Defaults let contributors run commands immediately, then override with their own project values.
const projectId = process.env.PUBLIC_SANITY_PROJECT_ID || '3do82whm';
const dataset = process.env.PUBLIC_SANITY_DATASET || 'production';

/**
 * Sanity CLI configuration used by schema extract and type generation scripts.
 *
 * TypeGen writes into `src/sanity` so generated artifacts stay colocated with
 * content-layer code and can be versioned consistently.
 */
export default defineCliConfig({
	api: {
		projectId,
		dataset
	},
	typegen: {
		path: './src/**/*.{ts,tsx,js,jsx,astro}',
		schema: './src/sanity/extract.json',
		generates: './src/sanity/types.ts'
	}
});
