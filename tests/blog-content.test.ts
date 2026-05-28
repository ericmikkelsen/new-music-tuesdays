import test from 'node:test';
import assert from 'node:assert/strict';

import { mapSanityBlogToAstroPost } from '../src/lib/content/blog';

test('mapSanityBlogToAstroPost maps valid blog records', () => {
	const entry = {
		_id: 'blog-1',
		title: 'Hello World',
		slug: 'hello-world',
		description: 'A post',
		richText: [{ _type: 'block', children: [] }]
	};

	const result = mapSanityBlogToAstroPost(entry);

	assert.ok(result);
	assert.equal(result.id, 'blog-1');
	assert.equal(result.title, 'Hello World');
	assert.equal(result.slug, 'hello-world');
	assert.equal(result.description, 'A post');
	assert.equal(result.path, '/blog/hello-world/');
	assert.deepEqual(result.body, [{ _type: 'block', children: [] }]);
});

test('mapSanityBlogToAstroPost returns null when title missing', () => {
	const result = mapSanityBlogToAstroPost({ _id: 'x', slug: 'x' });
	assert.equal(result, null);
});

test('mapSanityBlogToAstroPost returns null when slug missing', () => {
	const result = mapSanityBlogToAstroPost({ _id: 'x', title: 'X' });
	assert.equal(result, null);
});

test('mapSanityBlogToAstroPost defaults body to empty array when richText absent', () => {
	const result = mapSanityBlogToAstroPost({
		_id: 'blog-1',
		title: 'Hello',
		slug: 'hello'
	});

	assert.ok(result);
	assert.deepEqual(result.body, []);
});

test('mapSanityBlogToAstroPost maps metaImage when asset ref is present', () => {
	const result = mapSanityBlogToAstroPost({
		_id: 'blog-1',
		title: 'Hello',
		slug: 'hello',
		metaImage: { asset: { _ref: 'image-abc' } },
		metaImageAlt: 'A nice image'
	});

	assert.ok(result);
	assert.ok(result.metaImage);
	assert.equal(result.metaImage.assetRef, 'image-abc');
	assert.equal(result.metaImage.alt, 'A nice image');
});
