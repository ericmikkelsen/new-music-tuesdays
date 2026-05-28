import { defineArrayMember, defineField, defineType } from 'sanity';

const aiAssistImageField = (name: string, title: string) =>
	defineField({
		name,
		title,
		type: 'image',
		readOnly: true,
		fields: [
			defineField({
				name: 'instruction',
				title: 'Instruction',
				type: 'text',
				rows: 3
			})
		],
		options: {
			hotspot: false,
			aiAssist: {
				imageInstructionField: 'instruction'
			}
		}
	});

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
			name: 'artistId',
			title: 'Artist ID',
			type: 'string',
			readOnly: true,
			hidden: true
		}),
		defineField({
			name: 'albumId',
			title: 'Album ID',
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
			title: 'Cover art URL',
			type: 'url',
			readOnly: true
		}),
		defineField({
			name: 'genres',
			title: 'Genres',
			type: 'array',
			of: [defineArrayMember({ type: 'string' })],
			readOnly: true
		}),
		defineField({
			name: 'popularityScore',
			title: 'Popularity score',
			type: 'number',
			readOnly: true
		}),
		defineField({
			name: 'spotifyUrl',
			title: 'Spotify URL',
			type: 'url',
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
			name: 'featuredTrack',
			title: 'Featured track',
			type: 'string',
			readOnly: true
		}),
		defineField({
			name: 'featuredTrackUrl',
			title: 'Featured track URL',
			type: 'url',
			readOnly: true
		}),
		defineField({
			name: 'tracks',
			title: 'Tracks',
			type: 'array',
			of: [defineArrayMember({ type: 'string' })],
			readOnly: true
		}),
		defineField({
			name: 'similarArtists',
			title: 'Similar artists',
			type: 'array',
			of: [
				defineArrayMember({
					type: 'object',
					fields: [
						defineField({
							name: 'name',
							title: 'Name',
							type: 'string'
						}),
						defineField({
							name: 'spotifyId',
							title: 'Spotify ID',
							type: 'string'
						}),
						defineField({
							name: 'imageUrl',
							title: 'Image URL',
							type: 'url'
						})
					]
				})
			],
			readOnly: true
		}),
		aiAssistImageField('backgroundImage', 'Background image'),
		aiAssistImageField('titleCard', 'Title card'),
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
			subtitle: 'artistName'
		}
	}
});
