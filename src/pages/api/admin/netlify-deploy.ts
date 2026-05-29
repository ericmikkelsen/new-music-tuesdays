import type { APIRoute } from 'astro';

const ACTIONS_TOKEN = import.meta.env.SANITY_STUDIO_ACTIONS_TOKEN;
const NETLIFY_BUILD_HOOK_URL = import.meta.env.NETLIFY_BUILD_HOOK_URL;
const IS_DEV = import.meta.env.DEV;

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const isAuthorized = (request: Request): boolean => {
	if (IS_DEV && !ACTIONS_TOKEN) {
		return true;
	}

	if (!ACTIONS_TOKEN) {
		return false;
	}

	const authHeader = request.headers.get('authorization') ?? '';
	return authHeader === `Bearer ${ACTIONS_TOKEN}`;
};

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		headers: corsHeaders
	});
};

export const POST: APIRoute = async ({ request }) => {
	if (!IS_DEV && !ACTIONS_TOKEN) {
		return new Response('Missing SANITY_STUDIO_ACTIONS_TOKEN', {
			status: 500,
			headers: corsHeaders
		});
	}

	if (!isAuthorized(request)) {
		return new Response('Unauthorized', {
			status: 401,
			headers: corsHeaders
		});
	}

	if (!NETLIFY_BUILD_HOOK_URL) {
		return new Response('Missing NETLIFY_BUILD_HOOK_URL', {
			status: 500,
			headers: corsHeaders
		});
	}

	const response = await fetch(NETLIFY_BUILD_HOOK_URL, {
		method: 'POST'
	});

	if (!response.ok) {
		const details = await response.text();
		return new Response(details || 'Netlify deploy hook failed', {
			status: 502,
			headers: corsHeaders
		});
	}

	return new Response('Deploy triggered', {
		status: 200,
		headers: corsHeaders
	});
};
