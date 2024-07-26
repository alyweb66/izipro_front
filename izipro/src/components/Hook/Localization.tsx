export const Localization = async (address: string, city: string, postal_code: string) => {
	const mapboxAccessToken = import.meta.env.VITE_MAPBOX_TOKEN;
	const mapboxUrl = import.meta.env.VITE_MAPBOX_URL;

	if (address && city && postal_code) {
		// transform address to coordinates with Mapbox API
		
		const formattedAddress = `country=fr&address_line1=${encodeURIComponent(address)}&postcode=${encodeURIComponent(postal_code)}&place=${encodeURIComponent(city)}`;
		const url = `${mapboxUrl}${formattedAddress}&access_token=${mapboxAccessToken}`;
		
		const response = await fetch(url);
		const data = await response.json();



		if (data.features && data.features.length > 0) {
			const [longitude, latitude] = data.features[0].geometry.coordinates;
			//setLocation({ lng: longitude, lat: latitude });
			return { lng: longitude, lat: latitude };
		} else {
			throw new Error('Unable to geocode address');
		}
	
	}
};

