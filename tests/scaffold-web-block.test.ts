import test from 'node:test';
import assert from 'node:assert/strict';

import {
	generateSanityBlockSchema,
	generateBlockCollectionModule,
	generateBlockCollectionLoader,
	generateBlockPageRoute
} from '../scripts/scaffold-web-block';

// Shared utilities (toPascalCase, validateScaffoldInputs) are tested in scaffold-utils.test.ts.

// --- generateSanityBlockSchema ---

test('generateSanityBlockSchema produces a defineType call with the given name', () => {
	const src = generateSanityBlockSchema('campaign', 'Campaign');
	assert.ok(
		src.includes("name: 'campaign'"),
		'document name should appear in schema'
	);
	assert.ok(
		src.includes("title: 'Campaign'"),
		'title should appear in schema'
	);
	assert.ok(src.includes("type: 'document'"), 'should declare document type');
});

test('generateSanityBlockSchema exports a typed variable named <name>Type', () => {
	const src = generateSanityBlockSchema('campaign', 'Campaign');
	assert.ok(
		src.includes('export const campaignType'),
		'should export campaignType'
	);
});

test('generateSanityBlockSchema spreads WEB_PAGE_FIELDS', () => {
	const src = generateSanityBlockSchema('campaign', 'Campaign');
	assert.ok(
		src.includes('Object.values(WEB_PAGE_FIELDS)'),
		'should spread shared web page fields'
	);
});

test('generateSanityBlockSchema includes all four block primitives', () => {
	const src = generateSanityBlockSchema('campaign', 'Campaign');
	assert.ok(
		src.includes("type: 'billboard'"),
		'should include billboard block'
	);
	assert.ok(
		src.includes("type: 'listScroller'"),
		'should include listScroller block'
	);
	assert.ok(
		src.includes("type: 'peopleRefs'"),
		'should include peopleRefs block'
	);
	assert.ok(
		src.includes("type: 'richText'"),
		'should include richText block'
	);
});

// --- generateBlockCollectionModule ---

test('generateBlockCollectionModule includes GROQ query for the document type', () => {
	const src = generateBlockCollectionModule('campaign', 'campaign');
	assert.ok(
		src.includes('_type == "campaign"'),
		'query should filter by document type'
	);
	assert.ok(
		src.includes('SANITY_CAMPAIGN_COLLECTION_QUERY'),
		'should export a named query constant'
	);
});

test('generateBlockCollectionModule exports the collection entry type', () => {
	const src = generateBlockCollectionModule('campaign', 'campaign');
	assert.ok(
		src.includes('CampaignCollectionEntry'),
		'should export entry type'
	);
	assert.ok(
		src.includes("from '../../sanity/types'"),
		'should derive block types from generated Sanity types'
	);
	assert.ok(
		src.includes('ArrayPageBuilderBlock'),
		'entry type should reference block type'
	);
});

test('generateBlockCollectionModule exports a mapper function', () => {
	const src = generateBlockCollectionModule('campaign', 'campaign');
	assert.ok(
		src.includes('export function mapSanityCampaignToCollectionEntry'),
		'should export mapper function'
	);
});

test('generateBlockCollectionModule builds the path from urlPrefix', () => {
	const src = generateBlockCollectionModule('campaign', 'events');
	assert.ok(
		src.includes('`/events/${entry.slug}/`') ||
			src.includes("'/events/' + entry.slug"),
		'path should include the url prefix'
	);
});

// --- generateBlockCollectionLoader ---

test('generateBlockCollectionLoader exports a loader factory function', () => {
	const src = generateBlockCollectionLoader('campaign');
	assert.ok(
		src.includes('export function createCampaignCollectionLoader'),
		'should export loader factory'
	);
});

test('generateBlockCollectionLoader imports from the collection module', () => {
	const src = generateBlockCollectionLoader('campaign');
	assert.ok(
		src.includes("from './campaignCollection'"),
		'should import from the generated collection module'
	);
});

test('generateBlockCollectionLoader names the loader with the document name', () => {
	const src = generateBlockCollectionLoader('campaign');
	assert.ok(
		src.includes('sanity-campaign-collection-loader'),
		'loader name should include document type'
	);
});

// --- generateBlockPageRoute ---

test('generateBlockPageRoute imports BlocksPage layout', () => {
	const src = generateBlockPageRoute('campaign', 'Campaign', 'campaign');
	assert.ok(
		src.includes("import BlocksPage from '../../layouts/BlocksPage.astro'"),
		'should import BlocksPage layout'
	);
});

test('generateBlockPageRoute imports the generated entry type', () => {
	const src = generateBlockPageRoute('campaign', 'Campaign', 'campaign');
	assert.ok(
		src.includes('CampaignCollectionEntryData'),
		'should reference the collection entry type'
	);
	assert.ok(
		src.includes("from '../../lib/content/campaignCollection'"),
		'should import from the generated collection module'
	);
});

test('generateBlockPageRoute renders the entry via BlocksPage', () => {
	const src = generateBlockPageRoute('campaign', 'Campaign', 'events');
	assert.ok(
		src.includes('<BlocksPage'),
		'should render via BlocksPage layout'
	);
});

test('generateBlockPageRoute renders entry title and description', () => {
	const src = generateBlockPageRoute('campaign', 'Campaign', 'campaign');
	assert.ok(src.includes('{entry.title}'), 'should render title');
	assert.ok(
		src.includes('entry.description'),
		'should conditionally render description'
	);
});

test('generateBlockPageRoute uses a static path route file shape', () => {
	const src = generateBlockPageRoute('campaign', 'Campaign', 'campaigns');
	assert.ok(src.includes('export async function getStaticPaths()'));
	assert.ok(src.includes("getCollection('campaign')"));
	assert.ok(
		src.includes('<BlocksPage'),
		'should use BlocksPage layout component'
	);
});
