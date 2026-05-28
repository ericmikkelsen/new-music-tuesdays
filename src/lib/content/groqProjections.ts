/**
 * Reusable field selection for Sanity image asset refs.
 */
export const SANITY_IMAGE_ASSET_REF_FIELDS = `
  asset {
    _ref
  }
`;

/**
 * Reusable field selection for legacy image objects that persist authored dimensions.
 */
export const SANITY_IMAGE_LEGACY_DIMENSION_FIELDS = `
  src,
  alt,
  width,
  height
`;

/**
 * Reusable field projection for native Sanity image uploads.
 * Derives src, width, and height from asset metadata so Sanity schemas only
 * need to store the image asset reference and alt text.
 */
export const SANITY_IMAGE_METADATA_PROJECTION = `
  alt,
  "src": asset->url,
  "width": asset->metadata.dimensions.width,
  "height": asset->metadata.dimensions.height
`;

/**
 * Renders a reusable object projection block for GROQ query strings.
 */
export function projectObjectFields(fieldName: string, fields: string): string {
	return `${fieldName} {\n${fields}\n}`;
}
