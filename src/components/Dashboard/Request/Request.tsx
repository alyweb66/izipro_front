import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import maplibregl, { Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Apollo Client
import { useMutation } from '@apollo/client';
import { REQUEST_MUTATION } from '../../GraphQL/RequestMutation';

// Custom hooks and queries
import { useQueryCategory, useQueryJobs } from '../../Hook/Query';
import { useFileHandler } from '../../Hook/useFileHandler';

// State management and stores
import { userDataStore } from '../../../store/UserData';
import { myRequestStore } from '../../../store/Request';
import { useShallow } from 'zustand/shallow';

// Types and icons

import pdfLogo from '/logos/logo-pdf-name.webp';
import { FaCamera } from 'react-icons/fa';

// Utilities and styles
import DOMPurify from 'dompurify';
import TextareaAutosize from 'react-textarea-autosize';
import './Request.scss';
import Spinner from '../../Hook/Components/Spinner/Spinner';
import SelectBox from '../../Hook/Components/SelectBox';
import { subscriptionDataStore } from '../../../store/subscription';
import { motion, AnimatePresence } from 'framer-motion';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Fade from '@mui/material/Fade';
import * as turf from '@turf/turf';
import {
  FormControlLabel,
  FormGroup,
  Grow,
  Popper,
  Switch,
} from '@mui/material';
import { categoriesJobStore, jobsStore } from '../../../store/Job';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { CategoryProps, JobProps } from '../../../Type/Request';
import { popperSx, autocompleteSx } from '../../Hook/SearchStyle';
import InfoPop from '../../Hook/Components/InfoPop/InfoPop';
import { Localization } from '../../Hook/Localization';


function Request() {
  // Store
  const {
    id,
    role,
    address,
    city,
    lng,
    denomination,
    lat,
    first_name,
    last_name,
    postal_code,
  } = userDataStore(
    useShallow((state) => ({
      id: state.id,
      role: state.role,
      address: state.address,
      city: state.city,
      lng: state.lng,
      denomination: state.denomination,
      lat: state.lat,
      first_name: state.first_name,
      last_name: state.last_name,
      postal_code: state.postal_code,
    }))
  );
  const [myRequestsStore, setMyRequestsStore] = myRequestStore(
    useShallow((state) => [state.requests, state.setMyRequestStore])
  );
  const [subscriptionStore, setSubscriptionStore] = subscriptionDataStore(
    useShallow((state) => [state.subscription, state.setSubscription])
  );

  const [categoriesJobsStore, setCategoriesJobsStore] = categoriesJobStore(
    useShallow((state) => [state.categories, state.setcategories])
  );
  const [jobStore, setJobsStore] = jobsStore(
    useShallow((state) => [state.jobs, state.setJobs])
  );

  // State
  const [cityState, setCityState] = useState(city);
  const [lngState, setLngState] = useState(lng);
  const [latState, setLatState] = useState(lat);
  const [urgent, setUrgent] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [searchedJob, setSearchedJob] = useState<JobProps | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [selectedJobByCategory, setSelectedJobByCategory] =
    useState<JobProps | null>(null);
  const [titleRequest, setTitleRequest] = useState('');
  const [descriptionRequest, setDescriptionRequest] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [uploadFileError, setUploadFileError] = useState('');
  const [isCreateRequestLoading, setIsCreateRequestLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [map, setMap] = useState<Map | null>(null);
  // Map
  const [radius, setRadius] = useState(0); // Radius in meters
  // Other adresse
  const [isOtherAddress, setIsOtherAddress] = useState(false);
  const [addressOther, setAddressOther] = useState('');
  const [cityOther, setCityOther] = useState('');
  const [postalCodeOther, setPostalCodeOther] = useState('');
  const [errorLocation, setErrorLocation] = useState('');
  const [successLocation, setSuccessLocation] = useState('');
  const [otherAddressLoading, setOtherAddressLoading] = useState(false);
  const [isCorrectionLocation, setIsCorrectionLocation] = useState(false);
  const [location, setLocation] = useState({
    city: '',
    postcode: '',
    name: '',
  });

  // File upload
  const { fileError, file, setFile, setUrlFile, urlFile, handleFileChange } =
    useFileHandler();

  // Ref
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | null>(null); // Ref to close the keyboard on mobile

  // Mutation
  const [createRequest, { loading: createLoading, error: requestError }] =
    useMutation(REQUEST_MUTATION, {
      onError: (error) => {
        if (error) {
          setErrorMessage('Erreur lors de la création de la demande');
          setTimeout(() => {
            setErrorMessage('');
          }, 10000); // 10000ms = 10s
        }
      },
    });

  // Query
  const { loading: categoryLoading, categoriesData } = useQueryCategory(
    categoriesJobsStore.length > 0
  );
  const { loading: JobDataLoading, jobData } = useQueryJobs(
    jobStore.length > 0
  );

  // remove file
  const handleRemove = (index: number) => {
    // Remove file from file list
    setUploadFileError('');
    const newFiles = [...file];
    newFiles.splice(index, 1);
    setFile(newFiles);
    // Remove file from urlFile list
    const newUrlFileList = [...urlFile];
    newUrlFileList.splice(index, 1);
    setUrlFile(newUrlFileList);
  };

  // Submit request
  const handleSubmitRequest = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setErrorMessage('');
    setSuccessMessage('');

    // check if all fields are filled
    let timer: number | undefined;
    if (!titleRequest || !descriptionRequest || !selectedJobByCategory) {
      setErrorMessage('Veuillez remplir tous les champs');
      setTimeout(() => {
        setErrorMessage('');
      }, 10000); // 10000ms = 10s
    } else {
      clearTimeout(timer);

      // map file to send to graphql
      const sendFile = file.map((file) => ({
        file,
      }));
      setIsCreateRequestLoading(true);
      createRequest({
        variables: {
          input: {
            urgent: urgent,
            title: DOMPurify.sanitize(titleRequest ?? ''),
            message: DOMPurify.sanitize(descriptionRequest ?? ''),
            city: cityState,
            lng: lngState,
            lat: latState,
            range: radius,
            job_id: Number(selectedJobByCategory.id),
            user_id: id,
            media: sendFile,
          },
        },
      }).then((response) => {
        if (
          (response.errors && response.errors.length > 0) ||
          !response.data.createRequest
        ) {
          setIsCreateRequestLoading(false);
          setErrorMessage('Erreur lors de la création de la demande');
          setTimeout(() => {
            setErrorMessage('');
          }, 10000); // 10000ms = 10s
        }

        if (response.data.createRequest) {
          // Add the new request to the store
          setMyRequestsStore([response.data.createRequest, ...myRequestsStore]);
          const newRequest = response.data.createRequest;

          // update subscriptionStore with the new request id
          if (
            subscriptionStore.some(
              (subscription) => subscription.subscriber === 'request'
            )
          ) {
            const newSubscription = subscriptionStore.map((subscription) => {
              if (
                subscription.subscriber === 'request' &&
                Array.isArray(subscription.subscriber_id) &&
                !subscription.subscriber_id.includes(newRequest.id)
              ) {
                // create new subscriber_id array
                const newSubscriberId = [
                  ...subscription.subscriber_id,
                  newRequest.id,
                ];
                // Return new subscription
                return { ...subscription, subscriber_id: newSubscriberId };
                //subscription.subscriber_id.push(newRequest.id);
              }
              return subscription;
            });

            setSubscriptionStore(newSubscription);
          } else {
            // Create new subscription
            setSubscriptionStore([
              ...subscriptionStore,
              {
                subscriber: 'request',
                subscriber_id: [newRequest.id],
                user_id: id,
                created_at: new Date().toISOString(),
              },
            ]);
          }
          setIsCreateRequestLoading(false);
          setSuccessMessage('Demande envoyée avec succès');
          setTimeout(() => {
            setSuccessMessage('');
          }, 10000); // 5000ms = 5s

          // Clear fields
          setTitleRequest('');
          setDescriptionRequest('');
          setFile([]);
          setUrlFile([]);
          setRadius(0);
          setSelectedCategory(0);
          setErrorMessage('');
          setUrgent(false);
          setIsOtherAddress(false);
          setAddressOther('');
          setCityOther('');
          setPostalCodeOther('');
        }
      });
      clearTimeout(timer);
    }
    if (requestError) {
      setErrorMessage('Erreur lors de la création de la demande');
      throw new Error('Error while creating request');
    }
  };

  // Handle file upload
  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement> &
      React.DragEvent<HTMLLabelElement>
  ) => {
    event.preventDefault();
    setUploadFileError('');

    // Check if the number of files is less than 3
    const remainingSlots = 3 - urlFile.length;

    if ((event.target.files?.length ?? 0) > 3) {
      setUploadFileError('Nombre de fichiers maximum atteint');
    }

    if (event.target.files) {
      if (remainingSlots > 0) {
        const filesToUpload = Array.from(event.target.files).slice(
          0,
          remainingSlots
        );
        handleFileChange(undefined, undefined, filesToUpload as File[]);
      }
      if (remainingSlots <= 0) {
        setUploadFileError('Nombre de fichiers maximum atteint');
      }
    }
  };

  // Update address
  const updateAdress = async (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setErrorMessage('');
    setSuccessLocation('');
    setErrorLocation('');

    // fetch the location
    if (addressOther && cityOther && postalCodeOther) {
      setOtherAddressLoading(true);
      const location = await Localization(
        addressOther,
        cityOther,
        postalCodeOther
      );
 

      if (location && location.label) {
        setOtherAddressLoading(false);
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
        setOtherAddressLoading(false);
        setErrorLocation(
          'Adresse non valide, veuillez vérifier les informations saisies'
        );
        return;
      }

      if (location) {
        setOtherAddressLoading(false);
        setLngState(location.lng);
        setLatState(location.lat);
        setCityState(location.city);
        setSuccessLocation('Adresse valide');
        setTimeout(() => {
          setSuccessLocation('');
        }, 5000);
      }
    }
  };

  // Address correction if click on error message
  const addressCorrection = () => {
    setErrorLocation('');
    setAddressOther(location.name);
    setCityOther(location.city);
    setPostalCodeOther(location.postcode);
    setOtherAddressLoading(true);
    setIsCorrectionLocation(true);
  };

  // Update location when address is corrected
  useEffect(() => {
    const updateLocation = async () => {
      if (isCorrectionLocation) {
        await updateAdress({
          preventDefault: () => {},
          stopPropagation: () => {},
        } as React.MouseEvent<HTMLButtonElement>);

        setIsCorrectionLocation(false);
      }
    };

    updateLocation();
  }, [isCorrectionLocation]);

  // Map instance
  useEffect(() => {
    if (mapContainerRef.current) {
      const MapInstance = new maplibregl.Map({
        container: 'map',
        style: import.meta.env.VITE_MAPLIBRE_URL,
        center: [lngState ?? 0, latState ?? 0],
        zoom: 10,
        dragPan: false, // Disable dragging to pan the map
        scrollZoom: false, // Disable scroll zoom
        attributionControl: false,
        canvasContextAttributes: {
          antialias: false,
          preserveDrawingBuffer: false,
          failIfMajorPerformanceCaveat: false,
          contextType: 'webgl2', // Spécifie WebGL2 si disponible
        },
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
  }, [lngState, latState]);

  // Adding options to the map
  useLayoutEffect(() => {
    if (map) {
      // Add markers, layers, sources, etc. as needed
      new maplibregl.Marker({
        color: '#f37c04',
        scale: 0.8,
      })
        .setLngLat([lngState ?? 0, latState ?? 0])
        .addTo(map as maplibregl.Map);

      // Create a circle around the center point
      let circle = null;
      if (lngState !== null && latState !== null) {
        const center = turf.point([lngState, latState]); // Crate center point
        circle = turf.circle(center, radius / 1000, {
          steps: 100,
          units: 'kilometers',
        }); // Create a circle from the center point
      }

      // Add circle to the map
      if (map.getSource('circle')) {
        if (circle) {
          (map.getSource('circle') as maplibregl.GeoJSONSource).setData(circle); // Update the circle data
        }
      } else {
        map.addSource('circle', {
          type: 'geojson',
          data: circle || { type: 'FeatureCollection', features: [] },
        });
        // Show the circle on the map
        map.addLayer({
          id: 'circle-layer',
          type: 'fill',
          source: 'circle',
          layout: {},
          paint: {
            'fill-color': '#028eef',
            'fill-opacity': 0.3,
          },
        });
      }
      // Zoom ajust to circle
      if (radius === 0) {
        map.setZoom(10); // Set zoom to 12 if radius is 0
      } else if (circle) {
        const bounds = turf.bbox(circle).slice(0, 4) as [
          number,
          number,
          number,
          number,
        ]; // Get circle bounds
        if (bounds) {
          map.fitBounds(bounds, { padding: 20, duration: 500 });
        }
      }
    }
  }, [map, radius, lngState, latState]);

  // Update jobs when category changes
  useEffect(() => {
    if (jobData) {
      setJobsStore(jobData.allJobs);
    }
  }, [jobData]);

  // Update categories when data is fetched
  useEffect(() => {
    if (categoriesData) {
      setCategoriesJobsStore(categoriesData.categories);
    }
  }, [categoriesData]);

  // clear and set state when searchedJob is set
  useEffect(() => {
    if (searchedJob) {
      const categoryId = categoriesJobsStore.find(
        (category) => category.id === searchedJob.category_id
      )?.id;
      setSelectedCategory(categoryId ?? 0);
      setSelectedJobByCategory(searchedJob);
    }
  }, [searchedJob]);

  return (
    <Grow in={true} timeout={200}>
      <div className="request">
        {categoryLoading && <Spinner />}

        {!address ||
        !city ||
        !postal_code ||
        (role === 'pro' ? !denomination : !first_name || !last_name) ? (
          <p className="request no-req">
            Veuillez renseigner les champs de &quot;Mes informations&quot; dans
            votre compte pour faire une demande
          </p>
        ) : (
          <form
            className="request__form"
            onSubmit={handleSubmitRequest}
            aria-label="Formulaire de demande"
          >
            {/* <h1 className="request__form__title urgent">Si votre demande est une urgence cliquez sur URGENT:</h1> */}
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    id="urgent-switch"
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: 'red',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 0, 0, 0.08)',
                        },
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':
                        {
                          backgroundColor: 'red',
                        },
                    }}
                    checked={urgent}
                    onChange={(event) => setUrgent(event.target.checked)}
                    inputProps={{ 'aria-label': 'URGENT' }}
                  />
                }
                label="Demande urgente"
                labelPlacement="start"
                classes={{ label: 'urgent-switch' }}
              />
            </FormGroup>
            <div className="request__form__container">
              <h1 className="request__form__container__title">
                Séléctionnez le métier concerné*
              </h1>
              <InfoPop isRequestJob={true} />
            </div>
            <Stack
              spacing={2}
              sx={{
                width: {
                  xs: '100%', // 80% width for screen sizes below 900px
                  sm: '80%', // 80% width for screen sizes 600px and above
                  md: '50%', // 50% width for screen sizes 900px and above
                },
              }}
            >
              <Autocomplete
                id="jobs"
                freeSolo
                options={jobStore}
                getOptionLabel={(option: string | JobProps) =>
                  typeof option === 'string' ? option : option.name
                }
                renderOption={(props, option) => {
                  return (
                    <li {...props} key={option.id}>
                      {option.name}
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={searchedJob ? '' : 'Rechercher'}
                    inputRef={(node) => {
                      // Assign the input element to the inputRef to close the keyboard on mobile
                      inputRef.current = node; // input element to reference
                      if (typeof params.inputProps.ref === 'function') {
                        params.inputProps.ref(node); // Connect the input element to the Autocomplete
                      }
                    }}
                  />
                )}
                className="custom-autocomplete"
                sx={autocompleteSx({ isValidate: !!searchedJob })}
                onInputChange={(event, newInputValue) => {
                  event.preventDefault();
                  setInputValue(newInputValue);
                  if (newInputValue === '') {
                    setSearchedJob(null); // Clear when click on cross clear button
                    setInputValue('');
                  }
                }}
                inputValue={searchedJob?.name ?? inputValue}
                onChange={(event, value) => {
                  if (value && typeof value !== 'string') setSearchedJob(value);
                  // use blur to close the keyboard on mobile
                  if (inputRef.current) {
                    inputRef.current.blur();
                  }
                  event.preventDefault();
                }}
                slots={{
                  popper: (props) => (
                    <Popper
                      {...props}
                      modifiers={[
                        {
                          name: 'offset',
                          options: {
                            offset: [0, 9], // Move popper down by 9px
                          },
                        },
                      ]}
                      sx={popperSx}
                    />
                  ),
                }}
              />
            </Stack>
            <p className="request__form__or">ou</p>
            <SelectBox
              data={categoriesJobsStore}
              selected={selectedCategory}
              isCategory={true}
              loading={categoryLoading}
              setSelected={(value: CategoryProps | JobProps) => {
                if ('id' in value) {
                  setSelectedCategory(value.id);
                }
              }}
            />

            <SelectBox
              data={jobStore}
              isCategory={false}
              selected={selectedJobByCategory ? selectedJobByCategory.id : 0}
              loading={JobDataLoading}
              setSelected={(value: JobProps | CategoryProps) => {
                if ('category_id' in value) {
                  setSelectedJobByCategory(value as JobProps);
                  setSearchedJob(null);
                  setInputValue('');
                }
              }}
              selectedCategory={selectedCategory}
            />

            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    id="push-permission-switch"
                    color="warning"
                    checked={isOtherAddress}
                    onChange={(event) =>
                      setIsOtherAddress(event.target.checked)
                    }
                    inputProps={{
                      'aria-label': 'Adresse différente du compte',
                    }}
                  />
                }
                label="Adresse différente du compte"
                labelPlacement="start"
                classes={{ label: 'custom-label' }}
              />
            </FormGroup>
            <AnimatePresence>
              {isOtherAddress && (
                <motion.div
                  className="request__form__other-address"
                  layout
                  style={{ overflow: 'hidden' }}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.1, type: 'tween' }}
                >
                  <div className="request__form__other-address__form">
                    {otherAddressLoading && <Spinner />}
                    <label className="request__form__label other-address">
                      <input
                        className="request__form__label__input title"
                        name="adresse"
                        aria-label="Adresse"
                        title="adresse"
                        type="text"
                        placeholder="Adresse"
                        value={addressOther}
                        onChange={(event) =>
                          setAddressOther(
                            DOMPurify.sanitize(event.target.value)
                          )
                        }
                        maxLength={100}
                      />
                    </label>
                    <label className="request__form__label other-address">
                      <input
                        className="request__form__label__input title"
                        name="postal_code"
                        aria-label="Code postal"
                        title="Code postal"
                        type="text"
                        placeholder="Code postal"
                        value={postalCodeOther}
                        onChange={(event) =>
                          setPostalCodeOther(
                            DOMPurify.sanitize(event.target.value)
                          )
                        }
                        maxLength={10}
                      />
                    </label>
                    <label className="request__form__label other-address">
                      <input
                        className="request__form__label__input title"
                        name="city"
                        aria-label="Ville"
                        title="Ville"
                        type="text"
                        placeholder="Ville"
                        value={cityOther}
                        onChange={(event) =>
                          setCityOther(DOMPurify.sanitize(event.target.value))
                        }
                        maxLength={100}
                      />
                    </label>
                    <AnimatePresence>
                      {(successLocation || errorLocation) && (
                        <motion.div
                          className="message"
                          layout
                          style={{ overflow: 'hidden' }}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.1, type: 'tween' }}
                        >
                          <Stack sx={{ width: '100%' }} spacing={2}>
                            {successLocation && (
                              <Fade in={!!successLocation} timeout={300}>
                                <Alert variant="filled" severity="success">
                                  {successLocation}
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
                          </Stack>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <button
                      className="request__form__other-address__button"
                      type="button"
                      onClick={updateAdress}
                      disabled={createLoading}
                      aria-label="Valider l'adresse"
                      title="Valider l'adresse"
                    >
                      Valider l'adresse
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {lngState && latState && (
              <>
                <h1 className="request__form__title radius">
                  Dans un rayon autour de*
                </h1>
                <label className="request__form__label-radius">
                  {radius === 0
                    ? 'Toute la france'
                    : `Autour de moi: ${radius / 1000} Km`}
                  <Box
                    className="request__slider-container"
                    sx={{ width: 250 }}
                  >
                    <Slider
                      aria-labelledby="radius-slider-label"
                      defaultValue={105}
                      aria-valuetext={
                        radius === 0
                          ? 'Toute la France'
                          : `${radius / 1000} Km autour de moi`
                      }
                      aria-label="Distance de recherche"
                      valueLabelDisplay="auto"
                      value={radius === 0 ? 105 : radius / 1000}
                      step={5}
                      marks
                      min={5}
                      max={105}
                      onChange={(_, value) =>
                        setRadius(
                          (value as number) === 105
                            ? 0
                            : (value as number) * 1000
                        )
                      }
                      valueLabelFormat={(value) =>
                        value === 105 ? 'France' : `${value} Km`
                      }
                    />
                  </Box>
                </label>
                <div className="request__form__map">
                  <div
                    id="map"
                    ref={mapContainerRef}
                    className="request__form__map__map"
                  >
                    {isLoading && <Spinner />}
                  </div>
                </div>
              </>
            )}
            <h1 className="request__form__title">Saisissez le titre*</h1>
            <label className="request__form__label">
              <input
                className="request__form__label__input title"
                name="title"
                aria-label="Titre de la demande"
                title="Titre de la demande (50 caractères maximum)"
                type="text"
                placeholder="Titre de la demande (50 caractères maximum)"
                value={titleRequest}
                onChange={(event) =>
                  setTitleRequest(DOMPurify.sanitize(event.target.value))
                }
                maxLength={50}
              />
            </label>
            <h1 className="request__form__title">Décrivez votre demande*</h1>
            <label className="request__form__label">
              <TextareaAutosize
                className="request__form__label__input textarea"
                name="description"
                id="description"
                placeholder="Description de la demande, donnez le plus d'informations possible ainsi que la date souhaitée"
                value={descriptionRequest}
                maxLength={500}
                aria-label="Description de la demande 500 caractères maximum"
                onChange={(event) =>
                  setDescriptionRequest(DOMPurify.sanitize(event.target.value))
                }
              ></TextareaAutosize>
              <p className="request__form__label__input length">
                {descriptionRequest?.length}/500
              </p>
            </label>
            <div className="request__form__input-media">
              <AnimatePresence mode="popLayout">
                {urlFile.map((file, index) => (
                  <motion.div
                    className="request__form__input-media__container"
                    key={index}
                    layout
                    style={{ overflow: 'scroll' }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2, type: 'Spring' }}
                  >
                    <div className="request__form__input-media-content__container">
                      <img
                        className={`request__form__input-media-content__container preview ${file.file.type === 'application/pdf' ? 'pdf' : ''}`}
                        style={{
                          width: '100px',
                          height: '100px',
                          objectFit: 'cover',
                        }}
                        src={
                          file.file.type === 'application/pdf'
                            ? pdfLogo
                            : file.url
                        }
                        alt={`Preview ${index}`}
                        title={`Prévisualisation du fichier ${index + 1}`}
                      />
                      {file.file.type === 'application/pdf' && (
                        <div className="pdf-name-container">
                          <p className="pdf-name">{file.file.name}</p>
                        </div>
                      )}
                    </div>
                    <button
                      className="request__form__input-media__container remove"
                      onClick={(event) => {
                        handleRemove(index),
                          event.stopPropagation(),
                          event.preventDefault();
                      }}
                    >
                      X
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {/* <p className="request__form error">{uploadFileError}</p> */}
            <div className="upload-message">
              <Stack sx={{ width: '100%' }} spacing={2}>
                {uploadFileError && (
                  <Fade in={!!uploadFileError} timeout={300}>
                    <Alert variant="filled" severity="error">
                      {uploadFileError}
                    </Alert>
                  </Fade>
                )}
              </Stack>
            </div>
            <h1 className="request__form__title media">
              (Optionnel) ajoutez des photos pour des réponses plus précises (3
              maximum):
            </h1>
            <label
              htmlFor="file"
              className="request__form__label-file"
              onDragOver={(event) => event.preventDefault()}
              onDragEnter={(event) => event.preventDefault()}
              onDrop={handleFileUpload}
              aria-label="Ajouter des fichiers"
              title="Glissez et déposez vos fichiers ici ou cliquez pour les sélectionner"
            >
              <span>
                <svg
                  xmlSpace="preserve"
                  viewBox="0 0 184.69 184.69"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  xmlns="http://www.w3.org/2000/svg"
                  id="Capa_1"
                  version="1.1"
                  width="60px"
                  height="60px"
                >
                  <title id="upload-icon">
                    Icône de téléchargement de fichier
                  </title>
                  <g>
                    <g>
                      <g>
                        <path
                          d="M149.968,50.186c-8.017-14.308-23.796-22.515-40.717-19.813
				C102.609,16.43,88.713,7.576,73.087,7.576c-22.117,0-40.112,17.994-40.112,40.115c0,0.913,0.036,1.854,0.118,2.834
				C14.004,54.875,0,72.11,0,91.959c0,23.456,19.082,42.535,42.538,42.535h33.623v-7.025H42.538
				c-19.583,0-35.509-15.929-35.509-35.509c0-17.526,13.084-32.621,30.442-35.105c0.931-0.132,1.768-0.633,2.326-1.392
				c0.555-0.755,0.795-1.704,0.644-2.63c-0.297-1.904-0.447-3.582-0.447-5.139c0-18.249,14.852-33.094,33.094-33.094
				c13.703,0,25.789,8.26,30.803,21.04c0.63,1.621,2.351,2.534,4.058,2.14c15.425-3.568,29.919,3.883,36.604,17.168
				c0.508,1.027,1.503,1.736,2.641,1.897c17.368,2.473,30.481,17.569,30.481,35.112c0,19.58-15.937,35.509-35.52,35.509H97.391
				v7.025h44.761c23.459,0,42.538-19.079,42.538-42.535C184.69,71.545,169.884,53.901,149.968,50.186z"
                          fill="#010002"
                        ></path>
                      </g>
                      <g>
                        <path
                          d="M108.586,90.201c1.406-1.403,1.406-3.672,0-5.075L88.541,65.078
				c-0.701-0.698-1.614-1.045-2.534-1.045l-0.064,0.011c-0.018,0-0.036-0.011-0.054-0.011c-0.931,0-1.85,0.361-2.534,1.045
				L63.31,85.127c-1.403,1.403-1.403,3.672,0,5.075c1.403,1.406,3.672,1.406,5.075,0L82.296,76.29v97.227
				c0,1.99,1.603,3.597,3.593,3.597c1.979,0,3.59-1.607,3.59-3.597V76.165l14.033,14.036
				C104.91,91.608,107.183,91.608,108.586,90.201z"
                          fill="#010002"
                        ></path>
                      </g>
                    </g>
                  </g>
                </svg>
              </span>
              <p>
                Glissez et déposez votre fichier ici ou cliquez pour
                sélectionner un fichier! (Format accepté : jpg, jpeg, png, pdf
                (pdf inférieur à 1Mo))
              </p>
            </label>
            <input
              id="file"
              className="request__form__input-media file"
              name="text"
              type="file"
              multiple={true}
              onClick={(event) => {
                event.currentTarget.value = '';
              }}
              onChange={handleFileUpload}
              accept="image/png, image/jpeg, image/jpg, application/pdf"
              aria-label="Téléchargez plusieurs fichiers (formats acceptés : jpg, jpeg, png, pdf)"
              title="Téléchargez des fichiers"
            />
            <input
              id="fileInput"
              className="request__form__input-media camera"
              type="file"
              accept="image/png, image/jpeg, image/jpg, application/pdf"
              capture="environment"
              onClick={(event) => {
                event.currentTarget.value = '';
              }}
              onChange={handleFileUpload}
              aria-label="Prendre une photo via la caméra"
              title="Prendre une photo via la caméra"
            />
            <FaCamera
              className="request__form__input-media camera-icone "
              onClick={() => document.getElementById('fileInput')?.click()}
              aria-label="Icône de caméra pour prendre une photo"
              title="Prendre une photo avec la caméra"
            />

            <div className="message">
              <Stack sx={{ width: '100%' }} spacing={2}>
                {successMessage && (
                  <Fade in={!!successMessage} timeout={300}>
                    <Alert variant="filled" severity="success">
                      {successMessage}
                    </Alert>
                  </Fade>
                )}
                {errorMessage && (
                  <Fade in={!!errorMessage} timeout={300}>
                    <Alert variant="filled" severity="error">
                      {errorMessage}
                    </Alert>
                  </Fade>
                )}
                {fileError && (
                  <Fade in={!!fileError} timeout={300}>
                    <Alert variant="filled" severity="error">
                      {fileError}
                    </Alert>
                  </Fade>
                )}
                {(createLoading || isCreateRequestLoading) && (
                  <Spinner className="small-spinner" />
                )}
              </Stack>
            </div>
            <button
              className="request__form__button"
              type="submit"
              disabled={createLoading}
              aria-label="Envoyer le formulaire de demande"
              title="Envoyer"
            >
              Envoyer
            </button>
          </form>
        )}
      </div>
    </Grow>
  );
}

export default Request;
