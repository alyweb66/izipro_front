import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { REGISTER_USER_MUTATION, REGISTER_PRO_USER_MUTATION } from '../../GraphQL/Mutations';
import validator from 'validator';
import './Register.scss';


function Register() {
  const [isRegisterVisible, setIsRegisterVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [proEmail, setProEmail] = useState('');
  const [password, setPassword] = useState('');
  const [proPassword, setProPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [proConfirmPassword, setProConfirmPassword] = useState('');
  const [siret, setSiret] = useState('');
  const [error, setError] = useState('');
  const [userCreated, setUserCreated] = useState(false);
  
  // function to toggle the visibility of the register form
  const toggleRegisterVisibility = () => {
    setIsRegisterVisible(!isRegisterVisible);
  };

 // Mutation to register a user
  const [createUser, { error: userError }] = useMutation(REGISTER_USER_MUTATION);
  const [createProUser, { error: proUserError}] = useMutation(REGISTER_PRO_USER_MUTATION);
  
  const handleRegister = (event: React.FormEvent<HTMLFormElement>, isProfessional: boolean) => {
    // reset the state
    setUserCreated(false);
    setError('');

    event.preventDefault();
    
    // Check if the email is valid
    if ((email && !validator.isEmail(email)) || (proEmail && !validator.isEmail(proEmail))) {
      setError('Adresse e-mail invalide');
      return;
    }
    
    // Check if the password and confirm password are the same
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    // Check if the password is strong
    if ((password && !validator.isStrongPassword(password)) || (proPassword && !validator.isStrongPassword(proPassword))) {
      setError('Mot de passe faible, doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial');
      return;
    }
 
    
    // Check if the siret is valid
    if (isProfessional && siret && siret.length !== 14) {
      setError('Siret invalide');
      return;
    }

    // send the data to the server
    const variables = isProfessional ? {
      input: {
        email: proEmail,
        password: proPassword,
        siret: Number(siret)
      }
    } : {
      input: {
        email: email,
        password: password
      }
    };

    if (isProfessional) {
      createProUser({ variables }).then((response) => {
        if (response.data.createProUser.id) {
          setUserCreated(true);
         } 
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setSiret('');
      });

    } else {
      createUser({ variables }).then((response) => {
       if (response.data.createUser.id) {
        setUserCreated(true);
       } 
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      });
    }

    // handle errors
    if (userError) {
      console.log(userError.graphQLErrors[0].extensions);
      return `Submission error!`
    } else if (proUserError) {
      console.log(proUserError.graphQLErrors[0].extensions);
      return `Submission error!`
    }
   
  };

  return (
    <div>
      <p className='create-account' ><span onClick={toggleRegisterVisibility}>Créer un compte</span></p>
      {error && <p className='error-register'>{error}</p>}
      {proUserError && <p className='error-register'>{'Siret inconnu'}</p>}
      {userCreated && <p className='user-created'>Utilisateur créé avec succès, un email de validation vous a été envoyé </p>}
      {isRegisterVisible && (
        <div className="register-container">
          <form className="register" onSubmit={(event) => handleRegister(event, false)}>
            <p className="category">Particulier</p>
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
            <input
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              className="input"
              placeholder="Confirmer mot de passe"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(event.target.value)}
              aria-label="Confirmer mot de passe"
              required
            />
            <button type="submit" className="register-button">Enregistrer</button>
            <button className="button-google">
              <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" viewBox="0 0 256 262">
                <path fill="#4285F4" d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"></path>
                <path fill="#34A853" d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"></path>
                <path fill="#FBBC05" d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"></path>
                <path fill="#EB4335" d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"></path>
              </svg>
              Continuer avec Google
            </button>
            <button className="button-facebook">
              <svg stroke="#ffffff" xmlSpace="preserve" viewBox="-143 145 512 512" xmlnsXlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" id="Layer_1" version="1.1" fill="#ffffff"><g strokeWidth="0" id="SVGRepo_bgCarrier"></g><g strokeLinejoin="round" strokeLinecap="round" id="SVGRepo_tracerCarrier"></g><g id="SVGRepo_iconCarrier"> <path d="M329,145h-432c-22.1,0-40,17.9-40,40v432c0,22.1,17.9,40,40,40h432c22.1,0,40-17.9,40-40V185C369,162.9,351.1,145,329,145z M169.5,357.6l-2.9,38.3h-39.3v133H77.7v-133H51.2v-38.3h26.5v-25.7c0-11.3,0.3-28.8,8.5-39.7c8.7-11.5,20.6-19.3,41.1-19.3 c33.4,0,47.4,4.8,47.4,4.8l-6.6,39.2c0,0-11-3.2-21.3-3.2c-10.3,0-19.5,3.7-19.5,14v29.9H169.5z"></path> </g></svg>
              Continuer avec Facebook
            </button>
          </form>
          <form className="register" onSubmit={(event) => handleRegister(event, true)}>
            <p className='category'>Professionnel</p>
            <input
              type="email"
              name="email"
              value={proEmail}
              className="input"
              placeholder="Adresse e-mail"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setProEmail(event.target.value)}
              aria-label="Adresse e-mail"
              required
            />
            <input
              type="password"
              name="password"
              value={proPassword}
              className="input"
              placeholder="Mot de passe"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setProPassword(event.target.value)}
              aria-label="Mot de passe"
              required
            />
            <input
              type="password"
              name="confirmPassword"
              value={proConfirmPassword}
              className="input"
              placeholder="Confirmer mot de passe"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setProConfirmPassword(event.target.value)}
              aria-label="Confirmer mot de passe"
              required
            />
            <input
              type="siret"
              name="siret"
              value={siret}
              className="input"
              placeholder="Siret (14 chiffres)"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSiret(event.target.value)}
              aria-label="siret"
              required
            />
            <button type="submit" className='register-button'>Enregistrer</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Register;