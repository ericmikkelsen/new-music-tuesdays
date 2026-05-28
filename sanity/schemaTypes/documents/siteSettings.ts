import { defineField, defineType } from 'sanity';
import { LINKS_FIELD_ARGS } from '../objects/componentFields';
export default defineType({
	name: 'siteSettings',
	title: 'Site Settings',
	type: 'document',
	fields: [
		defineField({
			name: 'title',
			title: 'Site Title',
			type: 'string'
		}),
		defineField({
			name: 'description',
			title: 'Site Description',
			type: 'text'
		}),
		defineField({
			name: 'favicon',
			title: 'Favicon',
			type: 'image',
			options: { hotspot: false },
			validation: (rule) => rule.required()
		}),
		defineField({
			...LINKS_FIELD_ARGS,
			name: 'navigation',
			title: 'Navigation'
		})
	]
});
