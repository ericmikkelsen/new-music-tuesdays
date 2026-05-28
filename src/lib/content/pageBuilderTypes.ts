import type ImageType from '../../types/image';
import type { Page as SanityPage } from '../../sanity/types';

/**
 * Narrow portable text block representation used by the scaffolded rich-text block.
 */
export type PortableTextBlock = {
	_type: string;
	[key: string]: unknown;
};

type SanityPageBuilderBlock = SanityPage['blocks'][number];

/**
 * Shared rendering settings applied to all block components by the renderer.
 * Controls wrapper element type, heading level, index position, and image priority.
 */
export type BlockSettings = {
	as: 'header' | 'section';
	hLevel: 1 | 2 | 3 | 4 | 5 | 6;
	index: number;
	priority: boolean;
};

export type ArrayPageBuilderBlock =
	| (Omit<
			Extract<SanityPageBuilderBlock, { _type: 'billboard' }>,
			'image'
	  > & {
			image?: ImageType;
	  })
	| Extract<SanityPageBuilderBlock, { _type: 'listScroller' }>
	| (Omit<
			Extract<SanityPageBuilderBlock, { _type: 'peopleRefs' }>,
			'people'
	  > & {
			people?: Array<{ _id: string; name?: string }>;
	  })
	| (Omit<
			Extract<SanityPageBuilderBlock, { _type: 'richText' }>,
			'richText'
	  > & {
			richText?: PortableTextBlock[];
	  });

/**
 * Utility type to derive a specific block shape by `_type` key.
 */
export type ArrayPageBuilderBlockByType<
	TType extends ArrayPageBuilderBlock['_type']
> = Extract<ArrayPageBuilderBlock, { _type: TType }>;
