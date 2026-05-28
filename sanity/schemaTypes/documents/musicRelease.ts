import { defineArrayMember, defineField, defineType } from 'sanity';

export const musicRelease = defineType({
	name: 'musicRelease',
	title: 'Music Release',
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
			name: 'artistName',
			title: 'Artist name',
			type: 'string',
			readOnly: true
		}),
		defineField({
			name: 'wikidataId',
			title: 'Wikidata ID',
			type: 'string',
			readOnly: true,
			hidden: true
		}),
		defineField({
			name: 'releaseDate',
			title: 'Release date',
			type: 'date',
			readOnly: true
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
			of: [defineArrayMember({ type: 'string' })],
			readOnly: true
		}),
		defineField({
			name: 'label',
			title: 'Label',
			type: 'string',
			readOnly: true
		}),
		defineField({
			name: 'trackCount',
			title: 'Track count',
			type: 'number',
			readOnly: true
		}),
		defineField({
			name: 'trackList',
			title: 'Track list',
			type: 'array',
			of: [defineArrayMember({ type: 'string' })],
			readOnly: true
		}),
		defineField({
			name: 'producers',
			title: 'Producers',
			type: 'array',
			of: [defineArrayMember({ type: 'string' })],
			readOnly: true
		}),
		defineField({
			name: 'personnel',
			title: 'Personnel',
			type: 'array',
			of: [defineArrayMember({ type: 'string' })],
			readOnly: true
		}),
		defineField({
			name: 'awards',
			title: 'Awards',
			type: 'array',
			of: [defineArrayMember({ type: 'string' })],
			readOnly: true
		}),
		defineField({
			name: 'wikidataSummary',
			title: 'Wikidata summary',
			type: 'text',
			readOnly: true,
			hidden: true
		}),
		defineField({
			name: 'itunesUrl',
			title: 'iTunes URL',
			type: 'url',
			readOnly: true
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
