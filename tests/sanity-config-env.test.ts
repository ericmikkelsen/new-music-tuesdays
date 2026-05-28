import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Imports the resolver lazily so each test can control env setup beforehand.
 */
const importResolver = async () => {
	const module = await import('../sanity.config');
	return module.resolveStudioEnvValue;
};

/**
 * Wraps a test body with temporary Studio env values and restores prior state.
 *
 * @param {() => Promise<void>} callback - Async test body.
 */
const withStudioEnv = async (callback: () => Promise<void>) => {
	const previousProjectId = process.env.PUBLIC_SANITY_PROJECT_ID;
	const previousDataset = process.env.PUBLIC_SANITY_DATASET;

	process.env.PUBLIC_SANITY_PROJECT_ID = 'test-project';
	process.env.PUBLIC_SANITY_DATASET = 'test-dataset';

	try {
		await callback();
	} finally {
		if (previousProjectId === undefined) {
			delete process.env.PUBLIC_SANITY_PROJECT_ID;
		} else {
			process.env.PUBLIC_SANITY_PROJECT_ID = previousProjectId;
		}

		if (previousDataset === undefined) {
			delete process.env.PUBLIC_SANITY_DATASET;
		} else {
			process.env.PUBLIC_SANITY_DATASET = previousDataset;
		}
	}
};

test('resolveStudioEnvValue prefers import.meta env values', async () => {
	await withStudioEnv(async () => {
		const resolveStudioEnvValue = await importResolver();
		const value = resolveStudioEnvValue('PUBLIC_SANITY_PROJECT_ID', {
			defineValues: {
				PUBLIC_SANITY_PROJECT_ID: undefined,
				PUBLIC_SANITY_DATASET: undefined
			},
			importMetaEnv: {
				PUBLIC_SANITY_PROJECT_ID: 'meta-project'
			},
			processEnv: {
				PUBLIC_SANITY_PROJECT_ID: 'process-project'
			}
		});

		assert.equal(value, 'meta-project');
	});
});

test('resolveStudioEnvValue falls back to process env when import.meta env is missing', async () => {
	await withStudioEnv(async () => {
		const resolveStudioEnvValue = await importResolver();
		const value = resolveStudioEnvValue('PUBLIC_SANITY_DATASET', {
			defineValues: {
				PUBLIC_SANITY_PROJECT_ID: undefined,
				PUBLIC_SANITY_DATASET: undefined
			},
			importMetaEnv: {},
			processEnv: {
				PUBLIC_SANITY_DATASET: 'process-dataset'
			}
		});

		assert.equal(value, 'process-dataset');
	});
});

test('resolveStudioEnvValue prefers define-injected studio values', async () => {
	await withStudioEnv(async () => {
		const resolveStudioEnvValue = await importResolver();
		const value = resolveStudioEnvValue('PUBLIC_SANITY_PROJECT_ID', {
			defineValues: {
				PUBLIC_SANITY_PROJECT_ID: 'defined-project',
				PUBLIC_SANITY_DATASET: 'defined-dataset'
			},
			importMetaEnv: {
				PUBLIC_SANITY_PROJECT_ID: 'meta-project'
			},
			processEnv: {
				PUBLIC_SANITY_PROJECT_ID: 'process-project'
			}
		});

		assert.equal(value, 'defined-project');
	});
});

test('resolveStudioEnvValue throws when required env value is missing', async () => {
	await withStudioEnv(async () => {
		const resolveStudioEnvValue = await importResolver();
		assert.throws(
			() =>
				resolveStudioEnvValue('PUBLIC_SANITY_PROJECT_ID', {
					defineValues: {
						PUBLIC_SANITY_PROJECT_ID: undefined,
						PUBLIC_SANITY_DATASET: undefined
					},
					importMetaEnv: {},
					processEnv: {}
				}),
			/missing required environment variable public_sanity_project_id/i
		);
	});
});
