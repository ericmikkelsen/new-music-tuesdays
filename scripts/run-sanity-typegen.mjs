import { existsSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.PUBLIC_SANITY_DATASET;

const extractPath = './src/sanity/extract.json';

// The generated outputs live under src so the Astro app and tests can import them consistently.
mkdirSync('./src/sanity', { recursive: true });

/**
 * Runs the repo-installed Sanity CLI and exits this script with the same status code.
 *
 * @param args The Sanity CLI arguments to pass through to `npx sanity`.
 * @returns The exit status reported by the child process.
 */
function runSanityCommand(args) {
	const result = spawnSync('npx', ['sanity', ...args], {
		stdio: 'inherit'
	});

	return result.status ?? 1;
}

// Fresh clones should still install, test, and build before Sanity credentials are configured.
// If env vars are missing but a committed extract exists, still regenerate types from that snapshot.
if (!projectId || !dataset) {
	if (!existsSync(extractPath)) {
		console.log(
			'Skipping sanity:typegen (set PUBLIC_SANITY_PROJECT_ID and PUBLIC_SANITY_DATASET to enable extraction).'
		);
		process.exit(0);
	}

	console.log(
		'Generating Sanity types from existing src/sanity/extract.json (env vars not set).'
	);
	process.exit(runSanityCommand(['typegen', 'generate']));
}

// Extraction runs first so TypeGen reads the current schema snapshot from disk.
const extractStatus = runSanityCommand([
	'schema',
	'extract',
	'--enforce-required-fields',
	`--path=${extractPath}`
]);

if (extractStatus !== 0) {
	process.exit(extractStatus);
}

process.exit(runSanityCommand(['typegen', 'generate']));
