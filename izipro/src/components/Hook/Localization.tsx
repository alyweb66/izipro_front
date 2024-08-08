

export const Localization = async (address: string, city: string, postal_code: string, setError: Function) => {
	const mapboxAccessToken = import.meta.env.VITE_MAPBOX_TOKEN;
	const mapboxUrl = import.meta.env.VITE_MAPBOX_URL;
	// to use in local not in production

	if (address && city && postal_code) {
		// transform address to coordinates with Mapbox API

		const formattedAddress = `country=fr&address_line1=${encodeURIComponent(address)}&postcode=${encodeURIComponent(postal_code)}&place=${encodeURIComponent(city)}`;
		const url = `${mapboxUrl}${formattedAddress}&access_token=${mapboxAccessToken}`;
		
		const response = await fetch(url);
		const data = await response.json();

		// check if the city and postal code match the provided values
		if (data.features && data.features.length > 0) {
			const feature = data.features[0];
			const [longitude, latitude] = feature.geometry.coordinates;

			// Extract postal code and city from the formatted address
			const placeFormatted = feature.properties.place_formatted;
			//	get only the postal code 
			const postalCodeMatch = placeFormatted.match(/(\d{5})/);

			//	get only the city
			const cityMatch = placeFormatted.match(/(\d{5})\s(.+),\sFrance/);
			const extractedPostalCode = postalCodeMatch ? postalCodeMatch[1] : '';
			const extractedCity = cityMatch ? cityMatch[2] : '';


			// Comparer les valeurs extraites avec celles fournies
			if (extractedPostalCode === postal_code && extractedCity.toLowerCase() === city.toLowerCase()) {

				return { lng: longitude, lat: latitude };
			} else {
				setError('Adresse non valide')
				throw new Error('City or postal code does not match the provided values');
			}
		} else {
			throw new Error('Unable to geocode address');
		}

	}
};

