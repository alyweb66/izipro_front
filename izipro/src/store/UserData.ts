import { create } from 'zustand';

type UserDataProps = {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    address: string;
    postal_code: string;
    city: string;
    siret: string;
    denomination: string;
	
}

type UserDataStore = UserDataProps & {
    setId: (id: number) => void;
    setFirstName: (first_name: string) => void;
    setLastName: (last_name: string) => void;
    setEmail: (email: string) => void;
    setAddress: (address: string) => void;
    setPostalCode: (postal_code: string) => void;
    setCity: (city: string) => void;
    setSiret: (siret: string) => void;
    setDenomination: (denomination: string) => void;
	initialData: UserDataProps;
	setInitialData: (data: UserDataProps) => void;
	setAll: (data: UserDataProps) => void;

}

// store creation for user data
export const userDataStore = create<UserDataStore>((set) => ({
	id: 0,
	first_name: '',
	last_name: '',
	email: '',
	address: '',
	postal_code: '',
	city: '',
	siret: '',
	denomination: '',

	initialData: {
		id: 0,
		first_name: '',
		last_name: '',
		email: '',
		address: '',
		postal_code: '',
		city: '',
		siret: '',
		denomination: '',
	},
	
	setAll: (data) => set(state => ({
		...state,
		id: data.id,
		first_name: data.first_name,
		last_name: data.last_name,
		email: data.email,
		address: data.address,
		postal_code: data.postal_code,
		city: data.city,
		siret: data.siret,
		denomination: data.denomination,
	})),

	setInitialData: (data) => set({ initialData: data }),

	

	setId: (id) => set({ id }),
	setFirstName: (first_name) => set({ first_name }),
	setLastName: (last_name) => set({ last_name }),
	setEmail: (email) => set({ email }),
	setAddress: (address) => set({ address }),
	setPostalCode: (postal_code) => set({ postal_code }),
	setCity: (city) => set({ city }),
	setSiret: (siret) => set({ siret }),
	setDenomination: (denomination) => set({ denomination }),
    
	resetUserData: () => set({ id: 0, first_name: '', last_name: '', email: '', address: '', postal_code: '', city: '', siret: '', denomination: '' })
    
}));

