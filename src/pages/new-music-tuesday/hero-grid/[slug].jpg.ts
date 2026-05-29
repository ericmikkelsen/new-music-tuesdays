import sharp from 'sharp';
import type { APIRoute } from 'astro';
import {
	getNewMusicTuesdayBySlug,
	getNewMusicTuesdayIssues
} from '../../../lib/content/newMusicTuesdayCollection';

const CELL_SIZE = 600;
const OUTPUT_SIZE = CELL_SIZE * 2;
const MAX_IMAGES = 4;

export const prerender = true;

export async function getStaticPaths() {
	const issues = await getNewMusicTuesdayIssues({ preview: false });
	return issues.map((issue) => ({
		params: { slug: issue.slug }
	}));
}

function isHttpUrl(value: string): boolean {
	try {
		const parsed = new URL(value);
		return parsed.protocol === 'http:' || parsed.protocol === 'https:';
	} catch {
		return false;
	}
}

export const GET: APIRoute = async ({ params }) => {
	const slug = params.slug;
	if (!slug) {
		return new Response('Missing slug', { status: 400 });
	}

	const issue = await getNewMusicTuesdayBySlug(slug, { preview: false });
	const heroBlock = issue?.blocks.find(
		(block) => block._type === 'newMusicHeroBlock'
	);
	const images =
		heroBlock?._type === 'newMusicHeroBlock'
			? heroBlock.heroImages
					.map((image) => image.url)
					.filter((url): url is string => Boolean(url))
					.filter(isHttpUrl)
					.slice(0, MAX_IMAGES)
			: [];

	if (images.length !== MAX_IMAGES) {
		return new Response('Expected exactly 4 hero images', { status: 404 });
	}

	try {
		const imageBuffers = await Promise.all(
			images.map(async (imageUrl) => {
				const response = await fetch(imageUrl);
				if (!response.ok) {
					throw new Error(`Failed image fetch: ${response.status}`);
				}
				return Buffer.from(await response.arrayBuffer());
			})
		);

		const composite = await Promise.all(
			imageBuffers.map(async (buffer, index) => ({
				input: await sharp(buffer)
					.resize(CELL_SIZE, CELL_SIZE, { fit: 'cover' })
					.jpeg({ quality: 85 })
					.toBuffer(),
				left: (index % 2) * CELL_SIZE,
				top: Math.floor(index / 2) * CELL_SIZE
			}))
		);

		const output = await sharp({
			create: {
				width: OUTPUT_SIZE,
				height: OUTPUT_SIZE,
				channels: 3,
				background: '#111111'
			}
		})
			.composite(composite)
			.jpeg({ quality: 85 })
			.toBuffer();
		const body = new Uint8Array(output);

		return new Response(body, {
			headers: {
				'Content-Type': 'image/jpeg',
				'Cache-Control': 'public, max-age=31536000, immutable'
			}
		});
	} catch {
		return new Response('Failed to compose hero image', { status: 502 });
	}
};
