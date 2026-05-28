import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

import { mapSanityPageToAstroPage } from '../src/lib/content/pages';
import { mapSanityPageToCollectionEntry } from '../src/lib/content/pageCollection';
import { resolvePageCollectionLoaderMode } from '../src/lib/content/pageCollectionLoader';
import {
	normalizePageSlug,
	toPagePath,
	toPageRouteParam
} from '../src/lib/content/pageSlug';

/**
 * These tests cover the pure normalization helpers used by both the legacy page
 * fetch path and the new content-layer loader foundation.
 */

/**
 * Verifies the mapper preserves the fields the Astro routes depend on.
 */
test('mapSanityPageToAstroPage maps valid page records', () => {
	const mapped = mapSanityPageToAstroPage({
		_id: 'page-1',
		title: 'About',
		slug: 'about',
		description: 'About page',
		metaImage: {
			asset: {
				_ref: 'image-ref'
			}
		},
		metaImageAlt: 'Alt text'
	});

	assert.ok(mapped);
	assert.equal(mapped?.id, 'page-1');
	assert.equal(mapped?.slug, 'about');
	assert.equal(mapped?.path, '/about/');
	assert.equal(mapped?.metaImage?.assetRef, 'image-ref');
});

/**
 * Verifies incomplete Sanity records are rejected before they can reach route generation.
 */
test('mapSanityPageToAstroPage skips invalid entries', () => {
	const mapped = mapSanityPageToAstroPage({
		_id: 'page-2',
		title: 'Missing slug'
	});

	assert.equal(mapped, null);
});

/**
 * Verifies the published content-layer entry keeps Astro route data in a typed collection shape.
 */
test('mapSanityPageToCollectionEntry maps valid page records', () => {
	const mapped = mapSanityPageToCollectionEntry({
		_id: 'page-3',
		title: 'Contact',
		slug: 'contact',
		description: 'Contact page',
		metaImage: {
			asset: {
				_ref: 'image-ref'
			}
		},
		metaImageAlt: 'Contact image'
	});

	assert.ok(mapped);
	assert.equal(mapped?.id, 'page-3');
	assert.equal(mapped?.data.slug, 'contact');
	assert.equal(mapped?.data.path, '/contact/');
	assert.equal(mapped?.data.metaImage?.assetRef, 'image-ref');
});

test('mapSanityPageToAstroPage maps blocks records on page documents', () => {
	const mapped = mapSanityPageToAstroPage({
		_type: 'page',
		_id: 'blocks-page-1',
		title: 'Landing',
		slug: 'landing',
		blocks: [
			{
				_type: 'billboard',
				heading: 'Hero heading',
				body: 'Hero body'
			}
		]
	});

	assert.ok(mapped);
	assert.equal(mapped?.id, 'blocks-page-1');
	assert.equal(mapped?.documentType, 'page');
	assert.equal(mapped?.blocks?.[0]?._type, 'billboard');
	assert.equal(mapped?.path, '/landing/');
});

test('mapSanityPageToAstroPage ignores legacy pageBuilder fallback', () => {
	const mapped = mapSanityPageToAstroPage({
		_type: 'page',
		_id: 'legacy-page-builder-1',
		title: 'Legacy Landing',
		slug: 'legacy-landing',
		pageBuilder: [
			{
				_type: 'billboard',
				heading: 'Legacy hero heading',
				body: 'Legacy hero body'
			}
		]
	});

	assert.ok(mapped);
	assert.equal(mapped?.id, 'legacy-page-builder-1');
	assert.equal(mapped?.blocks, undefined);
	assert.equal(mapped?.path, '/legacy-landing/');
});

test('mapSanityPageToAstroPage treats slash slug as homepage path', () => {
	const mapped = mapSanityPageToAstroPage({
		_type: 'page',
		_id: 'home-page-1',
		title: 'Home',
		slug: '/'
	});

	assert.ok(mapped);
	assert.equal(mapped?.slug, '/');
	assert.equal(mapped?.path, '/');
});

test('mapSanityPageToCollectionEntry treats slash slug as homepage path', () => {
	const mapped = mapSanityPageToCollectionEntry({
		_id: 'home-page-2',
		title: 'Home',
		slug: '/'
	});

	assert.ok(mapped);
	assert.equal(mapped?.data.slug, '/');
	assert.equal(mapped?.data.path, '/');
});

test('page slug helpers normalize root and dynamic route params', () => {
	assert.equal(normalizePageSlug('///'), '/');
	assert.equal(normalizePageSlug('/about/'), 'about');
	assert.equal(toPagePath('/'), '/');
	assert.equal(toPagePath('/about/'), '/about/');
	assert.equal(toPageRouteParam('/'), undefined);
	assert.equal(toPageRouteParam('/about/'), 'about');
});

/**
 * Verifies content-layer loader mode matches shared preview toggle semantics.
 */
test('resolvePageCollectionLoaderMode returns published when preview is disabled', () => {
	assert.equal(resolvePageCollectionLoaderMode(false), 'published');
});

/**
 * Verifies content-layer loader mode switches to draft reads when preview is enabled.
 */
test('resolvePageCollectionLoaderMode returns preview when preview is enabled', () => {
	assert.equal(resolvePageCollectionLoaderMode(true), 'preview');
});

/**
 * Verifies the typegen wrapper exits early on unconfigured clones without inventing fake outputs.
 */
test('sanity:typegen skip does not create placeholder artifacts', () => {
	const tempDir = mkdtempSync(join(tmpdir(), 'sanity-typegen-skip-'));
	const scriptPath = resolve(process.cwd(), 'scripts/run-sanity-typegen.mjs');

	try {
		// Running in a throwaway directory makes it obvious whether the script writes files on its own.
		const result = spawnSync(process.execPath, [scriptPath], {
			cwd: tempDir,
			env: {
				PATH: process.env.PATH
			},
			encoding: 'utf8'
		});

		assert.equal(result.status, 0);
		assert.equal(
			existsSync(join(tempDir, 'src/sanity/extract.json')),
			false
		);
		assert.equal(existsSync(join(tempDir, 'src/sanity/types.ts')), false);
	} finally {
		rmSync(tempDir, { recursive: true, force: true });
	}
});
