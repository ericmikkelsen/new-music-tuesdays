import test from 'node:test';
import assert from 'node:assert/strict';

import {
	BODY_FIELD_ARGS,
	HEADING_FIELD_ARGS,
	IMAGE_FIELD_ARGS,
	LINK_FIELD_ARGS,
	RICH_TEXT_BASIC_FIELD_ARGS,
	RICH_TEXT_FIELD_ARGS
} from '../sanity/schemaTypes/objects/componentFields';

test('HEADING_FIELD_ARGS defines heading string field', () => {
	assert.equal(HEADING_FIELD_ARGS.name, 'heading');
	assert.equal(HEADING_FIELD_ARGS.type, 'string');

	const validation = HEADING_FIELD_ARGS.validation as
		| ((rule: { required: () => string }) => string)
		| undefined;

	assert.equal(typeof validation, 'function');
	assert.equal(
		validation?.({ required: () => 'required-called' }),
		'required-called'
	);
});

test('BODY_FIELD defines body string field', () => {
	assert.equal(BODY_FIELD_ARGS.name, 'body');
	assert.equal(BODY_FIELD_ARGS.type, 'string');
});

test('LINK_FIELD_ARGS defines text and url fields', () => {
	assert.equal(LINK_FIELD_ARGS.name, 'link');
	assert.deepEqual(
		LINK_FIELD_ARGS.fields?.map((field) => field.name),
		['text', 'url']
	);
});

test('IMAGE_FIELD_ARGS defines native Sanity image upload with alt text', () => {
	assert.equal(IMAGE_FIELD_ARGS.name, 'image');
	assert.equal(IMAGE_FIELD_ARGS.type, 'image');
	assert.deepEqual(
		IMAGE_FIELD_ARGS.fields?.map((field) => field.name),
		['alt']
	);
});

test('RICH_TEXT_FIELD_ARGS excludes h1 style', () => {
	assert.equal(RICH_TEXT_FIELD_ARGS.name, 'richText');

	const blockMember = (RICH_TEXT_FIELD_ARGS.of?.[0] as {
		styles?: Array<{ value: string }>;
	}) ?? {
		styles: []
	};
	const styles = (blockMember.styles ?? []).map((style) => style.value);

	assert.equal(styles.includes('h1'), false);
	assert.equal(styles.includes('h2'), true);
});

test('RICH_TEXT_BASIC_FIELD_ARGS only enables link annotations', () => {
	assert.equal(RICH_TEXT_BASIC_FIELD_ARGS.name, 'richTextBasic');

	const blockMember =
		(RICH_TEXT_BASIC_FIELD_ARGS.of?.[0] as {
			lists?: unknown[];
			marks?: {
				decorators?: unknown[];
				annotations?: Array<{ name?: string }>;
			};
		}) ?? {};

	assert.equal((blockMember.lists ?? []).length, 0);
	assert.equal((blockMember.marks?.decorators ?? []).length, 0);
	assert.equal(blockMember.marks?.annotations?.[0]?.name, 'portableTextLink');
});
