// React and React Router imports
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// State management and GraphQL imports
import { userDataStore } from '../../../store/UserData';
import { useMutation } from '@apollo/client';
//import { GET_USER_DATA } from '../../GraphQL/UserQueries';
import {
	CHANGE_PASSWORD_MUTATION,
	DELETE_ACCOUNT_MUTATION,
	DELETE_PROFILE_PICTURE_MUTATION,
	UPDATE_USER_MUTATION
} from '../../GraphQL/UserMutations';

// Third-party libraries
import DOMPurify from 'dompurify';
import validator from 'validator';
// @ts-expect-error react-modal is not compatible with typescript
import ReactModal from 'react-modal';


// Local component imports
import SettingAccount from './SettingAccount/SettingAccount';
import { Localization } from '../../Hook/Localization';
import Spinner from '../../Hook/Spinner';
import serviceWorkerRegistration from '../../Hook/ServiceWorkerRegistration';

// Type definitions
import { UserAccountDataProps, UserDataProps } from '../../../Type/User';

// Asset imports
import profileLogo from '/logo/logo profile.jpeg';

//Mapbox
import Map, { Marker } from 'react-map-gl';
// @ts-expect-error no types for mapbox-gl
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Styling imports
import './Account.scss';
import { motion, AnimatePresence } from 'framer-motion';
import { DeleteItemModal } from '../../Hook/DeleteItemModal';
import { IoLocationSharp } from "react-icons/io5";
import Switch from '@mui/material/Switch';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Fade from '@mui/material/Fade';
//import '../../../styles/spinner.scss';


ReactModal.setAppElement('#root');


function Account() {
	// token for mapbox
	const mapboxAccessToken = import.meta.env.VITE_MAPBOX_TOKEN;
	// Navigate
	const navigate = useNavigate();

	const { askPermission, disableNotifications } = serviceWorkerRegistration();
	// useRef for profile picture
	const fileInput = useRef<HTMLInputElement>(null);

	const [
		id,
		email,
		address,
		cityStore,
		first_name,
		last_name,
		lng,
		siret,
		denomination,
		image,
		description,
		lat,
		setImage,
		postal_code] = userDataStore((state) => [
			state.id,
			state.email,
			state.address,
			state.city,
			state.first_name,
			state.last_name,
			state.lng,
			state.siret,
			state.denomination,
			state.image,
			state.description,
			state.lat,
			state.setImage,
			state.postal_code
		]);



	//state
	const [first_nameState, setFirstNameState] = useState(first_name || '');
	const [last_nameState, setLastNameState] = useState(last_name || '');
	const [emailState, setEmailState] = useState(email || '');
	const [addressState, setAddressState] = useState(address || '');
	const [postal_codeState, setPostalCodeState] = useState(postal_code || '');
	const [cityState, setCityState] = useState(cityStore || '');
	const [lngState, setLngState] = useState(lng || '');
	const [latState, setLatState] = useState(lat || '');
	const [siretState, setSiretState] = useState(siret || '');
	const [denominationState, setDenominationState] = useState(denomination || '');
	const [descriptionState, setDescriptionState] = useState(description || '');
	const [pictureState, setPictureState] = useState(image || '');
	const [oldPassword, setOldPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmNewPassword, setConfirmNewPassword] = useState('');
	const [modalIsOpen, setModalIsOpen] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [ChangeEmail, setChangeEmail] = useState('');
	const [isNotificationEnabled, setIsNotificationEnabled] = useState(Notification.permission === 'granted');
	const [errorPicture, setErrorPicture] = useState('');
	// state for mapBox
	const [viewState, setViewState] = useState({
		longitude: typeof lngState === 'number' ? lngState : parseFloat(lngState),
		latitude: typeof latState === 'number' ? latState : parseFloat(latState),
		zoom: 12,
	});


	// Message modification account
	const [messageAccount, setMessageAccount] = useState('');
	const [errorAccount, setErrorAccount] = useState('');

	// Message modification password
	const [messagePassword, setMessagePassword] = useState('');
	const [errorPassword, setErrorPassword] = useState('');

	// Set the changing user data
	const [userData, setUserData] = useState({} as UserAccountDataProps);

	// Store data
	const setAccount = userDataStore((state) => state.setAccount);
	const role = userDataStore((state) => state.role);
	//const [image, setImage] = userDataStore((state) => [state.image, state.setImage]);
	const resetUserData = userDataStore((state) => state.resetUserData);

	// Mutation to update the user data
	const [updateUser, { loading: updateUserLoading, error: updateUserError }] = useMutation(UPDATE_USER_MUTATION, {
		// update the cache
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

	// Set the new user data to state
	useEffect(() => {
		//sanitize the input
		const newUserData = {
			first_name: DOMPurify.sanitize(first_nameState),
			last_name: DOMPurify.sanitize(last_nameState),
			email: DOMPurify.sanitize(emailState),
			address: DOMPurify.sanitize(addressState),
			postal_code: DOMPurify.sanitize(postal_codeState),
			city: DOMPurify.sanitize(cityState),
			siret: DOMPurify.sanitize(siretState),
			denomination: DOMPurify.sanitize(denominationState),
			description: DOMPurify.sanitize(descriptionState),
			image: DOMPurify.sanitize(pictureState),
		};

		setUserData(newUserData);
	}, [first_nameState, last_nameState, emailState, addressState, postal_codeState, cityState, lngState, latState, siretState, denominationState, descriptionState]);


	// Handle the account submit
	const handleAccountSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		setErrorAccount('');
		setMessageAccount('');
		setChangeEmail('');

		let newUserData = {} as UserAccountDataProps;
		if (address !== addressState || cityStore !== cityState || postal_code !== postal_codeState) {
			// fetch the location
			//let newUserData = {} as UserAccountDataProps;;
			if (addressState && cityState && postal_codeState) {
				const location = await Localization(addressState, cityState, postal_codeState, setErrorAccount);

				if (!location) {
					return;
				}
				// Add lng and lat to userData
				// Create a copy of userData
				newUserData = { ...userData };
				newUserData.lng = location?.lng;
				newUserData.lat = location?.lat;
				setLngState(location?.lng);
				setLatState(location?.lat);
			}
		}

		// Compare the initial data with the new data and get the changed fields
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const changedFields = (Object.keys(userDataStore.getState()) as Array<keyof UserDataProps>).reduce((result: any, key: keyof UserDataProps) => {

			if (userDataStore.getState()[key] !== userData[key]) {
				result[key] = userData[key];
			}

			return result;
		}, {});


		if (changedFields.siret && changedFields.siret.length !== 14) {
			setErrorAccount('Siret invalide');
			setTimeout(() => {
				setErrorAccount('');

			}, 15000);
			return;
		}

		if (changedFields.email) {
			if (!validator.isEmail(changedFields.email)) {
				setErrorAccount('Email invalide');
				setTimeout(() => {
					setErrorAccount('');

				}, 15000);
				return;
			}

		}

		if (changedFields.postal_code) {
			if (!validator.isPostalCode(changedFields.postal_code, 'FR')) {
				setErrorAccount('Code postal invalide');
				setTimeout(() => {
					setErrorAccount('');

				}, 15000);
				return;
			}
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
				console.log('updateUser', updateUser);

				// Set the new user data to the store
				setAccount(updateUser);

				if (changedFields.email) {
					setChangeEmail('Un email de confirmation a été envoyé, le nouvel email sera effectif après confirmation');
					setTimeout(() => {
						setChangeEmail('');

					}, 15000);
				}

				if (updateUser) {
					setMessageAccount('Modifications éfféctué');
					setTimeout(() => {
						setMessageAccount('');

					}, 15000);
				}
			});

			if (updateUserError) {
				setErrorAccount('Erreur lors de la modification');
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

		// Check if the file is .jpg, .jpeg or .png
		if (file && file[0]) {
			const extension = file[0].name.split('.').pop()?.toLowerCase();
			if (extension && !['jpg', 'jpeg', 'png'].includes(extension)) {
				setErrorPicture('Seuls les fichiers .jpg, .jpeg et .png sont autorisés');
				setTimeout(() => {
					setErrorAccount('');
				}, 3000);
				return;
			}
		}

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
				setErrorPicture('');
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
				setPictureState('');
				setImage('');
			}
		});

		if (deleteProfilePictureError) {
			throw new Error('Error while deleting profile picture');
		}
	};

	// Handle the account delete
	const handledeleteAccount = () => {

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

	// useEffect for notification push
	useEffect(() => {
		const checkNotificationStatus = async () => {
			// set the state of the notification
			// check if the user is already subscribed to push notifications
			const registration = await navigator.serviceWorker.getRegistration();
			if (registration) {
				const subscription = await registration.pushManager.getSubscription();
				setIsNotificationEnabled(!!subscription);
			} else {
				setIsNotificationEnabled(false);
			}

			// verify if the browser supports notifications push and service workers
			const permission = document.getElementById('push-permission');
			console.log('permission', permission);
			if (
				!permission &&
				!('serviceWorker' in navigator) ||
				!('Notification' in window)
			) {
				if (permission) {
					permission.style.display = 'none';
				}
				return;
			}
		};

		checkNotificationStatus();
	}, []);

	// handle the switch change for notification
	const handleSwitchChange = () => {
		if (isNotificationEnabled) {
			disableNotifications();
		} else {
			askPermission();
		}
		setIsNotificationEnabled(!isNotificationEnabled);
	};

	// useEffect for mapBox lng lat
	useEffect(() => {
		setViewState({
			longitude: typeof lngState === 'number' ? lngState : parseFloat(lngState),
			latitude: typeof latState === 'number' ? latState : parseFloat(latState),
			zoom: 12,
		});
	}, [lng, lat, lngState, latState]);

	return (
		<div className="account">
			<AnimatePresence>
				<motion.div
					className='account__profile'
					/* className={`account__profile ${loading ? 'loading' : ''}`} */
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.1, type: 'tween' } }}
					transition={{ duration: 0.1, type: 'tween' }}
				>
					<div className="account__picture" >
						<img
							className="account__profile__picture__img"
							src={image || profileLogo}
							alt="Profile"
							onClick={() => fileInput.current?.click()}
							onError={(event) => {
								event.currentTarget.src = '/logo/no-picture.jpg';
							}}
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
						<div className="message">
							<Stack sx={{ width: '100%' }} spacing={2}>
								{errorPicture && (
									<Fade in={!!errorPicture} timeout={300}>
										<Alert variant="filled" severity="error">{errorPicture}</Alert>
									</Fade>
								)}
							</Stack>
						</div>
						<button className="account__profile__picture__delete" type='button' onClick={handleDeletePicture}>Supprimer</button>
					</div >

					<div className="account_profile_container">
						<form className={`account__profile__form ${updateUserLoading ? 'loading' : ''}`} onSubmit={handleAccountSubmit} >
							<div id="push-permission">
								<FormGroup>
									<FormControlLabel
										control={<Switch
											color="warning"
											checked={isNotificationEnabled}
											onChange={handleSwitchChange}
											inputProps={{ 'aria-label': 'Activer les notifications' }}
										/>}
										label="Activer les notifications"
										labelPlacement="start"
										classes={{ label: 'custom-label' }}
									/>
								</FormGroup>
							</div>
							{updateUserLoading && <Spinner />}
							<h1 className="account__profile__form__title">Mes informations:</h1>
							<div></div>
							<label className="account__profile__form__label">
								Prénom:
								<input
									className="account__profile__form__label__input"
									type="text"
									name="first_name"
									value={first_nameState || ''}
									placeholder={first_nameState || ''}
									onChange={(event: React.ChangeEvent<HTMLInputElement>) => setFirstNameState(event.target.value)}
									aria-label="Prénom"
									maxLength={50}
									autoComplete='first_name'
								/>
							</label>
							<label className="account__profile__form__label">
								Nom:
								<input
									className="account__profile__form__label__input"
									type="text"
									name="last_name"
									value={last_nameState || ''}
									placeholder={last_nameState || ''}
									onChange={(event: React.ChangeEvent<HTMLInputElement>) => setLastNameState(event.target.value)}
									aria-label="Nom"
									maxLength={50}
									autoComplete='last_name'
								/>
							</label>
							<label className="account__profile__form__label">
								Email:
								<input
									className="account__profile__form__label__input"
									type="text"
									name="email"
									value={emailState || ''}
									placeholder={emailState || ''}
									onChange={(event: React.ChangeEvent<HTMLInputElement>) => setEmailState(event.target.value)}
									aria-label="Email"
									maxLength={50}
									autoComplete='email'
								/>
							</label>
							<label className="account__profile__form__label">
								Adresse:StateState
								<input
									className="account__profile__form__label__input"
									type="text"
									name="address"
									value={addressState || ''}
									placeholder={addressState || ''}
									onChange={(event: React.ChangeEvent<HTMLInputElement>) => setAddressState(event.target.value)}
									aria-label="Adresse"
									maxLength={100}
									autoComplete='address'
									required
								/>
							</label>
							<label className="account__profile__form__label">
								Code postal:
								<input
									className="account__profile__form__label__input"
									type="text"
									name="postal_code"
									value={postal_codeState || ''}
									placeholder={postal_codeState || ''}
									onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPostalCodeState(event.target.value)}
									aria-label="Code postal"
									autoComplete='postal_code'
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
									value={cityState || ''}
									placeholder={cityState || ''}
									onChange={(event: React.ChangeEvent<HTMLInputElement>) => setCityState(event.target.value)}
									aria-label="Ville"
									autoComplete='city'
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
											value={siretState || ''}
											placeholder={siretState || ''}
											onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSiretState(event.target.value)}
											aria-label="Siret"
											autoComplete='siret'
											maxLength={14}
										/>
									</label>
									<label className="account__profile__form__label">
										Dénomination:
										<input
											className="account__profile__form__label__input"
											type="text"
											name="denomination"
											value={denominationState || ''}
											placeholder={denominationState || ''}
											onChange={(event: React.ChangeEvent<HTMLInputElement>) => setDenominationState(event.target.value)}
											aria-label="Dénomination"
											autoComplete='denomination'
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
											value={descriptionState}
											onChange={(event) => setDescriptionState(event.target.value)}
											aria-label="Exprimez-vous 200 caractères maximum"
											maxLength={200}
										>
										</textarea>
										<p>{descriptionState?.length}/200</p>
									</label>
								</>
							)}
							<div className="message">
								<Stack sx={{ width: '100%' }} spacing={2}>
									{messageAccount && (
										<Fade in={!!messageAccount} timeout={300}>
											<Alert variant="filled" severity="success">{messageAccount}</Alert>
										</Fade>
									)}
									{errorAccount && (
										<Fade in={!!errorAccount} timeout={300}>
											<Alert variant="filled" severity="error">{errorAccount}</Alert>
										</Fade>
									)}
									{ChangeEmail && (
										<Fade in={!!ChangeEmail} timeout={300}>
											<Alert variant="filled" severity="success">{ChangeEmail}</Alert>
										</Fade>
									)}
								</Stack>
							</div>
							<button className="account__profile__button" type="submit">Valider</button>
							<div className="request__form__map">
								<p className="request__title-map">Vérifiez votre adresse sur la carte (validez pour actualiser):</p>
								<div className="request__form__map__map">
									<Map
										reuseMaps
										mapboxAccessToken={mapboxAccessToken}
										{...viewState}
										onMove={evt => setViewState(evt.viewState)}
										//zoom={zoom}
										scrollZoom={true}
										maxZoom={15}
										minZoom={10}
										mapStyle="mapbox://styles/mapbox/streets-v12"
										dragRotate={false}
										dragPan={false}
									>
										<Marker
											longitude={typeof lngState === 'number' ? lngState : parseFloat(lngState)}
											latitude={typeof latState === 'number' ? latState : parseFloat(latState)}
										>
											<div className="map-marker">
												<IoLocationSharp className="map-marker__icon" />
											</div>
										</Marker>
									</Map>
								</div>
							</div>

						</form>

						<div className="account-profile__setting-password">
							<SettingAccount />
							<form
								className={`__password ${changepasswordLoading ? 'loading' : ''}`}
								onSubmit={handleSubmitNewPassword}>
								{changepasswordLoading && <Spinner />}
								<h1 className="__title">Changer le mot de passe:</h1>
								<label className="__label">
									<input
										className="__input"
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
								<label className="__label">
									<input
										className="__input"
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
								<label className="__label">
									<input
										className="__input"
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
								<div className="message">
								<Stack sx={{ width: '100%' }} spacing={2}>
									{messagePassword && (
										<Fade in={!!messagePassword} timeout={300}>
											<Alert variant="filled" severity="success">{messagePassword}</Alert>
										</Fade>
									)}
									{errorPassword && (
										<Fade in={!!errorPassword} timeout={300}>
											<Alert variant="filled" severity="error">{errorPassword}</Alert>
										</Fade>
									)}
								</Stack>
							</div>
								<button className="show-password" onClick={() => setShowPassword(!showPassword)}>
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
								onClick={() => setModalIsOpen(!modalIsOpen)}>supprimer mon compte
							</button>
						</div>
					</div>
				</motion.div >
			</AnimatePresence>

			<DeleteItemModal
				isDeleteUser={true}
				setDeleteItemModalIsOpen={setModalIsOpen}
				deleteItemModalIsOpen={modalIsOpen}
				handleDeleteItem={handledeleteAccount}
			/>


		</div >
	);
}
export default Account;