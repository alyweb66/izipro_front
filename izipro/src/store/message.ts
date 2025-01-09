import { create } from 'zustand';
import { MessageProps } from '../Type/message';

export type MessageStore = {
    messages: MessageProps[];
    setMessageStore: (data: MessageProps[]) => void;
    resetMessage: () => void;
}

type MessageConvIdStore = {
	convId: number[];
	setConvId: (data: number[]) => void;
	resetMessageMyConvId?: () => void;
	resetMessageMyReqConvId?: () => void;
};

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



export const messageConvIdMyConvStore = create<MessageConvIdStore>((set) => ({
	convId: [],
	setConvId: (data) => set({ convId: data }),
	resetMessageMyConvId: () => set({ convId: [] }),
}));

export const messageConvIdMyreqStore = create<MessageConvIdStore>((set) => ({
	convId: [],
	setConvId: (data) => set({ convId: data }),
	resetMessageMyReqConvId: () => set({ convId: [] }),
}));