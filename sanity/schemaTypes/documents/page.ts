import { defineArrayMember, defineField, defineType } from 'sanity';

import { WEB_PAGE_FIELDS } from '../webPageFields';

export const pageType = defineType({
	name: 'page',
	title: 'Page',
	type: 'document',
	fields: [
		...Object.values(WEB_PAGE_FIELDS),
		defineField({
			name: 'blocks',
			title: 'Blocks',
			type: 'array',
			of: [
				defineArrayMember({ type: 'billboard' }),
				defineArrayMember({ type: 'listScroller' }),
				defineArrayMember({ type: 'peopleRefs' }),
				defineArrayMember({ type: 'richText' })
			],
			validation: (rule) => rule.required().min(1)
		})
	],
	preview: {
		select: {
			title: 'title',
			subtitle: 'slug.current'
		}
	}
});
