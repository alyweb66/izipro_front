import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Apollo Client
import { useMutation } from '@apollo/client';
import { VALIDATE_FORGOT_PASSWORD_MUTATION } from '../GraphQL/UserMutations';

// External libraries
import validator from 'validator';
import DOMPurify from 'dompurify';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Fade from '@mui/material/Fade';
import { MdOutlineVisibility, MdOutlineVisibilityOff } from "react-icons/md";

// State management and stores
import { changeForgotPasswordStore } from '../../store/UserData';


import './ForgotPassword.scss';


function ForgotPassword() {
	// Get the token from the URL
	const location = useLocation();
	const token = new URLSearchParams(location.search).get('token');

	// state
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [error, setError] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isLogo, setIsLogo] = useState(false);

	// store
	const setIsChangePassword = changeForgotPasswordStore((state) => state.setIsChangePassword);

	// mutation
	const [validateForgotPassword, { error: validateForgotPasswordError }] = useMutation(VALIDATE_FORGOT_PASSWORD_MUTATION);

	const navigate = useNavigate();

	// useEffect to check the size of the window
	useEffect(() => {
	
		if (!token) {

			navigate('/', { replace: true });
		}
		const handleResize = () => {
			if (window.innerWidth < 480) {
				setIsLogo(true);
			} else {
				setIsLogo(false);
			}
		};

		// add event listener to check the size of the window
		window.addEventListener('resize', handleResize);

		// 	call the function to check the size of the window
		handleResize();

		// remove the event listener when the component unmount
		return () => window.removeEventListener('resize', handleResize);
	}, []); 

	const handleSubmitForm = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		event.stopPropagation();

		// Check if the password and confirm password are the same
		if (password !== confirmPassword) {
			setError('Les mots de passe ne correspondent pas');
			setTimeout(() => {
				setError('');
			},15000);
			return;
		}

		// Check if the password is strong
		if ((password && !validator.isStrongPassword(password))) {
			setError('Mot de passe faible, doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial');
			setTimeout(() => {
				setError('');
			},15000);
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
			navigate('/', { replace: true });

		});

		if (validateForgotPasswordError) {
			throw new Error('Bad request');
		}


	};

	return (
		<div className="forgot-password-container">
			{isLogo && <div className="login-container__logo">
				<img className='__image' src="/logos/izipro-logo.svg" alt="Izipro logo" />
				<h1 className="__title">POP</h1>
			</div>}
			<form className="forgot-password-container__form" onSubmit={handleSubmitForm} aria-label="Formulaire de réinitialisation de mot de passe">
				<h1 className="forgot-password-container__form__title">Réinitialisez votre mot de passe</h1>
				<h2 className="forgot-password-container__form__subtitle">Veuillez rentrer votre nouveau mot de passe (8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial )</h2>
				<div className="show-password">
							<input
								type={showPassword ? 'text' : 'password'}
								name="password"
								value={password}
								className="__input"
								placeholder="Mot de passe"
								onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
								aria-label="Mot de passe"
								maxLength={60}
								required
							/>
							<span
								className="toggle-password-icon"
								onClick={() => setShowPassword(!showPassword)}
								aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
							>
								{showPassword ? <MdOutlineVisibilityOff /> : <MdOutlineVisibility />}
							</span>
						</div>
						<div className="show-password">
							<input
								type={showConfirmPassword ? 'text' : 'password'}
								name="confirmPassword"
								value={confirmPassword}
								className="__input"
								placeholder="Confirmer mot de passe"
								onChange={(event: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(event.target.value)}
								aria-label="Confirmer le mot de passe"
								maxLength={60}
								required
							/>
							<span
								className="toggle-password-icon"
								onClick={() => setShowConfirmPassword(!showConfirmPassword)}
								aria-label={showConfirmPassword ? "Masquer la confirmation du mot de passe" : "Afficher la confirmation du mot de passe"}
							>
								{showConfirmPassword ? <MdOutlineVisibilityOff /> : <MdOutlineVisibility />}
							</span>
						</div>
				<div className="message">
							<Stack sx={{ width: '100%' }} spacing={2}>
								{error && (
									<Fade in={!!error} timeout={300}>
										<Alert variant="filled" severity="error">{error}</Alert>
									</Fade>
								)}
							</Stack>
						</div>
				<button className="forgot-password-container__form__button" type="submit">Valider</button>
			</form>
		</div>
	);
}

export default ForgotPassword;