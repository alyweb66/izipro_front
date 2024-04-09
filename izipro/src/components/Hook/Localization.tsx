export const Localization = async (address: string, city: string, postal_code: string) => {

	if (address && city && postal_code) {
		// transform address to coordinates with Mapbox API
		
		const formattedAddress = `${address}, ${postal_code} ${city}`;
		const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(formattedAddress)}.json?access_token=pk.eyJ1IjoiYWx5d2ViIiwiYSI6ImNsdTcwM2xnazAwdHMya3BpamhmdjRvM3AifQ.V3d3rCH-FYb4s_e9fIzNxg`;

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