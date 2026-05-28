import test from 'node:test';
import assert from 'node:assert/strict';

import {
	toPascalCase,
	toStudioTitle,
	toDocumentTypeName,
	toUrlPrefix,
	validateScaffoldInputs,
	printScaffoldGuidance,
	writeGeneratedFile
} from '../scripts/scaffold-utils';
import { mkdirSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// --- toPascalCase ---

test('toPascalCase capitalizes the first letter', () => {
	assert.equal(toPascalCase('campaign'), 'Campaign');
});

test('toPascalCase preserves subsequent characters unchanged', () => {
	assert.equal(toPascalCase('landingPage'), 'LandingPage');
	assert.equal(toPascalCase('a'), 'A');
	assert.equal(toPascalCase('myContentType'), 'MyContentType');
});

// --- toStudioTitle ---

test('toStudioTitle capitalizes a single lowercase word', () => {
	assert.equal(toStudioTitle('article'), 'Article');
});

test('toStudioTitle converts camelCase to spaced title case', () => {
	assert.equal(toStudioTitle('landingPage'), 'Landing Page');
	assert.equal(toStudioTitle('myContentType'), 'My Content Type');
});

// --- toDocumentTypeName ---

test('toDocumentTypeName converts a single word to lowercase', () => {
	assert.equal(toDocumentTypeName('Article'), 'article');
});

test('toDocumentTypeName converts a two-word label to camelCase', () => {
	assert.equal(toDocumentTypeName('Campaign Page'), 'campaignPage');
	assert.equal(toDocumentTypeName('Feature Card'), 'featureCard');
});

test('toDocumentTypeName handles all-lowercase label', () => {
	assert.equal(toDocumentTypeName('blog post'), 'blogPost');
});

// --- toUrlPrefix ---

test('toUrlPrefix appends s to a simple camelCase name', () => {
	assert.equal(toUrlPrefix('article'), 'article');
	assert.equal(toUrlPrefix('guide'), 'guide');
});

test('toUrlPrefix splits camelCase and pluralizes', () => {
	assert.equal(toUrlPrefix('campaignPage'), 'campaign-page');
	assert.equal(toUrlPrefix('blogPost'), 'blog-post');
});

test('toUrlPrefix does not double-append s when name already ends in s', () => {
	assert.equal(toUrlPrefix('articles'), 'articles');
	assert.equal(toUrlPrefix('news'), 'news');
});

// --- validateScaffoldInputs ---

test('validateScaffoldInputs accepts valid name and urlPrefix', () => {
	assert.doesNotThrow(() => validateScaffoldInputs('article', 'articles'));
	assert.doesNotThrow(() =>
		validateScaffoldInputs('myContent', 'my-content')
	);
});

test('validateScaffoldInputs rejects name that starts with uppercase', () => {
	assert.throws(
		() => validateScaffoldInputs('Article', 'articles'),
		/Invalid document type name/
	);
});

test('validateScaffoldInputs rejects name with spaces', () => {
	assert.throws(
		() => validateScaffoldInputs('my article', 'articles'),
		/Invalid document type name/
	);
});

test('validateScaffoldInputs rejects urlPrefix with uppercase', () => {
	assert.throws(
		() => validateScaffoldInputs('article', 'Articles'),
		/Invalid URL prefix/
	);
});

test('validateScaffoldInputs rejects urlPrefix with spaces', () => {
	assert.throws(
		() => validateScaffoldInputs('article', 'my articles'),
		/Invalid URL prefix/
	);
});

// --- printScaffoldGuidance ---

test('printScaffoldGuidance outputs copy-pasteable import lines', () => {
	const lines: string[] = [];
	const originalLog = console.log;
	console.log = (...args: unknown[]) => lines.push(args.join(' '));

	try {
		printScaffoldGuidance('article', 'articles');
	} finally {
		console.log = originalLog;
	}

	const output = lines.join('\n');
	assert.ok(
		output.includes('import { articleType }'),
		'should include schema import'
	);
	assert.ok(
		output.includes('import { createArticleCollectionLoader }'),
		'should include loader import'
	);
	assert.ok(
		output.includes('const article = defineCollection'),
		'should include defineCollection call'
	);
});

test('printScaffoldGuidance uses the correct document name and urlPrefix in file paths', () => {
	const lines: string[] = [];
	const originalLog = console.log;
	console.log = (...args: unknown[]) => lines.push(args.join(' '));

	try {
		printScaffoldGuidance('post', 'blog');
	} finally {
		console.log = originalLog;
	}

	const output = lines.join('\n');
	assert.ok(output.includes('post.ts'), 'should reference post schema file');
	assert.ok(
		output.includes('src/pages/blog/[slug].astro'),
		'should reference blog route'
	);
});

// --- writeGeneratedFile ---

test('writeGeneratedFile writes content to disk', () => {
	const dir = join(tmpdir(), `scaffold-utils-test-${Date.now()}`);
	const filePath = join(dir, 'output.ts');

	try {
		writeGeneratedFile(filePath, 'export const x = 1;\n');
		assert.equal(readFileSync(filePath, 'utf-8'), 'export const x = 1;\n');
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('writeGeneratedFile creates missing parent directories', () => {
	const rootDir = join(tmpdir(), `scaffold-utils-test-${Date.now()}`);
	const dir = join(rootDir, 'nested', 'deep');
	const filePath = join(dir, 'output.ts');

	try {
		writeGeneratedFile(filePath, 'const y = 2;\n');
		assert.ok(existsSync(filePath), 'file should exist after write');
	} finally {
		rmSync(rootDir, { recursive: true, force: true });
	}
});

test('writeGeneratedFile overwrites existing files', () => {
	const dir = join(tmpdir(), `scaffold-utils-test-${Date.now()}`);
	const filePath = join(dir, 'output.ts');

	try {
		mkdirSync(dir, { recursive: true });
		writeGeneratedFile(filePath, 'first\n');
		writeGeneratedFile(filePath, 'second\n');
		assert.equal(readFileSync(filePath, 'utf-8'), 'second\n');
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});
