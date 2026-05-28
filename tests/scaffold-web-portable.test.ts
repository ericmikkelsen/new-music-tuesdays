import test from 'node:test';
import assert from 'node:assert/strict';

import {
	generateSanityPortableSchema,
	generatePortableCollectionModule,
	generatePortableCollectionLoader,
	generatePortablePageRoute
} from '../scripts/scaffold-web-portable';

// Shared utilities (toPascalCase, toStudioTitle, validateScaffoldInputs) are tested in scaffold-utils.test.ts.

// --- generateSanityPortableSchema ---

test('generateSanityPortableSchema produces a defineType call with the given name', () => {
	const src = generateSanityPortableSchema('article', 'Article');
	assert.ok(
		src.includes("name: 'article'"),
		'document name should appear in schema'
	);
	assert.ok(
		src.includes("title: 'Article'"),
		'title should appear in schema'
	);
	assert.ok(src.includes("type: 'document'"), 'should declare document type');
});

test('generateSanityPortableSchema exports a typed variable named <name>Type', () => {
	const src = generateSanityPortableSchema('article', 'Article');
	assert.ok(
		src.includes('export const articleType'),
		'should export articleType'
	);
});

test('generateSanityPortableSchema spreads WEB_PAGE_FIELDS', () => {
	const src = generateSanityPortableSchema('article', 'Article');
	assert.ok(
		src.includes('Object.values(WEB_PAGE_FIELDS)'),
		'should spread shared web page fields'
	);
});

test('generateSanityPortableSchema composes body from RICH_TEXT_FIELD_ARGS', () => {
	const src = generateSanityPortableSchema('article', 'Article');
	assert.ok(
		src.includes('RICH_TEXT_FIELD_ARGS'),
		'should use shared rich text field args'
	);
	assert.ok(src.includes("title: 'Body'"), 'should set the body field title');
});

// --- generatePortableCollectionModule ---

test('generatePortableCollectionModule includes GROQ query for the document type', () => {
	const src = generatePortableCollectionModule('article', 'articles');
	assert.ok(
		src.includes('_type == "article"'),
		'query should filter by document type'
	);
	assert.ok(
		src.includes('SANITY_ARTICLE_COLLECTION_QUERY'),
		'should export a named query constant'
	);
});

test('generatePortableCollectionModule projects richText and maps it to body', () => {
	const src = generatePortableCollectionModule('article', 'articles');
	assert.ok(src.includes('richText'), 'query should include richText');
	assert.ok(
		src.includes('body: entry.richText ?? []'),
		'mapper should normalize richText into body'
	);
});

test('generatePortableCollectionModule exports a mapper function', () => {
	const src = generatePortableCollectionModule('article', 'articles');
	assert.ok(
		src.includes('export function mapSanityArticleToCollectionEntry'),
		'should export mapper function'
	);
});

test('generatePortableCollectionModule builds the path from urlPrefix', () => {
	const src = generatePortableCollectionModule('article', 'resources');
	// Assert the full concatenation shape: leading slash, prefix, slug segment, and trailing slash
	assert.ok(
		src.includes("'/' + 'resources/' + entry.slug + '/'"),
		'path should concatenate leading slash, urlPrefix, entry.slug, and trailing slash'
	);
});

// --- generatePortableCollectionLoader ---

test('generatePortableCollectionLoader exports a loader factory function', () => {
	const src = generatePortableCollectionLoader('article');
	assert.ok(
		src.includes('export function createArticleCollectionLoader'),
		'should export loader factory'
	);
});

test('generatePortableCollectionLoader imports from the collection module', () => {
	const src = generatePortableCollectionLoader('article');
	assert.ok(
		src.includes("from './articleCollection'"),
		'should import from the generated collection module'
	);
});

test('generatePortableCollectionLoader includes body in schema validation', () => {
	const src = generatePortableCollectionLoader('article');
	assert.ok(
		src.includes('body: z.array(z.record(z.string(), z.unknown()))'),
		'should require a portable body array in schema'
	);
});

// --- generatePortablePageRoute ---

test('generatePortablePageRoute imports PortablePage layout', () => {
	const src = generatePortablePageRoute('article', 'Article', 'articles');
	assert.ok(
		src.includes(
			"import PortablePage from '../../layouts/PortablePage.astro'"
		),
		'should import PortablePage layout'
	);
});

test('generatePortablePageRoute imports the generated entry type', () => {
	const src = generatePortablePageRoute('article', 'Article', 'articles');
	assert.ok(
		src.includes('ArticleCollectionEntryData'),
		'should reference the collection entry type'
	);
	assert.ok(
		src.includes("from '../../lib/content/articleCollection'"),
		'should import from the generated collection module'
	);
});

test('generatePortablePageRoute passes urlPrefix to PortablePage', () => {
	const src = generatePortablePageRoute('article', 'Article', 'resources');
	assert.ok(
		src.includes('urlPrefix="resources"'),
		'should pass urlPrefix prop to PortablePage'
	);
});

test('generatePortablePageRoute passes body to PortablePage', () => {
	const src = generatePortablePageRoute('article', 'Article', 'articles');
	assert.ok(
		src.includes('body={entry.body}'),
		'should pass body prop to PortablePage'
	);
});

test('generatePortablePageRoute uses static paths with the generated collection', () => {
	const src = generatePortablePageRoute('article', 'Article', 'articles');
	assert.ok(src.includes('export async function getStaticPaths()'));
	assert.ok(src.includes("getCollection('article')"));
	assert.ok(
		src.includes('<PortablePage'),
		'should render via PortablePage layout'
	);
});
