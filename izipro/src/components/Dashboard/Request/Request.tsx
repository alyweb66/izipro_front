import { useEffect, useState } from 'react';
import './Request.scss';
import { GET_JOBS_BY_CATEGORY, GET_JOB_CATEGORY } from '../../GraphQL/RequestQueries';
import { useMutation, useQuery } from '@apollo/client';
import { REQUEST_MUTATION } from '../../GraphQL/RequestMutation';
import { userDataStore } from '../../../store/UserData';
import DOMPurify from 'dompurify';
import Map from 'react-map-gl';
//@ts-expect-error no types for mapbox-gl
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';


type CategoryPros = {
	id: number;
	name: string;
}

type jobProps = {
	id: number;
    name: string;
    description: string;
}

type LocationProps = {
	lat: number | null;
	lng: number | null;
}

function Request() {
	//state
	const [urgent, setUrgent] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState('');
	const [selectedJob, setSelectedJob] = useState('');
	const [titleRequest, setTitleRequest] = useState('');
	const [descriptionRequest, setDescriptionRequest] = useState('');
	const [errorMessage, setErrorMessage] = useState('');
	const [successMessage, setSuccessMessage] = useState('');
	// map
	const [radius, setRadius] = useState(0); // Radius in meters
	const [location, setLocation] = useState<LocationProps>({ lng: null, lat: null });
	const [error, setError] = useState('');
	const [map, setMap] = useState<mapboxgl.Map | null>(null);
	const [zoom, setZoom] = useState(10);

	
	//store
	const id = userDataStore((state) => state.id);
	const address = userDataStore((state) => state.address);
	const city = userDataStore((state) => state.city);
	const postal_code = userDataStore((state) => state.postal_code);

	// mutation
	const [createRequest, { error: requestError }] = useMutation(REQUEST_MUTATION);
	
	// fetch categories 
	const { error: categoryError, data: categoriesData} = useQuery(GET_JOB_CATEGORY);
	if (categoryError) {
		throw new Error('Error while fetching categories data');
	}

	// fetch jobs
	const { error: jobError, data: jobData} = useQuery(GET_JOBS_BY_CATEGORY,
		{
			variables:{
				categoryId: Number(selectedCategory)
			},
			skip: !selectedCategory
		});

	if (jobError) {
		throw new Error('Error while fetching jobs');
	}

	// Submit request
	const handleSubmitRequest = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		// check if all fields are filled
		let timer: number | undefined;
		if (!titleRequest || !descriptionRequest || !selectedJob) {
			setErrorMessage('Veuiilez remplir tous les champs');
			timer = setTimeout(() => {
				setErrorMessage('');
			}, 5000); // 5000ms = 5s

		} else {
			clearTimeout(timer);
		
			createRequest({
				variables: {
					input: {
						urgent: urgent,
						title: DOMPurify.sanitize(titleRequest ?? ''),
						message: DOMPurify.sanitize(descriptionRequest ?? ''),
						localization: location,
						range: radius / 1000,
						job_id: Number(selectedJob),
						user_id: id
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
				}
			});
			clearTimeout(timer);

		} 
	

		if (requestError) {
			throw new Error('Error while creating request');
		}
	};

	// location
	useEffect(() => {

		if ( address && city && postal_code) {
		// transform address to coordinates with Mapbox API
			const fetchGeocoding = async () => {
				const formattedAddress = `${address}, ${postal_code} ${city}`;
				const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(formattedAddress)}.json?access_token=pk.eyJ1IjoiYWx5d2ViIiwiYSI6ImNsdTcwM2xnazAwdHMya3BpamhmdjRvM3AifQ.V3d3rCH-FYb4s_e9fIzNxg`;
		
				const response = await fetch(url);
				const data = await response.json();

				if (data.features && data.features.length > 0) {
					const [longitude, latitude] = data.features[0].geometry.coordinates;
					setLocation({ lng: longitude, lat: latitude });
					return { latitude, longitude };
				} else {
					throw new Error('Unable to geocode address');
				}
			};
			fetchGeocoding();

		} else {

			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(
					(position) => {
						setLocation({
							lat: position.coords.latitude,
							lng: position.coords.longitude,
						});
					},
					(error) => {
						setError(error.message);
					},
				);
			} else {
				// Geolocation is not supported
				setError('Geolocation is not supported by your browser');
			} 
		}
	}, [address, city, postal_code]);

	// radius on map
	useEffect(() => {
		if (map && location.lat && location.lng) {
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
							coordinates: [location.lng, location.lat]
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
	}, [map, location, radius]);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const handleMapLoaded = (event: any) => {
		setMap(event.target);
	};

	// Update zoom level when radius changes
	useEffect(() => {
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
	}, [radius]);

	return (
		<div className="request-container">
			<form className="request-form" onSubmit={handleSubmitRequest}>
				{error && <p className="error-message">{error}</p>}
				<button 
					className={`urgent-button ${urgent ? 'urgent-button-active' : ''}`}
					onClick={(event) => {
						event.preventDefault();
						setUrgent(!urgent);}
					}
				>Urgent</button>
				<select 
					className="job-select" 
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
					className="category_select" 
					name="job" 
					id="job"
					value={selectedJob}
					onChange={(event)=> setSelectedJob(event.target.value)}
				>	
					<option value="">Métiers</option>
					{jobData && jobData.category.jobs.map((job: jobProps, index: number) =>(

						<option 
							key={index} 
							value={job.id}
							title={job.description}
						>
							{job.name}
						</option>
					))}

				</select>
				{location.lng && location.lat && (
					<>
						<label htmlFor="radius">
							<p>Selectionnez une distance:</p>
							{radius === 0 ? 'Toute la france' : `Autour de moi: ${radius / 1000} Km`}
						</label>
						<input
							id="radius"
							type="range"
							min="0"
							max="100000"
							step="5000"
							value={radius}
							onChange={e => setRadius(Number(e.target.value))}
						/>
						<Map
							mapboxAccessToken="pk.eyJ1IjoiYWx5d2ViIiwiYSI6ImNsdTcwM2xnazAwdHMya3BpamhmdjRvM3AifQ.V3d3rCH-FYb4s_e9fIzNxg"
							initialViewState={{
								longitude: location.lng,
								latitude: location.lat,
								zoom: zoom
							}}
							zoom={zoom}
							style={{width: 600, height: 400}}
							mapStyle="mapbox://styles/mapbox/streets-v9"
							onLoad={handleMapLoaded}
							dragRotate={false}

						/>
					</>
				)}
				<input 
					className="input-request" 
					type="text" 
					placeholder="Titre de la demande"
					value={titleRequest}
					onChange={(event) => setTitleRequest(event.target.value)}
					maxLength={50} 
				/>

				<textarea 
					className="text-request" 
					name="description" 
					id="description" 
					placeholder="Description de la demande"
					value={descriptionRequest}
					onChange={(event) => setDescriptionRequest(event.target.value)}
				>
						
				</textarea>
				{errorMessage && <p className="error-message">{errorMessage}</p>}
				{successMessage && <p className="success-message">{successMessage}</p>}
				<button className="request_submit" type="submit">Envoyer</button>
			</form>

		</div>
	);
}

export default Request;