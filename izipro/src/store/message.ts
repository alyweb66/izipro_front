import { create } from 'zustand';
import { MessageProps } from '../Type/message';

type MessageStore = {
    messages: MessageProps[];
    setMessageStore: (data: MessageProps[/* 'message' */]) => void;
    resetMessage: () => void;
}

export const messageDataStore = create<MessageStore>((set) => ({
	messages:[],/* {
		id: 0,
		content: '',
		user_id: 0,
		conversation_id: 0,
		created_at: '',
		media: [{
			id: 0,
			url: '',
			name: '',
		}],
	}, */

	setMessageStore: (data) => set({ messages: data }),
	resetMessage: () => set({
		messages:[] /* {
			id: 0,
			content: '',
			user_id: 0,
			conversation_id: 0,
			created_at: '',
			media: [{
				id: 0,
				url: '',
				name: '',
			}],
		} */
	})
}));