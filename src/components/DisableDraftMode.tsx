import { useIsPresentationTool } from '@sanity/visual-editing/react';

/**
 * Floating "Disable Draft Mode" button shown when the frontend is viewed directly
 * in a browser tab (not inside the Presentation Tool iframe).
 *
 * Must be mounted with `client:only="react"`.
 */
export default function DisableDraftMode() {
	const isPresentationTool = useIsPresentationTool();

	// null = still detecting, true = inside Presentation Tool — hide the button in both cases
	if (isPresentationTool !== false) return null;

	return (
		<a
			href="/api/draft-mode/disable"
			style={{
				position: 'fixed',
				bottom: '1rem',
				right: '1rem',
				zIndex: 50,
				padding: '0.5rem 1rem',
				borderRadius: '9999px',
				backgroundColor: '#101112',
				color: '#fff',
				fontSize: '0.875rem',
				textDecoration: 'none'
			}}
		>
			Disable Draft Mode
		</a>
	);
}
