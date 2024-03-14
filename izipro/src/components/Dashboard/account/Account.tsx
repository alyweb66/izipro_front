import { useEffect } from 'react';
import { userDataStore } from '../../../store/UserData';
import { GET_USER_DATA } from '../../GraphQL/Queries';
import { useMutation, useQuery } from '@apollo/client';
import { UPDATE_USER_MUTATION } from '../../GraphQL/Mutations';

import './Account.scss';

function Account() {

	const [first_name, setFirstName] = userDataStore((state) => [state.first_name, state.setFirstName]);
	const [last_name, setLastName] = userDataStore((state) => [state.last_name, state.setLastName]);
	const [email, setEmail] = userDataStore((state) => [state.email, state.setEmail]);
	const [address, setAddress] = userDataStore((state) => [state.address, state.setAddress]);
	const [postal_code, setPostalCode] = userDataStore((state) => [state.postal_code, state.setPostalCode]);
	const [city, setCity] = userDataStore((state) => [state.city, state.setCity]);
	const [siret, setSiret] = userDataStore((state) => [state.siret, state.setSiret]);
	const [denomination, setDenomination] = userDataStore((state) => [state.denomination, state.setDenomination]);

	const [initialData, setInitialData] = userDataStore((state) => [state.initialData, state.setInitialData]);
	const setAll = userDataStore((state) => state.setAll);

	// Query to get the user data
	const { error: getUserError, data: getUserData } = useQuery(GET_USER_DATA);

	
	// Mutation to update the user data
	const [updateUser, { error: updateUserError, data: updateUserData }] = useMutation(UPDATE_USER_MUTATION);
	
	useEffect(() => {
		if (getUserData?.user) {
			console.log('setinital',getUserData?.user);
			
			setInitialData(getUserData.user);
			setAll(getUserData.user);
	
		}
		
		/* console.log('data', getUserData);
		setFirstName(getUserData?.user.first_name || '');
		setLastName(getUserData?.user.last_name || '');
		setEmail(getUserData?.user.email || '');
		setAddress(getUserData?.user.address || '');
		setPostalCode(getUserData?.user.postal_code || '');
		setCity(getUserData?.user.city || '');
		setSiret(getUserData?.user.siret || '');
		setDenomination(getUserData?.user.denomination || ''); */

		if (getUserError) {
			console.log(getUserError);
		}


	}, [getUserData]);

	
	const handleAccountSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
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
		}
		// Obtenez uniquement les champs qui ont changé
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const changedFields = (Object.keys(initialData) as Array<keyof UserState>).reduce((result: any, key: keyof UserState) => {
			const state = userDataStore.getState() as UserState;
			if (initialData[key] !== state[key]) {
				result[key] = state[key];
			}
			return result;
		}, {});

		updateUser({
			variables: {
				input: changedFields,
				/* input: {
					first_name: first_name,
					last_name: last_name,
					email: email,
					address: address,
					postal_code: postal_code,
					city: city,
					siret: Number(siret),
					denomination: denomination
				}, */
			},
		}).then((response) => {
			console.log('update user',updateUser);
			
			setFirstName(updateUserData?.updateUser.first_name);
			setLastName(updateUserData?.updateUser.last_name);
			setEmail(updateUserData?.updateUser.email);
			setAddress(updateUserData?.updateUser.address);
			setPostalCode(updateUserData?.updateUser.postal_code);
			setCity(updateUserData?.updateUser.city);
			setSiret(updateUserData?.updateUser.siret);
			setDenomination(updateUserData?.updateUser.denomination);
			console.log(response);
		});

		if (updateUserError) {
			console.log(updateUserError);
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
						value={first_name} 
						placeholder={first_name}
						onChange={(event: React.ChangeEvent<HTMLInputElement>) => setFirstName(event.target.value)} 
						aria-label="Prénom"
					/>
				</label>
				<label className="label">
					Nom:
					<input 
						className="input-label" 
						type="text" 
						name="last_name"
						value={last_name}
						placeholder={last_name} 
						onChange={(event: React.ChangeEvent<HTMLInputElement>) => setLastName(event.target.value)}
						aria-label="Nom"
					/>
				</label>
				<label className="label">
					Email:
					<input 
						className="input-label" 
						type="text" 
						name="email"
						value={email}
						placeholder={email} 
						onChange={(event: React.ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
						aria-label="Email"
					/>
				</label>
				<label className="label">
					Adresse:
					<input 
						className="input-label" 
						type="text"
						name="address" 
						value={address}
						placeholder={address} 
						onChange={(event: React.ChangeEvent<HTMLInputElement>) => setAddress(event.target.value)} 
						aria-label="Adresse"
					/>
				</label>
				<label className="label">
					Code postal:
					<input 
						className="input-label" 
						type="text" 
						name="postal_code"
						value={postal_code}
						placeholder={postal_code} 
						onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPostalCode(event.target.value)} 
						aria-label="Code postal"
					/>
				</label>
				<label className="label">
					Ville:
					<input 
						className="input-label" 
						type="text" 
						name="city"
						value={city}
						placeholder={city} 
						onChange={(event: React.ChangeEvent<HTMLInputElement>) => setCity(event.target.value)}
						aria-label="Ville"
					/>
				</label>
				<label className="label">
					Siret:
					<input 
						className="input-label" 
						type="text" 
						name="siret"
						value={siret}
						placeholder={siret} 
						onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSiret(event.target.value)}
						aria-label="Siret"
					/>
				</label>
				<label className="label">
					Dénomination:
					<input 
						className="input-label" 
						type="text"
						name="denomination" 
						value={denomination }
						placeholder={denomination}
						onChange={(event: React.ChangeEvent<HTMLInputElement>) => setDenomination(event.target.value)} 
						aria-label="Dénomination"
					/>
				</label>

				<button className="account-button" type="submit">Valider les modifications</button>
			</form>
		</div>
	);
}

export default Account;