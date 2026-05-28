import { createClient } from '@sanity/client';
import { getItunesAlbumData } from './itunes';
import {
	getRecentWikidataAlbums,
	setWikidataReferenceDate,
	getWikidataAlbumDetail,
	type WikidataAlbum,
	type WikidataAlbumDetail
} from './wikidata';

function parseSeedDateFromArgs(argv: string[]): Date {
	const args = argv.slice(2);
	const dateFlag = args.find((arg) => arg.startsWith('--date='));
	const dateFromFlag = dateFlag ? dateFlag.split('=')[1] : undefined;
	const positionalDate = args.find((arg) => !arg.startsWith('--'));
	const rawDate = dateFromFlag || positionalDate;

	if (!rawDate) {
		return new Date();
	}

	if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
		throw new Error(`Invalid date format: "${rawDate}". Use YYYY-MM-DD.`);
	}

	const parsed = new Date(`${rawDate}T00:00:00Z`);
	if (Number.isNaN(parsed.getTime())) {
		throw new Error(`Invalid date value: "${rawDate}".`);
	}

	return parsed;
}

const sanity = createClient({
	projectId: process.env.PUBLIC_SANITY_PROJECT_ID!,
	dataset: process.env.PUBLIC_SANITY_DATASET ?? 'production',
	apiVersion:
		process.env.SANITY_API_VERSION ??
		process.env.PUBLIC_SANITY_API_VERSION ??
		'2026-04-09',
	token: process.env.SANITY_API_TOKEN!,
	useCdn: false
});

const sanityAgent = sanity.withConfig({ apiVersion: 'vX' });

// Set SANITY_AGENT_SCHEMA_ID from `sanity schema deploy` output.
const SCHEMA_ID = process.env.SANITY_AGENT_SCHEMA_ID;

function toSlug(str: string): string {
	return str
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
}

function resolveAlbumTitle(wikidataTitle: string, itunesTitle: string): string {
	const cleanWikidataTitle = (wikidataTitle ?? '').trim();
	const cleanItunesTitle = (itunesTitle ?? '').trim();

	if (!cleanItunesTitle) {
		return cleanWikidataTitle;
	}

	const looksLikeQid = /^Q\d{5,}$/i.test(cleanWikidataTitle);
	const hasDisambiguationSuffix = /\(album\)$/i.test(cleanWikidataTitle);
	const hasRawEntityPrefix = /^Q\d{5,}\b/.test(cleanWikidataTitle);

	if (looksLikeQid || hasDisambiguationSuffix || hasRawEntityPrefix) {
		return cleanItunesTitle;
	}

	return cleanWikidataTitle;
}

function normalizeTitleForKey(title: string): string {
	return title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}

function getFirstSentence(text: string): string {
	return (text ?? '').split(/[.!?]/)[0]?.trim() ?? '';
}

function getLeadingTwoWordKey(text: string): string {
	const words = getFirstSentence(text)
		.toLowerCase()
		.match(/[a-z0-9']+/g);

	if (!words || words.length < 2) return '';
	return `${words[0]} ${words[1]}`;
}

function getFollowingMondayStart(referenceDate: Date): Date {
	const monday = new Date(referenceDate);
	monday.setHours(0, 0, 0, 0);
	const dayOfWeek = monday.getDay();
	const rawDaysUntilMonday = (8 - dayOfWeek) % 7;
	const daysUntilMonday = rawDaysUntilMonday === 0 ? 7 : rawDaysUntilMonday;
	monday.setDate(monday.getDate() + daysUntilMonday);
	return monday;
}

function isAfterFollowingMonday(
	releaseDate: string,
	referenceDate: Date
): boolean {
	if (!releaseDate) return false;

	const parsed = new Date(releaseDate);
	if (Number.isNaN(parsed.getTime())) return false;
	const followingMonday = getFollowingMondayStart(referenceDate);
	return parsed.getTime() >= followingMonday.getTime();
}

function scoreCandidate(candidate: {
	detail: WikidataAlbumDetail;
	itunes: { trackCount: number; primaryGenre: string };
}): number {
	return (
		candidate.detail.awards.length * 2 +
		candidate.detail.personnel.length +
		candidate.detail.producers.length +
		candidate.detail.genres.length +
		(candidate.itunes.trackCount > 0 ? 1 : 0) +
		(candidate.itunes.primaryGenre ? 1 : 0)
	);
}

function buildHeroFallbackDescription(top4: ProcessedRelease[]): string {
	const styles = top4
		.map(
			({ detail, itunes }) =>
				detail.genres[0] || itunes.primaryGenre || 'contemporary'
		)
		.filter(Boolean)
		.slice(0, 4);

	if (!styles.length) {
		return "Four strong releases made this week's cut, each with enough detail to support specific, opinionated reviews.";
	}

	return `From ${styles.join(', ')}, this set has real stylistic spread without feeling random.`;
}

function buildAlbumReviewFallbackBody({
	albumTitle,
	artistName,
	genres,
	detail,
	label,
	itunesTrackCount
}: {
	albumTitle: string;
	artistName: string;
	genres: string[];
	detail: WikidataAlbumDetail;
	label: string;
	itunesTrackCount: number;
}): string {
	const genreLine = genres.length
		? `${albumTitle} is currently categorized as ${genres.join(', ')}.`
		: `${albumTitle} has limited genre metadata in the current source set.`;

	const personnelLine = detail.personnel.length
		? `Credited performers include ${detail.personnel.join(', ')}.`
		: `Performer metadata is limited beyond ${artistName}.`;

	const contextLine = `The release is listed on ${label || 'an unspecified label'} with ${itunesTrackCount || 'an unknown number of'} tracks.`;

	return `${genreLine} ${personnelLine} ${contextLine}`;
}

function buildAllowedSonicImagery(genres: string[]): string[] {
	if (!genres.length) {
		return ['imagery directly tied to listed factual metadata only'];
	}

	return genres.map(
		(genre) =>
			`imagery explicitly tied to ${genre.toLowerCase()} descriptors`
	);
}

type ApprovedEvaluativeClaim = {
	claim: string;
	why: string;
};

function buildApprovedEvaluativeClaims({
	resolvedTitle,
	artistName,
	genres,
	label,
	itunesTrackCount,
	detail
}: {
	resolvedTitle: string;
	artistName: string;
	genres: string[];
	label: string;
	itunesTrackCount: number;
	detail: WikidataAlbumDetail;
}): ApprovedEvaluativeClaim[] {
	const claims: ApprovedEvaluativeClaim[] = [];
	const hasSparseIndustrySignals =
		detail.awards.length === 0 && detail.producers.length === 0;

	if (genres.length) {
		claims.push({
			claim: 'Genre-constrained framing',
			why: `Genres listed are ${genres.join(', ')} with no conflicting genre tags in current metadata.`
		});
	}

	if (itunesTrackCount > 0 && itunesTrackCount <= 12) {
		claims.push({
			claim: 'Compact-scope framing',
			why: `Track count is ${itunesTrackCount}, which supports a tighter-scope framing.`
		});
	}

	if (label && label.toLowerCase().includes(artistName.toLowerCase())) {
		claims.push({
			claim: 'In-house imprint framing',
			why: `Label (${label}) includes the artist name (${artistName}), indicating direct imprint alignment.`
		});
	}

	if (hasSparseIndustrySignals) {
		claims.push({
			claim: 'Low-prestige-signaling framing',
			why: 'No producers or awards are currently listed, so claims of high-gloss crossover push are unsupported.'
		});
	}

	if (!claims.length) {
		claims.push({
			claim: 'Cautious framing only',
			why: 'Available metadata is limited, so cautious framing is the most supportable editorial stance.'
		});
	}

	return claims.slice(0, 4);
}

async function uploadImageFromUrl(
	url: string,
	filename: string
): Promise<string> {
	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`Image upload source request failed (${res.status})`);
	}

	const buffer = Buffer.from(await res.arrayBuffer());
	const asset = await sanity.assets.upload('image', buffer, {
		filename,
		contentType: 'image/jpeg'
	});
	return asset._id;
}

async function deleteDraftIfExists(documentId: string) {
	try {
		await sanity.delete(`drafts.${documentId}`);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		if (
			message.includes('Not found') ||
			message.includes('document not found')
		) {
			return;
		}
		throw error;
	}
}

function buildEditorialThesisCandidates({
	album,
	resolvedTitle,
	detail,
	genres,
	label,
	itunesTrackCount
}: {
	album: WikidataAlbum;
	resolvedTitle: string;
	detail: WikidataAlbumDetail;
	genres: string[];
	label: string;
	itunesTrackCount: number;
}): string[] {
	const theses: string[] = [];

	if (itunesTrackCount > 0 && itunesTrackCount <= 4) {
		theses.push(
			`- High-confidence thesis: Treat this as a concise statement release with tightly scoped intent. Evidence: iTunes track count is ${itunesTrackCount}.`
		);
	} else if (itunesTrackCount > 4) {
		theses.push(
			`- High-confidence thesis: Treat this as a full release with room for sequencing and arc. Evidence: iTunes track count is ${itunesTrackCount}.`
		);
	} else {
		theses.push(
			'- High-confidence thesis: Focus on artistic positioning and context over sequencing claims. Evidence: no reliable track count metadata was returned.'
		);
	}

	if (genres.length) {
		theses.push(
			`- Medium-confidence thesis: Frame the review around scene adjacency and style boundaries. Evidence: genres include ${genres.join(', ')}.`
		);
	} else {
		theses.push(
			'- Medium-confidence thesis: Keep genre framing cautious and avoid overclassification. Evidence: no clear genre tags were returned.'
		);
	}

	if (
		detail.awards.length ||
		detail.personnel.length ||
		detail.producers.length
	) {
		const evidence = [
			detail.awards.length
				? `awards: ${detail.awards.slice(0, 3).join(', ')}`
				: '',
			detail.personnel.length
				? `performers: ${detail.personnel.slice(0, 4).join(', ')}`
				: '',
			detail.producers.length
				? `producers: ${detail.producers.slice(0, 2).join(', ')}`
				: ''
		]
			.filter(Boolean)
			.join('; ');
		theses.push(
			`- Medium-confidence thesis: Anchor the review in authorship and cultural footprint rather than sonic guesswork. Evidence: ${evidence}.`
		);
	}

	theses.push(
		`- Guardrail thesis: If the evidence feels thin, write narrowly about release framing, language, and institutional context. Evidence: title=${resolvedTitle}, label=${label || 'unknown'}, language=${detail.language || 'unknown'}, release date=${album.releaseDate}.`
	);

	return theses;
}

function buildAlbumReviewShowYourWork({
	album,
	resolvedTitle,
	detail,
	genres,
	allowedSonicImagery,
	approvedEvaluativeClaims,
	label,
	itunesTrackCount,
	itunesUrl
}: {
	album: WikidataAlbum;
	resolvedTitle: string;
	detail: WikidataAlbumDetail;
	genres: string[];
	allowedSonicImagery: string[];
	approvedEvaluativeClaims: ApprovedEvaluativeClaim[];
	label: string;
	itunesTrackCount: number;
	itunesUrl: string;
}): string {
	const theses = buildEditorialThesisCandidates({
		album,
		resolvedTitle,
		detail,
		genres,
		label,
		itunesTrackCount
	});

	const assumptions = [
		'Release selection uses Wikidata recency as the primary gate and iTunes album match as the cover-art gate.',
		genres.length
			? `Genre framing is grounded in Wikidata/iTunes metadata: ${genres.join(', ')}.`
			: 'Genre framing is constrained because genre tags were sparse.',
		detail.personnel.length
			? `Personnel context can be referenced as factual scaffolding: ${detail.personnel.slice(0, 4).join(', ')}.`
			: 'Personnel context was limited, so claims about collaborative dynamics should stay conservative.',
		detail.wikidataSummary
			? 'Wikidata returned structured factual context suitable for grounding review claims.'
			: 'Wikidata detail was sparse; keep prose specific and modest.'
	];

	return [
		`Data collected for ${resolvedTitle} by ${album.artistName}`,
		'',
		'Sources and endpoints used:',
		'- Wikidata SPARQL recent albums query (release-date constrained).',
		`- Wikidata entity detail: Special:EntityData/${album.entityId}.json`,
		'- iTunes Search API: /search?entity=album',
		'',
		'Raw metadata worth considering:',
		`- Wikidata entity: ${album.entityId}`,
		`- Resolved album title: ${resolvedTitle}`,
		`- Release date: ${album.releaseDate || 'Unknown'}`,
		`- Label: ${label || 'Unknown'}`,
		`- Track count: ${itunesTrackCount || 0}`,
		`- Genres: ${genres.join(', ') || 'None returned'}`,
		`- Producers: ${detail.producers.join(', ') || 'None returned'}`,
		`- Personnel: ${detail.personnel.join(', ') || 'None returned'}`,
		`- Awards: ${detail.awards.join(', ') || 'None returned'}`,
		`- Language: ${detail.language || 'Unknown'}`,
		`- iTunes URL: ${itunesUrl || 'Unavailable'}`,
		'',
		'Wikidata / factual context:',
		detail.wikidataSummary ||
			'No additional Wikidata summary lines were available.',
		'',
		'Sonic imagery policy for this draft:',
		`- Allowed (genre-derived): ${allowedSonicImagery.join(', ')}`,
		'- Any sonic image in the body must map to this list.',
		'- If a sonic phrase is outside this list, it should not appear.',
		'',
		'Approved evaluative claims (with rationale):',
		...approvedEvaluativeClaims.map(
			(item, idx) =>
				`- [${idx + 1}] ${item.claim}\n  Why supported: ${item.why}`
		),
		'- Any interpretive phrase in the body should map to one of the numbered claims above.',
		'',
		'Editorial thesis candidates:',
		...theses,
		'',
		'Editorial assumptions and cautions:',
		...assumptions.map((assumption) => `- ${assumption}`),
		'',
		'How the body draft should use this:',
		'- Choose one primary thesis and optionally one secondary thesis from the list above.',
		'- Keep the draft specific to available facts; avoid invented sonic detail.',
		'- Do not mention Wikidata, iTunes, APIs, or internal reporting notes in published copy.',
		'- Treat this note as editorial scaffolding, not prose to publish.'
	].join('\n');
}

type ProcessedRelease = {
	album: WikidataAlbum;
	resolvedTitle: string;
	artistNames: string[];
	detail: WikidataAlbumDetail;
	itunes: NonNullable<Awaited<ReturnType<typeof getItunesAlbumData>>>;
	docId: string;
};

type CandidateRelease = {
	album: WikidataAlbum;
	resolvedTitle: string;
	artistNames: string[];
	detail: WikidataAlbumDetail;
	itunes: NonNullable<Awaited<ReturnType<typeof getItunesAlbumData>>>;
	docId: string;
};

async function seedMusic() {
	const seedDate = parseSeedDateFromArgs(process.argv);
	const seedDateStr = seedDate.toISOString().split('T')[0];

	if (!SCHEMA_ID) {
		throw new Error(
			'Missing SANITY_AGENT_SCHEMA_ID. Run `PUBLIC_SANITY_PROJECT_ID=8qgw9chp PUBLIC_SANITY_DATASET=production npx sanity schema deploy` and copy the returned schema ID into .env as SANITY_AGENT_SCHEMA_ID.'
		);
	}

	setWikidataReferenceDate(seedDate);

	console.log(
		`Fetching recent albums from Wikidata (reference date ${seedDateStr})...`
	);
	let wikidataAlbums = await getRecentWikidataAlbums(7);

	if (wikidataAlbums.length === 0) {
		console.log(
			'No albums found in 7-day window. Retrying with 14 days...'
		);
		wikidataAlbums = await getRecentWikidataAlbums(14);
	}

	if (wikidataAlbums.length === 0) {
		console.log(
			'No albums found in 14-day window. Retrying with 30 days...'
		);
		wikidataAlbums = await getRecentWikidataAlbums(30);
	}

	console.log(`Found ${wikidataAlbums.length} albums on Wikidata`);

	const candidateReleases: CandidateRelease[] = [];

	for (const album of wikidataAlbums) {
		if (isAfterFollowingMonday(album.releaseDate, seedDate)) {
			console.log(`  Skipping after next Monday window: ${album.title}`);
			continue;
		}

		const existingDocId = await sanity.fetch(
			`*[_type == "musicRelease" && wikidataId == $id][0]._id`,
			{ id: album.entityId }
		);

		console.log(
			existingDocId
				? `  Re-evaluating existing: ${album.title} by ${album.artistName}`
				: `  Evaluating new: ${album.title} by ${album.artistName}`
		);

		const [detail, itunes] = await Promise.all([
			getWikidataAlbumDetail(album.entityId),
			getItunesAlbumData(album.artistName, album.title)
		]);

		if (!itunes) {
			console.log(`  Skipping (no iTunes match): ${album.title}`);
			continue;
		}

		const resolvedTitle = resolveAlbumTitle(album.title, itunes.albumName);
		const existingIndex = candidateReleases.findIndex(
			(candidate) =>
				(normalizeTitleForKey(candidate.resolvedTitle) ===
					normalizeTitleForKey(resolvedTitle) ||
					normalizeTitleForKey(candidate.itunes.albumName || '') ===
						normalizeTitleForKey(itunes.albumName || '')) &&
				candidate.album.releaseDate === album.releaseDate
		);

		if (existingIndex >= 0) {
			const existing = candidateReleases[existingIndex];
			const mergedArtists = Array.from(
				new Set([...existing.artistNames, album.artistName])
			);
			const incomingCandidate: CandidateRelease = {
				album,
				resolvedTitle,
				artistNames: mergedArtists,
				detail,
				itunes,
				docId: existing.docId
			};

			const best =
				scoreCandidate(incomingCandidate) > scoreCandidate(existing)
					? incomingCandidate
					: { ...existing, artistNames: mergedArtists };

			candidateReleases[existingIndex] = {
				...best,
				artistNames: mergedArtists
			};
			console.log(
				`  Merged duplicate album candidate: ${resolvedTitle} (${mergedArtists.join(', ')})`
			);
			await new Promise((resolve) => setTimeout(resolve, 250));
			continue;
		}

		candidateReleases.push({
			album,
			resolvedTitle,
			artistNames: [album.artistName],
			detail,
			itunes,
			docId: existingDocId ?? `wikidata-album-${album.entityId}`
		});
		await new Promise((resolve) => setTimeout(resolve, 400));
	}

	if (candidateReleases.length === 0) {
		console.log('No new releases processed.');
		return;
	}

	const top4Candidates = [...candidateReleases]
		.sort((a, b) => {
			const scoreA =
				a.detail.awards.length * 2 + a.detail.personnel.length;
			const scoreB =
				b.detail.awards.length * 2 + b.detail.personnel.length;
			return scoreB - scoreA;
		})
		.slice(0, 4);

	const top4: ProcessedRelease[] = [];

	for (const candidate of top4Candidates) {
		const { album, resolvedTitle, artistNames, detail, itunes, docId } =
			candidate;
		const displayArtistName = artistNames.join(', ');
		const genres = detail.genres.length
			? detail.genres
			: itunes.primaryGenre
				? [itunes.primaryGenre]
				: [];
		const label = detail.label || itunes.label || '';

		await deleteDraftIfExists(docId);

		await sanity.createOrReplace({
			_type: 'musicRelease',
			_id: docId,
			title: resolvedTitle,
			slug: {
				_type: 'slug',
				current: toSlug(`${resolvedTitle}-${displayArtistName}`)
			},
			artistName: displayArtistName,
			wikidataId: album.entityId,
			releaseDate: album.releaseDate,
			coverArt: itunes.coverArt,
			genres,
			label,
			trackCount: itunes.trackCount,
			producers: detail.producers,
			personnel: detail.personnel,
			awards: detail.awards,
			wikidataSummary: detail.wikidataSummary,
			itunesUrl: itunes.itunesUrl,
			featuredPick: false,
			publishedAt: seedDate.toISOString()
		});

		top4.push({
			album,
			resolvedTitle,
			artistNames,
			detail,
			itunes,
			docId
		});
	}

	const now = seedDate;
	const dateStr = seedDateStr;
	const nmtTitle = `New Music Tuesday ${dateStr}`;
	const nmtSlug = `new-music-tuesday-${dateStr}`;
	const nmtId = `nmt-${dateStr}`;
	const heroBlockKey = `hero-${dateStr}`;

	console.log(`\nBuilding New Music Tuesday: ${nmtTitle}`);

	console.log('  Uploading hero images...');
	const heroImageAssets = await Promise.all(
		top4.map(async ({ itunes }, i) => {
			const assetId = await uploadImageFromUrl(
				itunes.coverArt,
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
	const albumReviews = top4.map(
		({ album, resolvedTitle, artistNames, detail, itunes, docId }) => {
			const displayArtistName = artistNames.join(', ');
			const genres = detail.genres.length
				? detail.genres
				: itunes.primaryGenre
					? [itunes.primaryGenre]
					: [];
			const allowedSonicImagery = buildAllowedSonicImagery(genres);
			const label = detail.label || itunes.label || '';
			const approvedEvaluativeClaims = buildApprovedEvaluativeClaims({
				resolvedTitle,
				artistName: displayArtistName,
				genres,
				label,
				itunesTrackCount: itunes.trackCount,
				detail
			});
			const showYourWork = buildAlbumReviewShowYourWork({
				album,
				resolvedTitle,
				detail,
				genres,
				allowedSonicImagery,
				approvedEvaluativeClaims,
				label,
				itunesTrackCount: itunes.trackCount,
				itunesUrl: itunes.itunesUrl
			});

			return {
				_type: 'albumReviewBlock',
				_key: `review-${album.entityId}`,
				body: buildAlbumReviewFallbackBody({
					albumTitle: resolvedTitle,
					artistName: displayArtistName,
					genres,
					detail,
					label,
					itunesTrackCount: itunes.trackCount
				}),
				showYourWork,
				musicRelease: { _type: 'reference', _ref: docId }
			};
		}
	);
	const fallbackBodyByReviewKey = new Map<string, string>(
		albumReviews.map((block) => [block._key, block.body ?? ''])
	);

	const heroBlock = {
		_type: 'newMusicHeroBlock',
		_key: heroBlockKey,
		heading: nmtTitle,
		description: buildHeroFallbackDescription(top4),
		heroImages: heroImageAssets
	};

	await deleteDraftIfExists(nmtId);
	await sanity.createOrReplace({
		_type: 'newMusicTuesday',
		_id: nmtId,
		title: nmtTitle,
		slug: { _type: 'slug', current: nmtSlug },
		publishedAt: now.toISOString(),
		blocks: [heroBlock, ...albumReviews]
	});

	console.log('  NMT document created. Firing Agent Actions...');

	const heroAlbumContext = top4
		.map(({ resolvedTitle, artistNames, detail, itunes }) => {
			const displayArtistName = artistNames.join(', ');
			const genres = detail.genres.length
				? detail.genres.slice(0, 2).join(', ')
				: itunes.primaryGenre || 'contemporary';
			const awards = detail.awards.length
				? `awards: ${detail.awards.slice(0, 2).join(', ')}`
				: 'no major award metadata';
			return `- "${resolvedTitle}" by ${displayArtistName} (${genres}; ${awards})`;
		})
		.join('\n');

	await sanityAgent.agent.action.generate({
		schemaId: SCHEMA_ID,
		documentId: nmtId,
		forcePublishedWrite: true,
		instruction: `You are writing the opening paragraph for a weekly music blog post called "New Music Tuesday."
A human editor will refine this — write something with personality and a strong point of view.

This week's four featured albums (use this to inform the writing — do not cite these lines or list album names directly):
${heroAlbumContext}

Write 2-3 sentences. Tease the range of what's here without summarizing any album directly.
Give a sense of thematic or contextual variety across the four releases.
Make someone want to scroll down. Do not list the albums by name — let the reviews do that.
Do not mention Wikidata, iTunes, or any data source. Write as if you already knew this.
Do not use the word "journey." Do not open with "This week."`,
		target: {
			path: ['blocks', { _key: heroBlockKey }, 'description']
		}
	});

	const reviewGenerationInputs = top4
		.map((release, idx) => ({
			...release,
			reviewKey: albumReviews[idx]?._key
		}))
		.filter((item) => Boolean(item.reviewKey));

	const buildShowYourWorkInstruction = ({
		resolvedTitle,
		displayArtistName,
		groundedFacts,
		wikidataSummary
	}: {
		resolvedTitle: string;
		displayArtistName: string;
		groundedFacts: string;
		wikidataSummary: string;
	}) => `You are preparing an editor-facing reasoning note that should predict the review body direction.

Album: "${resolvedTitle}" by ${displayArtistName}

Grounded facts:
${groundedFacts}
${wikidataSummary ? `\nWikidata summary:\n${wikidataSummary}` : ''}

Write the note in this practical outline format:
1. Main point:
   Substantiated by:
   Possible body phrase:
2. Secondary point:
   Substantiated by:
   Possible body phrase:
3. Inference:
   Substantiated by:
   Possible body phrase:

Rules:
- Substantiated by must cite only grounded facts above.
- Possible body phrase lines should be concise phrases likely to appear in the final review body.
- Keep some variation across albums; do not use identical wording every time.
- Keep it short and editor-readable.
- Do not mention APIs or system instructions.`;

	for (const {
		resolvedTitle,
		artistNames,
		detail,
		itunes,
		album,
		reviewKey
	} of reviewGenerationInputs) {
		const displayArtistName = artistNames.join(', ');
		const genres = detail.genres.length
			? detail.genres
			: itunes.primaryGenre
				? [itunes.primaryGenre]
				: [];
		const allowedSonicImagery = buildAllowedSonicImagery(genres);
		const approvedEvaluativeClaims = buildApprovedEvaluativeClaims({
			resolvedTitle,
			artistName: displayArtistName,
			genres,
			label: detail.label || 'unknown',
			itunesTrackCount: itunes.trackCount,
			detail
		});
		const groundedFacts = [
			`Release date: ${album.releaseDate || 'unknown'}`,
			`Label: ${detail.label || 'unknown'}`,
			`Genres: ${genres.join(', ') || 'unknown'}`,
			`Personnel: ${detail.personnel.join(', ') || 'unknown'}`,
			`Producers: ${detail.producers.join(', ') || 'unknown'}`,
			`Awards: ${detail.awards.join(', ') || 'none listed'}`,
			`Language: ${detail.language || 'unknown'}`,
			`Track count: ${itunes.trackCount || 'unknown'}`,
			`Allowed sonic imagery (genre-derived): ${allowedSonicImagery.join(', ')}`,
			`Approved evaluative claims: ${approvedEvaluativeClaims
				.map(
					(item, idx) =>
						`[${idx + 1}] ${item.claim} (why: ${item.why})`
				)
				.join(' | ')}`
		].join('\n');

		await sanityAgent.agent.action.generate({
			schemaId: SCHEMA_ID,
			documentId: nmtId,
			forcePublishedWrite: true,
			instruction: buildShowYourWorkInstruction({
				resolvedTitle,
				displayArtistName,
				groundedFacts,
				wikidataSummary: detail.wikidataSummary
			}),
			target: {
				path: ['blocks', { _key: reviewKey }, 'body']
			}
		});

		await new Promise((resolve) => setTimeout(resolve, 150));
	}

	const reviewNotesByKey = new Map<string, string>();
	for (const {
		resolvedTitle,
		artistNames,
		detail,
		itunes,
		album,
		reviewKey
	} of reviewGenerationInputs) {
		const displayArtistName = artistNames.join(', ');
		const genres = detail.genres.length
			? detail.genres
			: itunes.primaryGenre
				? [itunes.primaryGenre]
				: [];
		const allowedSonicImagery = buildAllowedSonicImagery(genres);
		const approvedEvaluativeClaims = buildApprovedEvaluativeClaims({
			resolvedTitle,
			artistName: displayArtistName,
			genres,
			label: detail.label || 'unknown',
			itunesTrackCount: itunes.trackCount,
			detail
		});
		const groundedFacts = [
			`Release date: ${album.releaseDate || 'unknown'}`,
			`Label: ${detail.label || 'unknown'}`,
			`Genres: ${genres.join(', ') || 'unknown'}`,
			`Personnel: ${detail.personnel.join(', ') || 'unknown'}`,
			`Producers: ${detail.producers.join(', ') || 'unknown'}`,
			`Awards: ${detail.awards.join(', ') || 'none listed'}`,
			`Language: ${detail.language || 'unknown'}`,
			`Track count: ${itunes.trackCount || 'unknown'}`,
			`Allowed sonic imagery (genre-derived): ${allowedSonicImagery.join(', ')}`,
			`Approved evaluative claims: ${approvedEvaluativeClaims
				.map(
					(item, idx) =>
						`[${idx + 1}] ${item.claim} (why: ${item.why})`
				)
				.join(' | ')}`
		].join('\n');

		let latestBody =
			(await sanity.fetch(
				`*[_id == $id][0].blocks[_type == "albumReviewBlock" && _key == $key][0].body`,
				{ id: nmtId, key: reviewKey }
			)) ?? '';

		const fallbackBody = fallbackBodyByReviewKey.get(reviewKey) ?? '';
		if (!latestBody.trim() || latestBody.trim() === fallbackBody.trim()) {
			console.log(
				`  Retrying show-your-work generation for ${resolvedTitle} (${displayArtistName})`
			);
			await sanityAgent.agent.action.generate({
				schemaId: SCHEMA_ID,
				documentId: nmtId,
				forcePublishedWrite: true,
				instruction: buildShowYourWorkInstruction({
					resolvedTitle,
					displayArtistName,
					groundedFacts,
					wikidataSummary: detail.wikidataSummary
				}),
				target: {
					path: ['blocks', { _key: reviewKey }, 'body']
				}
			});
			await new Promise((resolve) => setTimeout(resolve, 250));
			latestBody =
				(await sanity.fetch(
					`*[_id == $id][0].blocks[_type == "albumReviewBlock" && _key == $key][0].body`,
					{ id: nmtId, key: reviewKey }
				)) ?? latestBody;
		}

		reviewNotesByKey.set(reviewKey, latestBody || fallbackBody);
	}

	const generatedBlocks = await sanity.fetch(`*[_id == $id][0].blocks`, {
		id: nmtId
	});
	const blocksWithReviewNotes = (generatedBlocks ?? []).map((block: any) => {
		if (block?._type !== 'albumReviewBlock') return block;
		const generatedNote = reviewNotesByKey.get(block._key) ?? '';
		return {
			...block,
			showYourWork:
				generatedNote || block.body || block.showYourWork || ''
		};
	});

	await sanity.patch(nmtId).set({ blocks: blocksWithReviewNotes }).commit();

	const openingDirectives = [
		'Sentence 1 should open with release scope and format (length, framing, or intended audience).',
		'Sentence 1 should open with editorial positioning (where this sits in its lane).',
		'Sentence 1 should open with production/context signals from the reasoning note.',
		'Sentence 1 should open with market framing (niche vs crossover posture).'
	];
	const reviewContextByKey = new Map<
		string,
		{ resolvedTitle: string; displayArtistName: string; reviewNote: string }
	>();

	for (const [
		index,
		{ resolvedTitle, artistNames, reviewKey }
	] of reviewGenerationInputs.entries()) {
		const displayArtistName = artistNames.join(', ');
		const fallbackReview = albumReviews.find(
			(item) => item._key === reviewKey
		);
		const reviewNote =
			blocksWithReviewNotes?.find((item: any) => item?._key === reviewKey)
				?.showYourWork ??
			fallbackReview?.showYourWork ??
			'';
		reviewContextByKey.set(reviewKey, {
			resolvedTitle,
			displayArtistName,
			reviewNote
		});
		const openingDirective =
			openingDirectives[index % openingDirectives.length];

		await sanityAgent.agent.action.generate({
			schemaId: SCHEMA_ID,
			documentId: nmtId,
			forcePublishedWrite: true,
			instruction: `You are writing a first-draft album review for a music blog.

Album: "${resolvedTitle}" by ${displayArtistName}

Use this editor reasoning note as your only source of direction:
${reviewNote}

Rules:
- Reuse at least one phrase from a "Possible body phrase" line.
- A little crafted deviation is allowed, but keep the same core claim/evidence relationships from the note.
- Keep interpretive language aligned with the note's substantiation lines.
- If the note is sparse, keep the body modest and factual.
- Do not invent claims that are not implied by the note.
- Avoid repetitive lead-ins. Do not start sentence one with: "Built", "Leaning", "Leaning into", "Across", or "Despite".
- ${openingDirective}

Write 3 sentences (4 max) with natural rhythm.
Do not open with the album or artist name.
Do not mention Wikidata, iTunes, APIs, or internal notes.`,
			target: {
				path: ['blocks', { _key: reviewKey }, 'body']
			}
		});

		await new Promise((resolve) => setTimeout(resolve, 200));
	}

	const generatedBodies =
		(await sanity.fetch(
			`*[_id == $id][0].blocks[_type == "albumReviewBlock"]{_key, body}`,
			{ id: nmtId }
		)) ?? [];
	const leadGroups = new Map<string, string[]>();

	for (const block of generatedBodies) {
		const leadKey = getLeadingTwoWordKey(block?.body ?? '');
		if (!leadKey) continue;
		const current = leadGroups.get(leadKey) ?? [];
		current.push(block._key);
		leadGroups.set(leadKey, current);
	}

	const duplicateReviewKeys = new Set<string>();
	const disallowedLeadKeys: string[] = [];
	for (const [leadKey, keys] of leadGroups.entries()) {
		if (keys.length <= 1) continue;
		disallowedLeadKeys.push(leadKey);
		for (const key of keys.slice(1)) {
			duplicateReviewKeys.add(key);
		}
	}

	if (duplicateReviewKeys.size > 0) {
		console.log(
			`  Regenerating ${duplicateReviewKeys.size} review(s) due to repeated opening phrases...`
		);
	}

	for (const reviewKey of duplicateReviewKeys) {
		const context = reviewContextByKey.get(reviewKey);
		if (!context) continue;

		await sanityAgent.agent.action.generate({
			schemaId: SCHEMA_ID,
			documentId: nmtId,
			forcePublishedWrite: true,
			instruction: `You are rewriting a first-draft album review opening to avoid duplicate lead phrasing across this issue.

Album: "${context.resolvedTitle}" by ${context.displayArtistName}

Use this editor reasoning note as your only source of direction:
${context.reviewNote}

Rules:
- Keep the same claim/evidence relationships from the reasoning note.
- Reuse at least one phrase from a "Possible body phrase" line.
- The first sentence must start with a different two-word opening than these: ${disallowedLeadKeys.join(', ')}.
- Do not start sentence one with: "Built", "Leaning", "Leaning into", "Across", or "Despite".
- Keep the review to 3 sentences (4 max) and natural rhythm.
- Do not open with the album or artist name.
- Do not mention Wikidata, iTunes, APIs, or internal notes.`,
			target: {
				path: ['blocks', { _key: reviewKey }, 'body']
			}
		});

		await new Promise((resolve) => setTimeout(resolve, 200));
	}

	console.log(
		'\nDone. Check Studio in ~1 minute for generated content and images.'
	);
	console.log(`New Music Tuesday URL: /new-music-tuesday/${dateStr}/`);
}

seedMusic().catch(console.error);
