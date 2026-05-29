export type SchemaTypeDefinition = Record<string, unknown>;

type SanityRule = {
	required: () => SanityRule;
	min: (_value: number) => SanityRule;
};

export type ValidationBuilder = (rule: SanityRule) => SanityRule;

type BaseSchemaConfig = {
	name?: string;
	title?: string;
	type?: string;
	validation?: ValidationBuilder;
	[key: string]: unknown;
};

/**
 * Lightweight schema helpers used in test/runtime contexts to avoid importing
 * the Sanity Studio package when only plain schema objects are needed.
 */
export const defineType = <T extends BaseSchemaConfig>(config: T): T => config;

export const defineField = <T extends BaseSchemaConfig>(config: T): T => config;

export const defineArrayMember = <T extends BaseSchemaConfig>(config: T): T =>
	config;
