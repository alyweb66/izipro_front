import { useMutation } from '@apollo/client';
import { VALIDATE_FORGOT_PASSWORD_MUTATION } from '../GraphQL/UserMutations';
import { useState } from 'react';
import validator from 'validator';
import DOMPurify from 'dompurify';
import { useLocation } from 'react-router-dom';
import { changeForgotPasswordStore } from '../../store/UserData';
import { useNavigate } from 'react-router-dom';

import './ForgotPassword.scss';


function ForgotPassword() {
	// Get the token from the URL
	const location = useLocation();
	const token = new URLSearchParams(location.search).get('token');

	// state
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [error, setError] = useState('');

	// store
	const setIsChangePassword = changeForgotPasswordStore((state) => state.setIsChangePassword);

	// mutation
	const [validateForgotPassword, { error: validateForgotPasswordError }] = useMutation(VALIDATE_FORGOT_PASSWORD_MUTATION);

	const navigate = useNavigate();

	const handleSubmitForm = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		// Check if the password and confirm password are the same
		if (password !== confirmPassword) {
			setError('Les mots de passe ne correspondent pas');
			return;
		}

		// Check if the password is strong
		if ((password && !validator.isStrongPassword(password))) {
			setError('Mot de passe faible, doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial');
			return;
		}

		validateForgotPassword({
			variables: {
				input: {
					token: token,
					password: DOMPurify.sanitize(password),
				}
			}
		}).then(() => {
			setIsChangePassword(true);
			navigate('/');

		});

		if (validateForgotPasswordError) {
			throw new Error('Bad request');
		}


	};



	return (
		<div className="forgot-password-container">
			<form action="form" onSubmit={handleSubmitForm}>
				{error && <p className="error-message">{error}</p>}
				<input
					type="password"
					name="password"
					value={password}
					className="input"
					placeholder="Mot de passe"
					onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
					aria-label="Mot de passe"
					maxLength={60}
					required
				/>
				<input
					type="password"
					name="confirmPassword"
					value={confirmPassword}
					className="input"
					placeholder="Confirmer mot de passe"
					onChange={(event: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(event.target.value)}
					aria-label="Confirmer mot de passe"
					maxLength={60}
					required
				/>
				<button className="submit-button" type="submit">Valider</button>
			</form>
		</div>
	);
}

export default ForgotPassword;