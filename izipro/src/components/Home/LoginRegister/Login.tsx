import { Link, useNavigate } from 'react-router-dom';
import { FormEvent, useEffect, useState } from 'react';
import { useMutation } from '@apollo/client';
import { LOGIN_USER_MUTATION } from '../../GraphQL/UserMutations';
import { userIsLoggedStore } from '../../../store/UserData';

import './Login.scss';

function Login() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [activeSession, setActiveSession] = useState(false);
	const [messageError, setMessageError] = useState('');

	const navigate = useNavigate();

	const setIsLogged  = userIsLoggedStore((state) => state.setIsLogged);
	
	const [login, { error }] = useMutation(LOGIN_USER_MUTATION);
	
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
					email,
					password,
					activeSession,
				},
			},
		}).then((response) => {
			if (response.data?.login === true) {
				setIsLogged(true);
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