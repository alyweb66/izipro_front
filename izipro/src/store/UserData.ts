import { create } from 'zustand';

type UserDataProps = {
	id: number;
	first_name: string | null;
	last_name: string | null;
	email: string;
	address: string | null;
	postal_code: string | null;
	city: string | null;
	siret: string;
	denomination: string | null;
	role: string;


}

type UserDataStore = UserDataProps & {
	setId: (id: number) => void;
	setFirstName: (first_name: string | '') => void;
	setLastName: (last_name: string | '') => void;
	setEmail: (email: string) => void;
	setAddress: (address: string | '') => void;
	setPostalCode: (postal_code: string | '') => void;
	setCity: (city: string | '') => void;
	setSiret: (siret: string) => void;
	setDenomination: (denomination: string | '') => void;
	setRole: (role: string | '') => void;
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
	role:'',

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
		role:''
	},

	setAll: (data) => {
		if (data) {
			set(state => ({
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

			}));
		}
	},

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
	setRole: (role) => set ({ role }),

	resetUserData: () => set({ id: 0, first_name: '', last_name: '', email: '', address: '', postal_code: '', city: '', siret: '', denomination: '' })

}));

