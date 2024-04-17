import { create } from 'zustand';
import { RequestSoreProps } from '../Type/Request';

type RequestStore = RequestSoreProps & {
    setRequest: (data: RequestSoreProps['request']) => void;
}

export const requestDataStore = create<RequestStore>((set) => ({
	request:{
		id:0,
		urgent: false,
		title: '',
		message: '',
		first_name: '',
		last_name: '',
		city: '',
		lng: 0,
		lat: 0,
		range: 0,
		user_id: 0,
		job_id: 0,
		job: '',
		media: [{
			id: 0,
			url: '',
			name: '',
		}],
		created_at: '',
	},

	setRequest: (data) => set({ request: data }),
    
	
}));

