import test from 'node:test';
import assert from 'node:assert/strict';

import { mapSanityMusicRelease } from '../src/lib/content/musicCollection';
import { mapSanityNewMusicTuesdayIssue } from '../src/lib/content/newMusicTuesdayCollection';

test('mapSanityMusicRelease maps valid release', () => {
	const mapped = mapSanityMusicRelease({
		_id: 'release-1',
		title: 'Album One',
		slug: 'album-one',
		artistName: 'Artist',
		genres: ['indie'],
		tracks: ['Track 1'],
		similarArtists: []
	});

	assert.ok(mapped);
	assert.equal(mapped?.slug, 'album-one');
	assert.deepEqual(mapped?.genres, ['indie']);
});

test('mapSanityNewMusicTuesdayIssue maps known block types only', () => {
	const mapped = mapSanityNewMusicTuesdayIssue({
		_id: 'nmt-1',
		title: 'New Music Tuesday 2026-01-01',
		slug: 'new-music-tuesday-2026-01-01',
		blocks: [
			{
				_type: 'newMusicHeroBlock',
				heading: 'Hero',
				description: 'Desc',
				heroImages: [{ url: 'https://example.com/1.jpg' }]
			},
			{
				_type: 'albumReviewBlock',
				heading: 'Album',
				subheading: 'Artist',
				body: 'Body',
				trackList: ['One'],
				albumArtUrl: 'https://example.com/album.jpg',
				featuredTrack: 'One',
				featuredTrackUrl: 'https://example.com/track',
				spotifyUrl: 'https://open.spotify.com/album/x',
				genres: ['indie']
			},
			{ _type: 'unknownBlock' }
		]
	});

	assert.ok(mapped);
	assert.equal(mapped?.blocks.length, 2);
	assert.equal(mapped?.blocks[0]?._type, 'newMusicHeroBlock');
	assert.equal(mapped?.blocks[1]?._type, 'albumReviewBlock');
});
