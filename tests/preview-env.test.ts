import assert from 'node:assert/strict';
import test from 'node:test';

import { resolvePreviewEnabled } from '../src/lib/content/preview';

test('resolvePreviewEnabled returns true when preview flag is enabled', () => {
	const enabled = resolvePreviewEnabled({
		PUBLIC_SANITY_ENABLE_PREVIEW: 'true',
		PUBLIC_SANITY_VISUAL_EDITING_ENABLED: 'false'
	});

	assert.equal(enabled, true);
});

test('resolvePreviewEnabled returns true when visual editing flag is enabled', () => {
	const enabled = resolvePreviewEnabled({
		PUBLIC_SANITY_ENABLE_PREVIEW: 'false',
		PUBLIC_SANITY_VISUAL_EDITING_ENABLED: 'true'
	});

	assert.equal(enabled, true);
});

test('resolvePreviewEnabled returns false when neither flag is enabled', () => {
	const enabled = resolvePreviewEnabled({
		PUBLIC_SANITY_ENABLE_PREVIEW: 'false',
		PUBLIC_SANITY_VISUAL_EDITING_ENABLED: 'false'
	});

	assert.equal(enabled, false);
});
