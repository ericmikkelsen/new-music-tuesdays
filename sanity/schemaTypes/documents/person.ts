import { defineArrayMember, defineField, defineType } from 'sanity';

export const personType = defineType({
	name: 'person',
	title: 'Person',
	type: 'document',
	fields: [
		defineField({
			name: 'name',
			title: 'Name',
			type: 'string',
			validation: (rule) => rule.required().min(2)
		}),
		defineField({
			name: 'bio',
			title: 'Bio',
			type: 'array',
			of: [
				defineArrayMember({
					type: 'block',
					styles: [],
					lists: [],
					marks: {
						decorators: [],
						annotations: [
							{
								name: 'bioLink',
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
							}
						]
					}
				})
			],
			validation: (rule) => rule.required().min(1)
		}),
		defineField({
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
			],
			validation: (rule) => rule.required()
		})
	],
	preview: {
		select: {
			title: 'name',
			media: 'image'
		}
	}
});
