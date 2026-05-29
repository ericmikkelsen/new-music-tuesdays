import sharp from 'sharp';
import type { APIRoute } from 'astro';

const CELL_SIZE = 600;
const OUTPUT_SIZE = CELL_SIZE * 2;
const MAX_IMAGES = 4;

function isHttpUrl(value: string): boolean {
	try {
		const parsed = new URL(value);
		return parsed.protocol === 'http:' || parsed.protocol === 'https:';
	} catch {
		return false;
	}
}

export const GET: APIRoute = async ({ url }) => {
	const images = url.searchParams
		.getAll('i')
		.map((value) => value.trim())
		.filter((value) => value.length > 0)
		.filter(isHttpUrl)
		.slice(0, MAX_IMAGES);

	if (images.length !== MAX_IMAGES) {
		return new Response('Expected exactly 4 image URLs', { status: 400 });
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

		return new Response(output, {
			headers: {
				'Content-Type': 'image/jpeg',
				'Cache-Control': 'public, max-age=3600'
			}
		});
	} catch {
		return new Response('Failed to compose hero image', { status: 502 });
	}
};
