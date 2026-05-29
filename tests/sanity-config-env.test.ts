import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveStudioEnvValue } from '../sanity/resolveStudioEnv';

/**
 * Imports the resolver lazily so each test can control env setup beforehand.
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

test('resolveStudioEnvValue supports hosted studio import.meta alias keys', async () => {
	await withStudioEnv(async () => {
		const value = resolveStudioEnvValue('PUBLIC_SANITY_PROJECT_ID', {
			defineValues: {
				PUBLIC_SANITY_PROJECT_ID: undefined,
				PUBLIC_SANITY_DATASET: undefined
			},
			importMetaEnv: {
				SANITY_STUDIO_PROJECT_ID: 'hosted-meta-project'
			},
			processEnv: {}
		});

		assert.equal(value, 'hosted-meta-project');
	});
});

test('resolveStudioEnvValue supports hosted studio process env alias keys', async () => {
	await withStudioEnv(async () => {
		const value = resolveStudioEnvValue('PUBLIC_SANITY_DATASET', {
			defineValues: {
				PUBLIC_SANITY_PROJECT_ID: undefined,
				PUBLIC_SANITY_DATASET: undefined
			},
			importMetaEnv: {},
			processEnv: {
				SANITY_STUDIO_DATASET: 'hosted-process-dataset'
			}
		});

		assert.equal(value, 'hosted-process-dataset');
	});
});

test('resolveStudioEnvValue prefers define-injected studio values', async () => {
	await withStudioEnv(async () => {
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
			/checked aliases: public_sanity_project_id, sanity_studio_project_id/i
		);
	});
});
