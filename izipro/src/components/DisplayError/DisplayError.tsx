import { isRouteErrorResponse, useRouteError } from 'react-router';
import './DisplayError.scss';
import { serverErrorStore } from '../../store/LoginRegister';
import { useShallow } from 'zustand/shallow';

function DisplayError() {
	// use the `useRouteError` hook to get the error
	const error = useRouteError() as { status: number; statusText: string; };

	// Store
	const [serverErrorStatus, serverErrorText] = serverErrorStore(useShallow((state) => [state.status, state.statusText]));

	// Function to get the error message
	function getErrorMessage(error: { status: number, statusText: string }): string {

		if (serverErrorStatus) {
			return serverErrorText;
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
		<section className="error" aria-labelledby="error-title" aria-describedby="error-description">
			<header>
				<h1 id="error-title" className="error__title">{serverErrorStatus || error.status}</h1>
			</header>
			<img className="error__img" src="/images/Error.webp" alt="Image d'erreur" />
			<p id="error-description" className="error__description">Désolé, une erreur inattendue est survenue.</p>
			<article>
				<p>
					<i className="error__message">{getErrorMessage(error)}</i>
				</p>
			</article>
		</section>
	);
}

export default DisplayError;