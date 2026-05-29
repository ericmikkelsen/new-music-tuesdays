export type ItunesAlbumResult = {
	albumName: string;
	coverArt: string;
	primaryGenre: string;
	trackCount: number;
	trackList: string[];
	label: string;
	itunesUrl: string;
};

function normalizeForMatch(value: string): string {
	return String(value ?? '')
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}

function namesLikelyMatch(left: string, right: string): boolean {
	const normalizedLeft = normalizeForMatch(left);
	const normalizedRight = normalizeForMatch(right);

	if (!normalizedLeft || !normalizedRight) {
		return false;
	}

	return (
		normalizedLeft.includes(normalizedRight) ||
		normalizedRight.includes(normalizedLeft)
	);
}

async function getItunesTrackList(collectionId: number): Promise<string[]> {
	try {
		const lookupRes = await fetch(
			`https://itunes.apple.com/lookup?id=${collectionId}&entity=song&limit=200`
		);

		if (!lookupRes.ok) {
			return [];
		}

		const lookupData = (await lookupRes.json()) as any;
		const songs = (lookupData.results ?? [])
			.filter((item: any) => item?.wrapperType === 'track')
			.sort(
				(a: any, b: any) =>
					Number(a?.discNumber ?? 0) - Number(b?.discNumber ?? 0) ||
					Number(a?.trackNumber ?? 0) - Number(b?.trackNumber ?? 0)
			)
			.map((item: any) => String(item?.trackName ?? '').trim())
			.filter(Boolean);

		return Array.from(new Set(songs));
	} catch {
		return [];
	}
}

async function getItunesTrackListFromSongSearch(
	artistName: string,
	albumName: string
): Promise<string[]> {
	try {
		const query = encodeURIComponent(`${artistName} ${albumName}`);
		const songRes = await fetch(
			`https://itunes.apple.com/search?term=${query}&entity=song&limit=200`
		);

		if (!songRes.ok) {
			return [];
		}

		const songData = (await songRes.json()) as any;
		const songs = (songData.results ?? [])
			.filter((item: any) => item?.wrapperType === 'track')
			.filter((item: any) =>
				namesLikelyMatch(String(item?.collectionName ?? ''), albumName)
			)
			.sort(
				(a: any, b: any) =>
					Number(a?.discNumber ?? 0) - Number(b?.discNumber ?? 0) ||
					Number(a?.trackNumber ?? 0) - Number(b?.trackNumber ?? 0)
			)
			.map((item: any) => String(item?.trackName ?? '').trim())
			.filter(Boolean);

		return Array.from(new Set(songs));
	} catch {
		return [];
	}
}

export async function getItunesAlbumData(
	artistName: string,
	albumName: string
): Promise<ItunesAlbumResult | null> {
	try {
		const query = encodeURIComponent(`${artistName} ${albumName}`);
		const res = await fetch(
			`https://itunes.apple.com/search?term=${query}&entity=album&limit=5`
		);

		if (!res.ok) {
			return null;
		}

		const data = (await res.json()) as any;
		const match =
			(data.results ?? []).find((result: any) => {
				return namesLikelyMatch(
					String(result.collectionName ?? ''),
					albumName
				);
			}) ?? data.results?.[0];

		if (!match) return null;

		const coverArt = String(match.artworkUrl100 ?? '').replace(
			'100x100',
			'600x600'
		);
		if (!coverArt) return null;

		const collectionId = Number(match.collectionId ?? 0);
		let trackList =
			Number.isFinite(collectionId) && collectionId > 0
				? await getItunesTrackList(collectionId)
				: [];

		if (!trackList.length) {
			trackList = await getItunesTrackListFromSongSearch(
				artistName,
				match.collectionName ?? albumName
			);
		}

		const label = String(match.copyright ?? '')
			.replace(/^[℗©]\s*\d{4}\s*/, '')
			.trim();

		return {
			albumName: match.collectionName ?? '',
			coverArt,
			primaryGenre: match.primaryGenreName ?? '',
			trackCount: Number(match.trackCount ?? 0),
			trackList,
			label,
			itunesUrl: match.collectionViewUrl ?? ''
		};
	} catch {
		return null;
	}
}
