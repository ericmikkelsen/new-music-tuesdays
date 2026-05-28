import { defineField } from 'sanity';

/**
 * Core web page fields shared across all web document types.
 *
 * Keyed by field name so individual fields are addressable. Use
 * `Object.values(WEB_PAGE_FIELDS)` to spread all of them into a document's
 * `fields` array.
 */
export const WEB_PAGE_FIELDS = {
	title: defineField({
		name: 'title',
		title: 'Title',
		type: 'string',
		validation: (rule) => rule.required().min(2)
	}),
	slug: defineField({
		name: 'slug',
		title: 'Slug',
		type: 'slug',
		options: {
			source: 'title',
			maxLength: 96
		},
		validation: (rule) => rule.required()
	}),
	description: defineField({
		name: 'description',
		title: 'Description',
		type: 'text',
		rows: 3
	}),
	metaImage: defineField({
		name: 'metaImage',
		title: 'Meta Image',
		type: 'image',
		options: { hotspot: true }
	}),
	metaImageAlt: defineField({
		name: 'metaImageAlt',
		title: 'Meta Image Alt',
		type: 'string',
		description: 'Alternative text used when meta image is present.'
	})
};
