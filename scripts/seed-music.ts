import { createClient } from '@sanity/client';
import { getWikidataAlbumFacts } from './wikidata';

const sanity = createClient({
	projectId: process.env.SANITY_PROJECT_ID!,
	dataset: process.env.SANITY_DATASET ?? 'production',
	apiVersion: '2024-01-01',
	token: process.env.SANITY_API_TOKEN!,
	useCdn: false
});

// Replace with schemaId from `sanity schema deploy`
const SCHEMA_ID = 'YOUR_SCHEMA_ID_HERE';

async function getSpotifyToken(): Promise<string> {
	const credentials = Buffer.from(
		`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
	).toString('base64');
	const res = await fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: {
			Authorization: `Basic ${credentials}`,
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: 'grant_type=client_credentials'
	});
	return ((await res.json()) as any).access_token;
}

function toSlug(str: string): string {
	return str
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
}

async function uploadImageFromUrl(
	url: string,
	filename: string
): Promise<string> {
	const res = await fetch(url);
	const buffer = Buffer.from(await res.arrayBuffer());
	const asset = await sanity.assets.upload('image', buffer, {
		filename,
		contentType: 'image/jpeg'
	});
	return asset._id;
}

async function seedMusic() {
	console.log('Getting Spotify token...');
	const token = await getSpotifyToken();
	const spotifyAuthHeader = { Authorization: 'Bearer ' + token };

	const res = await fetch(
		'https://api.spotify.com/v1/browse/new-releases?limit=20&country=US',
		{ headers: spotifyAuthHeader }
	);
	const data = (await res.json()) as any;
	const releases = data.albums.items;
	console.log(`Found ${releases.length} releases`);

	const processedReleases: any[] = [];

	for (const album of releases) {
		const artistId = album.artists[0]?.id;
		if (!artistId) continue;

		const existing = await sanity.fetch(
			`*[_type == "musicRelease" && albumId == $albumId][0]._id`,
			{ albumId: album.id }
		);
		if (existing) {
			console.log(`  Skipping existing: ${album.name}`);
			continue;
		}

		console.log(`  Processing: ${album.name} by ${album.artists[0]?.name}`);

		const [artistRes, similarRes, albumRes, tracksRes] = (await Promise.all(
			[
				fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
					headers: spotifyAuthHeader
				}).then((r) => r.json()),
				fetch(
					`https://api.spotify.com/v1/artists/${artistId}/related-artists`,
					{
						headers: spotifyAuthHeader
					}
				).then((r) => r.json()),
				fetch(`https://api.spotify.com/v1/albums/${album.id}`, {
					headers: spotifyAuthHeader
				}).then((r) => r.json()),
				fetch(
					`https://api.spotify.com/v1/albums/${album.id}/tracks?limit=50`,
					{
						headers: spotifyAuthHeader
					}
				).then((r) => r.json())
			]
		)) as any[];

		const tracks = tracksRes.items ?? [];
		const trackIds = tracks
			.slice(0, 20)
			.map((t: any) => t.id)
			.join(',');
		let featuredTrack = tracks[0];
		let featuredTrackAudioFeatures: any;

		if (trackIds) {
			try {
				const featuresRes = (await fetch(
					`https://api.spotify.com/v1/audio-features?ids=${trackIds}`,
					{ headers: spotifyAuthHeader }
				).then((r) => r.json())) as any;

				const scored = (featuresRes.audio_features ?? [])
					.filter(Boolean)
					.map((f: any, i: number) => ({
						score: (f.energy ?? 0) * (f.valence ?? 0),
						track: tracks[i],
						features: f
					}))
					.sort((a: any, b: any) => b.score - a.score);

				if (scored[0]?.track) {
					featuredTrack = scored[0].track;
					featuredTrackAudioFeatures = scored[0].features;
				}
			} catch {
				// fall back to first track
			}
		}

		const docId = `spotify-album-${album.id}`;

		await sanity.createOrReplace({
			_type: 'musicRelease',
			_id: docId,
			title: album.name,
			slug: {
				_type: 'slug',
				current: toSlug(`${album.name}-${album.artists[0]?.name ?? ''}`)
			},
			artistName: album.artists[0]?.name ?? '',
			artistId,
			albumId: album.id,
			releaseDate: album.release_date,
			coverArt: album.images[0]?.url ?? '',
			genres: artistRes.genres ?? [],
			popularityScore: albumRes.popularity ?? 0,
			spotifyUrl: album.external_urls.spotify,
			label: albumRes.label ?? '',
			trackCount: album.total_tracks,
			tracks: tracks.map((t: any) => t.name),
			featuredTrack: featuredTrack?.name ?? '',
			featuredTrackUrl: featuredTrack?.external_urls?.spotify ?? '',
			similarArtists: (similarRes.artists ?? [])
				.slice(0, 5)
				.map((a: any) => ({
					_type: 'object',
					_key: a.id,
					name: a.name,
					spotifyId: a.id,
					imageUrl: a.images[0]?.url ?? ''
				})),
			featuredPick: false,
			publishedAt: new Date().toISOString()
		});

		await sanity.agent.action.transform({
			schemaId: SCHEMA_ID,
			documentId: docId,
			instruction:
				'Using $coverArt as reference, produce a clean version of this image with all text, logos, and typographic elements removed. Fill any areas where text was removed using the surrounding imagery, as if the text was never there. Preserve the original colors, composition, and imagery exactly. Do not add anything new.',
			instructionParams: { coverArt: { type: 'document' } },
			target: { path: ['backgroundImage', 'asset'] }
		});

		await sanity.agent.action.transform({
			schemaId: SCHEMA_ID,
			documentId: docId,
			instruction:
				'Using $coverArt as reference, produce an image containing only the album title and artist name text from the original cover, rendered in black on a flat white background. No imagery, no decorative elements. Just the text in black, positioned as it appeared on the original cover.',
			instructionParams: { coverArt: { type: 'document' } },
			target: [
				{ path: ['titleCard', 'asset'] },
				{ path: ['titleCard', 'instruction'] }
			]
		});

		processedReleases.push({
			album,
			albumRes,
			artistRes,
			tracks,
			featuredTrack,
			featuredTrackAudioFeatures,
			docId
		});
		await new Promise((r) => setTimeout(r, 300));
	}

	if (processedReleases.length === 0) {
		console.log(
			'No new releases processed — skipping New Music Tuesday document.'
		);
		return;
	}

	const top4 = [...processedReleases]
		.sort(
			(a, b) =>
				(b.albumRes.popularity ?? 0) - (a.albumRes.popularity ?? 0)
		)
		.slice(0, 4);

	const now = new Date();
	const dateStr = now.toISOString().split('T')[0];
	const nmtTitle = `New Music Tuesday ${dateStr}`;
	const nmtSlug = `new-music-tuesday-${dateStr}`;
	const nmtId = `nmt-${dateStr}`;

	console.log(`\nBuilding New Music Tuesday: ${nmtTitle}`);

	console.log('  Uploading hero images...');
	const heroImageAssets = await Promise.all(
		top4.map(async ({ album }, i) => {
			const assetId = await uploadImageFromUrl(
				album.images[0]?.url,
				`nmt-${dateStr}-hero-${i + 1}.jpg`
			);
			return {
				_type: 'image',
				_key: `hero-${i}`,
				asset: { _type: 'reference', _ref: assetId }
			};
		})
	);

	console.log('  Building album review blocks...');
	const albumReviews = await Promise.all(
		top4.map(
			async (
				{ album, albumRes, artistRes, tracks, featuredTrack, docId },
				i
			) => {
				const albumArtAssetId = await uploadImageFromUrl(
					album.images[0]?.url,
					`nmt-${dateStr}-album-${i + 1}.jpg`
				);

				console.log(`  Looking up Wikidata: ${album.name}...`);
				const wikidataFacts = await getWikidataAlbumFacts(
					album.artists[0]?.name ?? '',
					album.name
				);
				const wikidataSummary =
					wikidataFacts ??
					`Artist: ${album.artists[0]?.name}. Genre: ${(artistRes.genres ?? []).slice(0, 2).join(', ') || 'contemporary'}. Label: ${albumRes.label ?? 'independent'}. ${tracks.length} tracks.`;

				return {
					_type: 'albumReviewBlock',
					_key: `review-${album.id}`,
					heading: album.name,
					subheading: album.artists[0]?.name ?? '',
					body: '',
					trackList: tracks.map((t: any) => t.name),
					albumArt: {
						_type: 'image',
						asset: { _type: 'reference', _ref: albumArtAssetId }
					},
					featuredTrack: featuredTrack?.name ?? '',
					featuredTrackUrl:
						featuredTrack?.external_urls?.spotify ?? '',
					spotifyUrl: album.external_urls.spotify,
					genres: artistRes.genres ?? [],
					wikidataSummary,
					musicRelease: { _type: 'reference', _ref: docId }
				};
			}
		)
	);

	const heroBlock = {
		_type: 'newMusicHeroBlock',
		_key: `hero-${dateStr}`,
		heading: nmtTitle,
		description: '',
		heroImages: heroImageAssets
	};

	await sanity.createOrReplace({
		_type: 'newMusicTuesday',
		_id: nmtId,
		title: nmtTitle,
		slug: { _type: 'slug', current: nmtSlug },
		publishedAt: now.toISOString(),
		blocks: [heroBlock, ...albumReviews]
	});

	console.log('  NMT document created. Firing Agent Actions...');

	const audioFeaturesByAlbum: Record<string, any> = {};
	for (const { album, featuredTrackAudioFeatures } of top4) {
		if (featuredTrackAudioFeatures)
			audioFeaturesByAlbum[album.id] = featuredTrackAudioFeatures;
	}

	const heroAlbumContext = top4
		.map(({ album, artistRes }) => {
			const f = audioFeaturesByAlbum[album.id];
			const feel = f
				? `${f.valence > 0.6 ? 'upbeat' : f.valence > 0.3 ? 'emotionally complex' : 'dark'}, ${f.energy > 0.6 ? 'high-energy' : f.energy > 0.4 ? 'mid-tempo' : 'understated'}, ${f.danceability > 0.7 ? 'highly rhythmic' : f.danceability > 0.4 ? 'moderately rhythmic' : 'not rhythm-forward'}, ${f.acousticness > 0.6 ? 'largely acoustic' : f.acousticness > 0.3 ? 'blends acoustic and electronic' : 'predominantly electronic'}`
				: '';
			return `- "${album.name}" by ${album.artists[0]?.name} (${(artistRes.genres ?? []).slice(0, 2).join(', ')}${feel ? `, ${feel}` : ''})`;
		})
		.join('\n');

	await sanity.agent.action.generate({
		schemaId: SCHEMA_ID,
		documentId: nmtId,
		instruction: `You are writing the opening paragraph for a weekly music blog post called "New Music Tuesday."
A human editor will refine this — write something with personality and a strong point of view.

This week's four featured albums (use this to inform the writing — do not cite these numbers or list album names directly):
${heroAlbumContext}

Write 2-3 sentences. Tease the range of what's here without summarizing any album directly.
Give a sense of the emotional or sonic variety across the four releases.
Make someone want to scroll down. Do not list the albums by name — let the reviews do that.
Do not mention Spotify, Wikidata, or any data source. Write as if you already knew this.
Do not use the word "journey." Do not open with "This week."`,
		target: { path: ['blocks', 0, 'description'] }
	});

	for (let i = 0; i < top4.length; i++) {
		const { album } = top4[i];
		const wikidataSummary = albumReviews[i].wikidataSummary;

		const { featuredTrackAudioFeatures } = top4[i];
		const f = featuredTrackAudioFeatures;
		const audioContext = f
			? `
Audio character (use this to inform your writing voice and descriptions — do not cite these values directly, do not mention tempo or scores):
- Energy: ${f.energy > 0.7 ? 'high — urgent, relentless, physical' : f.energy > 0.4 ? 'mid — present but not overwhelming' : 'low — spacious, deliberate, restrained'}
- Mood: ${f.valence > 0.6 ? 'positive and upbeat' : f.valence > 0.3 ? 'emotionally mixed' : 'dark or melancholic'}
- Rhythm: ${f.danceability > 0.7 ? 'highly rhythmic and danceable' : f.danceability > 0.4 ? 'moderately rhythmic' : 'not rhythm-forward'}
- Texture: ${f.acousticness > 0.6 ? 'largely acoustic and organic' : f.acousticness > 0.3 ? 'blend of acoustic and electronic' : 'predominantly electronic or produced'}
- Density: ${f.instrumentalness > 0.5 ? 'largely instrumental' : 'vocal-forward'}`.trim()
			: '';

		await sanity.agent.action.generate({
			schemaId: SCHEMA_ID,
			documentId: nmtId,
			instruction: `You are writing a first-draft album review for a music blog. A human editor will refine this — write something with personality that gives them a strong starting point.

Album: "${album.name}" by ${album.artists[0]?.name}
Genres: ${(top4[i].artistRes.genres ?? []).slice(0, 3).join(', ') || 'contemporary'}
Popularity: ${top4[i].albumRes.popularity}/100
${audioContext}
${wikidataSummary ? `What we know about this release (use what's useful, skip what isn't):\n${wikidataSummary}` : ''}

Write 3-4 sentences. Lead with something specific and interesting.
Be direct and slightly opinionated — leave room for the editor to add their own voice.
Do not open with the album name or artist name. Do not use the word "journey."
Do not mention Spotify, Wikidata, or any data source. Write as if you already knew this.
Do not cite any numbers, scores, or technical values directly in the text.`,
			target: { path: ['blocks', i + 1, 'body'] }
		});

		await new Promise((r) => setTimeout(r, 200));
	}

	console.log(
		'\nDone. Check Studio in ~1 minute for generated content and images.'
	);
	console.log(`New Music Tuesday URL: /new-music-tuesday/${dateStr}/`);
}

seedMusic().catch(console.error);
