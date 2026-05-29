import { RocketIcon } from '@sanity/icons';
import { Button, Card, Flex, useToast } from '@sanity/ui';
import type { NavbarProps } from 'sanity';
import { useState } from 'react';

type StudioEnv = Record<string, string | undefined>;

const env = (import.meta as { env?: StudioEnv }).env ?? {};

const siteUrl = (
	env.SANITY_STUDIO_SITE_URL ??
	env.PUBLIC_SITE_URL ??
	''
).replace(/\/+$/u, '');
const actionsToken = env.SANITY_STUDIO_ACTIONS_TOKEN ?? '';

const resolveApiUrl = (path: string): string => {
	if (
		typeof location !== 'undefined' &&
		location.origin.includes('localhost')
	) {
		return path;
	}

	return siteUrl ? `${siteUrl}${path}` : path;
};

async function postStudioAction(path: string): Promise<Response> {
	const headers: Record<string, string> = {
		'content-type': 'application/json'
	};

	if (actionsToken) {
		headers.authorization = `Bearer ${actionsToken}`;
	}

	return fetch(resolveApiUrl(path), {
		method: 'POST',
		headers,
		body: JSON.stringify({}),
		mode: 'cors'
	});
}

export function StudioActionNavbar(props: NavbarProps) {
	const toast = useToast();
	const [deploying, setDeploying] = useState(false);

	const handleDeploy = async () => {
		if (deploying) {
			return;
		}

		setDeploying(true);
		try {
			const response = await postStudioAction(
				'/api/admin/netlify-deploy'
			);
			if (!response.ok) {
				const errorMessage = await response.text();
				throw new Error(errorMessage || 'Deploy trigger failed.');
			}

			toast.push({
				status: 'success',
				title: 'Netlify deploy triggered'
			});
		} catch (error) {
			toast.push({
				status: 'error',
				title: 'Deploy failed',
				description:
					error instanceof Error
						? error.message
						: 'Unexpected deploy error.'
			});
		} finally {
			setDeploying(false);
		}
	};

	return (
		<Card>
			{props.renderDefault(props)}
			<Card padding={2} borderTop>
				<Flex gap={2} justify="flex-end">
					<Button
						icon={RocketIcon}
						mode="ghost"
						text={deploying ? 'Deploying...' : 'Deploy Netlify'}
						onClick={handleDeploy}
						disabled={deploying}
					/>
				</Flex>
			</Card>
		</Card>
	);
}
