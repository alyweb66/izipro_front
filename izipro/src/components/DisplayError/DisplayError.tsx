import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import './DisplayError.scss';
import { serverErrorStore } from '../../store/LoginRegister';

function DisplayError() {
	// use the `useRouteError` hook to get the error
	const error = useRouteError() as { status: number; statusText: string; };

	// Store
	const [serverErrorStatus, serverErrorText] = serverErrorStore((state) => [state.status, state.statusText]);

	// Function to get the error message
	function getErrorMessage(error: {status: number, statusText: string}): string {
	
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
		<div className="error">
			<h1 className="error__title">{serverErrorStatus || error.status}</h1>
			<img className="error__img" src="/images/error/Error.jpg" alt="" />
			<p className="error__description">Désolé, une erreur inattendue est survenue.</p>
			<p>
				<i className="error__message">{getErrorMessage(error)}</i>
			</p>
		</div>
	);
}

export default DisplayError;