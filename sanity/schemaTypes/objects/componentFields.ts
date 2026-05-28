import { defineArrayMember, defineField } from 'sanity';

/**
 * Reusable heading string field.
 */
export const HEADING_FIELD_ARGS = {
	name: 'heading',
	title: 'Heading',
	type: 'string',
	validation: (rule: any) => rule.required()
};

/**
 * Reusable body string field.
 */
export const BODY_FIELD_ARGS = {
	name: 'body',
	title: 'Body',
	type: 'string'
};

/**
 * Reusable link object field with required display text and URL.
 */
export const LINK_FIELD_ARGS = {
	name: 'link',
	title: 'Link',
	type: 'object',
	fields: [
		defineField({
			name: 'text',
			title: 'Text',
			type: 'string',
			validation: (rule) => rule.required()
		}),
		defineField({
			name: 'url',
			title: 'URL',
			type: 'url',
			validation: (rule) => rule.required()
		})
	]
};

export const LINKS_FIELD_ARGS = {
	name: 'links',
	title: 'Links',
	type: 'array',
	of: [LINK_FIELD_ARGS]
};

/**
 * Reusable native Sanity image upload field with alt text.
 * Dimensions (width, height) and URL (src) are derived in the Astro content
 * layer via GROQ projections against asset metadata — not stored manually.
 */
export const IMAGE_FIELD_ARGS = {
	name: 'image',
	title: 'Image',
	type: 'image',
	options: { hotspot: true },
	fields: [
		defineField({
			name: 'alt',
			title: 'Alt Text',
			type: 'string'
		})
	]
};
/**
 * Used in the rich text fields
 */
const linkAnnotation = {
	name: 'portableTextLink',
	title: 'Link',
	type: 'object',
	fields: [
		defineField({
			name: 'href',
			title: 'URL',
			type: 'url',
			validation: (rule) => rule.required()
		})
	]
};
/**
 * Reusable rich text field that excludes `h1` but keeps standard formatting controls.
 */
export const RICH_TEXT_FIELD_ARGS = {
	name: 'richText',
	title: 'Rich Text',
	type: 'array',
	of: [
		defineArrayMember({
			type: 'block',
			styles: [
				{ title: 'Normal', value: 'normal' },
				{ title: 'H2', value: 'h2' },
				{ title: 'H3', value: 'h3' },
				{ title: 'H4', value: 'h4' },
				{ title: 'H5', value: 'h5' },
				{ title: 'H6', value: 'h6' },
				{ title: 'Quote', value: 'blockquote' }
			],
			marks: {
				annotations: [linkAnnotation]
			}
		})
	],
	validation: (rule: any) => rule.required().min(1)
};

/**
 * Reusable minimal rich text field that allows only links.
 */
export const RICH_TEXT_BASIC_FIELD_ARGS = {
	name: 'richTextBasic',
	title: 'Rich Text Basic',
	type: 'array',
	of: [
		defineArrayMember({
			type: 'block',
			styles: [{ title: 'Normal', value: 'normal' }],
			lists: [],
			marks: {
				decorators: [],
				annotations: [linkAnnotation]
			}
		})
	],
	validation: (rule: any) => rule.required().min(1)
};
