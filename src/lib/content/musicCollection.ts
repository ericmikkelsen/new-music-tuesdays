import { loadQuery } from './preview';

export type SimilarArtist = {
	name: string;
	spotifyId: string;
	imageUrl?: string;
};

export type MusicRelease = {
	_id: string;
	title: string;
	slug: string;
	artistName: string;
	artistId?: string;
	albumId?: string;
	releaseDate?: string;
	coverArt?: string;
	genres: string[];
	popularityScore?: number;
	spotifyUrl?: string;
	label?: string;
	trackCount?: number;
	featuredTrack?: string;
	featuredTrackUrl?: string;
	tracks: string[];
	similarArtists: SimilarArtist[];
	backgroundImageUrl?: string;
	titleCardUrl?: string;
	featuredPick?: boolean;
	editorialNote?: string;
	publishedAt?: string;
};

type SanityMusicReleaseQueryResult = Omit<MusicRelease, 'slug'> & {
	slug?: string;
};

const MUSIC_RELEASES_QUERY = `*[_type == "musicRelease" && defined(slug.current)]{
  _id,
  title,
  "slug": slug.current,
  artistName,
  artistId,
  albumId,
  releaseDate,
  coverArt,
  genres,
  popularityScore,
  spotifyUrl,
  label,
  trackCount,
  featuredTrack,
  featuredTrackUrl,
  tracks,
  similarArtists[]{name, spotifyId, imageUrl},
  "backgroundImageUrl": backgroundImage.asset->url,
  "titleCardUrl": titleCard.asset->url,
  featuredPick,
  editorialNote,
  publishedAt
} | order(releaseDate desc)`;

const MUSIC_RELEASE_BY_SLUG_QUERY = `*[_type == "musicRelease" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  artistName,
  artistId,
  albumId,
  releaseDate,
  coverArt,
  genres,
  popularityScore,
  spotifyUrl,
  label,
  trackCount,
  featuredTrack,
  featuredTrackUrl,
  tracks,
  similarArtists[]{name, spotifyId, imageUrl},
  "backgroundImageUrl": backgroundImage.asset->url,
  "titleCardUrl": titleCard.asset->url,
  featuredPick,
  editorialNote,
  publishedAt
}`;

const FEATURED_RELEASES_QUERY = `*[_type == "musicRelease" && featuredPick == true && defined(slug.current)]{
  _id,
  title,
  "slug": slug.current,
  artistName,
  artistId,
  albumId,
  releaseDate,
  coverArt,
  genres,
  popularityScore,
  spotifyUrl,
  label,
  trackCount,
  featuredTrack,
  featuredTrackUrl,
  tracks,
  similarArtists[]{name, spotifyId, imageUrl},
  "backgroundImageUrl": backgroundImage.asset->url,
  "titleCardUrl": titleCard.asset->url,
  featuredPick,
  editorialNote,
  publishedAt
} | order(publishedAt desc)`;

export function mapSanityMusicRelease(
	entry: SanityMusicReleaseQueryResult
): MusicRelease | null {
	if (!entry._id || !entry.slug || !entry.title || !entry.artistName) {
		return null;
	}

	return {
		...entry,
		slug: entry.slug,
		genres: entry.genres ?? [],
		tracks: entry.tracks ?? [],
		similarArtists: entry.similarArtists ?? []
	};
}

export async function getMusicReleases(): Promise<MusicRelease[]> {
	try {
		const releases =
			await loadQuery<SanityMusicReleaseQueryResult[]>(
				MUSIC_RELEASES_QUERY
			);
		return releases
			.map(mapSanityMusicRelease)
			.filter((entry): entry is MusicRelease => Boolean(entry));
	} catch {
		return [];
	}
}

export async function getMusicReleaseBySlug(
	slug: string
): Promise<MusicRelease | undefined> {
	try {
		const release = await loadQuery<SanityMusicReleaseQueryResult | null>(
			MUSIC_RELEASE_BY_SLUG_QUERY,
			{ slug }
		);
		if (!release) return undefined;
		return mapSanityMusicRelease(release) ?? undefined;
	} catch {
		return undefined;
	}
}

export async function getFeaturedReleases(): Promise<MusicRelease[]> {
	try {
		const releases = await loadQuery<SanityMusicReleaseQueryResult[]>(
			FEATURED_RELEASES_QUERY
		);
		return releases
			.map(mapSanityMusicRelease)
			.filter((entry): entry is MusicRelease => Boolean(entry));
	} catch {
		return [];
	}
}
