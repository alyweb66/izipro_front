// React and React Router imports
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// State management and GraphQL imports
import { userDataStore } from '../../../store/UserData';
import { useMutation } from '@apollo/client';
//import { GET_USER_DATA } from '../../GraphQL/UserQueries';
import {
  CHANGE_PASSWORD_MUTATION,
  DELETE_ACCOUNT_MUTATION,
  DELETE_PROFILE_PICTURE_MUTATION,
  UPDATE_USER_MUTATION,
} from '../../GraphQL/UserMutations';
import UAParser from 'ua-parser-js';

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
import profileLogo from '/logos/logo-profile.webp';
import noPicture from '/logos/no-picture.webp';

//Maplibre
import maplibregl, { Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
//import 'mapbox-gl/dist/mapbox-gl.css';

// Styling imports
import './Account.scss';
import { DeleteItemModal } from '../../Hook/DeleteItemModal';
import Switch from '@mui/material/Switch';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Fade from '@mui/material/Fade';
import { MdOutlineVisibility, MdOutlineVisibilityOff } from 'react-icons/md';
import { useQueryGetNotification } from '../../Hook/Query';
import { UPDATE_NOTIFICATION_MUTATION } from '../../GraphQL/notificationMutation';
import { userNotificationStore } from '../../../store/Notification';
import TextareaAutosize from 'react-textarea-autosize';
import { Grow } from '@mui/material';
import { serverErrorStore } from '../../../store/LoginRegister';
import InfoPop from '../../Hook/InfoPop';

//import '../../../styles/spinner.scss';

ReactModal.setAppElement('#root');

function Account() {
  // Navigate
  const navigate = useNavigate();

  const { askPermission, disableNotifications } = serviceWorkerRegistration();
  // useRef for profile picture
  const fileInput = useRef<HTMLInputElement>(null);
  const isGetNotificationRef = useRef(true);

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
    postal_code,
  ] = userDataStore((state) => [
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
    state.postal_code,
  ]);
  const [
    emailNotification,
    endpointStore,
    setEnpointStore,
    setEmailNotification,
  ] = userNotificationStore((state) => [
    state.email_notification,
    state.endpoint,
    state.setEndpoint,
    state.setEmailNotification,
  ]);

  //state
  const [first_nameState, setFirstNameState] = useState(first_name || '');
  const [last_nameState, setLastNameState] = useState(last_name || '');
  const [emailState, setEmailState] = useState(email || '');
  const [addressState, setAddressState] = useState(address || '');
  const [postal_codeState, setPostalCodeState] = useState(postal_code || '');
  const [cityState, setCityState] = useState(cityStore || '');
  const [lngState, setLngState] = useState(lng || 0);
  const [latState, setLatState] = useState(lat || 0);
  const [siretState] = useState(siret || '');
  const [denominationState, setDenominationState] = useState(
    denomination || ''
  );
  const [descriptionState, setDescriptionState] = useState(description || '');
  const [pictureState, setPictureState] = useState(image || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [ChangeEmail, setChangeEmail] = useState('');
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(
    endpointStore ? true : false
  );
  const [errorPicture, setErrorPicture] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(
    emailNotification === null ? false : emailNotification
  );
  const [isImgLoading, setIsImgLoading] = useState(true);
  const [location, setLocation] = useState({
    city: '',
    postcode: '',
    name: '',
  });
  const [errorLocation, setErrorLocation] = useState('');
  const [isIOS, setIsIOS] = useState(false);
  //const [anchorEl, setAnchorEl] = useState<SVGElement | null>(null);
  // state for mapBox
  const [map, setMap] = useState<Map | null>(null);
  // Message modification account
  const [messageAccount, setMessageAccount] = useState('');
  const [errorAccount, setErrorAccount] = useState('');
  // Message modification password
  const [messagePassword, setMessagePassword] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  // Set the changing user data
  const [userData, setUserData] = useState({} as UserAccountDataProps);

  // Ref
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Store data
  const [serverErrorStatus, resetServerError, serverErrorStatusText, message] =
    serverErrorStore((state) => [
      state.status,
      state.resetServerError,
      state.statusText,
      state.message,
    ]);
  const setAccount = userDataStore((state) => state.setAccount);
  const role = userDataStore((state) => state.role);
  const resetUserData = userDataStore((state) => state.resetUserData);

  // Mutation to update the user data
  const [updateUser, { loading: updateUserLoading, error: updateUserError }] =
    useMutation(UPDATE_USER_MUTATION, {
      // update the cache
      update(cache, { data: { updateUser } }) {
        cache.modify({
          fields: {
            user(existingUser = {}) {
              return { ...existingUser, ...updateUser.user };
            },
          },
        });
      },
    });
  const [
    changePassword,
    { loading: changepasswordLoading, error: changePasswordError },
  ] = useMutation(CHANGE_PASSWORD_MUTATION);
  const [deleteProfilePicture, { error: deleteProfilePictureError }] =
    useMutation(DELETE_PROFILE_PICTURE_MUTATION);
  const [deleteAccount, { error: deleteAccountError }] = useMutation(
    DELETE_ACCOUNT_MUTATION
  );
  const [updateNotification, { error: updateNotificationError }] = useMutation(
    UPDATE_NOTIFICATION_MUTATION
  );

  // Query
  const { loading: notificationLoading, notificationData } =
    useQueryGetNotification(isGetNotificationRef.current);
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
  }, [
    first_nameState,
    last_nameState,
    emailState,
    addressState,
    postal_codeState,
    cityState,
    lngState,
    latState,
    siretState,
    denominationState,
    descriptionState,
  ]);

  // handle email notification
  const handleNotification = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();

    updateNotification({
      variables: {
        input: {
          user_id: id,
          email_notification: !notification,
        },
      },
    }).then((response): void => {
      const { updateNotification } = response.data;
      if (updateNotification) {
        setEmailNotification(!notification);
        setNotification(!notification);
      }
    });

    if (updateNotificationError) {
      throw new Error('Error while updating notification');
    }
  };

  // Handle the account submit
  const handleAccountSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setErrorAccount('');
    setMessageAccount('');
    setChangeEmail('');
    setErrorLocation('');
    setLocation({ city: '', postcode: '', name: '' });

    let newUserData = {} as UserAccountDataProps;
    if (
      address !== addressState ||
      cityStore !== cityState ||
      postal_code !== postal_codeState
    ) {
      // fetch the location
      if (addressState && cityState && postal_codeState) {
        const location = await Localization(
          addressState,
          cityState,
          postal_codeState
        );
        if (location && location.label) {
          setErrorLocation(
            `Adresse non valide, voulez vous dire : "${location?.label}" ?`
          );
          setLocation({
            city: location.city,
            postcode: location.postcode,
            name: location.name,
          });
          return;
        }
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
    } else {
      newUserData = { ...userData };
    }

    // Récupérer les clés communes entre userDataStore et userData
    const commonKeys = Object.keys(userDataStore.getState()).filter(
      (key) => key in newUserData
    ) as Array<keyof UserDataProps>;

    // Comparer les valeurs de ces clés pour voir si elles ont changé
    const changedFields = commonKeys.reduce(
      (result: any, key: keyof UserDataProps) => {
        const storeValue = userDataStore.getState()[key];
        const userDataValue = newUserData[key];

        if (
          storeValue !== userDataValue &&
          userDataValue !== undefined &&
          userDataValue !== '' &&
          userDataValue !== ''
        ) {
          result[key] = userDataValue;
        }

        return result;
      },
      {}
    );

    // Check if the siret is valid
    if (changedFields.siret && changedFields.siret.length !== 14) {
      setErrorAccount('Siret invalide');
      setTimeout(() => {
        setErrorAccount('');
      }, 15000);
      return;
    }

    // Check if the email is valid
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
    const keys = Object.keys(changedFields).filter(
      (key) => changedFields[key] !== undefined && changedFields[key] !== null
    );

    // if there are changed values, use mutation
    if (keys.length > 0) {
      updateUser({
        variables: {
          updateUserId: id,
          input: changedFields,
        },
      }).then((response): void => {
        if (response.errors && response.errors.length > 0) {
          setErrorAccount('Erreur lors de la modification');
        }
        const { updateUser } = response.data;

        // Set the new user data to the store
        setAccount(updateUser);

        setErrorLocation('');
        setLocation({ city: '', postcode: '', name: '' });

        if (changedFields.email) {
          setChangeEmail(
            'Un email de confirmation a été envoyé, le nouvel email sera effectif après confirmation'
          );
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
      setErrorPassword(
        'Le mot de passe doit contenir au moins 8 caractères, une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial'
      );
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
      if (response.errors && response.errors.length > 0) {
        setErrorPassword('Erreur lors de la modification du mot de passe');
      }
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

    setErrorPicture('');
    resetServerError();
    const file = event.target.files;

    // Check if the file is .jpg, .jpeg or .png
    if (file && file[0]) {
      const extension = file[0].name.split('.').pop()?.toLowerCase();

      if (
        extension &&
        !['jpg', 'jpeg', 'png'].includes(extension) &&
        !['image/png', 'image/jpeg', 'image/jpg'].includes(file[0].type)
      ) {
        setErrorPicture(
          'Seuls les fichiers .jpg, .jpeg, et .png sont autorisés'
        );
        setTimeout(() => {
          setErrorAccount('');
        }, 3000);
        return;
      }
    }

    // check file size
    if (file && file[0] && file[0].size > 1.5e7) {
      setErrorPicture(
        'Fichier trop volumineux, veuillez choisir un fichier de moins de 15MB'
      );
      setTimeout(() => {
        setErrorPicture('');
      }, 3000);
      return;
    }

    if ((file?.length ?? 0) > 0) {
      setIsImgLoading(true);
      updateUser({
        variables: {
          updateUserId: id,
          input: {
            image: file,
          },
        },
      }).then((response): void => {
        setIsImgLoading(false);
        if (response.errors && response.errors.length > 0) {
          setErrorPicture(
            'Erreur avec ce fichier, tentez un autre format de fichier type .jpg, .jpeg, .png'
          );
          setTimeout(() => {
            setErrorPicture('');
          }, 3000);
        }

        const { updateUser } = response.data;
        // Set the new user data to the store
        setImage(updateUser.image);
        setErrorPicture('');
        resetServerError();
      });
    }

    if (updateUserError) {
      setErrorPicture(
        'Erreur avec ce fichier, tentez un autre format de fichier type .jpg, .jpeg, .png'
      );
      throw new Error('Error while updating user picture');
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
          document.cookie =
            'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          document.cookie =
            'refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          document.cookie =
            'session-id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        }
        //redirect to home page
        setModalIsOpen(false);
        navigate('/', { replace: true });
        //});
      }
    });

    if (deleteAccountError) {
      throw new Error('Error while deleting account');
    }
  };

  // handle the switch change for notification
  const handleSwitchChange = () => {
    if (isNotificationEnabled) {
      disableNotifications();
      setEnpointStore(null);
    } else {
      askPermission();
    }
    setIsNotificationEnabled(!isNotificationEnabled);
  };

  const addressCorrection = () => {
    if (location.city && location.postcode && location.name) {
      setAddressState(location.name);
      setCityState(location.city);
      setPostalCodeState(location.postcode);

      setErrorLocation('');
    }
  };

  if (emailNotification === null) {
    isGetNotificationRef.current = false;
  }

  // Error profile picture
  useEffect(() => {
    if (
      (serverErrorStatus === 500 &&
        serverErrorStatusText === 'INTERNAL_SERVER_FILES_ERROR') ||
      message === 'Error updating image' ||
      message === 'Error updating image user'
    ) {
      setErrorPicture(
        'Erreur avec ce fichier, tentez un autre format de fichier type .jpg, .jpeg, .png'
      );
    }
  }, [serverErrorStatus, serverErrorStatusText]);

  // Map instance
  useEffect(() => {
    if (mapContainerRef.current) {
      const MapInstance = new maplibregl.Map({
        container: 'map',
        style: import.meta.env.VITE_MAPLIBRE_URL,
        center: [lng ?? 0, lat ?? 0],
        zoom: 10,
        scrollZoom: false, // Disable zooming with the scroll wheel
        dragPan: false, // Disable dragging to pan the map
        attributionControl: false,
      });

      // Disable map interactions
      MapInstance.touchZoomRotate.disable();
      MapInstance.doubleClickZoom.disable();

      MapInstance.on('load', () => {
        setIsLoading(false);
        setMap(MapInstance);
      });

      return () => {
        if (map) {
          map.remove();
        }
      };
    }
  }, [lng, lat]);

  // Adding options to the map
  useLayoutEffect(() => {
    if (map) {
      // Add markers, layers, sources, etc. as needed
      new maplibregl.Marker({
        color: '#028eef',
      })
        .setLngLat([lng ?? 0, lat ?? 0])
        .addTo(map as maplibregl.Map);
    }
  }, [map, lng, lat]);

  // set the notification
  useLayoutEffect(() => {
    if (endpointStore) {
      setIsNotificationEnabled(true);
    } else {
      setIsNotificationEnabled(false);
    }
  }, [endpointStore]);

  // useEffect for notification
  useEffect(() => {
    // Set email notification to the store and state
    if (
      notificationData &&
      notificationData.user &&
      emailNotification === null
    ) {
      const emailNotification =
        notificationData.user.notification[0]?.email_notification;

      setEmailNotification(emailNotification);
      setNotification(emailNotification);

      isGetNotificationRef.current = true;
    }

    // check if the user is already subscribed to push notifications
    const checkNotificationStatus = async () => {
      // set the state of the notification
      // check if the user is already subscribed to push notifications
      if (
        window.location.protocol === 'https:' ||
        window.location.hostname === 'localhost'
      ) {
        if ('serviceWorker' in navigator && endpointStore === null) {
          const registration = await navigator.serviceWorker.getRegistration();

          if (registration) {
            const subscription =
              await registration.pushManager.getSubscription();

            //setIsNotificationEnabled(!!subscription);
            if (subscription) {
              const endpoint = subscription.endpoint;
              const notification = notificationData?.user?.notification;

              // check if the user is already subscribed to push notifications
              let isSubscribed;
              if (notification && notification.length > 0) {
                const isNotification = notification.find(
                  (notification: {
                    id: number;
                    user: number;
                    email_notification: boolean;
                    endpoint: string;
                    public_key: string;
                    auth_token: string;
                  }) => notification.endpoint === endpoint
                );

                isSubscribed = isNotification?.endpoint;
              } else {
                isSubscribed = endpointStore;
              }

              if (isSubscribed) {
                setEnpointStore(isSubscribed);
              }
            }
          }

          // verify if the browser supports notifications push and service workers
          const permission = document.getElementById('push-permission');

          if (
            (!permission && !('serviceWorker' in navigator)) ||
            !('Notification' in window)
          ) {
            if (permission) {
              permission.style.display = 'none';
            }
            return;
          }
        }
      }
    };

    checkNotificationStatus();
  }, [notificationData]);


  // detect if the user is on iOS
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    const isMobileSafari = result.browser.name === 'Mobile Safari';
    setIsIOS(isMobileSafari);
  }, []);

  return (
    <div className="account">
      <Grow in={true} timeout={200}>
        <div className="account__profile" aria-label="Profil utilisateur">
          <div className="account__picture">
            <div className="spinner-container">
              <img
                className="account__profile__picture__img"
                src={image || profileLogo}
                alt="Profile"
                onClick={() => fileInput.current?.click()}
                onLoad={() => setIsImgLoading(false)}
                onError={(event) => {
                  event.currentTarget.src = noPicture;
                  setIsImgLoading(false);
                }}
                style={{ cursor: 'pointer' }}
                aria-label="Changer la photo de profil"
              />
              {isImgLoading && <Spinner delay={0} />}
            </div>
            <input
              className="account__profile__picture__input"
              type="file"
              ref={fileInput}
              onClick={(event) => {
                event.currentTarget.value = '';
              }}
              onChange={(event) => {
                handleProfilePicture(event);
              }}
              style={{ display: 'none' }}
              accept="image/png, image/jpeg, image/jpg"
              aria-label="Sélectionner une nouvelle photo de profil"
            />
            <div className="message">
              <Stack sx={{ width: '100%' }} spacing={2}>
                {errorPicture && (
                  <Fade in={!!errorPicture} timeout={300}>
                    <Alert variant="filled" severity="error">
                      {errorPicture}
                    </Alert>
                  </Fade>
                )}
              </Stack>
            </div>
            <button
              className="account__profile__picture__delete"
              type="button"
              onClick={handleDeletePicture}
              disabled={isImgLoading}
              aria-label="Supprimer la photo de profil"
            >
              Supprimer
            </button>
          </div>
          <div className="notification-container">
            {(notification === null || notificationLoading) && (
              <Spinner delay={0} />
            )}
            <div className="notification">
              {isIOS && <InfoPop isPush={true} />}
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      id="push-permission-switch"
                      color="warning"
                      checked={isNotificationEnabled}
                      onChange={handleSwitchChange}
                      inputProps={{ 'aria-label': 'Notifications push' }}
                    />
                  }
                  label="Notifications push"
                  labelPlacement="start"
                  classes={{ label: 'custom-label' }}
                />
              </FormGroup>
            </div>
            <div className="notification">
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      id="email-notification-switch"
                      color="warning"
                      checked={notification}
                      onChange={handleNotification}
                      inputProps={{ 'aria-label': 'Notifications par email' }}
                    />
                  }
                  label="Notifications par email"
                  labelPlacement="start"
                  classes={{ label: 'custom-label' }}
                />
              </FormGroup>
            </div>
          </div>
          <div className="account_profile_container">
            <form
              className={`account__profile__form ${updateUserLoading ? 'loading' : ''}`}
              onSubmit={handleAccountSubmit}
            >
              {updateUserLoading && <Spinner />}
              <h1 className="account__profile__form__title">
                Mes informations
              </h1>
              <div></div>
              <label className="account__profile__form__label">
                Prénom{role === 'user' && '*'}
                <input
                  className="account__profile__form__label__input"
                  type="text"
                  name="first_name"
                  value={first_nameState || ''}
                  placeholder={first_nameState || ''}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setFirstNameState(DOMPurify.sanitize(event.target.value))
                  }
                  aria-label="Prénom"
                  maxLength={50}
                  autoComplete="given-name"
                  required={role === 'user'}
                />
              </label>
              <label className="account__profile__form__label">
                Nom{role === 'user' && '*'}
                <input
                  className="account__profile__form__label__input"
                  type="text"
                  name="last_name"
                  value={last_nameState || ''}
                  placeholder={last_nameState || ''}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setLastNameState(DOMPurify.sanitize(event.target.value))
                  }
                  aria-label="Nom"
                  maxLength={50}
                  autoComplete="family-name"
                  required={role === 'user'}
                />
              </label>
              <label className="account__profile__form__label">
                Email*
                <input
                  className="account__profile__form__label__input"
                  type="text"
                  name="email"
                  value={emailState || ''}
                  placeholder={emailState || ''}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setEmailState(
                      DOMPurify.sanitize(event.target.value.toLowerCase())
                    )
                  }
                  aria-label="Email"
                  maxLength={50}
                  autoComplete="email"
                  required
                />
              </label>
              <label className="account__profile__form__label">
                Adresse*
                <input
                  className="account__profile__form__label__input"
                  type="text"
                  name="address"
                  value={addressState || ''}
                  placeholder={addressState || ''}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setAddressState(DOMPurify.sanitize(event.target.value))
                  }
                  aria-label="Adresse"
                  maxLength={100}
                  autoComplete="street-address"
                  required
                />
              </label>
              <label className="account__profile__form__label">
                Code postal*
                <input
                  className="account__profile__form__label__input"
                  type="text"
                  name="postal_code"
                  value={postal_codeState || ''}
                  placeholder={postal_codeState || ''}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setPostalCodeState(DOMPurify.sanitize(event.target.value))
                  }
                  aria-label="Code postal"
                  autoComplete="postal-code"
                  maxLength={10}
                  required
                />
              </label>
              <label className="account__profile__form__label">
                Ville*
                <input
                  className="account__profile__form__label__input"
                  type="text"
                  name="city"
                  value={cityState || ''}
                  placeholder={cityState || ''}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setCityState(DOMPurify.sanitize(event.target.value))
                  }
                  aria-label="Ville"
                  autoComplete="address-level2"
                  maxLength={100}
                  required
                />
              </label>
              {role === 'pro' && (
                <>
                  <label className="account__profile__form__label">
                    Siret*
                    <input
                      className="account__profile__form__label__input"
                      type="number"
                      name="siret"
                      value={siretState || ''}
                      placeholder={siretState || ''}
                      //onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSiretState(event.target.value.replace(/\s+/g, ''))}
                      aria-label="Siret"
                      autoComplete="off"
                      maxLength={14}
                      required
                      readOnly
                      style={{ color: 'gray' }}
                    />
                  </label>
                  <label className="account__profile__form__label">
                    Dénomination*
                    <input
                      className="account__profile__form__label__input"
                      type="text"
                      name="denomination"
                      value={denominationState || ''}
                      placeholder={denominationState || ''}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                        setDenominationState(
                          DOMPurify.sanitize(event.target.value)
                        )
                      }
                      aria-label="Dénomination"
                      autoComplete="organization"
                      maxLength={50}
                      required
                    />
                  </label>
                  <label className="account__profile__form__label">
                    Description
                    <TextareaAutosize
                      className="account__profile__form__label__input textarea"
                      name="description"
                      id="description"
                      placeholder="Exprimez-vous 200 caractères maximum"
                      value={descriptionState}
                      onChange={(event) =>
                        setDescriptionState(
                          DOMPurify.sanitize(event.target.value)
                        )
                      }
                      aria-label="Exprimez-vous 200 caractères maximum"
                      maxLength={200}
                    ></TextareaAutosize>
                    <p>{descriptionState?.length}/200</p>
                  </label>
                </>
              )}
              <div className="message">
                <Stack sx={{ width: '100%' }} spacing={2}>
                  {messageAccount && (
                    <Fade in={!!messageAccount} timeout={300}>
                      <Alert variant="filled" severity="success">
                        {messageAccount}
                      </Alert>
                    </Fade>
                  )}
                  {errorAccount && (
                    <Fade in={!!errorAccount} timeout={300}>
                      <Alert variant="filled" severity="error">
                        {errorAccount}
                      </Alert>
                    </Fade>
                  )}
                  {errorLocation && (
                    <Fade in={!!errorLocation} /* timeout={300} */>
                      <Alert
                        className="alert-errorLocation"
                        variant="filled"
                        severity="warning"
                        onClick={addressCorrection}
                      >
                        {errorLocation}
                      </Alert>
                    </Fade>
                  )}
                  {ChangeEmail && (
                    <Fade in={!!ChangeEmail} timeout={300}>
                      <Alert variant="filled" severity="success">
                        {ChangeEmail}
                      </Alert>
                    </Fade>
                  )}
                </Stack>
              </div>
              <button
                className="account__profile__button"
                type="submit"
                aria-label="Valider les modifications"
              >
                Valider
              </button>
              <div className="request__form__map">
                <p className="request__title-map">
                  Vérifiez votre adresse sur la carte (après validation)
                </p>
                <div
                  id="map"
                  ref={mapContainerRef}
                  className="request__form__map__map"
                >
                  {isLoading && <Spinner />}
                </div>
              </div>
            </form>

            <div className="account-profile__setting-password">
              <SettingAccount />
              <form
                className={`__password ${changepasswordLoading ? 'loading' : ''}`}
                onSubmit={handleSubmitNewPassword}
                aria-label="Formulaire de changement de mot de passe"
              >
                {changepasswordLoading && <Spinner />}
                <h1 className="__title">Changer le mot de passe </h1>
                <label className="__label">
                  {' '}
                  Ancien mot de passe
                  <div className="show-password">
                    <input
                      type={showOldPassword ? 'text' : 'password'}
                      name="oldPassword"
                      value={oldPassword}
                      className="__input"
                      placeholder="Ancien mot de passe"
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                        setOldPassword(event.target.value)
                      }
                      aria-label="Ancien mot de passe"
                      maxLength={60}
                      required
                    />
                    <span
                      className="toggle-password-icon"
                      onClick={(event) => {
                        setShowOldPassword(!showOldPassword),
                          event.preventDefault();
                      }}
                      aria-label={
                        showOldPassword
                          ? "Masquer l'ancien mot de passe"
                          : "Afficher l'ancien mot de passe"
                      }
                    >
                      {showOldPassword ? (
                        <MdOutlineVisibilityOff />
                      ) : (
                        <MdOutlineVisibility />
                      )}
                    </span>
                  </div>
                </label>
                <label className="__label">
                  Nouveau mot de passe
                  <div className="show-password">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="newPassword"
                      value={newPassword}
                      className="__input"
                      placeholder="Nouveau mot de passe"
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                        setNewPassword(event.target.value)
                      }
                      aria-label="Nouveau mot de passe"
                      maxLength={60}
                      required
                    />
                    <span
                      className="toggle-password-icon"
                      onClick={(event) => {
                        setShowPassword(!showPassword), event.preventDefault();
                      }}
                      aria-label={
                        showPassword
                          ? 'Masquer le nouveau mot de passe'
                          : 'Afficher le nouveau mot de passe'
                      }
                    >
                      {showPassword ? (
                        <MdOutlineVisibilityOff />
                      ) : (
                        <MdOutlineVisibility />
                      )}
                    </span>
                  </div>
                </label>
                <label className="__label">
                  Confirmer le nouveau mot de passe
                  <div className="show-password">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={confirmNewPassword}
                      className="__input"
                      placeholder="Confirmer mot de passe"
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                        setConfirmNewPassword(event.target.value)
                      }
                      aria-label="Confirmer mot de passe"
                      maxLength={60}
                      required
                    />
                    <span
                      className="toggle-password-icon"
                      onClick={(event) => {
                        setShowConfirmPassword(!showConfirmPassword),
                          event.preventDefault();
                      }}
                      aria-label={
                        showConfirmPassword
                          ? 'Masquer le nouveau mot de passe'
                          : 'Afficher le nouveau mot de passe'
                      }
                    >
                      {showConfirmPassword ? (
                        <MdOutlineVisibilityOff />
                      ) : (
                        <MdOutlineVisibility />
                      )}
                    </span>
                  </div>
                </label>
                <div className="message">
                  <Stack sx={{ width: '100%' }} spacing={2}>
                    {messagePassword && (
                      <Fade in={!!messagePassword} timeout={300}>
                        <Alert variant="filled" severity="success">
                          {messagePassword}
                        </Alert>
                      </Fade>
                    )}
                    {errorPassword && (
                      <Fade in={!!errorPassword} timeout={300}>
                        <Alert variant="filled" severity="error">
                          {errorPassword}
                        </Alert>
                      </Fade>
                    )}
                  </Stack>
                </div>
                <button
                  className="account__profile__button"
                  type="submit"
                  aria-label="Valider le changement de mot de passe"
                >
                  Valider
                </button>
              </form>
            </div>
            <button
              className="account__profile__delete"
              type="button"
              onClick={() => setModalIsOpen(!modalIsOpen)}
              aria-label="Supprimer mon compte"
            >
              supprimer mon compte
            </button>
          </div>
        </div>
      </Grow>
      <DeleteItemModal
        isDeleteUser={true}
        setDeleteItemModalIsOpen={setModalIsOpen}
        deleteItemModalIsOpen={modalIsOpen}
        handleDeleteItem={handledeleteAccount}
      />
    </div>
  );
}
export default Account;
