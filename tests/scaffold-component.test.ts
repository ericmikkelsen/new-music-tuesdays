import assert from 'node:assert/strict';
import test from 'node:test';

import {
	COMPONENT_CATEGORIES,
	DEFAULT_COMPONENT_FIELDS,
	toPascalCase,
	validateComponentCategory,
	validateComponentFields,
	validateComponentName,
	validateComponentBodyType,
	generateSanityComponentSchema,
	generateAstroComponent,
	printComponentScaffoldGuidance
} from '../scripts/scaffold-component';

// Input validation contracts keep the interactive prompt flow predictable.
test('toPascalCase capitalizes the first letter', () => {
	assert.equal(toPascalCase('featureCard'), 'FeatureCard');
	assert.equal(toPascalCase('a'), 'A');
});

test('component categories export fixed plural directory values', () => {
	assert.deepEqual(COMPONENT_CATEGORIES, [
		'atoms',
		'molecules',
		'organisms',
		'blocks'
	]);
});

test('default component fields export expected prompt keys', () => {
	assert.deepEqual(DEFAULT_COMPONENT_FIELDS, [
		'heading',
		'subheading',
		'body',
		'link',
		'image',
		'links',
		'cards'
	]);
});

test('validateComponentName accepts valid names', () => {
	assert.doesNotThrow(() => validateComponentName('featureCard'));
});

test('validateComponentName rejects invalid names', () => {
	assert.throws(() => validateComponentName('../featureCard'));
});

test('validateComponentCategory accepts allowed category', () => {
	assert.doesNotThrow(() => validateComponentCategory('atoms'));
});

test('validateComponentCategory rejects unknown category', () => {
	assert.throws(() => validateComponentCategory('atom'));
});

test('validateComponentFields requires at least one field', () => {
	assert.throws(() => validateComponentFields([]));
});

test('validateComponentFields rejects unsupported field key', () => {
	assert.throws(() => validateComponentFields(['heading', 'nope']));
});

test('validateComponentBodyType accepts "string" and "portable"', () => {
	assert.doesNotThrow(() => validateComponentBodyType('string'));
	assert.doesNotThrow(() => validateComponentBodyType('portable'));
});

test('validateComponentBodyType rejects unsupported value', () => {
	assert.throws(() => validateComponentBodyType('rich'));
});

test('generateSanityComponentSchema includes selected fields and omits unselected fields', () => {
	const src = generateSanityComponentSchema(
		'featureCard',
		'Feature Card',
		['heading', 'body', 'links'],
		'portable'
	);
	assert.ok(src.includes('export const featureCardType'));
	assert.ok(src.includes("type: 'object'"));
	assert.ok(src.includes('HEADING_FIELD_ARGS'));
	assert.ok(src.includes('RICH_TEXT_FIELD_ARGS'));
	assert.ok(src.includes("name: 'body'"));
	assert.ok(src.includes("title: 'Body'"));
	assert.ok(!src.includes("name: 'richText'"));
	assert.ok(src.includes('LINKS_FIELD_ARGS'));
	assert.ok(!src.includes("name: 'subheading'"));
	assert.ok(!src.includes('LINK_FIELD_ARGS'));
});

test('generateSanityComponentSchema emits string body when requested', () => {
	const src = generateSanityComponentSchema(
		'featureCard',
		'Feature Card',
		['body'],
		'string'
	);
	assert.ok(src.includes('BODY_FIELD_ARGS'));
	assert.ok(!src.includes('RICH_TEXT_FIELD_ARGS'));
	assert.ok(src.includes("import { defineType } from 'sanity';"));
	assert.ok(!src.includes('defineField'));
	assert.ok(!src.includes('defineArrayMember'));
});

test('generateSanityComponentSchema composes cards from shared field args', () => {
	const src = generateSanityComponentSchema(
		'featureCard',
		'Feature Card',
		['cards'],
		'string'
	);
	assert.ok(src.includes('HEADING_FIELD_ARGS'));
	assert.ok(src.includes('BODY_FIELD_ARGS'));
	assert.ok(src.includes('LINK_FIELD_ARGS'));
	assert.ok(src.includes('IMAGE_FIELD_ARGS'));
	assert.ok(src.includes('fields: ['));
	assert.ok(!src.includes("name: 'url'"));
});

// Generated Astro modules should include only requested capabilities/imports.
test('generateAstroComponent includes portable text renderer for portable body', () => {
	const src = generateAstroComponent(
		'featureCard',
		['heading', 'body', 'link'],
		'portable'
	);
	assert.ok(
		src.includes("import { PortableText } from 'astro-portabletext'")
	);
	assert.ok(src.includes("import Heading from './Heading.astro'"));
	assert.ok(src.includes('interface Props'));
	assert.ok(src.includes('body?: Array<Record<string, unknown>>'));
	assert.ok(src.includes('hLevel?: 1 | 2 | 3 | 4 | 5 | 6;'));
	assert.ok(src.includes('hLevel = 2'));
	assert.ok(src.includes('<PortableText value={body} />'));
	assert.ok(src.includes('<Heading hLevel={hLevel}>{heading}</Heading>'));
	assert.ok(src.includes('href={link.url}'));
	assert.ok(src.includes('<div class="FeatureCard">'));
});

test('generateAstroComponent includes string body prop for string body', () => {
	const src = generateAstroComponent(
		'featureCard',
		['body', 'image'],
		'string'
	);
	assert.ok(src.includes('body?: string'));
	assert.ok(src.includes('<p>{body}</p>'));
	assert.ok(
		!src.includes("import { PortableText } from 'astro-portabletext'")
	);
	assert.ok(src.includes("import Image from './Image.astro'"));
	assert.ok(src.includes("import type ImageType from '../../types/image'"));
	assert.ok(src.includes('{image ? <Image {...image} /> : null}'));
	assert.ok(!src.includes('<img'));
});

test('generateAstroComponent includes cards and links prop shapes when selected', () => {
	const src = generateAstroComponent(
		'featureCard',
		['cards', 'links'],
		'string'
	);
	assert.ok(src.includes('links?: Link[]'));
	assert.ok(src.includes('cards?: Card[]'));
	assert.ok(src.includes('cards.map((card) =>'));
	assert.ok(src.includes('links.map((item) =>'));
	assert.ok(src.includes('{card.image ? <Image {...card.image} /> : null}'));
});

test('generateAstroComponent uses BlockWrapper for block category components', () => {
	const src = generateAstroComponent(
		'featureCard',
		['heading', 'body', 'image'],
		'string',
		'blocks'
	);
	assert.ok(src.includes("import Heading from '../atoms/Heading.astro'"));
	assert.ok(src.includes("import Image from '../atoms/Image.astro'"));
	assert.ok(
		src.includes("import BlockWrapper from '../atoms/BlockWrapper.astro'")
	);
	assert.ok(src.includes('<BlockWrapper class="FeatureCard">'));
	assert.ok(!src.includes('<div class="FeatureCard">'));
});

test('printComponentScaffoldGuidance prints registration instructions', () => {
	const logs: string[] = [];
	const original = console.log;
	console.log = (msg?: unknown) => {
		logs.push(String(msg ?? ''));
	};

	try {
		printComponentScaffoldGuidance('featureCard', 'atoms');
	} finally {
		console.log = original;
	}

	const output = logs.join('\n');
	assert.ok(
		output.includes(
			'Register featureCardType in sanity/schemaTypes/index.ts'
		)
	);
	assert.ok(output.includes('src/components/atoms/FeatureCard.astro'));
	assert.ok(
		output.includes(
			"import { featureCardType } from './objects/featureCard';"
		)
	);
});
