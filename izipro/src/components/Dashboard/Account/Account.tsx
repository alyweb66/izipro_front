import { useEffect, useState } from 'react';
import { userDataStore } from '../../../store/UserData';
import { GET_USER_DATA } from '../../GraphQL/UserQueries';
import { useMutation, useQuery } from '@apollo/client';
import SettingAccount from './SettingAccount/SettingAccount';
import { CHANGE_PASSWORD_MUTATION, UPDATE_USER_MUTATION } from '../../GraphQL/UserMutations';
import DOMPurify from 'dompurify';
import validator from 'validator';
import { UserDataProps } from '../../../Type/User';
import { Localization } from '../../Hook/Localization';

import './Account.scss';


function Account() {

	// Get the user data
	const { error: getUserError, data: getUserData } = useQuery(GET_USER_DATA);

	//state
	const [first_name, setFirstName] = useState(getUserData?.user.first_name || '');
	const [last_name, setLastName] = useState(getUserData?.user.last_name || '');
	const [email, setEmail] = useState(getUserData?.user.email || '');
	const [address, setAddress] = useState(getUserData?.user.address || '');
	const [postal_code, setPostalCode] = useState(getUserData?.user.postal_code || '');
	const [city, setCity] = useState(getUserData?.user.city || '');
	const [lng, setLng] = useState(getUserData?.user.lng || null);
	const [lat, setLat] = useState(getUserData?.user.lat || null);
	const [siret, setSiret] = useState(getUserData?.user.siret || '');
	const [denomination, setDenomination] = useState(getUserData?.user.denomination || '');
	const [oldPassword, setOldPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmNewPassword, setConfirmNewPassword] = useState('');
	const [role, setRole] = useState(getUserData?.user.role || '');

	// Message modification account
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');	

	// Set the changing user data
	const [userData, setUserData] = useState(getUserData?.user || {} as UserDataProps);

	// Store data
	const id = userDataStore((state) => state.id);
	const [initialData, setInitialData] = userDataStore((state) => [state.initialData, state.setInitialData]);
	const setAll = userDataStore((state) => state.setAll);
	const setAccount = userDataStore((state) => state.setAccount);
	
	// Mutation to update the user data
	const [updateUser, { error: updateUserError }] = useMutation(UPDATE_USER_MUTATION, {
		update(cache, {data: { updateUser}}) {
			cache.modify({
				fields: {
					user(existingUser = {}) {
						return { ...existingUser, ...updateUser.user };
					},
				},
			}); 
		}
	});
	const [changePassword, { error: changePasswordError }] = useMutation(CHANGE_PASSWORD_MUTATION);

	// Set the user data to state
	useEffect(() => {
		
		if (getUserData?.user) {
			setFirstName(getUserData.user.first_name);
			setLastName(getUserData.user.last_name);
			setEmail(getUserData.user.email);
			setAddress(getUserData.user.address);
			setPostalCode(getUserData.user.postal_code);
			setCity(getUserData.user.city);
			setLng(getUserData.user.lng);
			setLat(getUserData.user.lat);
			setSiret(getUserData.user.siret);
			setDenomination(getUserData.user.denomination);
			setUserData(getUserData.user);
			setRole(getUserData.user.role);
		}
	}, [getUserData]);
	
	// Set the new user data to state
	useEffect(() => {
		//sanitize the input
		const newUserData  = {
			first_name: DOMPurify.sanitize(first_name),
			last_name: DOMPurify.sanitize(last_name),
			email: DOMPurify.sanitize(email),
			address: DOMPurify.sanitize(address),
			postal_code: DOMPurify.sanitize(postal_code),
			city: DOMPurify.sanitize(city),
			lng,
			lat,
			siret: DOMPurify.sanitize(siret),
			denomination: DOMPurify.sanitize(denomination),
			role: DOMPurify.sanitize(role),
		};
	
		setUserData(newUserData);
	}, [first_name, last_name, email, address, postal_code, city, lng, lat, siret, denomination]);
	
	// Set the user data to the store
	useEffect(() => {

		if (getUserData?.user) {
			// Change the null values to empty strings
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const userData: UserDataProps = Object.entries(getUserData.user).reduce((acc: any, [key, value]) => {
				acc[key as keyof UserDataProps] = value === null ? '' : value;
				return acc;
			}, {} as UserDataProps);
		
			setInitialData(userData);
			setAll(userData);
		}
		

		if (getUserError) {
			throw new Error('Error while fetching user data');
		}

	}, [getUserData]);



	// Handle the account submit
	const handleAccountSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		// fetch the location
		let newUserData = {} as UserDataProps;
		if (address && city && postal_code) {
			const location = await Localization(address, city, postal_code);
			// Add lng and lat to userData
			// Create a copy of userData
			newUserData = { ...userData };
			newUserData.lng = location?.lng;
			newUserData.lat = location?.lat;
			setLng(location?.lng);
			setLat(location?.lat);
		}
	
		// Compare the initial data with the new data and get the changed fields
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const changedFields = (Object.keys(initialData) as Array<keyof UserDataProps>).reduce((result: any, key: keyof UserDataProps) => {
			
			if (initialData[key] !== newUserData[key]) {
				result[key] = newUserData[key];
			}
			
			return result ;
		}, {});
		
		if (changedFields.siret && changedFields.siret.length !== 14) {
			setError('Siret invalide');
			setTimeout(() => {
				setError('');
			
			},5000);
			return;
		}

		if (changedFields.email) {
			setMessage('Un email de confirmation a été envoyé, le nouvel email sera effectif après confirmation');
			setTimeout(() => {
				setMessage('');
			
			},5000);
			return;
		}
		
		// Delete the role and id fields
		delete changedFields.role && delete changedFields.id;

		// Check if there are changed values, if yes use mutation
		const keys =Object.keys(changedFields).filter(key => changedFields[key] !== undefined && changedFields[key] !== null);

		// if there are changed values, use mutation
		if (keys.length > 0) {
	
			updateUser({
				variables: {
					updateUserId: id,
					input: changedFields,
				},
			}).then((response): void => {
			
				const { updateUser } = response.data;
				// Set the new user data to the store
				setAccount(updateUser);

				if (updateUser) {
					setMessage('Modifications éfféctué');
					setTimeout(() => {
						setMessage('');
					
					},5000);
				}
			});

			if (updateUserError) {
				throw new Error('Error while updating user data');
			}
		}
	};

	// Handle the new password submit
	const handleSubmitNewPassword = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		// Check if the new password and the confirm new password are the same
		if (newPassword !== confirmNewPassword) {
			setError('Les mots de passe ne correspondent pas');
			return;
		}
		// Check if the new password is strong
		if (!validator.isStrongPassword(newPassword)) {
			setError('Le mot de passe doit contenir au moins 8 caractères, une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial');
			return;
		}
		// Change the password
		changePassword({
			variables: {
				changePasswordId: id,
				input: {
					oldPassword: DOMPurify.sanitize(oldPassword),
					newPassword: DOMPurify.sanitize(newPassword),
				},
			},
		}).then((response) => {
			if (response.data?.changePassword) {
				setMessage('Mot de passe modifié');
				setTimeout(() => {
					setMessage('');
				}, 5000);
			}
		});

		if (changePasswordError) {
			throw new Error('Error while changing password');
		}

	};
	return (
		<>
			<div className="account-container">
				{error && <p className="user-modification-error">{error}</p>}
				{message && <p className="user-modification-message">{message}</p>}
				<form className="account-form" onSubmit={handleAccountSubmit} >
					<label className="label">
					Prénom:
						<input className="input-label" 
							type="text" 
							name="first_name"						
							value={first_name || ''} 
							placeholder={first_name || ''}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => setFirstName(event.target.value)} 
							aria-label="Prénom"
							maxLength={50}
						/>
					</label>
					<label className="label">
					Nom:
						<input 
							className="input-label" 
							type="text" 
							name="last_name"
							value={last_name || ''}
							placeholder={last_name || ''}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => setLastName(event.target.value)}
							aria-label="Nom"
							maxLength={50}
						/>
					</label>
					<label className="label">
					Email:
						<input 
							className="input-label" 
							type="text" 
							name="email"
							value={email || ''}
							placeholder={email || ''} 
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
							aria-label="Email"
							maxLength={50}
						/>
					</label>
					<label className="label">
					Adresse:
						<input 
							className="input-label" 
							type="text"
							name="address" 
							value={address || ''}
							placeholder={address || ''} 
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => setAddress(event.target.value)} 
							aria-label="Adresse"
							maxLength={100}
							required
						/>
					</label>
					<label className="label">
					Code postal:
						<input 
							className="input-label" 
							type="text" 
							name="postal_code"
							value={postal_code || ''}
							placeholder={postal_code || ''} 
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPostalCode(event.target.value)} 
							aria-label="Code postal"
							maxLength={10}
							required
						/>
					</label>
					<label className="label">
					Ville:
						<input 
							className="input-label" 
							type="text" 
							name="city"
							value={city || ''}
							placeholder={city || ''} 
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => setCity(event.target.value)}
							aria-label="Ville"
							maxLength={20}
							required
						/>
					</label>
					{role === 'pro' && (
						<div>
							<label className="label">
							Siret:
								<input 
									className="input-label" 
									type="text" 
									name="siret"
									value={siret || ''}
									placeholder={siret || ''} 
									onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSiret(event.target.value)}
									aria-label="Siret"
									maxLength={14}
								/>
							</label>
							<label className="label">
							Dénomination:
								<input 
									className="input-label" 
									type="text"
									name="denomination" 
									value={denomination || ''}
									placeholder={denomination || ''}
									onChange={(event: React.ChangeEvent<HTMLInputElement>) => setDenomination(event.target.value)} 
									aria-label="Dénomination"
									maxLength={50}
								/>
							</label>
						</div>
					)}
				
					<button className="account-button" type="submit">Valider les modifications</button>
				</form>
				<form className="account-form" onSubmit={handleSubmitNewPassword}>
					<input
						type="oldPassword"
						name="oldPassword"
						value={oldPassword}
						className="input"
						placeholder="Ancien mot de passe"
						onChange={(event: React.ChangeEvent<HTMLInputElement>) => setOldPassword(event.target.value)}
						aria-label="Ancien mot de passe"
						maxLength={60}
						required
					/>
					<input
						type="newPassword"
						name="newPassword"
						value={newPassword}
						className="input"
						placeholder="Nouveau mot de passe"
						onChange={(event: React.ChangeEvent<HTMLInputElement>) => setNewPassword(event.target.value)}
						aria-label="Nouveau mot de passe"
						maxLength={60}
						required
					/>
					<input
						type="newPassword"
						name="confirmNewPassword"
						value={confirmNewPassword}
						className="input"
						placeholder="Confirmer le nouveau mot de passe"
						onChange={(event: React.ChangeEvent<HTMLInputElement>) => setConfirmNewPassword(event.target.value)}
						aria-label="Confirmer le nouveau mot de passe"
						maxLength={60}
						required
					/>
					<button className="account-button" type="submit">
					Valider le nouveau mot de passe
					</button>

				</form>
			</div>
			<SettingAccount />
		</>
	);
}
export default Account;