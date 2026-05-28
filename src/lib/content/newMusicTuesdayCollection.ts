import { loadQuery } from './preview';

export type NewMusicHeroBlock = {
	_type: 'newMusicHeroBlock';
	_key?: string;
	heading: string;
	description: string;
	heroImages: { url: string }[];
};

export type AlbumReviewBlock = {
	_type: 'albumReviewBlock';
	_key?: string;
	heading: string;
	subheading: string;
	body: string;
	trackList: string[];
	albumArtUrl: string;
	featuredTrack: string;
	featuredTrackUrl: string;
	spotifyUrl: string;
	genres: string[];
};

export type NMTBlock = NewMusicHeroBlock | AlbumReviewBlock;

export type NewMusicTuesdayIssue = {
	_id: string;
	title: string;
	slug: string;
	publishedAt?: string;
	blocks: NMTBlock[];
};

type SanityNMTIssueQueryResult = Omit<NewMusicTuesdayIssue, 'slug'> & {
	slug?: string;
};

const NEW_MUSIC_TUESDAY_QUERY = `*[_type == "newMusicTuesday" && defined(slug.current)]{
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  blocks[]{
    ...,
    _type,
    heroImages[]{"url": asset->url},
		"heading": coalesce(heading, musicRelease->title),
		"subheading": coalesce(subheading, musicRelease->artistName),
		"albumArtUrl": coalesce(albumArt.asset->url, musicRelease->coverArt.asset->url, musicRelease->coverArt),
		"trackList": coalesce(trackList, musicRelease->trackList, []),
		"spotifyUrl": coalesce(spotifyUrl, musicRelease->itunesUrl),
		"genres": coalesce(genres, musicRelease->genres, [])
  }
} | order(publishedAt desc)`;

const NEW_MUSIC_TUESDAY_BY_SLUG_QUERY = `*[_type == "newMusicTuesday" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  blocks[]{
    ...,
    _type,
    heroImages[]{"url": asset->url},
		"heading": coalesce(heading, musicRelease->title),
		"subheading": coalesce(subheading, musicRelease->artistName),
		"albumArtUrl": coalesce(albumArt.asset->url, musicRelease->coverArt.asset->url, musicRelease->coverArt),
		"trackList": coalesce(trackList, musicRelease->trackList, []),
		"spotifyUrl": coalesce(spotifyUrl, musicRelease->itunesUrl),
		"genres": coalesce(genres, musicRelease->genres, [])
  }
}`;

const NEW_MUSIC_TUESDAY_LATEST_QUERY = `*[_type == "newMusicTuesday" && defined(slug.current)] | order(publishedAt desc)[0]{
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  blocks[]{
    ...,
    _type,
    heroImages[]{"url": asset->url},
		"heading": coalesce(heading, musicRelease->title),
		"subheading": coalesce(subheading, musicRelease->artistName),
		"albumArtUrl": coalesce(albumArt.asset->url, musicRelease->coverArt.asset->url, musicRelease->coverArt),
		"trackList": coalesce(trackList, musicRelease->trackList, []),
		"spotifyUrl": coalesce(spotifyUrl, musicRelease->itunesUrl),
		"genres": coalesce(genres, musicRelease->genres, [])
  }
}`;

function mapNMTBlock(block: any): NMTBlock | null {
	if (block?._type === 'newMusicHeroBlock') {
		return {
			_type: 'newMusicHeroBlock',
			_key: block._key,
			heading: block.heading ?? '',
			description: block.description ?? '',
			heroImages: Array.isArray(block.heroImages) ? block.heroImages : []
		};
	}

	if (block?._type === 'albumReviewBlock') {
		return {
			_type: 'albumReviewBlock',
			_key: block._key,
			heading: block.heading ?? '',
			subheading: block.subheading ?? '',
			body: block.body ?? '',
			trackList: Array.isArray(block.trackList) ? block.trackList : [],
			albumArtUrl: block.albumArtUrl ?? '',
			featuredTrack: block.featuredTrack ?? '',
			featuredTrackUrl: block.featuredTrackUrl ?? '',
			spotifyUrl: block.spotifyUrl ?? '',
			genres: Array.isArray(block.genres) ? block.genres : []
		};
	}

	return null;
}

export function mapSanityNewMusicTuesdayIssue(
	entry: SanityNMTIssueQueryResult
): NewMusicTuesdayIssue | null {
	if (!entry?._id || !entry?.slug || !entry?.title) {
		return null;
	}

	const blocks = Array.isArray(entry.blocks)
		? entry.blocks
				.map(mapNMTBlock)
				.filter((block): block is NMTBlock => Boolean(block))
		: [];

	return {
		_id: entry._id,
		title: entry.title,
		slug: entry.slug,
		publishedAt: entry.publishedAt,
		blocks
	};
}

export async function getNewMusicTuesdayIssues(): Promise<
	NewMusicTuesdayIssue[]
> {
	try {
		const issues = await loadQuery<SanityNMTIssueQueryResult[]>(
			NEW_MUSIC_TUESDAY_QUERY
		);
		return issues
			.map(mapSanityNewMusicTuesdayIssue)
			.filter((entry): entry is NewMusicTuesdayIssue => Boolean(entry));
	} catch {
		return [];
	}
}

export async function getNewMusicTuesdayBySlug(
	slug: string
): Promise<NewMusicTuesdayIssue | undefined> {
	try {
		const issue = await loadQuery<SanityNMTIssueQueryResult | null>(
			NEW_MUSIC_TUESDAY_BY_SLUG_QUERY,
			{ slug }
		);
		if (!issue) return undefined;
		return mapSanityNewMusicTuesdayIssue(issue) ?? undefined;
	} catch {
		return undefined;
	}
}

export async function getLatestNewMusicTuesday(): Promise<
	NewMusicTuesdayIssue | undefined
> {
	try {
		const issue = await loadQuery<SanityNMTIssueQueryResult | null>(
			NEW_MUSIC_TUESDAY_LATEST_QUERY
		);
		if (!issue) return undefined;
		return mapSanityNewMusicTuesdayIssue(issue) ?? undefined;
	} catch {
		return undefined;
	}
}
