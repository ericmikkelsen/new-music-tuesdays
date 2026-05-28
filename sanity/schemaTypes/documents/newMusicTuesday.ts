import { defineArrayMember, defineField, defineType } from 'sanity';

export const newMusicTuesday = defineType({
	name: 'newMusicTuesday',
	title: 'New Music Tuesday',
	type: 'document',
	fields: [
		defineField({
			name: 'title',
			title: 'Title',
			type: 'string',
			readOnly: true
		}),
		defineField({
			name: 'slug',
			title: 'Slug',
			type: 'slug',
			readOnly: true,
			options: { source: 'title' }
		}),
		defineField({
			name: 'publishedAt',
			title: 'Published at',
			type: 'datetime',
			readOnly: true
		}),
		defineField({
			name: 'blocks',
			title: 'Blocks',
			type: 'array',
			of: [
				defineArrayMember({ type: 'newMusicHeroBlock' }),
				defineArrayMember({ type: 'albumReviewBlock' })
			]
		})
	],
	preview: {
		select: {
			title: 'title',
			subtitle: 'publishedAt'
		}
	}
});
