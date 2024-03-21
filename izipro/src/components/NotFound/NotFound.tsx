import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import './NotFound.scss';

function NotFound() {
	// use the `useRouteError` hook to get the error
	const error = useRouteError();


	function getErrorMessage(e: unknown): string {
		if (isRouteErrorResponse(e)) {
			return e.statusText;
		}
		if (e instanceof Error) {
			return e.message;
		}
		if (typeof e === 'string') {
			return e;
		}

		return 'Unknown error';
	}

	return (
		<div className="not-found">
			<h1>404</h1>
			<p>Désolé, une erreur inattendue est survenue.</p>
			<p>
				<i>{getErrorMessage(error)}</i>
			</p>
		</div>
	);
}

export default NotFound;