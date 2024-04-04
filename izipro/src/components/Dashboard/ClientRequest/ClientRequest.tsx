import { useEffect, useState } from 'react';
import { userDataStore } from '../../../store/UserData';
import { LocationProps } from '../../../Type/User';
import './clientRequest.scss';

function ClientRequest () {

	// State
	const [location, setLocation] = useState<LocationProps>({ lng: null, lat: null });
	const [error, setError] = useState<string | null>(null);
	//store
	const id = userDataStore((state) => state.id);
	const address = userDataStore((state) => state.address);
	const city = userDataStore((state) => state.city);
	const first_name = userDataStore((state) => state.first_name);
	const last_name = userDataStore((state) => state.last_name);
	const postal_code = userDataStore((state) => state.postal_code);
    
	// location
	useEffect(() => {

		if (address && city && postal_code) {
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
			// Get user's location by browser if no address
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(
					(position) => {
						setLocation({
							lat: position.coords.latitude,
							lng: position.coords.longitude,
						});
					},
					(error) => {
						throw new Error(error.message);
					},
				);
			} else {
				// Geolocation is not supported
				setError('Geolocation is not supported by your browser');
			}
		}
	}, [address, city, postal_code]);



	return (
		<div className="my_request-container">
			{!requests[0] && <p>Vous n&apos;avez pas de demande</p>}
			{getUserRequestsData && (
				<div> 
					{requests.map((request, index) => (
						<div key={index}>
							{/* Add a key prop */}
							<h1>{request.title}</h1>
							<p>{request.created_at}</p>
							<h2>{request.job}</h2>
							<p>{request.message}</p>
							<div>
								{request.media.map((image, index) => (
									<img key={index} src={image.url} alt={image.name} />
								))}
							</div>
							<button type='button' onClick={(event) => {handleDeleteRequest(event, request.id, request.media.map(image => image.name));}}>Supprimer la demande</button>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

export default ClientRequest;