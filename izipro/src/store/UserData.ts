import { create } from 'zustand';
import { UserDataProps } from '../Type/User';
import { CookieConsentsProps } from '../Type/CookieConsents';


type UserDataStore = UserDataProps & {
	setId: (id: number) => void;
	setFirstName: (first_name: string | '') => void;
	setLastName: (last_name: string | '') => void;
	setEmail: (email: string) => void;
	setAddress: (address: string | '') => void;
	setPostalCode: (postal_code: string | '') => void;
	setCity: (city: string | '') => void;
	setLng: (lng: number) => void;
	setLat: (lat: number) => void;
	setSiret: (siret: string) => void;
	setDenomination: (denomination: string | '') => void;
	setImage: (image: string | '') => void;
	setDescription: (description: string | '') => void;
	setRole: (role: string | '') => void;
	setAll: (data: UserDataProps) => void;
	setAccount: (data: UserDataProps) => void;
	setJobs: (jobs: Array<{ job_id: number }>) => void;
	setSettings: (settings: Array<{ range: number }>) => void;
	resetUserData: () => void;

}

type Rules = {
	CGU: string;
	cookies: string;
}

type ChangeForgotPasswordProps = {
	isChangePassword: boolean;
	setIsChangePassword: (isChangePassword: boolean) => void;
}

type UserConversationProps = {
	users: UserDataProps[];
	setUsers: (users: UserDataProps[]) => void;
	resetUsers: () => void;
}

type CookieConsentStore = CookieConsentsProps & {
	resetCookieConsents: () => void;
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
	lng: 0,
	lat: 0,
	siret: '',
	denomination: '',
	image: '',
	description: '',
	role: '',
	CGU: null,
	jobs: [],
	settings: [{ range: 0 }],
	deleted_at: '',

	setAccount: (data) => {
		if (data) {
			set(state => ({
				...state,
				first_name: data.first_name,
				last_name: data.last_name,
				email: data.email,
				address: data.address,
				postal_code: data.postal_code,
				city: data.city,
				lng: data.lng,
				lat: data.lat,
				siret: data.siret,
				denomination: data.denomination,
			}));
		}
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
				lng: data.lng,
				lat: data.lat,
				siret: data.siret,
				denomination: data.denomination,
				image: data.image,
				description: data.description,
				role: data.role,
				jobs: data.jobs,
				settings: data.settings,
				CGU: data.CGU,

			}));
		}
	},
	//setInitialData: (data) => set({ initialData: data }),
	setId: (id) => set({ id }),
	setFirstName: (first_name) => set({ first_name }),
	setLastName: (last_name) => set({ last_name }),
	setEmail: (email) => set({ email }),
	setAddress: (address) => set({ address }),
	setPostalCode: (postal_code) => set({ postal_code }),
	setCity: (city) => set({ city }),
	setLng: (lng) => set({ lng }),
	setLat: (lat) => set({ lat }),
	setSiret: (siret) => set({ siret }),
	setDenomination: (denomination) => set({ denomination }),
	setImage: (image) => set({ image }),
	setDescription: (description) => set({ description }),
	setRole: (role) => set({ role }),
	setJobs: (jobs) => set({ jobs }),
	setSettings: (settings) => set({ settings }),

	resetUserData: () => set({
		id: 0,
		first_name: '',
		last_name: '',
		email: '',
		address: '',
		postal_code: '',
		city: '',
		lng: 0,
		lat: 0,
		siret: '',
		denomination: '',
		jobs: [],
		settings: [],
		image: '',
		description: '',
		role: '',
		CGU: null,
		deleted_at: '',
	})

}));

export const userConversation = create<UserConversationProps>((set) => ({
	users: [],
	setUsers: (users) => set({ users }),
	resetUsers: () => set({ users: [] })

}));

export const rulesStore = create<Rules>(() => ({
	CGU: '',
	cookies: '',
}));

export const cookieConsents = create<CookieConsentStore>((set) => ({
	id: 0,
	user_id: 0,
	cookies_analytics: null,
	cookies_marketing: null,
	cookies_necessary: null,

	resetCookieConsents: () => set({
		id: 0,
		user_id: 0,
		cookies_analytics: null,
		cookies_marketing: null,
		cookies_necessary: null
	})
}));

type IsLoggedOutStore = {
	isLoggedOut: boolean;
	setIsLoggedOut: (isLoggedOut: boolean) => void;
}

export const isLoggedOutStore = create<IsLoggedOutStore>((set) => ({
	isLoggedOut: false,
	setIsLoggedOut: (isLoggedOut) => set({ isLoggedOut })
}));



