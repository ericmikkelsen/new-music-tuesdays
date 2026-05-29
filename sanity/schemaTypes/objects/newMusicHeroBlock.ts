import { defineArrayMember, defineField, defineType } from '../helpers';

export const newMusicHeroBlock = defineType({
	name: 'newMusicHeroBlock',
	title: 'New Music Hero',
	type: 'object',
	fields: [
		defineField({
			name: 'heading',
			title: 'Heading',
			type: 'string',
			description: 'Auto-populated: "New Music Tuesday {DATE}"'
		}),
		defineField({
			name: 'subheading',
			title: 'Subheading',
			type: 'string',
			description: 'Auto-populated year, e.g. "2026"'
		}),
		defineField({
			name: 'description',
			title: 'Description',
			type: 'text',
			rows: 3,
			description: 'Hero intro paragraph. Populated by Agent Actions.'
		}),
		defineField({
			name: 'heroImages',
			title: 'Hero images (4 album covers)',
			type: 'array',
			of: [
				defineArrayMember({
					type: 'image',
					options: { hotspot: false }
				})
			],
			validation: (rule) => rule.max(4),
			readOnly: false
		})
	],
	preview: {
		select: { title: 'heading' },
		prepare({ title }: { title?: string }) {
			return {
				title: title ?? 'New Music Hero',
				subtitle: 'New music hero'
			};
		}
	}
});
