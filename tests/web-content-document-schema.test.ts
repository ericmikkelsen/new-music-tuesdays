import test from 'node:test';
import assert from 'node:assert/strict';

import { scaffoldPortableTextDocument } from '../sanity/schemaTypes/documents/webContent';
import { schemaTypes } from '../sanity/schemaTypes';

/**
 * Verifies the scaffolded portable-text document includes shared web page fields and a body.
 */
test('scaffoldPortableTextDocument defines expected fields', () => {
	assert.equal(scaffoldPortableTextDocument.type, 'document');

	const fieldNames =
		scaffoldPortableTextDocument.fields?.map((field) => field.name) ?? [];
	assert.equal(fieldNames.includes('title'), true);
	assert.equal(fieldNames.includes('slug'), true);
	assert.equal(fieldNames.includes('description'), true);
	assert.equal(fieldNames.includes('metaImage'), true);
	assert.equal(fieldNames.includes('metaImageAlt'), true);
	assert.equal(fieldNames.includes('richText'), true);
});

/**
 * Verifies the blog schema registered in schemaTypes composes the scaffold base object.
 */
test('registered blog schema composes scaffoldPortableTextDocument', () => {
	const blogSchema = schemaTypes.find(
		(schemaType) => schemaType.name === 'blog'
	);

	assert.ok(blogSchema, 'blog schema should exist');
	assert.ok('fields' in blogSchema, 'blog schema should expose fields');
	assert.ok('preview' in blogSchema, 'blog schema should expose preview');
	assert.equal(blogSchema.type, scaffoldPortableTextDocument.type);
	assert.equal(blogSchema.fields, scaffoldPortableTextDocument.fields);
	assert.equal(blogSchema.preview, scaffoldPortableTextDocument.preview);
	assert.equal(blogSchema.title, 'Blog');
});

/**
 * Verifies the body field is a portable text array of block members.
 */
test('scaffoldPortableTextDocument body is a portable text array', () => {
	const bodyField = scaffoldPortableTextDocument.fields?.find(
		(field) => field.name === 'richText'
	);

	assert.ok(bodyField, 'body field should exist');
	assert.equal(bodyField.type, 'array');

	const members = 'of' in bodyField ? bodyField.of : [];
	assert.ok(
		Array.isArray(members) && members.length > 0,
		'body should have array members'
	);
	assert.equal(members[0]?.type, 'block');
});

/**
 * Verifies the schema registry includes the blog document type from scaffold config.
 */
test('schemaTypes registry includes blog', () => {
	const schemaTypeNames = new Set(
		schemaTypes.map((schemaType) => schemaType.name)
	);

	assert.equal(schemaTypeNames.has('blog'), true);
	assert.equal(schemaTypeNames.has('webContent'), false);
});

/**
 * Verifies Studio preview selects title and slug for the blog document.
 */
test('scaffold preview selects title and slug', () => {
	const selectFields = scaffoldPortableTextDocument.preview?.select ?? {};

	assert.ok('title' in selectFields, 'preview should select title');
	assert.ok('subtitle' in selectFields, 'preview should select subtitle');
});
