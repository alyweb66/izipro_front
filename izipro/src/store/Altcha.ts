import { create } from 'zustand';



type Altcha = {
    payload: string | null;
    status: string | null;
	setPayload: (data: string | null) => void;
    setStatus: (data: string | null) => void;
};


export const AltchaStore = create<Altcha>((set) => ({
    payload: null,
    status: null,
    setPayload: (payload) => set({payload}),
    setStatus: (status) => set({status}),
}));


