import {
	projectObjectFields,
	SANITY_IMAGE_METADATA_PROJECTION
} from './groqProjections';

/**
 * Canonical query for people documents synced into the Astro content layer.
 */
export const SANITY_PEOPLE_COLLECTION_QUERY = `*[_type == "person" && defined(name)]{
  _id,
  name,
  bio,
	${projectObjectFields('image', SANITY_IMAGE_METADATA_PROJECTION)}
} | order(name asc)`;

export type PersonPortableTextBlock = {
	_type: string;
	[key: string]: unknown;
};

export type PersonImage = {
	src: string;
	alt?: string;
	width: number;
	height: number;
};

export type SanityPersonQueryResult = {
	_id: string;
	name?: string;
	bio?: PersonPortableTextBlock[];
	image?: PersonImage;
};

export type PeopleCollectionEntryData = {
	name: string;
	bio: PersonPortableTextBlock[];
	image: PersonImage;
};

export type PeopleCollectionEntry = {
	id: string;
	data: PeopleCollectionEntryData;
};

/**
 * Maps raw person documents into the normalized Astro content-layer entry shape.
 */
export function mapSanityPersonToCollectionEntry(
	entry: SanityPersonQueryResult
): PeopleCollectionEntry | null {
	if (!entry._id || !entry.name || !entry.image?.src) {
		return null;
	}

	return {
		id: entry._id,
		data: {
			name: entry.name,
			bio: entry.bio ?? [],
			image: {
				src: entry.image.src,
				alt: entry.image.alt,
				width: entry.image.width,
				height: entry.image.height
			}
		}
	};
}
