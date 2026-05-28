import { defineArrayMember, defineField, defineType } from 'sanity';

import {
	BODY_FIELD_ARGS,
	HEADING_FIELD_ARGS,
	IMAGE_FIELD_ARGS,
	LINK_FIELD_ARGS,
	RICH_TEXT_FIELD_ARGS
} from './componentFields';

/**
 * Hero-style block for array-driven pages.
 */
export const billboardType = defineType({
	name: 'billboard',
	title: 'Billboard',
	type: 'object',
	fields: [
		defineField(HEADING_FIELD_ARGS),
		defineField(BODY_FIELD_ARGS),
		defineField(LINK_FIELD_ARGS),
		defineField(IMAGE_FIELD_ARGS)
	],
	preview: {
		select: {
			title: 'heading'
		},
		prepare(selection) {
			return {
				title: selection.title || 'Untitled Billboard',
				subtitle: 'Billboard'
			};
		}
	}
});

/**
 * Horizontal list block intended for simple scroller-style sections.
 */
export const listScrollerType = defineType({
	name: 'listScroller',
	title: 'List Scroller',
	type: 'object',
	fields: [
		defineField(HEADING_FIELD_ARGS),
		defineField(BODY_FIELD_ARGS),
		defineField({
			name: 'items',
			title: 'Items',
			type: 'array',
			of: [defineArrayMember({ type: 'string' })],
			validation: (rule) => rule.required().min(1)
		})
	],
	preview: {
		select: {
			title: 'heading'
		},
		prepare(selection) {
			return {
				title: selection.title || 'Untitled List',
				subtitle: 'List Scroller'
			};
		}
	}
});

/**
 * Reference list for people-style entities used by profile/team sections.
 */
export const peopleRefsType = defineType({
	name: 'peopleRefs',
	title: 'People References',
	type: 'object',
	fields: [
		defineField({
			name: 'people',
			title: 'People',
			type: 'array',
			of: [
				defineArrayMember({
					type: 'reference',
					to: [{ type: 'person' }]
				})
			],
			validation: (rule) => rule.required().min(1)
		})
	],
	preview: {
		select: {
			people: 'people'
		},
		prepare(selection) {
			const peopleCount = Array.isArray(selection.people)
				? selection.people.length
				: 0;

			return {
				title: `${peopleCount} linked ${peopleCount === 1 ? 'person' : 'people'}`,
				subtitle: 'People References'
			};
		}
	}
});

/**
 * Portable text wrapper for richer narrative blocks inside array content.
 */
export const richTextType = defineType({
	name: 'richText',
	title: 'Rich Text',
	type: 'object',
	fields: [defineField(RICH_TEXT_FIELD_ARGS)],
	preview: {
		select: {
			content: 'richText'
		},
		prepare(selection) {
			const blockCount = Array.isArray(selection.content)
				? selection.content.length
				: 0;

			return {
				title: `${blockCount} block${blockCount === 1 ? '' : 's'}`,
				subtitle: 'Rich Text'
			};
		}
	}
});
