export const Localization = async (address: string, city: string, postal_code: string) => {

	if (address && city && postal_code) {
		// transform address to coordinates with Mapbox API
		
		const formattedAddress = `country=fr&address_line1=${encodeURIComponent(address)}&postcode=${encodeURIComponent(postal_code)}&place=${encodeURIComponent(city)}`;
		const url = `https://api.mapbox.com/search/geocode/v6/forward?${formattedAddress}&access_token=pk.eyJ1IjoiYWx5d2ViIiwiYSI6ImNsdTcwM2xnazAwdHMya3BpamhmdjRvM3AifQ.V3d3rCH-FYb4s_e9fIzNxg`;
		
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

/* export const SuggestionLocalization = async (address?: string, city?: string, postal_code?: string) => {

	if (address || city || postal_code) {
		// transform address to coordinates with Mapbox API
		
		//const formattedAddress = `${address}, ${postal_code} ${city}`;
		let url = '';
		if (address) {
			url = `https://api.mapbox.com/search/geocode/v6/forward?country=fr&autocomplete=true&address_line1=${encodeURIComponent(address)}&access_token=pk.eyJ1IjoiYWx5d2ViIiwiYSI6ImNsdTcwM2xnazAwdHMya3BpamhmdjRvM3AifQ.V3d3rCH-FYb4s_e9fIzNxg`;
		}

		if (city) {
			url = `https://api.mapbox.com/search/geocode/v6/forward?place=${city}?access_token=pk.eyJ1IjoiYWx5d2ViIiwiYSI6ImNsdTcwM2xnazAwdHMya3BpamhmdjRvM3AifQ.V3d3rCH-FYb4s_e9fIzNxg`;
		}

		if (postal_code) {
			url = `https://api.mapbox.com/search/geocode/v6/forward?postcode=${postal_code}?access_token=pk.eyJ1IjoiYWx5d2ViIiwiYSI6ImNsdTcwM2xnazAwdHMya3BpamhmdjRvM3AifQ.V3d3rCH-FYb4s_e9fIzNxg`;
		}

		const response = await fetch(url);
		const data = await response.json();
		console.log('dataSuggestion', data);
		

		if (data.features && data.features.length > 0) {
			const suggestions = data.features.map((feature: any) => {
				const address = feature.place_name;
				const context = feature.context || [];
				const city = context.find((c: any) => c.id.startsWith('place'))?.text || '';
				const postal_code = context.find((c: any) => c.id.startsWith('postcode'))?.text || '';
				return { address, city, postal_code };
			});
			console.log('suggestions', suggestions);
			
			return { suggestions };
		} else {
			throw new Error('Unable to geocode address');
		}
	
	}
};
 */