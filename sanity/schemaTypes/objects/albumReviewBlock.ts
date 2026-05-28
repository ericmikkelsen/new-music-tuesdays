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

export const albumReviewBlock = defineType({
	name: 'albumReviewBlock',
	title: 'Album Review Block',
	type: 'object',
	fields: [
		defineField({
			name: 'heading',
			title: 'Heading',
			type: 'string',
			readOnly: true
		}),
		defineField({
			name: 'subheading',
			title: 'Subheading',
			type: 'string',
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
			name: 'spotifyUrl',
			title: 'Spotify URL',
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
			name: 'wikidataSummary',
			title: 'Wikidata summary',
			type: 'text',
			readOnly: true,
			hidden: true
		}),
		defineField({
			name: 'musicRelease',
			title: 'Music release',
			type: 'reference',
			to: [{ type: 'musicRelease' }],
			readOnly: true
		}),
		defineField({
			name: 'albumArt',
			title: 'Album art',
			type: 'image',
			readOnly: true,
			options: { hotspot: false }
		}),
		aiAssistImageField('backgroundImage', 'Background image'),
		aiAssistImageField('titleCard', 'Title card'),
		defineField({
			name: 'body',
			title: 'Body',
			type: 'text',
			rows: 4
		})
	],
	preview: {
		select: {
			title: 'heading',
			subtitle: 'subheading'
		}
	}
});
