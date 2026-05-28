import test from 'node:test';
import assert from 'node:assert/strict';

import { mapSanityPersonToCollectionEntry } from '../src/lib/content/peopleCollection';
import { createSanityPeopleCollectionLoader } from '../src/lib/content/peopleCollectionLoader';
import { schemaTypes } from '../sanity/schemaTypes';

test('mapSanityPersonToCollectionEntry maps valid people records', () => {
	const mapped = mapSanityPersonToCollectionEntry({
		_id: 'person-1',
		name: 'Ada Lovelace',
		bio: [
			{
				_type: 'block'
			}
		],
		image: {
			src: 'https://cdn.sanity.io/images/proj/dataset/ada.jpg',
			alt: 'Portrait of Ada',
			width: 800,
			height: 600
		}
	});

	assert.ok(mapped);
	assert.equal(mapped?.id, 'person-1');
	assert.equal(mapped?.data.name, 'Ada Lovelace');
	assert.equal(
		mapped?.data.image.src,
		'https://cdn.sanity.io/images/proj/dataset/ada.jpg'
	);
	assert.equal(mapped?.data.image.width, 800);
	assert.equal(mapped?.data.image.height, 600);
});

test('mapSanityPersonToCollectionEntry rejects records without required fields', () => {
	const mapped = mapSanityPersonToCollectionEntry({
		_id: 'person-2',
		name: 'Missing image src',
		image: {
			src: '',
			width: 100,
			height: 100
		}
	});

	assert.equal(mapped, null);
});

test('schemaTypes includes person document type', () => {
	const schemaTypeNames = new Set(
		schemaTypes.map((schemaType) => schemaType.name)
	);

	assert.equal(schemaTypeNames.has('person'), true);
});

test('people collection loader is registered with stable loader name', () => {
	const loader = createSanityPeopleCollectionLoader();

	assert.equal(loader.name, 'sanity-people-collection-loader');
});
