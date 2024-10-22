
export const Localization = async (address: string, city: string, postal_code: string, setError: Function) => {
	// API URL
	const APIUrl = import.meta.env.VITE_API_ADRESSE_URL;
	// to use in local not in production
	const trimmedAddress = address.trim();
    const trimmedCity = city.trim();
    const trimmedPostalCode = postal_code.trim();


		// Normalize the string to compare the values
		const normalizeString = (value: string) => {
			return value
				.normalize('NFD') // Canonical decomposition
				.replace(/[\u0300-\u036f]/g, '') // Delete accents
				.toLowerCase(); // Convert to lowercase
		};

		if (address && city && postal_code) {
			// transform address to coordinates with adresse.data.gouv.fr API
			const formattedAddress = `${encodeURIComponent(trimmedAddress)}+${encodeURIComponent(trimmedPostalCode)}+${encodeURIComponent(trimmedCity)}`;

			const url = `${APIUrl}?q=${formattedAddress}`;

			let data;
			try {
				const response = await fetch(url);
			  
				// Vérifiez si la réponse est correcte
				if (!response.ok) {
				  throw new Error(`HTTP error! status: ${response.status}`);
				}
			  
				data = await response.json();

			  } catch (error) {
				console.error('Fetch error:', error);
			  }

			// check if the city and postal code match the provided values
			if (data.features && data.features.length > 0) {
				const feature = data.features[0];
				const [longitude, latitude] = feature.geometry.coordinates;

				const { city: cityAPI, postcode: postcodeAPI, name: nameAPI } = feature.properties;
				
				// Comparer les valeurs extraites avec celles fournies
				if (postcodeAPI.trim() === postal_code.trim() &&
				normalizeString(cityAPI.trim()) === normalizeString(city.trim()) &&
				normalizeString(nameAPI.trim()) === normalizeString(address.trim())) {

					return { lng: longitude, lat: latitude };
				} else {
					//setError(`Adresse non valide, voulez vous dire : "${feature.properties.label}" ?`)
					return { city: cityAPI, postcode: postcodeAPI, name: nameAPI, label: feature.properties.label };
				}
			} else {
				throw Error('Unable to geocode address');
			}

		}

};

