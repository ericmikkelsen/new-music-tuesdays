/**
 * Looks up an album on Wikidata by artist name + album name.
 * Returns a plain-text summary of whatever facts are available:
 * chart positions, certifications, awards, personnel, recording details.
 * Returns null if no match found — caller should handle gracefully.
 */
export async function getWikidataAlbumFacts(
	artistName: string,
	albumName: string
): Promise<string | null> {
	try {
		const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
			`${albumName} ${artistName}`
		)}&language=en&format=json&type=item&limit=3`;
		const searchRes = await fetch(searchUrl, {
			headers: { 'User-Agent': 'music-feed-demo/1.0' }
		});
		const searchData = (await searchRes.json()) as any;

		if (!searchData.search?.length) return null;

		const entityId = searchData.search[0].id;
		const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${entityId}.json`;
		const entityRes = await fetch(entityUrl, {
			headers: { 'User-Agent': 'music-feed-demo/1.0' }
		});
		const entityData = (await entityRes.json()) as any;
		const entity = entityData.entities?.[entityId];
		if (!entity) return null;

		const claims = entity.claims ?? {};
		const facts: string[] = [];

		async function getLabel(qid: string): Promise<string> {
			try {
				const r = await fetch(
					`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`,
					{ headers: { 'User-Agent': 'music-feed-demo/1.0' } }
				);
				const d = (await r.json()) as any;
				return d.entities?.[qid]?.labels?.en?.value ?? qid;
			} catch {
				return qid;
			}
		}

		if (claims.P136) {
			const genres = await Promise.all(
				claims.P136.slice(0, 3).map((c: any) =>
					getLabel(c.mainsnak?.datavalue?.value?.id)
				)
			);
			if (genres.length)
				facts.push(`Genres: ${genres.filter(Boolean).join(', ')}`);
		}

		if (claims.P264) {
			const labels = await Promise.all(
				claims.P264.slice(0, 2).map((c: any) =>
					getLabel(c.mainsnak?.datavalue?.value?.id)
				)
			);
			if (labels.length)
				facts.push(`Label: ${labels.filter(Boolean).join(', ')}`);
		}

		if (claims.P175) {
			const performers = await Promise.all(
				claims.P175.slice(0, 3).map((c: any) =>
					getLabel(c.mainsnak?.datavalue?.value?.id)
				)
			);
			if (performers.length)
				facts.push(
					`Performers: ${performers.filter(Boolean).join(', ')}`
				);
		}

		if (claims.P162) {
			const producers = await Promise.all(
				claims.P162.slice(0, 2).map((c: any) =>
					getLabel(c.mainsnak?.datavalue?.value?.id)
				)
			);
			if (producers.length)
				facts.push(
					`Produced by: ${producers.filter(Boolean).join(', ')}`
				);
		}

		if (claims.P676) {
			const lyricists = await Promise.all(
				claims.P676.slice(0, 2).map((c: any) =>
					getLabel(c.mainsnak?.datavalue?.value?.id)
				)
			);
			if (lyricists.length)
				facts.push(
					`Lyrics by: ${lyricists.filter(Boolean).join(', ')}`
				);
		}

		if (claims.P577) {
			const date = claims.P577[0]?.mainsnak?.datavalue?.value?.time;
			if (date)
				facts.push(`Released: ${date.replace('+', '').split('T')[0]}`);
		}

		if (claims.P2596) {
			const key = await getLabel(
				claims.P2596[0]?.mainsnak?.datavalue?.value?.id
			);
			if (key) facts.push(`Key: ${key}`);
		}

		if (claims.P166) {
			const awards = await Promise.all(
				claims.P166.slice(0, 3).map((c: any) =>
					getLabel(c.mainsnak?.datavalue?.value?.id)
				)
			);
			if (awards.length)
				facts.push(`Awards: ${awards.filter(Boolean).join(', ')}`);
		}

		if (claims.P407) {
			const langs = await Promise.all(
				claims.P407.slice(0, 2).map((c: any) =>
					getLabel(c.mainsnak?.datavalue?.value?.id)
				)
			);
			if (langs.length)
				facts.push(`Language: ${langs.filter(Boolean).join(', ')}`);
		}

		return facts.length ? facts.join('\n') : null;
	} catch (e) {
		console.warn(`  Wikidata lookup failed for ${albumName}:`, e);
		return null;
	}
}
