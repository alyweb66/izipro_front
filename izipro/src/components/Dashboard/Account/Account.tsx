import { useEffect, useState } from 'react';
import { userDataStore } from '../../../store/UserData';
import { GET_USER_DATA } from '../../GraphQL/UserQueries';
import { useMutation, useQuery } from '@apollo/client';
import { UPDATE_USER_MUTATION } from '../../GraphQL/UserMutations';
import DOMPurify from 'dompurify';

import './Account.scss';

type UserState = {
	id: number;
	first_name: string;
	last_name: string;
	email: string;
	address: string;
	postal_code: string;
	city: string;
	siret: string;
	denomination: string;
	role: string;
}

function Account() {
	// Get the user data
	const { error: getUserError, data: getUserData } = useQuery(GET_USER_DATA);

	const id = useState(getUserData?.user.id || 0);
	const [first_name, setFirstName] = useState(getUserData?.user.first_name || '');
	const [last_name, setLastName] = useState(getUserData?.user.last_name || '');
	const [email, setEmail] = useState(getUserData?.user.email || '');
	const [address, setAddress] = useState(getUserData?.user.address || '');
	const [postal_code, setPostalCode] = useState(getUserData?.user.postal_code || '');
	const [city, setCity] = useState(getUserData?.user.city || '');
	const [siret, setSiret] = useState(getUserData?.user.siret || '');
	const [denomination, setDenomination] = useState(getUserData?.user.denomination || '');
	// Message modification account
	const [message, setMessage] = useState(false);
	// Set the changing user data
	const [userData, setUserData] = useState(getUserData?.user || {} as UserState);
	// Store data
	const role = userDataStore((state) => state.role);
	const [initialData, setInitialData] = userDataStore((state) => [state.initialData, state.setInitialData]);
	const setAll = userDataStore((state) => state.setAll);
	
	// Mutation to update the user data
	const [updateUser, { error: updateUserError }] = useMutation(UPDATE_USER_MUTATION);

	// Set the user data to state
	useEffect(() => {
		//sanitize the input
		const cleanFirstName = DOMPurify.sanitize(first_name);
		const cleanLastName = DOMPurify.sanitize(last_name);
		const cleanEmail = DOMPurify.sanitize(email);
		const cleanAddress = DOMPurify.sanitize(address);
		const cleanPostalCode = DOMPurify.sanitize(postal_code);
		const cleanCity = DOMPurify.sanitize(city);
		const cleanSiret = DOMPurify.sanitize(siret);
		const cleanDenomination = DOMPurify.sanitize(denomination);

		const newUserData  = {
			first_name: cleanFirstName,
			last_name: cleanLastName,
			email: cleanEmail,
			address: cleanAddress,
			postal_code: cleanPostalCode,
			city: cleanCity,
			siret: cleanSiret,
			denomination: cleanDenomination,
		};
	
		setUserData(newUserData);
	}, [first_name, last_name, email, address, postal_code, city, siret, denomination]);
	
	// Set the user data to the store
	useEffect(() => {
		if (getUserData?.user) {
			// Change the null values to empty strings
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const userData: UserState = Object.entries(getUserData.user).reduce((acc: any, [key, value]) => {
				acc[key as keyof UserState] = value === null ? '' : value;
				return acc;
			}, {} as UserState);
		
			setInitialData(userData);
			setAll(userData);
		}
		

		if (getUserError) {
			throw new Error('Error while fetching user data');
		}

	}, [getUserData]);

	
	const handleAccountSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		// Compare the initial data with the new data and get the changed fields
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const changedFields = (Object.keys(initialData) as Array<keyof UserState>).reduce((result: any, key: keyof UserState) => {
			
			const state = userData as UserState;
		
			if (initialData[key] !== state[key]) {
				result[key] = state[key];
			}
		
			return result ;
		}, {});
		// Delete the role and id fields
		delete changedFields.role && delete changedFields.id;
		
		// Check if there are changed values, if yes use mutation
		const keys =Object.keys(changedFields).filter(key => changedFields[key] !== undefined && changedFields[key] !== null);
		// if there are changed values, use mutation
		if (keys.length > 0) {
	
			updateUser({
				variables: {
					updateUserId: id[0],
					input: changedFields,
				},
			}).then((response): void => {
			
				const { updateUser } = response.data;
				// Set the new user data to the store
				setAll(updateUser);

				if (updateUser) {
					setMessage(true);
					setTimeout(() => {
						setMessage(false);
					
					},5000);
				}
			});

			if (updateUserError) {
				throw new Error('Error while updating user data');
			}
		}
	};
	return (
		<div className="account-container">
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
				{message === true && <p className="user-modification">Modifications éfféctué</p>}
				<button className="account-button" type="submit">Valider les modifications</button>
			</form>
		</div>
	);
}
export default Account;