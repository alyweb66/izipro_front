import { Link, useNavigate } from 'react-router-dom';
import { FormEvent, useEffect, useState } from 'react';
import { useMutation } from '@apollo/client';
import { LOGIN_USER_MUTATION } from '../../GraphQL/UserMutations';
import DOMPurify from 'dompurify';
// @ts-expect-error bcrypt is not typed
import bcrypt from 'bcryptjs';


import './Login.scss';
// secret key for encryption


function Login() {
	// State
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [activeSession, setActiveSession] = useState(false);
	const [messageError, setMessageError] = useState('');



	const navigate = useNavigate();
	
	const [login, { error }] = useMutation(LOGIN_USER_MUTATION);

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
        
		// sanitize input
		const cleanEmail = DOMPurify.sanitize(email);
		const cleanPassword = DOMPurify.sanitize(password);

		login({
			variables: {
				input: {
					email: cleanEmail,
					password: cleanPassword,
					activeSession: activeSession,
				},
			},
		}).then((response) => {
			// if login is successful, redirect to dashboard
			if (response.data?.login === true) {
				const salt = bcrypt.genSaltSync(10);
				const hasheIsLogged = bcrypt.hashSync('true', salt);
				// if user wants to keep the session active, store the hash in local storage
				if (activeSession) {
					localStorage.setItem('ayl', hasheIsLogged);
				} else {
					sessionStorage.setItem('ayl', hasheIsLogged );
				}
				navigate('/dashboard');
			} 
		});

	};

	return (
		<div className='login-container'>
			<p className='title'> Se connecter</p>
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
			<Link to={'/Forgot'} className='link'>Mot de passe oublié?</Link>

		</div>
	);
}

export default Login;