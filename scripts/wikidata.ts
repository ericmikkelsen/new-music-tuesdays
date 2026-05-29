export type WikidataAlbum = {
	entityId: string;
	title: string;
	artistName: string;
	artistEntityId?: string;
	releaseDate: string;
};

export type WikidataAlbumDetail = {
	genres: string[];
	label: string;
	producers: string[];
	personnel: string[];
	awards: string[];
	chartPositions: string[];
	language: string;
	wikidataSummary: string;
};

const WIKIDATA_HEADERS = {
	'User-Agent': 'new-music-tuesdays/1.0',
	Accept: 'application/json'
};

const labelCache = new Map<string, string>();
let wikidataReferenceDate: Date | undefined;

export function setWikidataReferenceDate(referenceDate?: Date): void {
	wikidataReferenceDate = referenceDate
		? new Date(referenceDate.getTime())
		: undefined;
}

function emptyDetail(): WikidataAlbumDetail {
	return {
		genres: [],
		label: '',
		producers: [],
		personnel: [],
		awards: [],
		chartPositions: [],
		language: '',
		wikidataSummary: ''
	};
}

function extractQidFromClaim(claim: any): string | undefined {
	return claim?.mainsnak?.datavalue?.value?.id;
}

async function getEntityLabel(qid: string): Promise<string> {
	if (!qid) return '';
	if (labelCache.has(qid)) {
		return labelCache.get(qid) ?? qid;
	}

	try {
		const res = await fetch(
			`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`,
			{ headers: WIKIDATA_HEADERS }
		);
		const data = (await res.json()) as any;
		const label = data.entities?.[qid]?.labels?.en?.value ?? qid;
		labelCache.set(qid, label);
		return label;
	} catch {
		return qid;
	}
}

export async function getRecentWikidataAlbums(
	daysBack = 7
): Promise<WikidataAlbum[]> {
	const baseDate = wikidataReferenceDate ?? new Date();
	const fromDate = new Date(
		baseDate.getTime() - daysBack * 24 * 60 * 60 * 1000
	)
		.toISOString()
		.split('T')[0];

	const query = `
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    SELECT DISTINCT ?album ?albumLabel ?artist ?artistLabel ?releaseDate WHERE {
      ?album wdt:P31 wd:Q482994 ;
             wdt:P577 ?releaseDate ;
             wdt:P175 ?artist .
			FILTER(xsd:dateTime(?releaseDate) >= "${fromDate}T00:00:00Z"^^xsd:dateTime)
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    ORDER BY DESC(?releaseDate)
    LIMIT 50
  `.trim();

	const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;
	const res = await fetch(url, {
		headers: {
			'User-Agent': 'new-music-tuesdays/1.0',
			Accept: 'application/sparql-results+json'
		}
	});

	if (!res.ok) {
		throw new Error(`Wikidata SPARQL request failed (${res.status})`);
	}

	const data = (await res.json()) as any;

	return (data.results?.bindings ?? [])
		.map((binding: any) => ({
			entityId: binding.album?.value?.split('/').pop() ?? '',
			title: binding.albumLabel?.value ?? '',
			artistName: binding.artistLabel?.value ?? '',
			artistEntityId: binding.artist?.value?.split('/').pop(),
			releaseDate: binding.releaseDate?.value?.split('T')[0] ?? ''
		}))
		.filter((album: WikidataAlbum) =>
			Boolean(album.entityId && album.title && album.artistName)
		);
}

export async function getWikidataAlbumDetail(
	entityId: string
): Promise<WikidataAlbumDetail> {
	try {
		const res = await fetch(
			`https://www.wikidata.org/wiki/Special:EntityData/${entityId}.json`,
			{ headers: WIKIDATA_HEADERS }
		);
		const data = (await res.json()) as any;
		const entity = data.entities?.[entityId];
		if (!entity) return emptyDetail();

		const claims = entity.claims ?? {};

		const [genres, labels, producers, personnel, awards] =
			await Promise.all([
				Promise.all(
					(claims.P136 ?? [])
						.slice(0, 3)
						.map((claim: any) =>
							getEntityLabel(extractQidFromClaim(claim) ?? '')
						)
				),
				Promise.all(
					(claims.P264 ?? [])
						.slice(0, 1)
						.map((claim: any) =>
							getEntityLabel(extractQidFromClaim(claim) ?? '')
						)
				),
				Promise.all(
					(claims.P162 ?? [])
						.slice(0, 2)
						.map((claim: any) =>
							getEntityLabel(extractQidFromClaim(claim) ?? '')
						)
				),
				Promise.all(
					(claims.P175 ?? [])
						.slice(0, 4)
						.map((claim: any) =>
							getEntityLabel(extractQidFromClaim(claim) ?? '')
						)
				),
				Promise.all(
					(claims.P166 ?? [])
						.slice(0, 3)
						.map((claim: any) =>
							getEntityLabel(extractQidFromClaim(claim) ?? '')
						)
				)
			]);

		const languageQid = extractQidFromClaim(claims.P407?.[0]);
		const language = languageQid ? await getEntityLabel(languageQid) : '';

		const normalizedGenres = genres.filter(Boolean);
		const normalizedLabels = labels.filter(Boolean);
		const normalizedProducers = producers.filter(Boolean);
		const normalizedPersonnel = personnel.filter(Boolean);
		const normalizedAwards = awards.filter(Boolean);

		const facts: string[] = [];
		if (normalizedGenres.length)
			facts.push(`Genres: ${normalizedGenres.join(', ')}`);
		if (normalizedLabels.length)
			facts.push(`Label: ${normalizedLabels.join(', ')}`);
		if (normalizedProducers.length)
			facts.push(`Produced by: ${normalizedProducers.join(', ')}`);
		if (normalizedPersonnel.length)
			facts.push(`Performers: ${normalizedPersonnel.join(', ')}`);
		if (normalizedAwards.length)
			facts.push(`Awards: ${normalizedAwards.join(', ')}`);
		if (language) facts.push(`Language: ${language}`);

		return {
			genres: normalizedGenres,
			label: normalizedLabels[0] ?? '',
			producers: normalizedProducers,
			personnel: normalizedPersonnel,
			awards: normalizedAwards,
			chartPositions: [],
			language,
			wikidataSummary: facts.join('\n')
		};
	} catch (error) {
		console.warn(
			`Wikidata detail lookup failed for ${entityId}: ${String(error)}`
		);
		return emptyDetail();
	}
}
