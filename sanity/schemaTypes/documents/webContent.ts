import { defineField } from 'sanity';
import { RICH_TEXT_FIELD_ARGS } from '../objects/componentFields';

import { WEB_PAGE_FIELDS } from '../webPageFields';

/**
 * Portable-text-first web content document type.
 *
 * Use this type for long-form, narrative-style content where a rich body is
 * the primary authoring surface (articles, guides, editorial pages). Unlike
 * `page`, which is structured around reusable block primitives, `webContent`
 * puts a portable text body front and centre with optional supporting metadata.
 */
export const scaffoldPortableTextDocument = {
	type: 'document',
	fields: [
		...Object.values(WEB_PAGE_FIELDS),
		defineField({
			...RICH_TEXT_FIELD_ARGS,
			title: 'Body'
		})
	],
	preview: {
		select: {
			title: 'title',
			subtitle: 'slug.current'
		}
	}
};
