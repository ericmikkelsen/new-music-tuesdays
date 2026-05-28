import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
	createPromptSession,
	NAME_RE,
	toPascalCase,
	toStudioTitle,
	toDocumentTypeName,
	writeGeneratedFile
} from './scaffold-utils';

export type ComponentCategory = 'atoms' | 'molecules' | 'organisms' | 'blocks';
export type ComponentFieldKey =
	| 'heading'
	| 'subheading'
	| 'body'
	| 'link'
	| 'image'
	| 'links'
	| 'cards';
export type ComponentBodyType = 'string' | 'portable';

export const COMPONENT_CATEGORIES: ComponentCategory[] = [
	'atoms',
	'molecules',
	'organisms',
	'blocks'
];

export const DEFAULT_COMPONENT_FIELDS: ComponentFieldKey[] = [
	'heading',
	'subheading',
	'body',
	'link',
	'image',
	'links',
	'cards'
];

export { toPascalCase };

/**
 * Validate the component schema/object name entered in the prompt flow.
 */
export function validateComponentName(name: string): void {
	if (!NAME_RE.test(name)) {
		throw new Error(
			'Invalid component name. Use /^[a-z][a-zA-Z0-9]*$/ (example: featureCard).'
		);
	}
}

/**
 * Validate that the selected component category maps to a known output folder.
 */
export function validateComponentCategory(
	category: string
): asserts category is ComponentCategory {
	if (!COMPONENT_CATEGORIES.includes(category as ComponentCategory)) {
		throw new Error(
			`Invalid component category. Use one of: ${COMPONENT_CATEGORIES.join(', ')}.`
		);
	}
}

/**
 * Validate selected field keys from the yes/no field prompt sequence.
 */
export function validateComponentFields(
	fields: string[]
): asserts fields is ComponentFieldKey[] {
	if (fields.length === 0) {
		throw new Error('Select at least one component field.');
	}

	for (const field of fields) {
		if (!DEFAULT_COMPONENT_FIELDS.includes(field as ComponentFieldKey)) {
			throw new Error(
				`Unsupported component field "${field}". Allowed values: ${DEFAULT_COMPONENT_FIELDS.join(', ')}.`
			);
		}
	}
}

/**
 * Validate body rendering mode for the optional body field.
 */
export function validateComponentBodyType(
	bodyType: string
): asserts bodyType is ComponentBodyType {
	if (bodyType !== 'string' && bodyType !== 'portable') {
		throw new Error('Invalid body type. Use "string" or "portable".');
	}
}

/**
 * Build a Sanity object schema module string based on selected component fields.
 */
export function generateSanityComponentSchema(
	name: string,
	title: string,
	fields: ComponentFieldKey[],
	bodyType: ComponentBodyType
): string {
	const selected = new Set(fields);
	const includesBody = selected.has('body');
	const fieldArgImports: string[] = [];
	const generatedFields: string[] = [];
	let usesDefineField = false;
	let usesDefineArrayMember = false;

	if (selected.has('heading')) {
		fieldArgImports.push('HEADING_FIELD_ARGS');
		generatedFields.push('HEADING_FIELD_ARGS');
	}

	if (selected.has('subheading')) {
		usesDefineField = true;
		generatedFields.push(`defineField({
			name: 'subheading',
			title: 'Subheading',
			type: 'string'
		})`);
	}

	if (includesBody && bodyType === 'string') {
		fieldArgImports.push('BODY_FIELD_ARGS');
		generatedFields.push('BODY_FIELD_ARGS');
	}

	if (includesBody && bodyType === 'portable') {
		fieldArgImports.push('RICH_TEXT_FIELD_ARGS');
		usesDefineField = true;
		generatedFields.push(`defineField({
			...RICH_TEXT_FIELD_ARGS,
			name: 'body',
			title: 'Body'
		})`);
	}

	if (selected.has('link')) {
		fieldArgImports.push('LINK_FIELD_ARGS');
		generatedFields.push('LINK_FIELD_ARGS');
	}

	if (selected.has('image')) {
		fieldArgImports.push('IMAGE_FIELD_ARGS');
		generatedFields.push('IMAGE_FIELD_ARGS');
	}

	if (selected.has('links')) {
		fieldArgImports.push('LINKS_FIELD_ARGS');
		generatedFields.push('LINKS_FIELD_ARGS');
	}

	if (selected.has('cards')) {
		// Keep generated cards self-contained so scaffold output can be used immediately.
		usesDefineField = true;
		usesDefineArrayMember = true;
		fieldArgImports.push(
			'HEADING_FIELD_ARGS',
			'BODY_FIELD_ARGS',
			'LINK_FIELD_ARGS',
			'IMAGE_FIELD_ARGS'
		);
		generatedFields.push(`defineField({
			name: 'cards',
			title: 'Cards',
			type: 'array',
			of: [
				defineArrayMember({
					type: 'object',
					fields: [
						HEADING_FIELD_ARGS,
						BODY_FIELD_ARGS,
						LINK_FIELD_ARGS,
						IMAGE_FIELD_ARGS
					]
				})
			]
		})`);
	}

	const uniqueFieldArgImports = [...new Set(fieldArgImports)];

	const sanityImports = ['defineType'];
	if (usesDefineField) sanityImports.push('defineField');
	if (usesDefineArrayMember) sanityImports.push('defineArrayMember');

	const importLines = [
		`import { ${sanityImports.join(', ')} } from 'sanity';`
	];

	if (uniqueFieldArgImports.length === 1) {
		importLines.push(
			`import { ${uniqueFieldArgImports[0]} } from './componentFields';`
		);
	}

	if (uniqueFieldArgImports.length > 1) {
		// Multi-line import keeps generated output stable under prettier and readable in diffs.
		importLines.push(`import {
	${uniqueFieldArgImports.join(',\n\t')}
} from './componentFields';`);
	}

	const fieldsSource =
		generatedFields.length === 1
			? `[${generatedFields[0]}]`
			: `[
		${generatedFields.join(',\n\t\t')}
	]`;

	return `${importLines.join('\n')}

export const ${name}Type = defineType({
	name: '${name}',
	title: '${title}',
	type: 'object',
	fields: ${fieldsSource}
});
`;
}

/**
 * Build generated Astro component Props interface from selected scaffold fields.
 */
function buildPropsInterface(
	fields: ComponentFieldKey[],
	bodyType: ComponentBodyType
): string {
	const lines: string[] = [];
	const selected = new Set(fields);

	if (selected.has('heading')) {
		lines.push('heading?: string;');
		lines.push('hLevel?: 1 | 2 | 3 | 4 | 5 | 6;');
	}
	if (selected.has('subheading')) lines.push('subheading?: string;');
	if (selected.has('body')) {
		if (bodyType === 'portable') {
			lines.push('body?: Array<Record<string, unknown>>;');
		} else {
			lines.push('body?: string;');
		}
	}
	if (selected.has('link')) lines.push('link?: Link;');
	if (selected.has('image')) lines.push('image?: ImageType;');
	if (selected.has('links')) lines.push('links?: Link[];');
	if (selected.has('cards')) lines.push('cards?: Card[];');
	if (lines.length === 0) lines.push('noop?: boolean;');

	return `interface Props {\n\t${lines.join('\n\t')}\n}`;
}

/**
 * Build optional card type used only when cards are selected.
 */
function buildCardType(hasCards: boolean): string {
	if (!hasCards) return '';

	return `
interface Card {
	heading?: string;
	body?: string;
	link?: Link;
	image?: ImageType;
}
`;
}

/**
 * Resolve Heading import path relative to the generated component directory.
 */
function buildHeadingImport(category: ComponentCategory): string {
	if (category === 'atoms') {
		return "import Heading from './Heading.astro';";
	}

	return "import Heading from '../atoms/Heading.astro';";
}

function buildImageImport(category: ComponentCategory): string {
	if (category === 'atoms') {
		return "import Image from './Image.astro';";
	}

	return "import Image from '../atoms/Image.astro';";
}

/**
 * Build an Astro component module string based on selected fields/body mode/category.
 */
export function generateAstroComponent(
	name: string,
	fields: ComponentFieldKey[],
	bodyType: ComponentBodyType,
	category: ComponentCategory = 'atoms'
): string {
	const selected = new Set(fields);
	const isBlockComponent = category === 'blocks';
	const hasCards = selected.has('cards');
	const needsLink = selected.has('link') || selected.has('links') || hasCards;
	const needsImage = selected.has('image') || hasCards;
	const imports: string[] = [];

	if (selected.has('body') && bodyType === 'portable') {
		imports.push("import { PortableText } from 'astro-portabletext';");
	}
	// Only emit imports for selected capabilities to keep generated files minimal.
	if (selected.has('heading')) {
		imports.push(buildHeadingImport(category));
	}
	if (needsImage) {
		imports.push(buildImageImport(category));
	}
	if (isBlockComponent) {
		imports.push("import BlockWrapper from '../atoms/BlockWrapper.astro';");
	}
	if (needsLink) imports.push("import type Link from '../../types/link';");
	if (needsImage) {
		imports.push("import type ImageType from '../../types/image';");
	}

	const destructure = [
		selected.has('heading') ? 'heading' : null,
		selected.has('subheading') ? 'subheading' : null,
		selected.has('body') ? 'body' : null,
		selected.has('link') ? 'link' : null,
		selected.has('image') ? 'image' : null,
		selected.has('links') ? 'links' : null,
		hasCards ? 'cards' : null
	]
		.filter(Boolean)
		.join(', ');

	const sectionLines: string[] = [];
	if (selected.has('heading')) {
		sectionLines.push(
			'{heading ? <Heading hLevel={hLevel}>{heading}</Heading> : null}'
		);
	}
	if (selected.has('subheading')) {
		sectionLines.push('{subheading ? <p>{subheading}</p> : null}');
	}
	if (selected.has('body') && bodyType === 'portable') {
		sectionLines.push(
			'{body?.length ? <PortableText value={body} /> : null}'
		);
	}
	if (selected.has('body') && bodyType === 'string') {
		sectionLines.push('{body ? <p>{body}</p> : null}');
	}
	if (selected.has('image')) {
		sectionLines.push('{image ? <Image {...image} /> : null}');
	}
	if (selected.has('link')) {
		sectionLines.push('{link ? <a href={link.url}>{link.text}</a> : null}');
	}
	if (selected.has('links')) {
		sectionLines.push(`{
		links?.length ? (
			<ul>
				{links.map((item) => (
					<li>
						<a href={item.url}>{item.text}</a>
					</li>
				))}
			</ul>
		) : null
	}`);
	}
	if (hasCards) {
		sectionLines.push(`{
		cards?.length ? (
			<div>
				{cards.map((card) => (
					<article>
						{card.heading ? <h3>{card.heading}</h3> : null}
						{card.body ? <p>{card.body}</p> : null}
						{card.link ? (
							<a href={card.link.url}>{card.link.text}</a>
						) : null}
						{card.image ? <Image {...card.image} /> : null}
					</article>
				))}
			</div>
		) : null
	}`);
	}

	const sectionContent = sectionLines.join('\n\t');
	const pascal = toPascalCase(name);
	const cardType = buildCardType(hasCards).trim();
	// Blocks keep renderer-controlled semantics via BlockWrapper; others use simple div wrappers.
	const wrapperOpen = isBlockComponent
		? `<BlockWrapper class="${pascal}">`
		: `<div class="${pascal}">`;
	const wrapperClose = isBlockComponent ? '</BlockWrapper>' : '</div>';
	const frontmatterParts: string[] = [];

	if (imports.length > 0) {
		frontmatterParts.push(imports.join('\n'));
	}

	frontmatterParts.push(buildPropsInterface(fields, bodyType));

	if (cardType) {
		frontmatterParts.push(cardType);
	}

	const destructureSource = selected.has('heading')
		? `${destructure}, hLevel = 2`
		: destructure;

	frontmatterParts.push(
		`const { ${destructureSource} } = Astro.props as Props;`
	);

	return `---
${frontmatterParts.join('\n\n')}
---

${wrapperOpen}
	${sectionContent}
${wrapperClose}
`;
}

/**
 * Write generated schema and Astro component files to their canonical locations.
 */
export function writeScaffoldComponentFiles(
	name: string,
	title: string,
	category: ComponentCategory,
	fields: ComponentFieldKey[],
	bodyType: ComponentBodyType
): void {
	const pascal = toPascalCase(name);
	const schemaPath = resolve(`sanity/schemaTypes/objects/${name}.ts`);
	const componentPath = resolve(`src/components/${category}/${pascal}.astro`);

	writeGeneratedFile(
		schemaPath,
		generateSanityComponentSchema(name, title, fields, bodyType)
	);
	writeGeneratedFile(
		componentPath,
		generateAstroComponent(name, fields, bodyType, category)
	);
}

/**
 * Print one-line registration guidance for wiring generated schema exports.
 */
export function printComponentScaffoldGuidance(
	name: string,
	category: ComponentCategory
): void {
	const pascal = toPascalCase(name);
	console.log(
		`Register ${name}Type in sanity/schemaTypes/index.ts via import { ${name}Type } from './objects/${name}'; generated component: src/components/${category}/${pascal}.astro`
	);
}

/**
 * Ask include/exclude prompts for each supported scaffold field key.
 */
async function promptForFields(
	session: ReturnType<typeof createPromptSession>
): Promise<ComponentFieldKey[]> {
	const selected: ComponentFieldKey[] = [];

	for (const field of DEFAULT_COMPONENT_FIELDS) {
		const answer = await session.ask(`Include field "${field}"? (Y/n): `);
		const normalized = answer.toLowerCase();
		if (normalized !== 'n' && normalized !== 'no') {
			selected.push(field);
		}
	}

	return selected;
}

/**
 * Interactive CLI entrypoint that validates prompt input and writes generated files.
 */
async function main(): Promise<void> {
	const session = createPromptSession();

	try {
		const label = await session.ask('Name (e.g. Feature Card): ');
		const defaultName = toDocumentTypeName(label);
		const name = await session.askWithDefault(
			'  Component name',
			defaultName
		);
		validateComponentName(name);

		const categoryInput = await session.askWithDefault(
			`  Category (${COMPONENT_CATEGORIES.join('/')})`,
			'atoms'
		);
		validateComponentCategory(categoryInput);

		const fields = await promptForFields(session);
		validateComponentFields(fields);

		let bodyType: ComponentBodyType = 'portable';
		if (fields.includes('body')) {
			const bodyTypeInput = await session.askWithDefault(
				'  Body type (string/portable)',
				'portable'
			);
			validateComponentBodyType(bodyTypeInput as ComponentBodyType);
			bodyType = bodyTypeInput as ComponentBodyType;
		}

		const title = toStudioTitle(name);
		writeScaffoldComponentFiles(
			name,
			title,
			categoryInput,
			fields,
			bodyType
		);
		printComponentScaffoldGuidance(name, categoryInput);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`Scaffold failed: ${message}`);
		process.exitCode = 1;
	} finally {
		session.close();
	}
}

const isMain =
	process.argv[1] !== undefined &&
	fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMain) {
	main().catch((error) => {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`Scaffold failed: ${message}`);
		process.exitCode = 1;
	});
}
