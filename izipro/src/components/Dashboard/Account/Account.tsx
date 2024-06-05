import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userDataStore } from '../../../store/UserData';
import { GET_USER_DATA } from '../../GraphQL/UserQueries';
import { useMutation, useQuery } from '@apollo/client';
import SettingAccount from './SettingAccount/SettingAccount';
import {
	CHANGE_PASSWORD_MUTATION,
	DELETE_ACCOUNT_MUTATION,
	DELETE_PROFILE_PICTURE_MUTATION,
	UPDATE_USER_MUTATION
} from '../../GraphQL/UserMutations';
import DOMPurify from 'dompurify';
import validator from 'validator';
import { UserDataProps } from '../../../Type/User';
import { Localization } from '../../Hook/Localization';
//@ts-expect-error react-modal is not compatible with typescript
import ReactModal from 'react-modal';

import './Account.scss';
//import '../../../styles/spinner.scss';
import profileLogo from '/logo/logo profile.jpeg';
import Spinner from '../../Hook/Spinner';

ReactModal.setAppElement('#root');


function Account() {
	// Navigate
	const navigate = useNavigate();

	// useRef for profile picture
	const fileInput = useRef<HTMLInputElement>(null);

	// Get the user data
	const { loading, error: getUserError, data: getUserData } = useQuery(GET_USER_DATA);

	console.log('getUserData', getUserData);


	//state
	const [first_name, setFirstName] = useState(getUserData?.user.first_name || '');
	const [last_name, setLastName] = useState(getUserData?.user.last_name || '');
	const [email, setEmail] = useState(getUserData?.user.email || '');
	const [address, setAddress] = useState(getUserData?.user.address || '');
	const [postal_code, setPostalCode] = useState(getUserData?.user.postal_code || '');
	const [city, setCity] = useState(getUserData?.user.city || '');
	const [lng, setLng] = useState(getUserData?.user.lng || '');
	const [lat, setLat] = useState(getUserData?.user.lat || '');
	const [siret, setSiret] = useState(getUserData?.user.siret || '');
	const [denomination, setDenomination] = useState(getUserData?.user.denomination || '');
	const [description, setDescription] = useState(getUserData?.user.description || '');
	const [picture, setPicture] = useState(getUserData?.user.image || '');
	const [oldPassword, setOldPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmNewPassword, setConfirmNewPassword] = useState('');
	const [ModalIsOpen, setModalIsOpen] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	// Message modification account
	const [messageAccount, setMessageAccount] = useState('');
	const [errorAccount, setErrorAccount] = useState('');

	// Message modification password
	const [messagePassword, setMessagePassword] = useState('');
	const [errorPassword, setErrorPassword] = useState('');

	// Set the changing user data
	const [userData, setUserData] = useState(getUserData?.user || {} as UserDataProps);

	// Store data
	const id = userDataStore((state) => state.id);
	const [initialData, setInitialData] = userDataStore((state) => [state.initialData, state.setInitialData]);
	const setAll = userDataStore((state) => state.setAll);
	const setAccount = userDataStore((state) => state.setAccount);
	const role = userDataStore((state) => state.role);
	const [image, setImage] = userDataStore((state) => [state.image, state.setImage]);
	const resetUserData = userDataStore((state) => state.resetUserData);

	// Mutation to update the user data
	const [updateUser, { loading: updateUserLoading, error: updateUserError }] = useMutation(UPDATE_USER_MUTATION, {
		update(cache, { data: { updateUser } }) {
			cache.modify({
				fields: {
					user(existingUser = {}) {
						return { ...existingUser, ...updateUser.user };
					},
				},
			});
		}
	});
	const [changePassword, { loading: changepasswordLoading, error: changePasswordError }] = useMutation(CHANGE_PASSWORD_MUTATION);
	const [deleteProfilePicture, { error: deleteProfilePictureError }] = useMutation(DELETE_PROFILE_PICTURE_MUTATION);
	const [deleteAccount, { error: deleteAccountError }] = useMutation(DELETE_ACCOUNT_MUTATION);

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
			setDescription(getUserData.user.description || '');
			setPicture(getUserData.user.image);
		}
	}, [getUserData]);

	// Set the new user data to state
	useEffect(() => {
		//sanitize the input
		const newUserData = {
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
			description: DOMPurify.sanitize(description),
			image: DOMPurify.sanitize(picture),
		};

		setUserData(newUserData);
	}, [first_name, last_name, email, address, postal_code, city, lng, lat, siret, denomination, description]);

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

			return result;
		}, {});

		if (changedFields.siret && changedFields.siret.length !== 14) {
			setErrorAccount('Siret invalide');
			setTimeout(() => {
				setErrorAccount('');

			}, 5000);
			return;
		}

		if (changedFields.email) {
			setMessageAccount('Un email de confirmation a été envoyé, le nouvel email sera effectif après confirmation');
			setTimeout(() => {
				setMessageAccount('');

			}, 5000);
			return;
		}

		// Delete the role and id fields
		delete changedFields.role && delete changedFields.id;

		// Check if there are changed values, if yes use mutation
		const keys = Object.keys(changedFields).filter(key => changedFields[key] !== undefined && changedFields[key] !== null);

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
					setMessageAccount('Modifications éfféctué');
					setTimeout(() => {
						setMessageAccount('');

					}, 5000);
				}
			});

			if (updateUserError) {
				setMessageAccount('Erreur lors de la modification');
				throw new Error('Error while updating user data');
			}
		}
	};

	// Handle the new password submit
	const handleSubmitNewPassword = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		// Check if the new password and the confirm new password are the same
		if (newPassword !== confirmNewPassword) {
			setErrorPassword('Les mots de passe ne correspondent pas');
			return;
		}
		// Check if the new password is strong
		if (!validator.isStrongPassword(newPassword)) {
			setErrorPassword('Le mot de passe doit contenir au moins 8 caractères, une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial');
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
				setMessagePassword('Mot de passe modifié');
				setOldPassword('');
				setNewPassword('');
				setConfirmNewPassword('');
				setTimeout(() => {
					setMessagePassword('');
				}, 5000);
			}
		});

		if (changePasswordError) {
			setErrorPassword('Erreur lors de la modification du mot de passe');
			throw new Error('Error while changing password');
		}

	};

	// Handle the profile picture change
	const handleProfilePicture = (event: React.ChangeEvent<HTMLInputElement>) => {
		event.preventDefault();

		const file = event.target.files;

		if ((file?.length ?? 0) > 0) {

			updateUser({
				variables: {
					updateUserId: id,
					input: {
						image: file,
					}
				},
			}).then((response): void => {

				const { updateUser } = response.data;
				// Set the new user data to the store
				setAccount(updateUser);
			});
		}

	};

	// Handle the profile picture delete
	const handleDeletePicture = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();

		deleteProfilePicture({
			variables: {
				id: id,
			},
		}).then((response): void => {

			if (response.data?.deleteProfilePicture) {
				setPicture('');
				setImage('');
			}
		});

		if (deleteProfilePictureError) {
			throw new Error('Error while deleting profile picture');
		}
	};

	// Handle the account delete
	const handledeleteAccount = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();

		// Delete the user account
		deleteAccount({
			variables: {
				id: id,
			},
		}).then((response): void => {
			if (response.data?.deleteUser) {

				// clear user data store
				resetUserData();
				// clear local storage and session storage
				localStorage.clear();
				sessionStorage.clear();

				// clear the cookie
				if (document.cookie) {
					document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
					document.cookie = 'refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
				}
				//redirect to home page
				setModalIsOpen(false);
				navigate('/');
				//});

			}
		});

		if (deleteAccountError) {
			throw new Error('Error while deleting account');
		}

	};


	return (
		<div className="account">

			< div className={`account__profile ${loading ? 'loading' : ''}`} >
				{loading && <Spinner />}
				{/* {error && <p className="account__profile__modification-error">{error}</p>}
				{message && <p className="account__profile__modification-message">{message}</p>} */}
				<div className="account__picture" >
					<img
						className="account__profile__picture__img"
						src={image || profileLogo}
						alt="Profile"
						onClick={() => fileInput.current?.click()}
						style={{ cursor: 'pointer' }}
					/>
					<input
						className="account__profile__picture__input"
						type="file"
						ref={fileInput}
						onChange={handleProfilePicture}
						style={{ display: 'none' }}
						accept=".jpg,.jpeg,.png"
					/>
					<button className="account__profile__picture__delete" type='button' onClick={handleDeletePicture}>Supprimer</button>
				</div >
				<form className={`account__profile__form ${updateUserLoading ? 'loading' : ''}`} onSubmit={handleAccountSubmit} >
					{updateUserLoading && <Spinner/> }
					<h1 className="account__profile__form__title">Mes informations:</h1>
					<div></div>
					<label className="account__profile__form__label">
						Prénom:
						<input
							className="account__profile__form__label__input"
							type="text"
							name="first_name"
							value={first_name || ''}
							placeholder={first_name || ''}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => setFirstName(event.target.value)}
							aria-label="Prénom"
							maxLength={50}
						/>
					</label>
					<label className="account__profile__form__label">
						Nom:
						<input
							className="account__profile__form__label__input"
							type="text"
							name="last_name"
							value={last_name || ''}
							placeholder={last_name || ''}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => setLastName(event.target.value)}
							aria-label="Nom"
							maxLength={50}
						/>
					</label>
					<label className="account__profile__form__label">
						Email:
						<input
							className="account__profile__form__label__input"
							type="text"
							name="email"
							value={email || ''}
							placeholder={email || ''}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
							aria-label="Email"
							maxLength={50}
						/>
					</label>
					<label className="account__profile__form__label">
						Adresse:
						<input
							className="account__profile__form__label__input"
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
					<label className="account__profile__form__label">
						Code postal:
						<input
							className="account__profile__form__label__input"
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
					<label className="account__profile__form__label">
						Ville:
						<input
							className="account__profile__form__label__input"
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
						<>
							<label className="account__profile__form__label">
								Siret:
								<input
									className="account__profile__form__label__input"
									type="text"
									name="siret"
									value={siret || ''}
									placeholder={siret || ''}
									onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSiret(event.target.value)}
									aria-label="Siret"
									maxLength={14}
								/>
							</label>
							<label className="account__profile__form__label">
								Dénomination:
								<input
									className="account__profile__form__label__input"
									type="text"
									name="denomination"
									value={denomination || ''}
									placeholder={denomination || ''}
									onChange={(event: React.ChangeEvent<HTMLInputElement>) => setDenomination(event.target.value)}
									aria-label="Dénomination"
									maxLength={50}
								/>
							</label>
							<label className="account__profile__form__label">
								Description:
								<textarea
									className="account__profile__form__label__input textarea"
									name="description"
									id="description"
									placeholder="Exprimez-vous 200 caractères maximum"
									value={description}
									onChange={(event) => setDescription(event.target.value)}
									aria-label="Exprimez-vous 200 caractères maximum"
									maxLength={200}
								>
								</textarea>
								<p>{description?.length}/200</p>
							</label>
						</>

					)}
					{errorAccount && <p className="account__profile__modification-error">{errorAccount}</p>}
					{messageAccount && <p className="account__profile__modification-message">{messageAccount}</p>}
					<button className="account__profile__button" type="submit">Valider</button>
				</form>
				<SettingAccount />
				<form
					className={`account__profile__form password ${changepasswordLoading ? 'loading' : ''}`}
					onSubmit={handleSubmitNewPassword}>
					{changepasswordLoading && <Spinner />}

					<h1 className="account__profile__form__title">Changer le mot de passe:</h1>
					<label className="account__profile__form__label">

						<input
							className="account__profile__form__label__input"
							type={showPassword ? 'text' : 'password'}
							name="oldPassword"
							value={oldPassword}
							placeholder="Ancien mot de passe"
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => setOldPassword(event.target.value)}
							aria-label="Ancien mot de passe"
							maxLength={60}
							required
						/>
					</label>
					<label className="account__profile__form__label">
						<input
							className="account__profile__form__label__input"
							type={showPassword ? 'text' : 'password'}
							name="newPassword"
							value={newPassword}
							placeholder="Nouveau mot de passe"
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => setNewPassword(event.target.value)}
							aria-label="Nouveau mot de passe"
							maxLength={60}
							required
						/>
					</label>
					<label className="account__profile__form__label">
						<input
							className="account__profile__form__label__input"
							type={showPassword ? 'text' : 'password'}
							name="confirmNewPassword"
							value={confirmNewPassword}
							placeholder="Confirmer le nouveau mot de passe"
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => setConfirmNewPassword(event.target.value)}
							aria-label="Confirmer le nouveau mot de passe"
							maxLength={60}
							required
						/>
					</label>
					{errorPassword && <p className="account__profile__modification-error">{errorPassword}</p>}
					{messagePassword && <p className="account__profile__modification-message">{messagePassword}</p>}
					<button className="account__profile__button__show-password" onClick={() => setShowPassword(!showPassword)}>
						{showPassword ? 'Cacher les mots de passe' : 'Afficher les mots de passe'}
					</button>
					<button
						className="account__profile__button"
						type="submit">
						Valider
					</button>


				</form>
				<button
					className="account__profile__delete"
					type='button'
					onClick={() => setModalIsOpen(!ModalIsOpen)}>supprimer mon compte
				</button>
			</div >



			<ReactModal
				className="modal"
				isOpen={ModalIsOpen}
				contentLabel="Delete Account"
				shouldCloseOnOverlayClick={false}
				aria-label="supprimer mon compte"
			>
				<div className="modal__container">
					<h1 className="modal__title">ATTENTION!!</h1>
					<p className="modal__description">Vous allez supprimer votre compte definitevement, êtes vous sur?</p>
					<div className="modal__container__button">
						<button className="modal__delete" onClick={handledeleteAccount}>Supprimer</button>
						<button className="modal__cancel" onClick={() => setModalIsOpen(!ModalIsOpen)}>Annuler</button>
					</div>
				</div>
			</ReactModal>

		</div >
	);
}
export default Account;