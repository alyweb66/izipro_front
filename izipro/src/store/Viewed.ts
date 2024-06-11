import { create } from 'zustand';

// Array of viewed ClientMessage messages
type ViewedStore = {
    viewed: number[];
    setViewedStore: (data: number[]) => void;
    resetViewed: () => void;
}

// Create store for viewed messages
export const viewedClientMessageStore = create<ViewedStore>((set) => ({
	viewed: [],
	setViewedStore: (data) => set({ viewed: data }),
	resetViewed: () => set({ viewed: [] }),
}));


// Create store for viewed messages
export const viewedMyRequestMessageStore = create<ViewedStore>((set) => ({
	viewed: [],
	setViewedStore: (data) => set({ viewed: data }),
	resetViewed: () => set({ viewed: [] }),
}));


// Create store for viewed requests
export const viewedClientRequestStore = create<ViewedStore>((set) => ({
	viewed: [],
	setViewedStore: (data) => set({ viewed: data }),
	resetViewed: () => set({ viewed: [] }),
}));