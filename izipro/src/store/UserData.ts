import { create } from 'zustand';
import { UserDataProps } from '../Type/User';
import { LocationProps } from '../Type/User';


type UserDataStore = UserDataProps & {
	setId: (id: number) => void;
	setFirstName: (first_name: string | '') => void;
	setLastName: (last_name: string | '') => void;
	setEmail: (email: string) => void;
	setAddress: (address: string | '') => void;
	setPostalCode: (postal_code: string | '') => void;
	setCity: (city: string | '') => void;
	setLocalization: (localization: LocationProps) => void;
	setSiret: (siret: string) => void;
	setDenomination: (denomination: string | '') => void;
	setRole: (role: string | '') => void;
	initialData: UserDataProps;
	setInitialData: (data: UserDataProps) => void;
	setAll: (data: UserDataProps) => void;
	setJobs: (jobs: Array<{ job_id: number}>) => void;
	setSettings: (settings: Array<{ range: number}>) => void;
	resetUserData: () => void;

}

type ChangeForgotPasswordProps = {
	isChangePassword: boolean;
	setIsChangePassword: (isChangePassword: boolean) => void;
}

export const changeForgotPasswordStore = create<ChangeForgotPasswordProps>((set) => ({
	isChangePassword: false,
	setIsChangePassword: (isChangePassword) => set({ isChangePassword })
}));


// store creation for user data
export const userDataStore = create<UserDataStore>((set) => ({
	id: 0,
	first_name: '',
	last_name: '',
	email: '',
	address: '',
	postal_code: '',
	city: '',
	localization: {lat: null, lng: null},
	siret: '',
	denomination: '',
	role: '',
	jobs: [],
	settings: [],

	initialData: {
		id: 0,
		first_name: '',
		last_name: '',
		email: '',
		address: '',
		postal_code: '',
		city: '',
		localization: {lat: null, lng: null},
		siret: '',
		denomination: '',
		role: '',
		jobs: [],
		settings: []
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
				localization: data.localization,
				siret: data.siret,
				denomination: data.denomination,
				role: data.role,
				jobs: data.jobs,
				settings: data.settings

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
	setLocalization: (localization) => set({ localization }),
	setSiret: (siret) => set({ siret }),
	setDenomination: (denomination) => set({ denomination }),
	setRole: (role) => set({ role }),
	setJobs: (jobs) => set({ jobs }),
	setSettings: (settings) => set({ settings }),

	resetUserData: () => set({ id: 0, first_name: '', last_name: '', email: '', address: '', postal_code: '', city: '', localization: {lat: null, lng: null} , siret: '', denomination: '', jobs: [], settings: [] })

}));

  


