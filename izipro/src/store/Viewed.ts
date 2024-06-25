import { create } from 'zustand';

// Array of viewed ClientMessage messages
type NotViewedStore = {
	notViewed: number[];
	setNotViewedStore: (data: number[]) => void;
	resetBotViewed: () => void;
}

// Create store for viewed messages
export const notViewedRequest = create<NotViewedStore>((set) => ({
	notViewed: [],
	setNotViewedStore: (data) => set({ notViewed: data }),
	resetBotViewed: () => set({ notViewed: [] }),
}));

// Create store for viewed messages
export const notViewedRequestRef = create<NotViewedStore>((set) => ({
	notViewed: [],
	setNotViewedStore: (data) => set({ notViewed: data }),
	resetBotViewed: () => set({ notViewed: [] }),
}));

// Create store for viewed messages
export const notViewedConversation = create<NotViewedStore>((set) => ({
	notViewed: [],
	setNotViewedStore: (data) => set({ notViewed: data }),
	resetBotViewed: () => set({ notViewed: [] }),
}));

export const requestConversationIds = create<NotViewedStore>((set) => ({
	notViewed: [],
	setNotViewedStore: (data) => set({ notViewed: data }),
	resetBotViewed: () => set({ notViewed: [] }),
}));

