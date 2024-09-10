import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import './NotFound.scss';
import { errorStatusStore } from '../../store/LoginRegister';

function NotFound() {
	// use the `useRouteError` hook to get the error
	const error = useRouteError();

	// Store
	const statusCode = errorStatusStore((state) => state.statusCode);

	const errorStatusCode = statusCode || 404;

	function getErrorMessage(error: unknown): string {
		if (errorStatusCode === 404) {
			return 'Not found';
		} 
		if (isRouteErrorResponse(error)) {
			return error.statusText;
		}
		if (error instanceof Error) {
			return error.message;
		}
		if (typeof error === 'string') {
			return error;
		}

		return 'Unknown error';
	}

	return (
		<div className="not-found">
			<h1 className="not-found__title">{errorStatusCode}</h1>
			<img className="not-found__img" src="/images/404/404.jpeg" alt="" />
			<p className="not-found__description">Désolé, une erreur inattendue est survenue.</p>
			<p>
				<i className="not-found__error">{getErrorMessage(error)}</i>
			</p>
		</div>
	);
}

export default NotFound;