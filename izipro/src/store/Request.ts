import { create } from 'zustand';
import { RequestSoreProps, RequestProps } from '../Type/Request';

type RequestStore = RequestSoreProps & {
    setRequest: (data: RequestSoreProps['request']) => void;

	resetRequest: () => void;
	
}

type RequestConversationStore = {
	requests: RequestProps[];
	setRequestConversation: (data: RequestProps[]) => void;
	resetRequestConversation: () => void;
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
		conversation: [{
			id: 0,
			user_1: 0,
			user_2: 0,
		}],
	},

	setRequest: (data) => set({ request: data }),
	resetRequest: () => set({ 
		request: {
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
			media: [{id: 0, url: '', name: ''}], 
			created_at: '', 
			conversation: [{id: 0, user_1: 0, user_2: 0}]
		} 
	})
    
	
}));

export const requestConversationStore = create<RequestConversationStore>((set) => ({
	requests:[],
	setRequestConversation: (data) => set({ requests: data }),
	resetRequestConversation: () => set({ requests: []})
	
	
}));