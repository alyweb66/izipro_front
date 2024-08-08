import { FormEvent, useEffect, useState } from 'react';

// React Router
import { useNavigate } from 'react-router-dom';

// Apollo Client
import { useMutation } from '@apollo/client';
import { FORGOT_PASSWORD_MUTATION, LOGIN_USER_MUTATION } from '../../GraphQL/UserMutations';

// External libraries
import DOMPurify from 'dompurify';
import validator from 'validator';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Fade from '@mui/material/Fade';
import { MdOutlineVisibility, MdOutlineVisibilityOff } from "react-icons/md";


// State management and stores
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
	const [isLogo, setIsLogo] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

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
			setTimeout(() => {
				setMessageError('');
			}, 15000);
		}
		return () => {
			clearTimeout(timer);
		};
	}, [error]);

	useEffect(() => {
		if (isEmailConfirmed) {
			setMessage('');
		}

		if (message) {
			setIsEmailConfirmed(false);
		}

	}, [isEmailConfirmed, message]);

	// useEffect to check the size of the window
	useEffect(() => {
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

	// send login request
	const handleLogin = (event: FormEvent<HTMLFormElement>) => {
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
					};
					const encodeData = btoa(JSON.stringify(data));
					localStorage.setItem('login', encodeData);
				} else {
					const value = btoa('session');
					localStorage.setItem('login', value);
				}
				setIsChangePassword(false);
				setIsEmailConfirmed(false);
				navigate('/dashboard');
			}
		});

	};

	// send forgot password request
	const handleSubmitForgotPassowd = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		//check if the email is valid
		if (!validator.isEmail(forgotPasswordEmail)) {
			setMessageError('Adresse e-mail invalide');

			setTimeout(() => {
				setMessageError('');
			}, 15000);
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
			setForgotPasswordEmail('');
		});

		if (forgotPasswordError) {
			throw new Error('Bad request');
		}

		//setEmailModal(false);
	};

	return (
		<div className="login-container">
			{isLogo && <div className="login-container__logo">
				<img className='__image' src="/izipro-logo.svg" alt="Izipro logo" />
				<h1 className="__title">POP</h1>
			</div>}
			<p className="login-container__title"> Se connecter</p>
			<div className="message">
				<Stack sx={{ width: '100%' }} spacing={2}>
					{message && (
						<Fade in={!!message} timeout={300}>
							<Alert variant="filled" severity="info">{message}</Alert>
						</Fade>
					)}
				</Stack>
				<Stack sx={{ width: '100%' }} spacing={2}>
					{isChangePassword && (
						<Fade in={!!isChangePassword} timeout={300}>
							<Alert variant="filled" severity="success">Votre mot de passe a été modifié, vous pouvez maintenant vous connecter</Alert>
						</Fade>
					)}
				</Stack>
				<Stack sx={{ width: '100%' }} spacing={2}>
					{isEmailConfirmed && (
						<Fade in={!!isEmailConfirmed} timeout={300}>
							<Alert variant="filled" severity="success">Votre adresse e-mail a été confirmée, vous pouvez maintenant vous connecter</Alert>
						</Fade>
					)}
				</Stack>
			</div>
			<form className="login-container__form" onSubmit={handleLogin}>
				<input
					type="email"
					name="email"
					value={email}
					className="login-container__form input"
					placeholder="Adresse e-mail"
					onChange={(event: React.ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
					aria-label="Adresse e-mail"
					maxLength={50}
					required
				/>
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
					>
						{showPassword ? <MdOutlineVisibilityOff /> : <MdOutlineVisibility />}
					</span>
				</div>

				{/* <TextField
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={password}
                    className="custom-input"
                    placeholder="Mot de passe"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
                    aria-label="Mot de passe"
                    //maxLength={60}
                    required
                    fullWidth
                    margin="normal"
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label="toggle password visibility"
                                    onClick={() => setShowPassword(!showPassword)}
                                    edge="end"
                                >
                                    {showPassword ? <MdOutlineVisibilityOff />: <MdOutlineVisibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
					
                /> */}
				<button type="submit" className='login-container__form button'>Se connecter</button>
			</form>
		{/* 	<button className="show-password" onClick={() => setShowPassword(!showPassword)}>
				{showPassword ? 'Cacher les mots de passe' : 'Afficher les mots de passe'}
			</button> */}
			<div className="message">
				<Stack sx={{ width: '100%' }} spacing={2}>
					{messageError && (
						<Fade in={!!messageError} timeout={300}>
							<Alert variant="filled" severity="error">{messageError}</Alert>
						</Fade>
					)}
				</Stack>
			</div>
			<label className="checkbox-session-container">
				<input
					className="input-checkbox-session"
					checked={activeSession}
					type="checkbox"
					onChange={() => setActiveSession(!activeSession)}
				/>
				<div className="checkmark"></div>
				<span className="active-session">Garder ma session active</span>
			</label>
			<span
				className="link"
				onClick={() => setEmailModal(!emailModal)}
			>
				Mot de passe oublié?</span>
			{emailModal && (
				<div className="email-modal">
					<form className="email-modal__forgot-password-form" onSubmit={handleSubmitForgotPassowd}>
						<label className="email-modal__forgot-password-form label"> Rentrez Votre adresse e-mail pour réinitialiser votre mot de passe

							<input
								type="email"
								name="email"
								value={forgotPasswordEmail}
								className="email-modal__forgot-password-form input"
								placeholder="Adresse e-mail"
								onChange={(event: React.ChangeEvent<HTMLInputElement>) => setForgotPasswordEmail(event.target.value)}
								aria-label="Adresse e-mail"
								maxLength={50}
								required
							/>
						</label>
						<button type="submit" className="email-modal__forgot-password-form button">Valider</button>
					</form>
				</div>
			)}

		</div>
	);
}

export default Login;