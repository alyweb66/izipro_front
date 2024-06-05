import { useEffect, useState } from 'react';
import { useQueryCategory, useQueryJobs } from '../../Hook/Query';
import { useMutation } from '@apollo/client';
import { REQUEST_MUTATION } from '../../GraphQL/RequestMutation';
import { userDataStore } from '../../../store/UserData';
import { CategoryPros, JobProps } from '../../../Type/Request';
import DOMPurify from 'dompurify';
import Map from 'react-map-gl';
//@ts-expect-error no types for mapbox-gl
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useFileHandler } from '../../Hook/useFileHandler';
import { TbUrgent } from 'react-icons/tb';
import { FaCamera } from 'react-icons/fa';

import './Request.scss';
import Spinner from '../../Hook/Spinner';
import pdfLogo from '/logo/pdf-icon.svg';



function Request() {


	//store
	const id = userDataStore((state) => state.id);
	const address = userDataStore((state) => state.address);
	const city = userDataStore((state) => state.city);
	const lng = userDataStore((state) => state.lng);
	const lat = userDataStore((state) => state.lat);
	const first_name = userDataStore((state) => state.first_name);
	const last_name = userDataStore((state) => state.last_name);
	const postal_code = userDataStore((state) => state.postal_code);

	//state
	const [urgent, setUrgent] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState('');
	const [selectedJob, setSelectedJob] = useState('');
	const [titleRequest, setTitleRequest] = useState('');
	const [descriptionRequest, setDescriptionRequest] = useState('');
	const [errorMessage, setErrorMessage] = useState('');
	const [successMessage, setSuccessMessage] = useState('');
	//const [description, setDescription] = useState('');

	// file upload
	const { fileError, file, setFile, setUrlFile, urlFile, handleFileChange } = useFileHandler();

	// map
	const [radius, setRadius] = useState(0); // Radius in meters
	//const [location, setLocation] = useState(localization);
	const [map, setMap] = useState<mapboxgl.Map | null>(null);
	const [zoom, setZoom] = useState(10);


	// mutation
	const [createRequest, { loading: createLoading, error: requestError }] = useMutation(REQUEST_MUTATION);

	// fetch categories 
	const { loading: categoryLoading, categoriesData } = useQueryCategory();

	// fetch jobs
	const { loading: JobDataLoading, jobData } = useQueryJobs(selectedCategory);

	// remove file
	const handleRemove = (index: number) => {
		// Remove file from file list
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

		// check if all fields are filled
		let timer: number | undefined;
		if (!titleRequest || !descriptionRequest || !selectedJob) {
			setErrorMessage('Veuillez remplir tous les champs');
			timer = setTimeout(() => {
				setErrorMessage('');
			}, 5000); // 5000ms = 5s

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
					setSuccessMessage('Demande envoyée avec succès');
					timer = setTimeout(() => {
						setSuccessMessage('');
					}, 5000); // 5000ms = 5s
					setTitleRequest('');
					setDescriptionRequest('');
					setFile([]);
					setUrlFile([]);
					setRadius(0);
					setSelectedCategory('');
					setSelectedJob('');
					setUrgent(false);
				}
			});
			clearTimeout(timer);

		}
		if (requestError) {
			throw new Error('Error while creating request');
		}
	};


	// radius on map
	useEffect(() => {
		if (map && lat && lng) {
			// Remove existing circles
			if (map.getLayer('radius-circle') && map.getSource('radius-circle')) {
				map.removeLayer('radius-circle');
				map.removeSource('radius-circle');
			}

			// Add circle layer
			map.addLayer({
				id: 'radius-circle',
				type: 'circle',
				source: {
					type: 'geojson',
					data: {
						type: 'Feature',
						geometry: {
							type: 'Point',
							coordinates: [lng, lat]
						}
					}
				},
				paint: {
					'circle-radius': {

						stops: [
							[0, 0],
							[15.8, radius] // Adjust the multiplier for scaling
						],
						base: 2
					},
					'circle-color': 'orange',
					'circle-opacity': 0.3
				}
			});
		}
	}, [map, lng, lat, radius]);

	// Get map instance
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const handleMapLoaded = (event: any) => {
		setMap(event.target);
	};

	// Handle file upload
	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (urlFile.length < 3) {
			handleFileChange(event);
		}
	};

	// Handle file drop
	const handleFileDrop = (event: React.DragEvent<HTMLLabelElement>) => {
		event.preventDefault(); // Get dropped files
		if (urlFile.length < 3) {
			const onDrag = true;
			handleFileChange(event, onDrag); // Use your existing file handler
		}
	};
	// Update zoom level when radius changes
	useEffect(() => {
		const mediaQuery = window.matchMedia('(max-width: 450px)');

		if (mediaQuery.matches) {
			if (radius <= 5000) {
				setZoom(10.5);
			} else if (radius <= 10000) {
				setZoom(9.5);
			} else if (radius <= 15000) {
				setZoom(9);
			} else if (radius <= 20000) {
				setZoom(8.5);
			} else if (radius <= 25000) {
				setZoom(8.2);
			} else if (radius <= 35000) {
				setZoom(7.9);
			} else if (radius <= 40000) {
				setZoom(7.7);
			} else if (radius <= 45000) {
				setZoom(7.5);
			} else if (radius <= 50000) {
				setZoom(7.4);
			} else if (radius <= 60000) {
				setZoom(6.9);
			} else if (radius <= 100000) {
				setZoom(6.4);
			} else {
				setZoom(6);
			}
		} else {
			if (radius <= 5000) {
				setZoom(11);
			} else if (radius <= 10000) {
				setZoom(10);
			} else if (radius <= 15000) {
				setZoom(9.5);
			} else if (radius <= 20000) {
				setZoom(9);
			} else if (radius <= 25000) {
				setZoom(8.5);
			} else if (radius <= 35000) {
				setZoom(8);
			} else if (radius <= 40000) {
				setZoom(8);
			} else if (radius <= 45000) {
				setZoom(7.7);
			} else if (radius <= 60000) {
				setZoom(7);
			} else if (radius <= 100000) {
				setZoom(6.8);
			} else {
				setZoom(7);
			}
		}
	}, [radius]);

	return (
		<div className="request">
			{categoryLoading || JobDataLoading || createLoading && <Spinner />}

			{(!address && !city && !postal_code && !first_name && !last_name) &&
				(<p>Veuillez renseigner votre nom, prénom et adresse dans votre compte pour faire une demande</p>)}
			{address && city && postal_code && first_name && last_name && (
				<form className="request__form" onSubmit={handleSubmitRequest}>
					<h2 className="request__form__title urgent">Si votre demande est une urgence cliquez sur URGENT:</h2>
					<button
						className={`urgent-button ${urgent ? 'active' : ''}`}
						onClick={(event) => {
							event.preventDefault();
							setUrgent(!urgent);
						}
						}
					>URGENT
						<TbUrgent className="urgent-icon" /></button>
					<h2 className="request__form__title">Séléctionnez la catégorie et le métier concerné:</h2>
					<select
						className="request__form__select"
						name="job"
						id="job"
						value={selectedCategory}
						onChange={(event) => setSelectedCategory(event.target.value)}
					>
						<option value="">Catégorie</option>
						{categoriesData && categoriesData.categories.map((category: CategoryPros, index: number) => (
							<option key={index} value={category.id}>
								{category.name}
							</option>

						))}
					</select>
					<select
						className="request__form__select"
						name="job"
						id="job"
						value={selectedJob}
						onChange={(event) => setSelectedJob(event.target.value)}
					>
						<option value="">Métiers</option>
						{jobData && jobData.category.jobs.map((job: JobProps, index: number) => (

							<option
								key={index}
								value={job.id}
								title={job.description}
							>
								{job.name}
							</option>
						))}

					</select>
					{lng && lat && (
						<>
							<h2 className="request__form__title radius">Séléctionnez une distance:</h2>
							<label className="request__form__label-radius" htmlFor="radius">
								{radius === 0 ? 'Toute la france' : `Autour de moi: ${radius / 1000} Km`}
							</label>
							<input
								className="request__form__input-radius"
								id="radius"
								type="range"
								min="0"
								max="100000"
								step="5000"
								value={radius}
								onChange={e => setRadius(Number(e.target.value))}
							/>

							<div className="request__form__map">

								<div className="request__form__map__map">
									<Map
										mapboxAccessToken="pk.eyJ1IjoiYWx5d2ViIiwiYSI6ImNsdTcwM2xnazAwdHMya3BpamhmdjRvM3AifQ.V3d3rCH-FYb4s_e9fIzNxg"
										initialViewState={{
											longitude: lng,
											latitude: lat,
											zoom: zoom
										}}
										zoom={zoom}
										scrollZoom={false}
										mapStyle="mapbox://styles/mapbox/streets-v9"
										onLoad={handleMapLoaded}
										dragRotate={false}
									/>
								</div>

							</div>
						</>
					)}
					<h2 className="request__form__title">Saisissez le titre:</h2>

					<label className="request__form__label">
						<input
							className="request__form__label__input title"
							type="text"
							placeholder="Titre de la demande (50 caractères maximum)"
							value={titleRequest}
							onChange={(event) => setTitleRequest(event.target.value)}
							maxLength={50}
						/>
					</label>
					<h2 className="request__form__title">Décrivez votre demande:</h2>
					<label className="request__form__label">
						<textarea
							className="request__form__label__input textarea"
							name="description"
							id="description"
							placeholder="Description de la demande (500 caractères maximum)"
							value={descriptionRequest}
							maxLength={500}
							aria-label="Description de la demande 500 caractères maximum"
							onChange={(event) => setDescriptionRequest(event.target.value)}
						>
						</textarea>
						<p>{descriptionRequest?.length}/500</p>
					</label>
					<div className="request__form__input-media">
						{urlFile.map((file, index) => (
							<div className="request__form__input-media container" key={index}>

								<img
									className="request__form__input-media preview"
									style={{ width: '100px', height: '100px', objectFit: 'cover' }}
									src={file.type === 'application/pdf' ? pdfLogo : file.name}
									alt={`Preview ${index}`}
								/>
								<div
									className="request__form__input-media remove"
									onClick={() => handleRemove(index)}
								>
									X
								</div>
							</div>
						))}
					</div>
					<h2 className="request__form__title media">Ajoutez des photos (3 maximum):</h2>
					<label
						htmlFor="file"
						className="request__form__label-file"
						onDragOver={(event) => event.preventDefault()}
						onDragEnter={(event) => event.preventDefault()}
						onDrop={handleFileDrop}
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
					/>
					<input
						id="fileInput"
						className="request__form__input-media camera"
						type="file"
						accept="image/*"
						capture="environment"
						onChange={handleFileUpload}
					/>
					<FaCamera
						className="request__form__input-media camera-icone "
						onClick={() => document.getElementById('fileInput')?.click()}
					/>

					<div className="message">
						{errorMessage && <p className="message__error">{errorMessage}</p>}
						{successMessage && <p className="message__success">{successMessage}</p>}
						{fileError && <p className="message__error">{fileError}</p>}
					</div>
					<button className="request__form__button" type="submit">Envoyer</button>
				</form>
			)}
		</div>
	);
}

export default Request;