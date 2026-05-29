import { defineType, type SchemaTypeDefinition } from './helpers';

import { pageType } from './documents/page';
import { personType } from './documents/person';
import { newMusicTuesday } from './documents/newMusicTuesday';
import { scaffoldPortableTextDocument } from './documents/webContent';
import { musicRelease } from './documents/musicRelease';
import {
	billboardType,
	listScrollerType,
	peopleRefsType,
	richTextType
} from './objects/arrayBlockPrimitives';
import { albumReviewBlock } from './objects/albumReviewBlock';
import {
	bodyTextType,
	headingType,
	imageObjectType,
	linkType,
	listType,
	subheadingType
} from './objects/bodyBlocks';
import { newMusicHeroBlock } from './objects/newMusicHeroBlock';

/**
 * Single registry of all schema types loaded by the Studio configuration.
 *
 * Keeping documents and reusable object blocks together here makes it easy to
 * extend the starter without chasing imports across multiple files.
 */
export const schemaTypes: SchemaTypeDefinition[] = [
	pageType,
	personType,
	musicRelease,
	newMusicTuesday,
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
	richTextType,
	newMusicHeroBlock,
	albumReviewBlock
];
