import { defineArrayMember, defineField, defineType } from 'sanity';

export const musicRelease = defineType({
	name: 'musicRelease',
	title: 'Music Release',
	type: 'document',
	fields: [
		defineField({
			name: 'title',
			title: 'Title',
			type: 'string'
		}),
		defineField({
			name: 'slug',
			title: 'Slug',
			type: 'slug',
			options: { source: 'title' }
		}),
		defineField({
			name: 'artistName',
			title: 'Artist name',
			type: 'string'
		}),
		defineField({
			name: 'wikidataId',
			title: 'Wikidata ID',
			type: 'string',
			hidden: true
		}),
		defineField({
			name: 'releaseDate',
			title: 'Release date',
			type: 'date'
		}),
		defineField({
			name: 'coverArt',
			title: 'Cover art',
			type: 'image',
			options: {
				hotspot: false,
				metadata: ['palette']
			}
		}),
		defineField({
			name: 'genres',
			title: 'Genres',
			type: 'array',
			of: [defineArrayMember({ type: 'string' })]
		}),
		defineField({
			name: 'label',
			title: 'Label',
			type: 'string'
		}),
		defineField({
			name: 'trackCount',
			title: 'Track count',
			type: 'number'
		}),
		defineField({
			name: 'trackList',
			title: 'Track list',
			type: 'array',
			of: [defineArrayMember({ type: 'string' })]
		}),
		defineField({
			name: 'producers',
			title: 'Producers',
			type: 'array',
			of: [defineArrayMember({ type: 'string' })]
		}),
		defineField({
			name: 'personnel',
			title: 'Personnel',
			type: 'array',
			of: [defineArrayMember({ type: 'string' })]
		}),
		defineField({
			name: 'awards',
			title: 'Awards',
			type: 'array',
			of: [defineArrayMember({ type: 'string' })]
		}),
		defineField({
			name: 'wikidataSummary',
			title: 'Wikidata summary',
			type: 'text',
			hidden: true
		}),
		defineField({
			name: 'itunesUrl',
			title: 'iTunes URL',
			type: 'url'
		}),
		defineField({
			name: 'featuredPick',
			title: 'Featured pick',
			type: 'boolean',
			initialValue: false
		}),
		defineField({
			name: 'editorialNote',
			title: 'Editorial note',
			type: 'text'
		}),
		defineField({
			name: 'publishedAt',
			title: 'Published at',
			type: 'datetime'
		})
	],
	preview: {
		select: {
			title: 'title',
			subtitle: 'artistName',
			media: 'coverArt'
		}
	}
});
