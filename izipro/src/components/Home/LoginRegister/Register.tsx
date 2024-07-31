import { useState } from 'react';

// Apollo Client
import { useMutation } from '@apollo/client';
import { REGISTER_USER_MUTATION, REGISTER_PRO_USER_MUTATION } from '../../GraphQL/UserMutations';

// External libraries
import validator from 'validator';
import DOMPurify from 'dompurify';

// Styles
import './Register.scss';



function Register() {
	const [email, setEmail] = useState('');
	const [proEmail, setProEmail] = useState('');
	const [password, setPassword] = useState('');
	const [proPassword, setProPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [proConfirmPassword, setProConfirmPassword] = useState('');
	const [siret, setSiret] = useState('');
	const [error, setError] = useState('');
	const [isRegisterVisible, setIsRegisterVisible] = useState(false);
	const [userCreated, setUserCreated] = useState(false);
	const [isProError, setIsProError] = useState('');
	const [proCreated, setProCreated] = useState(false);
  
	// function to toggle the visibility of the register form
	const toggleRegisterVisibility = () => {
		setIsRegisterVisible(!isRegisterVisible);
	};

	// Mutation to register a user
	const [createUser, { error: userError }] = useMutation(REGISTER_USER_MUTATION);
	const [createProUser, { error: proUserError}] = useMutation(REGISTER_PRO_USER_MUTATION);

	// function to handle the registration of a pro user
	const handleProRegister = (event: React.FormEvent<HTMLFormElement>) => {
		// reset the state
		setUserCreated(false);
		setError('');

		event.preventDefault();

		// Check if the email is valid
		if (proEmail && !validator.isEmail(proEmail)) {
			setIsProError('Adresse e-mail invalide');
			return;
		}
    
		// Check if the password and confirm password are the same
		if (proPassword && (proPassword !== proConfirmPassword)) {
			setIsProError('Les mots de passe ne correspondent pas');
			return;
		}
    
		// Check if the password is strong
		if (proPassword && !validator.isStrongPassword(proPassword)) {
			setIsProError('Mot de passe faible, doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial');
			return;
		}
 
		// Check if the siret is valid
		if (siret && siret.length !== 14) {
			setIsProError('Siret invalide');
			return;
		}

		createProUser({
			variables: {
				input: {
					email: DOMPurify.sanitize(proEmail),
					password: DOMPurify.sanitize(proPassword),
					siret: Number(DOMPurify.sanitize(siret))
				}
			}
		}).then((response) => {
			
			if (response.data.createProUser.id) {
				setProCreated(true);
			} 
			setProEmail('');
			setProPassword('');
			setProConfirmPassword('');
			setSiret('');
			setIsProError('');
		});

		// handle errors
		if (proUserError) {
			setIsProError('Erreur lors de la création de l\'utilisateur');
			throw new Error('Submission error!');
		}
   
	};

	// function to handle the registration of a user
	const handleRegister = (event: React.FormEvent<HTMLFormElement>) => {
		// reset the state
		setUserCreated(false);
		setError('');

		event.preventDefault();

		// Check if the email is valid
		if (email && !validator.isEmail(email)) {
			setError('Adresse e-mail invalide');
			return;
		}
    
		// Check if the password and confirm password are the same
		if (password !== confirmPassword) {
			setError('Les mots de passe ne correspondent pas');
			return;
		}

		// Check if the password is strong
		if (password && !validator.isStrongPassword(password)) {
			setError('Mot de passe faible, doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial');
			return;
		}
 
		createUser({ 
			variables: {
				input: {
					email: DOMPurify.sanitize(email),
					password: DOMPurify.sanitize(password)
				}
			}
		}).then((response) => {

			if (response.data.createUser.id) {
				setUserCreated(true);
			} 
			setEmail('');
			setPassword('');
			setConfirmPassword('');
			setError('');
		});
					
		// handle errors
		if (userError) {
			setError('Erreur lors de la création de l\'utilisateur');
			throw new Error('Submission error!');
		} 
   
	};

	return (
		<div className="register-container" >
			<p className="register-container title" ><span onClick={toggleRegisterVisibility}> Créer un compte </span></p>
			{isRegisterVisible && (
				<div className="register-container__form">
					<form className="register-container__form__form" onSubmit={(event) => handleRegister(event)}>
						<p className="register-container__form__form category">Particulier</p>
						<input
							type="email"
							name="email"
							value={email}
							className="register-container__form__form input"
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
							className="register-container__form__form input"
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
							className="register-container__form__form input"
							placeholder="Confirmer mot de passe"
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(event.target.value)}
							aria-label="Confirmer mot de passe"
							maxLength={60}
							required
						/>
						{userCreated && <p className="success">Utilisateur créé avec succès, un email de validation vous a été envoyé </p>}
						{error && <p className="error">{error}</p>}
						<button type="submit" className="register-container__form__form button">Enregistrer</button>
					</form>
					<form className="register-container__form__form" onSubmit={(event) => handleProRegister(event)}>
						<p className="register-container__form__form category">Professionnel</p>
						<input
							type="email"
							name="email"
							value={proEmail}
							className="register-container__form__form input"
							placeholder="Adresse e-mail"
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => setProEmail(event.target.value)}
							aria-label="Adresse e-mail"
							maxLength={50}
							required
						/>
						<input
							type="password"
							name="password"
							value={proPassword}
							className="register-container__form__form input"
							placeholder="Mot de passe"
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => setProPassword(event.target.value)}
							aria-label="Mot de passe"
							maxLength={60}
							required
						/>
						<input
							type="password"
							name="confirmPassword"
							value={proConfirmPassword}
							className="register-container__form__form input"
							placeholder="Confirmer mot de passe"
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => setProConfirmPassword(event.target.value)}
							aria-label="Confirmer mot de passe"
							maxLength={60}
							required
						/>
						<input
							type="siret"
							name="siret"
							value={siret}
							className="register-container__form__form input"
							placeholder="Siret (14 chiffres)"
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSiret(event.target.value)}
							aria-label="siret"
							maxLength={14}
							required
						/>
						{proCreated && <p className="success">Utilisateur créé avec succès, un email de validation vous a été envoyé </p>}
						{isProError && <p className="error">{isProError}</p>}
						<button type="submit" className="register-container__form__form button">Enregistrer</button>
					</form>
				</div>
			)}
		</div>
	);
}

export default Register;