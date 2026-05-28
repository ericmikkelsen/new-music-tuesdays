export type ItunesAlbumResult = {
	albumName: string;
	coverArt: string;
	primaryGenre: string;
	trackCount: number;
	label: string;
	itunesUrl: string;
};

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
		const lowerAlbumName = albumName.toLowerCase();
		const match =
			(data.results ?? []).find((result: any) => {
				const collectionName = String(
					result.collectionName ?? ''
				).toLowerCase();
				return (
					collectionName.includes(lowerAlbumName) ||
					lowerAlbumName.includes(collectionName)
				);
			}) ?? data.results?.[0];

		if (!match) return null;

		const coverArt = String(match.artworkUrl100 ?? '').replace(
			'100x100',
			'600x600'
		);
		if (!coverArt) return null;

		const label = String(match.copyright ?? '')
			.replace(/^[℗©]\s*\d{4}\s*/, '')
			.trim();

		return {
			albumName: match.collectionName ?? '',
			coverArt,
			primaryGenre: match.primaryGenreName ?? '',
			trackCount: Number(match.trackCount ?? 0),
			label,
			itunesUrl: match.collectionViewUrl ?? ''
		};
	} catch {
		return null;
	}
}
