import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

/**
 * Converts a camelCase or lowercase string to PascalCase.
 * Used for code identifiers such as type names and function names.
 *
 * @param name The identifier to convert (e.g. 'campaign').
 * @returns The PascalCase form (e.g. 'Campaign').
 */
export function toPascalCase(name: string): string {
	return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Converts a human-readable label into a camelCase document type name.
 * Used to derive a default Sanity schema name from a prompt answer.
 *
 * @param label Human-readable string (e.g. 'Campaign Page').
 * @returns camelCase identifier (e.g. 'campaignPage').
 */
export function toDocumentTypeName(label: string): string {
	const words = label.trim().split(/[\s-]+/);
	return words
		.map((word, i) =>
			i === 0
				? word.toLowerCase()
				: word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
		)
		.join('');
}

/**
 * Derives a URL-safe plural path prefix from a camelCase document type name.
 * Splits camelCase into kebab-case and appends 's' unless already plural.
 *
 * @param name camelCase document type name (e.g. 'campaignPage').
 * @returns Kebab-case plural prefix (e.g. 'campaign-pages').
 */
export function toUrlPrefix(name: string): string {
	return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Converts a camelCase document type identifier into a human-readable
 * Studio-facing title shown in the Sanity Studio UI.
 *
 * @param name A camelCase or lowercase document name (e.g. 'landingPage').
 * @returns A spaced, title-cased label (e.g. 'Landing Page').
 */
export function toStudioTitle(name: string): string {
	const spaced = name.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
	return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

// Sanity document type names must start with a lowercase letter and contain
// only alphanumeric characters. This prevents path traversal in generated
// file names, which are derived directly from the user-supplied name.
export const NAME_RE = /^[a-z][a-zA-Z0-9]*$/;

// URL prefixes are restricted to lowercase letters, digits, and hyphens to
// produce clean, slug-safe route paths (e.g. 'my-articles').
export const URL_PREFIX_RE = /^[a-z0-9-]+$/;

/**
 * Validates scaffold CLI inputs before any files are generated.
 * Rejects values that would produce invalid file names or unsafe URL paths.
 *
 * @param name       Sanity document type name (e.g. 'article').
 * @param urlPrefix  URL segment prefix for routes (e.g. 'articles').
 * @throws Error when either value is invalid.
 */
export function validateScaffoldInputs(name: string, urlPrefix: string): void {
	if (!NAME_RE.test(name)) {
		throw new Error(
			'Invalid document type name. Use /^[a-z][a-zA-Z0-9]*$/ (example: article).'
		);
	}

	if (!URL_PREFIX_RE.test(urlPrefix)) {
		throw new Error(
			'Invalid URL prefix. Use /^[a-z0-9-]+$/ (example: articles).'
		);
	}
}

/**
 * Prints the generated file list and copy-pasteable registration instructions
 * that a developer needs to wire the scaffold into existing config files.
 *
 * @param name      Sanity document type name (e.g. 'article').
 * @param urlPrefix URL path prefix for generated routes (e.g. 'articles').
 */
export function printScaffoldGuidance(name: string, urlPrefix: string): void {
	const pascal = toPascalCase(name);
	const pink = '\x1b[95m';
	const reset = '\x1b[0m';
	const previewLinksExample = `
	// Add your new document type to DOCUMENT_ROUTE_PREFIXES for Studio preview button support:
  	const DOCUMENT_ROUTE_PREFIXES: Record<string, string> = {
    	page: '/preview',
    	blog: '/preview/blog',
    	${name}: '/preview/${urlPrefix}', // ← add this line
  	};`;
	console.log(`
✔  Generated 5 files for "${name}".
→  Schema:     sanity/schemaTypes/documents/${name}.ts
→  Collection: src/lib/content/${name}Collection.ts
→  Loader:     src/lib/content/${name}CollectionLoader.ts
→  Route:      src/pages/${urlPrefix}/[slug].astro
→  Preview:    src/pages/preview/${urlPrefix}/[slug].astro

Next — copy and paste these into your config files:

	sanity/schemaTypes/index.ts
${pink}  import { ${name}Type } from './documents/${name}'; // ← add this line
  // add to the types array:
  export const schemaTypes = [..., ${name}Type]; // ← add ${name}Type${reset}

	src/content.config.ts
${pink}  import { create${pascal}CollectionLoader } from './lib/content/${name}CollectionLoader'; // ← add this line
  const ${name} = defineCollection({ loader: create${pascal}CollectionLoader() }); // ← add this line
  export const collections = { ..., ${name} }; // ← add ${name}${reset}

	sanity/previewLinks.ts
${pink}${previewLinksExample}${reset}
	`);
}

/**
 * Opens a readline session for sequential CLI prompts.
 * Caller is responsible for calling `.close()` when all prompts are done.
 *
 * @returns An object with `ask(question)` and `close()`.
 */
export function createPromptSession() {
	const rl = createInterface({ input, output });
	return {
		ask(question: string): Promise<string> {
			return rl.question(question).then((a) => a.trim());
		},
		/**
		 * Prompts with a pre-filled default shown in brackets.
		 * Returns the default when the user presses Enter without typing.
		 */
		askWithDefault(question: string, defaultVal: string): Promise<string> {
			return rl.question(`${question} [${defaultVal}]: `).then((a) => {
				const trimmed = a.trim();
				return trimmed === '' ? defaultVal : trimmed;
			});
		},
		close() {
			rl.close();
		}
	};
}

/**
 * Writes content to a file, creating parent directories as needed.
 *
 * @param filePath Absolute or cwd-relative path for the output file.
 * @param content  File content to write (UTF-8).
 */
export function writeGeneratedFile(filePath: string, content: string): void {
	mkdirSync(dirname(filePath), { recursive: true });
	writeFileSync(filePath, content, 'utf-8');
}
