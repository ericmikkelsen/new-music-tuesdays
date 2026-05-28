import assert from 'node:assert/strict';
import test from 'node:test';

import {
	resolveDocumentProductionUrl,
	resolvePreviewSiteUrl
} from '../sanity/previewLinks';

test('resolvePreviewSiteUrl uses localhost fallback when no env source is set', () => {
	assert.equal(
		resolvePreviewSiteUrl({
			importMetaEnv: {},
			processEnv: {}
		}),
		'http://localhost:4321'
	);
});

test('resolvePreviewSiteUrl trims trailing slashes from configured site url', () => {
	assert.equal(
		resolvePreviewSiteUrl({
			importMetaEnv: {
				PUBLIC_SITE_URL: 'https://example.com///'
			},
			processEnv: {}
		}),
		'https://example.com'
	);
});

test('resolvePreviewSiteUrl falls back when configured site url is blank', () => {
	assert.equal(
		resolvePreviewSiteUrl({
			importMetaEnv: {
				PUBLIC_SITE_URL: '   '
			},
			processEnv: {}
		}),
		'http://localhost:4321'
	);
});

test('resolveDocumentProductionUrl maps page documents to top-level routes', () => {
	assert.equal(
		resolveDocumentProductionUrl(
			{
				_type: 'page',
				slug: { current: 'about' }
			},
			{
				importMetaEnv: {},
				processEnv: {}
			}
		),
		'http://localhost:4321/preview/about'
	);
});

test('resolveDocumentProductionUrl maps slash slug to preview root route', () => {
	assert.equal(
		resolveDocumentProductionUrl(
			{
				_type: 'page',
				slug: { current: '/' }
			},
			{
				importMetaEnv: {},
				processEnv: {}
			}
		),
		'http://localhost:4321/preview'
	);
});

test('resolveDocumentProductionUrl maps blog documents to blog routes', () => {
	assert.equal(
		resolveDocumentProductionUrl(
			{
				_type: 'blog',
				slug: { current: 'hello-world' }
			},
			{
				importMetaEnv: {
					PUBLIC_SITE_URL: 'https://example.com'
				},
				processEnv: {}
			}
		),
		'https://example.com/preview/blog/hello-world'
	);
});

test('resolveDocumentProductionUrl returns undefined for unsupported document types', () => {
	assert.equal(
		resolveDocumentProductionUrl(
			{
				_type: 'person',
				slug: { current: 'ada' }
			},
			{
				importMetaEnv: {},
				processEnv: {}
			}
		),
		undefined
	);
});

test('resolveDocumentProductionUrl returns undefined when slug is missing', () => {
	assert.equal(
		resolveDocumentProductionUrl(
			{
				_type: 'page'
			},
			{
				importMetaEnv: {},
				processEnv: {}
			}
		),
		undefined
	);
});
