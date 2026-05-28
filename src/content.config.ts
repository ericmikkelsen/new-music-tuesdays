import { defineCollection } from 'astro:content';

import { createSanityPageCollectionLoader } from './lib/content/pageCollectionLoader';
import { createSanityPeopleCollectionLoader } from './lib/content/peopleCollectionLoader';
/**
 * Build-time content collections backed by Sanity remote data.
 *
 * This file currently registers the
 * content-layer foundation can be validated before additional document types
 * are introduced.
 */
const pages = defineCollection({
	loader: createSanityPageCollectionLoader()
});

const people = defineCollection({
	loader: createSanityPeopleCollectionLoader()
});
export const collections = { pages, people };
