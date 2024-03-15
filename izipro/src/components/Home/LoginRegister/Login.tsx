import { Link, useNavigate } from 'react-router-dom';
import { FormEvent, useState } from 'react';
import { useMutation } from '@apollo/client';
import { LOGIN_USER_MUTATION } from '../../GraphQL/Mutations';
import './Login.scss';

function Login() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	const navigate = useNavigate();

	
	const [login, { error }] = useMutation(LOGIN_USER_MUTATION);
	
	const handleLogin = (event: FormEvent<HTMLFormElement>) =>{
		event.preventDefault();
        
		login({
			variables: {
				input: {
					email,
					password,
				},
			},
		}).then((response) => {
			console.log(response);
			if (response.data?.login === true) {
				console.log('logged in');
				navigate('/dashboard');
			}
		});

		if (error) {
			console.log(error);
		}
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
			<Link to={'/Forgot'} className='link'>Mot de passe oublié?</Link>

		</div>
	);
}

export default Login;