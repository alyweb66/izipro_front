

export const Localization = async (address: string, city: string, postal_code: string, setError: Function) => {
	/* const mapboxAccessToken = import.meta.env.VITE_MAPBOX_TOKEN;
	const mapboxUrl = import.meta.env.VITE_MAPBOX_URL; */
	const APIUrl = import.meta.env.VITE_API_ADRESSE_URL;
	// to use in local not in production

	// Normalize the string to compare the values
	const normalizeString = (value: string) => {
		return value
			.normalize('NFD') // Canonical decomposition
			.replace(/[\u0300-\u036f]/g, '') // Delete accents
			.toLowerCase(); // Convert to lowercase
	};

	if (address && city && postal_code) {
		// transform address to coordinates with Mapbox API

		/* const formattedAddress = `country=fr&address_line1=${encodeURIComponent(address)}&postcode=${encodeURIComponent(postal_code)}&place=${encodeURIComponent(city)}`;
		const url = `${mapboxUrl}${formattedAddress}&access_token=${mapboxAccessToken}`; */
		const formattedAddress = `${encodeURIComponent(address)}+${encodeURIComponent(postal_code)}+${encodeURIComponent(city)}`;
		const url = `${APIUrl}?q=${formattedAddress}`;

		const response = await fetch(url);
		const data = await response.json();

		// check if the city and postal code match the provided values
		if (data.features && data.features.length > 0) {
			const feature = data.features[0];
			const [longitude, latitude] = feature.geometry.coordinates;

			/* // Extract postal code and city from the formatted address
			const placeFormatted = feature.properties.place_formatted;
			//	get only the postal code 
			const postalCodeMatch = placeFormatted.match(/(\d{5})/);

			//	get only the city
			const cityMatch = placeFormatted.match(/(\d{5})\s(.+),\sFrance/);
			const extractedPostalCode = postalCodeMatch ? postalCodeMatch[1] : '';
			const extractedCity = cityMatch ? cityMatch[2] : ''; */
			const { city: cityAPI, postcode: postcodeAPI, name: nameAPI } = feature.properties;
			// Normalize the string to compare
			const normalizedCityAPI = normalizeString(cityAPI);
			const normalizedCity = normalizeString(city);
			const normalizedAddressAPI = normalizeString(nameAPI);
			const normalizedAddress = normalizeString(address);

			// Comparer les valeurs extraites avec celles fournies
			/* if (extractedPostalCode === postal_code && extractedCity.toLowerCase() === city.toLowerCase()) { */
			if (postcodeAPI === postal_code && normalizedCityAPI === normalizedCity && normalizedAddressAPI === normalizedAddress) {

				return { lng: longitude, lat: latitude };
			} else {
				
				setError(`Adresse non valide, voulez vous dire : "${feature.properties.label}" ?`)
				throw Error('Address does not match the provided values');
			}
		} else {
			throw Error('Unable to geocode address');
		}

	}
};

