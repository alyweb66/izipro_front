import { useEffect, useLayoutEffect, useRef, useState } from 'react';
//import Map, { Layer, Marker, Source } from 'react-map-gl';
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

// Types and icons
import { CategoryPros, JobProps } from '../../../Type/Request';
import pdfLogo from '/logo-pdf.webp';
//import { TbUrgent } from 'react-icons/tb';
import { FaCamera } from 'react-icons/fa';

// Utilities and styles
import DOMPurify from 'dompurify';
import TextareaAutosize from 'react-textarea-autosize';
import './Request.scss';
import Spinner from '../../Hook/Spinner';
import SelectBox from '../../Hook/SelectBox';
import { subscriptionDataStore } from '../../../store/subscription';
import { motion, AnimatePresence } from 'framer-motion';
//import { IoLocationSharp } from "react-icons/io5";
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Fade from '@mui/material/Fade';
import * as turf from '@turf/turf';
import { FormControlLabel, FormGroup, Grow, Switch } from '@mui/material';



function Request() {

	// Store
	const id = userDataStore((state) => state.id);
	const address = userDataStore((state) => state.address);
	const city = userDataStore((state) => state.city);
	const lng = userDataStore((state) => state.lng);
	const lat = userDataStore((state) => state.lat);
	const first_name = userDataStore((state) => state.first_name);
	const last_name = userDataStore((state) => state.last_name);
	const postal_code = userDataStore((state) => state.postal_code);
	const [myRequestsStore, setMyRequestsStore] = myRequestStore((state) => [state.requests, state.setMyRequestStore]);
	const [subscriptionStore, setSubscriptionStore] = subscriptionDataStore((state) => [state.subscription, state.setSubscription]);

	// State
	const [urgent, setUrgent] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState(0);
	const [selectedJob, setSelectedJob] = useState(0);
	const [titleRequest, setTitleRequest] = useState('');
	const [descriptionRequest, setDescriptionRequest] = useState('');
	const [errorMessage, setErrorMessage] = useState('');
	const [successMessage, setSuccessMessage] = useState('');
	const [uploadFileError, setUploadFileError] = useState('');
	const [categoriesState, setCategoriesState] = useState<CategoryPros[]>([]);
	const [jobsState, setJobsState] = useState<JobProps[]>([]);
	//const [isMobile, setIsMobile] = useState(window.matchMedia('(max-width: 450px)').matches);
	const [isLoading, setIsLoading] = useState(true);
	const [map, setMap] = useState<Map | null>(null);
	// Map
	const [radius, setRadius] = useState(0); // Radius in meters
	//const [zoom, setZoom] = useState(10);

	// File upload
	const { fileError, file, setFile, setUrlFile, urlFile, handleFileChange } = useFileHandler();

	// Ref
	const mapContainerRef = useRef<HTMLDivElement>(null);

	// Mutation
	const [createRequest, { loading: createLoading, error: requestError }] = useMutation(REQUEST_MUTATION);

	// Query
	const { loading: categoryLoading, categoriesData } = useQueryCategory();
	const { loading: JobDataLoading, jobData } = useQueryJobs(selectedCategory);

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
		if (!titleRequest || !descriptionRequest || !selectedJob) {
			setErrorMessage('Veuillez remplir tous les champs');
			setTimeout(() => {
				setErrorMessage('');
			}, 10000); // 10000ms = 10s

		} else {
			clearTimeout(timer);

			// map file to send to graphql
			const sendFile = file.map(file => ({
				file,
			}));

			createRequest({
				variables: {
					input: {
						urgent: urgent,
						title: DOMPurify.sanitize(titleRequest ?? ''),
						message: DOMPurify.sanitize(descriptionRequest ?? ''),
						city: city,
						lng: lng,
						lat: lat,
						range: radius,
						job_id: Number(selectedJob),
						user_id: id,
						media: sendFile
					}
				}
			}).then((response) => {

				if (response.data.createRequest) {

					// Add the new request to the store
					setMyRequestsStore([response.data.createRequest, ...myRequestsStore]);
					const newRequest = response.data.createRequest;

					// update subscriptionStore with the new request id
					if (subscriptionStore.some(subscription => subscription.subscriber === 'request')) {
						const newSubscription = subscriptionStore.map(subscription => {
							if (subscription.subscriber === 'request' && Array.isArray(subscription.subscriber_id) && !subscription.subscriber_id.includes(newRequest.id)) {

								// create new subscriber_id array
								const newSubscriberId = [...subscription.subscriber_id, newRequest.id];
								// Return new subscription
								return { ...subscription, subscriber_id: newSubscriberId };
								//subscription.subscriber_id.push(newRequest.id);
							}
							return subscription;
						});


						setSubscriptionStore(newSubscription);
					} else {
						setSubscriptionStore([...subscriptionStore, { subscriber: 'request', subscriber_id: [newRequest.id], user_id: id, created_at: new Date().toISOString() }]);
					}

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
					setSelectedJob(0);
					setUrgent(false);

				}
			});
			clearTimeout(timer);

		}
		if (requestError) {
			throw new Error('Error while creating request');
		}
	};


	// Handle file upload
	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement> & React.DragEvent<HTMLLabelElement>) => {
		event.preventDefault();
		setUploadFileError('');

		// Check if the number of files is less than 3
		const remainingSlots = 3 - urlFile.length;

		if ((event.target.files?.length ?? 0) > 3) {
			setUploadFileError('Nombre de fichiers maximum atteint');
		}

		if (event.target.files) {

			if (remainingSlots > 0) {
				const filesToUpload = Array.from(event.target.files).slice(0, remainingSlots);
				handleFileChange(undefined, undefined, filesToUpload as File[]);
			}
			if (remainingSlots <= 0) {
				setUploadFileError('Nombre de fichiers maximum atteint');
			}
		}
	};

	// Map instance
	useEffect(() => {
		if (mapContainerRef.current) {
		const MapInstance = new maplibregl.Map({
			container: 'map',
			style: import.meta.env.VITE_MAPLIBRE_URL,
			center: [lng ?? 0, lat ?? 0],
			zoom: 10,
			dragPan: false, // Disable dragging to pan the map
			scrollZoom: false, // Disable scroll zoom
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
				color: "#f37c04",
				scale: 0.8,
			})
				.setLngLat([lng ?? 0, lat ?? 0])
				.addTo(map as maplibregl.Map);

			// Create a circle around the center point
			let circle = null;
			if (lng !== null && lat !== null) {
				const center = turf.point([lng, lat]); // Crate center point
				circle = turf.circle(center, radius / 1000, { steps: 100, units: 'kilometers' }); // Create a circle from the center point
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
				const bounds = turf.bbox(circle).slice(0, 4) as [number, number, number, number]; // Get circle bounds
				if (bounds) {
					map.fitBounds(bounds, { padding: 20, duration: 500 });
				}
			}
		}
	}, [map, radius, lng, lat]);

	// Update jobs when category changes
	useEffect(() => {
		if (jobData) {

			setJobsState(jobData.category.jobs);
		}
	}, [jobData]);

	// Update categories when data is fetched
	useEffect(() => {
		if (categoriesData) {
			setCategoriesState(categoriesData.categories);
		}
	}, [categoriesData]);

	// reset selected job when category changes
	useEffect(() => {
		if (selectedCategory) {
			setSelectedJob(0);
		}
	}, [selectedCategory]);


	return (
		<Grow in={true} timeout={200}>
			<div className="request">
				{categoryLoading && <Spinner />}

				{(!address && !city && !postal_code && !first_name && !last_name) &&
					(<p className="request no-req">Veuillez renseigner les champs de &quot;Mes informations&quot; dans votre compte pour faire une demande</p>)}
				{address && city && postal_code && first_name && last_name && (
					<form
						className="request__form"
						onSubmit={handleSubmitRequest}
						aria-label="Formulaire de demande"

					>
						{/* <h1 className="request__form__title urgent">Si votre demande est une urgence cliquez sur URGENT:</h1> */}
						<FormGroup>
							<FormControlLabel
								control={<Switch
									id="urgent-switch"
									sx={{
										'& .MuiSwitch-switchBase.Mui-checked': {
											color: 'red',
											'&:hover': {
												backgroundColor: 'rgba(255, 0, 0, 0.08)',
											},
										},
										'& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
											backgroundColor: 'red',
										},
									}}
									checked={urgent}
									onChange={(event) => setUrgent(event.target.checked)}
									inputProps={{ 'aria-label': 'URGENT' }}
								/>}
								label="Demande urgente"
								labelPlacement="start"
								classes={{ label: 'urgent-switch' }}
							/>
						</FormGroup>
						{/* <button
							className={`urgent-button ${urgent ? 'active' : ''}`}
							title="Marquer comme demande urgente"
							onClick={(event) => {
								event.preventDefault();
								setUrgent(!urgent);
							}
							}
						>URGENT
							<TbUrgent className="urgent-icon" aria-label="Icône de demande urgente" /></button> */}
						<h1 className="request__form__title">Séléctionnez la catégorie et le métier concerné:</h1>
						<SelectBox
							data={categoriesState}
							selected={selectedCategory}
							isCategory={true}
							loading={categoryLoading}
							setSelected={setSelectedCategory}
						/>

						<SelectBox
							data={jobsState}
							isCategory={false}
							selected={selectedJob}
							loading={JobDataLoading}
							setSelected={setSelectedJob}
						/>

						{lng && lat && (
							<>
								<h1 className="request__form__title radius">Séléctionnez une distance:</h1>
								<label className="request__form__label-radius">
									{radius === 0 ? 'Toute la france' : `Autour de moi: ${radius / 1000} Km`}
									<Box className="request__slider-container" sx={{ width: 250 }}>
										<Slider
											aria-labelledby="radius-slider-label"
											defaultValue={105}
											aria-valuetext={radius === 0 ? 'Toute la France' : `${radius / 1000} Km autour de moi`}
											aria-label="Distance de recherche"
											valueLabelDisplay="auto"
											value={radius === 0 ? 105 : radius / 1000}
											step={5}
											marks
											min={5}
											max={105}
											onChange={(_, value) => setRadius((value as number) === 105 ? 0 : (value as number) * 1000)}
											valueLabelFormat={(value) => value === 105 ? 'France' : `${value} Km`}
										/>
									</Box>
								</label>
								<div className="request__form__map">

									<div id="map" ref={mapContainerRef} className="request__form__map__map">
										{isLoading && <Spinner />}
									</div>
								</div>
							</>
						)}
						<h1 className="request__form__title">Saisissez le titre:</h1>
						<label className="request__form__label">
							<input
								className="request__form__label__input title"
								name="title"
								aria-label="Titre de la demande"
								title="Titre de la demande (50 caractères maximum)"
								type="text"
								placeholder="Titre de la demande (50 caractères maximum)"
								value={titleRequest}
								onChange={(event) => setTitleRequest(event.target.value)}
								maxLength={50}
							/>
						</label>
						<h1 className="request__form__title">Décrivez votre demande:</h1>
						<label className="request__form__label">
							<TextareaAutosize
								className="request__form__label__input textarea"
								name="description"
								id="description"
								placeholder="Description de la demande (500 caractères maximum)"
								value={descriptionRequest}
								maxLength={500}
								aria-label="Description de la demande 500 caractères maximum"
								onChange={(event) => setDescriptionRequest(event.target.value)}
							>
							</TextareaAutosize>
							<p className="request__form__label__input length">{descriptionRequest?.length}/500</p>
						</label>
						<div className="request__form__input-media">
							<AnimatePresence mode='popLayout'>
								{urlFile.map((file, index) => (
									<motion.div
										className="request__form__input-media container"
										key={index}
										layout
										style={{ overflow: 'scroll' }}
										initial={{ opacity: 0, scale: 0.9 }}
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: 0.9 }}
										transition={{ duration: 0.2, type: 'Spring' }}
									>

										<img
											className="request__form__input-media preview"
											style={{ width: '100px', height: '100px', objectFit: 'cover' }}
											src={file.type === 'application/pdf' ? pdfLogo : file.name}
											alt={`Preview ${index}`}
											title={`Prévisualisation du fichier ${index + 1}`}
										/>
										<div
											className="request__form__input-media remove"
											onClick={() => handleRemove(index)}
										>
											X
										</div>
									</motion.div>
								))}
							</AnimatePresence>
						</div>
						{/* <p className="request__form error">{uploadFileError}</p> */}
						<div className="upload-message">
							<Stack sx={{ width: '100%' }} spacing={2}>
								{uploadFileError && (
									<Fade in={!!uploadFileError} timeout={300}>
										<Alert variant="filled" severity="error">{uploadFileError}</Alert>
									</Fade>
								)}
							</Stack>
						</div>
						<h1 className="request__form__title media">Ajoutez des photos (3 maximum):</h1>
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
									<title id="upload-icon">Icône de téléchargement de fichier</title>
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
							<p>Glissez et déposez votre fichier ici ou cliquez pour sélectionner un fichier! (Format accepté : .jpg,.jpeg,.png,.pdf, pdf inférieur à 1Mo)</p>
						</label>
						<input
							id="file"
							className="request__form__input-media file"
							name="text"
							type="file"
							multiple={true}
							onChange={handleFileUpload}
							accept=".jpg,.jpeg,.png,.pdf"
							aria-label="Téléchargez plusieurs fichiers (formats acceptés : .jpg, .jpeg, .png, .pdf)"
							title="Téléchargez des fichiers"
						/>
						<input
							id="fileInput"
							className="request__form__input-media camera"
							type="file"
							accept="image/*"
							capture="environment"
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
										<Alert variant="filled" severity="success">{successMessage}</Alert>
									</Fade>
								)}
								{errorMessage && (
									<Fade in={!!errorMessage} timeout={300}>
										<Alert variant="filled" severity="error">{errorMessage}</Alert>
									</Fade>
								)}
								{fileError && (
									<Fade in={!!fileError} timeout={300}>
										<Alert variant="filled" severity="error">{fileError}</Alert>
									</Fade>
								)}
								{createLoading && <Spinner className="small-spinner" />}
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