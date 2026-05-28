import test from 'node:test';
import assert from 'node:assert/strict';

import {
	billboardType,
	listScrollerType,
	peopleRefsType,
	richTextType
} from '../sanity/schemaTypes/objects/arrayBlockPrimitives';
import { schemaTypes } from '../sanity/schemaTypes';

test('billboardType defines expected fields', () => {
	assert.equal(billboardType.name, 'billboard');
	assert.deepEqual(
		billboardType.fields?.map((field) => field.name),
		['heading', 'body', 'image']
	);
});

test('listScrollerType defines expected fields', () => {
	assert.equal(listScrollerType.name, 'listScroller');
	assert.deepEqual(
		listScrollerType.fields?.map((field) => field.name),
		['heading', 'body', 'items']
	);
});

test('heading is required for billboard and listScroller', () => {
	const requiredRule = { required: () => 'required-called' };

	const billboardHeading = billboardType.fields?.find(
		(field) => field.name === 'heading'
	) as { validation?: (rule: typeof requiredRule) => string } | undefined;
	const listScrollerHeading = listScrollerType.fields?.find(
		(field) => field.name === 'heading'
	) as { validation?: (rule: typeof requiredRule) => string } | undefined;

	assert.equal(
		billboardHeading?.validation?.(requiredRule),
		'required-called'
	);
	assert.equal(
		listScrollerHeading?.validation?.(requiredRule),
		'required-called'
	);
});

test('peopleRefsType defines people reference array', () => {
	assert.equal(peopleRefsType.name, 'peopleRefs');
	assert.deepEqual(
		peopleRefsType.fields?.map((field) => field.name),
		['people']
	);

	const peopleField = peopleRefsType.fields?.find(
		(field) => field.name === 'people'
	);
	const referenceMember =
		peopleField && 'of' in peopleField ? peopleField.of?.[0] : undefined;
	const referenceTarget =
		referenceMember && 'to' in referenceMember
			? Array.isArray(referenceMember.to)
				? referenceMember.to[0]?.type
				: undefined
			: undefined;

	assert.equal(referenceMember?.type, 'reference');
	assert.equal(referenceTarget, 'person');
});

test('richTextType defines portable content field', () => {
	assert.equal(richTextType.name, 'richText');
	assert.deepEqual(
		richTextType.fields?.map((field) => field.name),
		['richText']
	);
});

test('block previews include block name as subtitle', () => {
	const billboardPreview = billboardType.preview?.prepare?.({
		title: 'Hero section'
	});
	const listScrollerPreview = listScrollerType.preview?.prepare?.({
		title: 'Highlights'
	});
	const peopleRefsPreview = peopleRefsType.preview?.prepare?.({
		people: [{ _ref: 'person-1' }, { _ref: 'person-2' }]
	});
	const richTextPreview = richTextType.preview?.prepare?.({
		content: [{ _type: 'block' }]
	});

	assert.equal(billboardPreview?.subtitle, 'Billboard');
	assert.equal(listScrollerPreview?.subtitle, 'List Scroller');
	assert.equal(peopleRefsPreview?.subtitle, 'People References');
	assert.equal(richTextPreview?.subtitle, 'Rich Text');
});

test('schemaTypes registry includes array block primitives', () => {
	const schemaTypeNames = new Set(
		schemaTypes.map((schemaType) => schemaType.name)
	);

	assert.equal(schemaTypeNames.has('billboard'), true);
	assert.equal(schemaTypeNames.has('listScroller'), true);
	assert.equal(schemaTypeNames.has('peopleRefs'), true);
	assert.equal(schemaTypeNames.has('richText'), true);
});
