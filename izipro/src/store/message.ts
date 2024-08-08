import { create } from 'zustand';
import { MessageProps } from '../Type/message';

type MessageStore = {
    messages: MessageProps[];
    setMessageStore: (data: MessageProps[]) => void;
    resetMessage: () => void;
}

export const messageDataStore = create<MessageStore>((set) => ({
	messages: [],
	setMessageStore: (data) => set({ messages: data }),
	resetMessage: () => set({ messages: [] }),
}));

export const myMessageDataStore = create<MessageStore>((set) => ({
	messages: [],
	setMessageStore: (data) => set({ messages: data }),
	resetMessage: () => set({ messages: [] }),
}));