import { defineArrayMember, defineField, defineType } from 'sanity';

export const headingType = defineType({
	name: 'heading',
	title: 'Heading',
	type: 'object',
	fields: [
		defineField({
			name: 'text',
			title: 'Text',
			type: 'string',
			validation: (rule) => rule.required()
		})
	]
});

export const subheadingType = defineType({
	name: 'subheading',
	title: 'Subheading',
	type: 'object',
	fields: [
		defineField({
			name: 'text',
			title: 'Text',
			type: 'string',
			validation: (rule) => rule.required()
		})
	]
});

export const bodyTextType = defineType({
	name: 'bodyText',
	title: 'Body Text',
	type: 'object',
	fields: [
		defineField({
			name: 'text',
			title: 'Text',
			type: 'text',
			rows: 4,
			validation: (rule) => rule.required()
		})
	]
});

export const linkType = defineType({
	name: 'link',
	title: 'Link',
	type: 'object',
	fields: [
		defineField({
			name: 'url',
			title: 'URL',
			type: 'url',
			validation: (rule) => rule.required()
		}),
		defineField({
			name: 'text',
			title: 'Text',
			type: 'string',
			validation: (rule) => rule.required()
		})
	]
});

export const listType = defineType({
	name: 'list',
	title: 'List',
	type: 'object',
	fields: [
		defineField({
			name: 'items',
			title: 'Items',
			type: 'array',
			of: [defineArrayMember({ type: 'string' })],
			validation: (rule) => rule.required().min(1)
		})
	]
});

export const imageObjectType = defineType({
	name: 'imageObject',
	title: 'Image',
	type: 'object',
	fields: [
		defineField({
			name: 'image',
			title: 'Image',
			type: 'image',
			options: { hotspot: true },
			validation: (rule) => rule.required()
		}),
		defineField({ name: 'alt', title: 'Alt Text', type: 'string' })
	]
});
