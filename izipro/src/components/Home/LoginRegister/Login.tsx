import { useNavigate } from 'react-router-dom';
import { FormEvent, useEffect, useState } from 'react';
import { useMutation } from '@apollo/client';
import { FORGOT_PASSWORD_MUTATION, LOGIN_USER_MUTATION } from '../../GraphQL/UserMutations';
import DOMPurify from 'dompurify';
import validator from 'validator';
import { confirmEmailStore } from '../../../store/LoginRegister';
import { changeForgotPasswordStore } from '../../../store/UserData';


import './Login.scss';
// secret key for encryption


function Login() {

	// State
	const [email, setEmail] = useState('');
	const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
	const [password, setPassword] = useState('');
	const [activeSession, setActiveSession] = useState(false);
	const [messageError, setMessageError] = useState('');
	const [message, setMessage] = useState('');
	const [emailModal, setEmailModal] = useState(false);
	// Store
	const [isEmailConfirmed, setIsEmailConfirmed] = confirmEmailStore((state) => [state.isEmailConfirmed, state.setIsEmailConfirmed]);
	const [isChangePassword, setIsChangePassword] = changeForgotPasswordStore((state) => [state.isChangePassword, state.setIsChangePassword]);
	const navigate = useNavigate();

	// Mutation
	const [login, { error }] = useMutation(LOGIN_USER_MUTATION);
	const [forgotPassword, { error: forgotPasswordError }] = useMutation(FORGOT_PASSWORD_MUTATION);

	// Error login message
	useEffect(() => {
		let timer: number | undefined;
		if (error) {
			setMessageError('Adresse e-mail ou mot de passe incorrect');
			timer = setTimeout(() => {
				setMessageError('');
			}, 5000); // 5000ms = 5s
		}
		return () => {
			clearTimeout(timer);
		};
	}, [error]);
	
	const handleLogin = (event: FormEvent<HTMLFormElement>) =>{
		event.preventDefault();

		login({
			variables: {
				input: {
					email: DOMPurify.sanitize(email),
					password: DOMPurify.sanitize(password),
					activeSession: activeSession,
				},
			},
		}).then((response) => {
			// if login is successful, redirect to dashboard
			if (response.data?.login === true) {
				// if user wants to keep the session active, store the hash in local storage
				if (activeSession) {
					const data = {
						value: 'true',
						expiry: new Date().getTime() + 1*24*60*60*1000, // 24 hours from now
					};
					const encodeData = btoa(JSON.stringify(data));
					localStorage.setItem('chekayl', encodeData);
				} else {
					const value = btoa('session');
					localStorage.setItem('chekayl', value);
				}
				setIsChangePassword(false);
				setIsEmailConfirmed(false);
				navigate('/dashboard');
			} 
		});

	};

	const handleForgotPassword = () => {
	
		setEmailModal(true);
	};

	const handleSubmitForgotPassowd = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		//check if the email is valid
		if (!validator.isEmail(forgotPasswordEmail)) {
			setMessageError('Adresse e-mail invalide');
			return;
		}

		forgotPassword({
			variables: {
				input: {
					email: DOMPurify.sanitize(forgotPasswordEmail),
				},
			},
		}).then((response) => {
			if (response.data?.forgotPassword === true) {
				setMessage('Un e-mail a été envoyé pour réinitialiser votre mot de passe');
			}
		});

		if (forgotPasswordError) {
			throw new Error('Bad request');
		}

		setEmailModal(false);
	};

	return (
		<div className='login-container'>
			<p className='title'> Se connecter</p>
			{message && <p className='login-success'>{message}</p>}
			{isChangePassword && <p className='login-success'>Votre mot de passe a été modifié, vous pouvez maintenant vous connecter</p>}
			{isEmailConfirmed && <p className='login-success'>Votre adresse e-mail a été confirmée, vous pouvez maintenant vous connecter</p>}
			<form className='input-container' onSubmit={handleLogin}>
				<input
					type="email"
					name="email"
					value={email}
					className="input"
					placeholder="Adresse e-mail"
					onChange={(event: React.ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
					aria-label="Adresse e-mail"
					maxLength={50}
					required
				/>
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
				<button type="submit" className='button'>Se connecter</button>
			</form>
			{messageError && <p className='login-error'>{messageError}</p>}
			<label className="checkbox-session-container">
				<input 
					className='input-checkbox-session'
					checked={activeSession} 
					type="checkbox"
					onChange={() => setActiveSession(!activeSession)}
				/>
				<div className="checkmark"></div>
				<span>Garder ma session active</span>
			</label>
			<span 
				className='link' 
				onClick={handleForgotPassword}
			>
				Mot de passe oublié?</span>
			{emailModal && (
				<div className='email-modal'>
					<form className="forgot-password-form" onSubmit={handleSubmitForgotPassowd}>
						<input
							type="email"
							name="email"
							value={forgotPasswordEmail}
							className="input"
							placeholder="Adresse e-mail"
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => setForgotPasswordEmail(event.target.value)}
							aria-label="Adresse e-mail"
							maxLength={50}
							required
						/>
						<button type="submit" className="button">Valider</button>
					</form>
				</div>
			)}

		</div>
	);
}

export default Login;