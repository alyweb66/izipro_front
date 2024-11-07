import { useState } from 'react';

// Apollo Client
import { useMutation } from '@apollo/client';
import { REGISTER_USER_MUTATION, REGISTER_PRO_USER_MUTATION } from '../../GraphQL/UserMutations';

// External libraries
import validator from 'validator';
import DOMPurify from 'dompurify';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Fade from '@mui/material/Fade';
import { MdOutlineVisibility, MdOutlineVisibilityOff } from "react-icons/md";
import { motion, AnimatePresence } from 'framer-motion';

// Styles
import './Register.scss';
import Spinner from '../../Hook/Spinner';

type RegisterProps = {
	loginVisibility: boolean;
	setLoginVisibility: (value: boolean) => void;
}


function Register({ setLoginVisibility, loginVisibility }: RegisterProps) {
	// State
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
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [showProPassword, setShowProPassword] = useState(false);
	const [showProConfirmPassword, setShowProConfirmPassword] = useState(false);


	// function to toggle the visibility of the register form
	const toggleRegisterVisibility = () => {
		setIsRegisterVisible(!isRegisterVisible);
	};


	// Mutation to register a user
	const [createUser, { loading: userLoading, error: userError }] = useMutation(REGISTER_USER_MUTATION, {
	/* 	onError: (error) => {
			console.error('Error in mutation:', error);
			setError(error.message || 'Une erreur est survenue');
			// Si tu souhaites déclencher une autre action après la capture
		}, */
	});
	const [createProUser, { loading: proUserLoading, error: proUserError }] = useMutation(REGISTER_PRO_USER_MUTATION);

	// function to handle the registration of a pro user
	const handleProRegister = async (event: React.FormEvent<HTMLFormElement>) => {
		// reset the state
		setUserCreated(false);
		setError('');
		setIsProError('');

		event.preventDefault();

		// Check if the email is valid
		if (proEmail && !validator.isEmail(proEmail)) {
			setIsProError('Adresse e-mail invalide');
			setTimeout(() => {
				setIsProError('');
			}, 15000);
			return;
		}

		// Check if the password and confirm password are the same
		if (proPassword && (proPassword !== proConfirmPassword)) {
			setIsProError('Les mots de passe ne correspondent pas');
			setTimeout(() => {
				setIsProError('');
			}, 15000);
			return;
		}

		// Check if the password is strong
		if (proPassword && !validator.isStrongPassword(proPassword)) {
			setIsProError('Mot de passe faible, doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial');
			setTimeout(() => {
				setIsProError('');
			}, 15000);
			return;
		}

		// Check if the siret is valid
		if (siret && siret.length !== 14) {
			setIsProError('Siret invalide');
			setTimeout(() => {
				setIsProError('');
			}, 15000);
			return;
		}

		try {
			createProUser({
				variables: {
					input: {
						email: DOMPurify.sanitize(proEmail),
						password: DOMPurify.sanitize(proPassword),
						siret: Number(DOMPurify.sanitize(siret))
					}
				}
			}).then((response) => {
				if (response?.errors && response?.errors?.length > 0) {
					setIsProError('Erreur lors de la création de l\'utilisateur');
					setTimeout(() => {
						setIsProError('');
					}, 15000);
				}
				if (response.data.createProUser.__typename === 'ExistingSiret') {
					setIsProError('Erreur de SIRET');
				}
				if (response.data.createProUser.id) {
					setProCreated(true);
					setProEmail('');
					setProPassword('');
					setProConfirmPassword('');
					setSiret('');
					setIsProError('');
				}
			});
			if (proUserError) {
				setIsProError('Erreur lors de la création de l\'utilisateur');
				setTimeout(() => {
					setIsProError('');
				}, 15000);
			}


		} catch (error) {
			// handle errors
			setIsProError('Erreur lors de la création de l\'utilisateur');
			throw new Error('Submission error!');
		}

	};

	// function to handle the registration of a user
	const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
		// reset the state
		setUserCreated(false);
		setError('');
		setIsProError('');

		event.preventDefault();

		// Check if the email is valid
		if (email && !validator.isEmail(email)) {
			setError('Adresse e-mail invalide');
			setTimeout(() => {
				setError('');
			}, 15000);
			return;
		}

		// Check if the password and confirm password are the same
		if (password !== confirmPassword) {
			setError('Les mots de passe ne correspondent pas');
			setTimeout(() => {
				setError('');
			}, 15000);
			return;
		}

		// Check if the password is strong
		if (password && !validator.isStrongPassword(password)) {
			setError('Mot de passe faible, doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial');
			setTimeout(() => {
				setError('');
			}, 15000);
			return;
		}

		try {
			//setUserRegisterLoading(true);
			createUser({
				variables: {
					input: {
						email: DOMPurify.sanitize(email),
						password: DOMPurify.sanitize(password)
					}
				}
			}).then((response) => {
				
				if (response?.errors && response?.errors?.length > 0) {
					setError('Erreur lors de la création de l\'utilisateur');
					setTimeout(() => {
						setError('');
					}, 15000);
				}

				if (response.data.createUser.id) {
					setUserCreated(true);
				}
				setEmail('');
				setPassword('');
				setConfirmPassword('');
				setError('');
				//setUserRegisterLoading(false);
			})

			if (userError) {
				setError('Erreur lors de la création de l\'utilisateur');
				setTimeout(() => {
					setError('');
				}, 15000);
			}


		} catch (error) {
			setError('Erreur lors de la création de l\'utilisateur');
			setTimeout(() => {
				setError('');
			}, 15000);
		}
	};


	return (
		<div className="register-container" >
			<p className="register-container title" ><span onClick={() => { toggleRegisterVisibility(); (window.innerWidth < 480 && setLoginVisibility(!loginVisibility)); }}> Créer un compte </span></p>
			<AnimatePresence>
				{isRegisterVisible && (
					<motion.div
						className="register-container__form"
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.1, type: 'tween' } }}
						transition={{ duration: 0.1, type: 'tween' }}
					>
						<form className="register-container__form__form" onSubmit={(event) => handleRegister(event)}>
							{(userLoading) && <Spinner />}
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
							<div className="show-password">
								<input
									type={showConfirmPassword ? 'text' : 'password'}
									name="confirmPassword"
									value={confirmPassword}
									className="__input"
									placeholder="Confirmer mot de passe"
									onChange={(event: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(event.target.value)}
									aria-label="Confirmer mot de passe"
									maxLength={60}
									required
								/>
								<span
									className="toggle-password-icon"
									onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
								<Stack sx={{ width: '100%' }} spacing={2}>
									{userCreated && (
										<Fade in={!!userCreated} timeout={300}>
											<Alert variant="filled" severity="success">Utilisateur créé avec succès, un email de validation vous a été envoyé (pas de mail? vérifiez vos spams)</Alert>
										</Fade>
									)}
								</Stack>
							</div>
							<button type="submit" className="register-container__form__form button">Enregistrer</button>
						</form>
						<form className="register-container__form__form" onSubmit={(event) => handleProRegister(event)}>
							{(proUserLoading) && <Spinner />}
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

							<div className="show-password">
								<input
									type={showProPassword ? 'text' : 'password'}
									name="password"
									value={proPassword}
									className="__input"
									placeholder="Mot de passe"
									onChange={(event: React.ChangeEvent<HTMLInputElement>) => setProPassword(event.target.value)}
									aria-label="Mot de passe"
									maxLength={60}
									required
								/>
								<span
									className="toggle-password-icon"
									onClick={() => setShowProPassword(!showProPassword)}
								>
									{showProPassword ? <MdOutlineVisibilityOff /> : <MdOutlineVisibility />}
								</span>
							</div>
							<div className="show-password">
								<input
									type={showProConfirmPassword ? 'text' : 'password'}
									name="confirmPassword"
									value={proConfirmPassword}
									className="__input"
									placeholder="Confirmer le mot de passe"
									onChange={(event: React.ChangeEvent<HTMLInputElement>) => setProConfirmPassword(event.target.value)}
									aria-label="Confirmer le mot de passe"
									maxLength={60}
									required
								/>
								<span
									className="toggle-password-icon"
									onClick={() => setShowProConfirmPassword(!showProConfirmPassword)}
								>
									{showProConfirmPassword ? <MdOutlineVisibilityOff /> : <MdOutlineVisibility />}
								</span>
							</div>
							<input
								type="siret"
								name="siret"
								value={siret}
								className="register-container__form__form input siret"
								placeholder="Siret (14 chiffres)"
								onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSiret(event.target.value.replace(/\s+/g, ''))}
								aria-label="Siret"
								maxLength={14}
								required
							/>
							<div className="message" style={{ marginBottom: '1rem' }}>
								<Stack sx={{ width: '100%' }} spacing={2}>
									{isProError && (
										<Fade in={!!isProError} timeout={300}>
											<Alert variant="filled" severity="error">{isProError}</Alert>
										</Fade>
									)}
								</Stack>
								<Stack sx={{ width: '100%' }} spacing={2}>
									{proCreated && (
										<Fade in={!!proCreated} timeout={300}>
											<Alert variant="filled" severity="success">Utilisateur créé avec succès, un email de validation vous a été envoyé</Alert>
										</Fade>
									)}
								</Stack>
							</div>
							<button type="submit" className="register-container__form__form button pro">Enregistrer</button>
						</form>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

export default Register;