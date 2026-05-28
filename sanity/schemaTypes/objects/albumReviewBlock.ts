import { defineField, defineType } from 'sanity';
import { createElement } from 'react';

export const albumReviewBlock = defineType({
	name: 'albumReviewBlock',
	title: 'Album Review Block',
	type: 'object',
	fields: [
		defineField({
			name: 'musicRelease',
			title: 'Music release',
			type: 'reference',
			to: [{ type: 'musicRelease' }],
			readOnly: true
		}),
		defineField({
			name: 'body',
			title: 'Body',
			type: 'text',
			rows: 4
		}),
		defineField({
			name: 'showYourWork',
			title: 'Show Your Work',
			type: 'text',
			rows: 14,
			readOnly: true,
			description:
				'Editor-facing provenance note showing the data, assumptions, and source trail used to shape the review draft.'
		})
	],
	preview: {
		select: {
			albumName: 'musicRelease.title',
			artistName: 'musicRelease.artistName',
			coverArt: 'musicRelease.coverArt'
		},
		prepare({ albumName, artistName, coverArt }) {
			const title = albumName
				? `${albumName} by ${artistName || 'Unknown artist'}`
				: 'Album review';

			return {
				title,
				subtitle: 'Album review',
				media: coverArt
					? createElement('img', {
							src: coverArt,
							alt: title,
							style: {
								width: '100%',
								height: '100%',
								objectFit: 'cover'
							}
						})
					: undefined
			};
		}
	}
});
