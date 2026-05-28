import { defineType, type SchemaTypeDefinition } from 'sanity';

import { pageType } from './documents/page';
import { personType } from './documents/person';
import { scaffoldPortableTextDocument } from './documents/webContent';
import {
	billboardType,
	listScrollerType,
	peopleRefsType,
	richTextType
} from './objects/arrayBlockPrimitives';
import {
	bodyTextType,
	headingType,
	imageObjectType,
	linkType,
	listType,
	subheadingType
} from './objects/bodyBlocks';

/**
 * Single registry of all schema types loaded by the Studio configuration.
 *
 * Keeping documents and reusable object blocks together here makes it easy to
 * extend the starter without chasing imports across multiple files.
 */
export const schemaTypes: SchemaTypeDefinition[] = [
	pageType,
	personType,
	defineType({
		name: 'blog',
		title: 'Blog',
		...scaffoldPortableTextDocument
	}),
	headingType,
	subheadingType,
	bodyTextType,
	linkType,
	listType,
	imageObjectType,
	billboardType,
	listScrollerType,
	peopleRefsType,
	richTextType
];
