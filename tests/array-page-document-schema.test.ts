import test from 'node:test';
import assert from 'node:assert/strict';

import { pageType } from '../sanity/schemaTypes/documents/page';
import { schemaTypes } from '../sanity/schemaTypes';

/**
 * Verifies the page document includes shared fields and the blocks array.
 */
test('pageType defines expected fields', () => {
	assert.equal(pageType.name, 'page');

	const fieldNames = pageType.fields?.map((field) => field.name) ?? [];
	assert.equal(fieldNames.includes('title'), true);
	assert.equal(fieldNames.includes('slug'), true);
	assert.equal(fieldNames.includes('description'), true);
	assert.equal(fieldNames.includes('metaImage'), true);
	assert.equal(fieldNames.includes('metaImageAlt'), true);
	assert.equal(fieldNames.includes('blocks'), true);
});

/**
 * Verifies author-selectable block primitives stay constrained to the current primitive set.
 */
test('pageType blocks allows expected primitive blocks', () => {
	const blocksField = pageType.fields?.find(
		(field) => field.name === 'blocks'
	);
	const memberTypes =
		blocksField && 'of' in blocksField
			? blocksField.of?.map((member) => member.type)
			: [];

	assert.deepEqual(memberTypes, [
		'billboard',
		'listScroller',
		'peopleRefs',
		'richText'
	]);
});

/**
 * Verifies Studio registration does not include a separate array page document.
 */
test('schemaTypes registry keeps a single page document type', () => {
	const schemaTypeNames = new Set(
		schemaTypes.map((schemaType) => schemaType.name)
	);

	assert.equal(schemaTypeNames.has('page'), true);
	assert.equal(schemaTypeNames.has('arrayPage'), false);
});
