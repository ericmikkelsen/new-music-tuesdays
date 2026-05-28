import test from 'node:test';
import assert from 'node:assert/strict';

import { generatePreviewRoute } from '../scripts/scaffold-preview-route';

// Regression: prior versions imported `getAstroXBySlug` from a nonexistent
// `lib/content/<name>` module and referenced an undefined `urlPrefix`
// runtime variable, leaving scaffolded preview pages blank/erroring.

test('portable preview route imports from <name>Collection module', () => {
	const source = generatePreviewRoute('article', 'articles', 'portable');

	assert.match(
		source,
		/from '\.\.\/\.\.\/\.\.\/lib\/content\/articleCollection'/
	);
	assert.doesNotMatch(source, /lib\/content\/article['"]/);
	assert.doesNotMatch(source, /getAstroArticleBySlug/);
});

test('portable preview route hardcodes urlPrefix as a string literal', () => {
	const source = generatePreviewRoute('article', 'articles', 'portable');

	assert.match(source, /urlPrefix="articles"/);
	assert.doesNotMatch(source, /urlPrefix=\{urlPrefix\}/);
});

test('preview routes opt out of prerendering so drafts load at request time', () => {
	const portable = generatePreviewRoute('article', 'articles', 'portable');
	const block = generatePreviewRoute('campaign', 'campaigns', 'block');

	assert.match(portable, /export const prerender = false;/);
	assert.match(block, /export const prerender = false;/);
});

test('preview routes use loadQuery + collection mapper for fresh draft data', () => {
	const portable = generatePreviewRoute('article', 'articles', 'portable');

	assert.match(
		portable,
		/import \{ loadQuery \} from '\.\.\/\.\.\/\.\.\/lib\/content\/preview'/
	);
	assert.match(portable, /SANITY_ARTICLE_PREVIEW_QUERY/);
	assert.match(portable, /mapSanityArticleToCollectionEntry/);
	assert.doesNotMatch(portable, /SANITY_ARTICLE_COLLECTION_QUERY/);
});

test('block preview route imports BlocksPage layout', () => {
	const source = generatePreviewRoute('campaign', 'campaigns', 'block');

	assert.match(source, /from '\.\.\/\.\.\/\.\.\/layouts\/BlocksPage\.astro'/);
	assert.match(
		source,
		/from '\.\.\/\.\.\/\.\.\/lib\/content\/campaignCollection'/
	);
});

test('preview route passes slug param to loadQuery instead of filtering in JS', () => {
	const portable = generatePreviewRoute('article', 'articles', 'portable');

	assert.match(portable, /loadQuery<SanityArticleQueryResult \| null>/);
	assert.match(portable, /SANITY_ARTICLE_PREVIEW_QUERY,\s*\{ slug \}/);
	assert.doesNotMatch(portable, /\.find\(/);
});

test('preview route emits exactly one frontmatter block', () => {
	const source = generatePreviewRoute('article', 'articles', 'portable');
	const matches = source.match(/^---$/gm) ?? [];

	assert.equal(
		matches.length,
		2,
		'expected an opening and closing --- delimiter'
	);
});
