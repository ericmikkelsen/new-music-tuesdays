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
			coverArt: 'musicRelease.coverArt',
			coverArtUrl: 'musicRelease.coverArt.asset->url',
			coverArtLegacy: 'musicRelease.coverArt'
		},
		prepare({
			albumName,
			artistName,
			coverArt,
			coverArtUrl,
			coverArtLegacy
		}) {
			const title = albumName
				? `${albumName} by ${artistName || 'Unknown artist'}`
				: 'Album review';
			const mediaUrl =
				coverArtUrl ||
				(typeof coverArtLegacy === 'string'
					? coverArtLegacy
					: undefined);

			return {
				title,
				subtitle: 'Album review',
				media:
					coverArt ??
					(mediaUrl
						? createElement('img', {
								src: mediaUrl,
								alt: title,
								style: {
									width: '100%',
									height: '100%',
									objectFit: 'cover'
								}
							})
						: undefined)
			};
		}
	}
});
