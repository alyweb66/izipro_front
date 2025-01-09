import { create } from 'zustand';


type UserFormProps = {
	email: string;
	password: string;
	confirmPassword: string;
	siret: string;
	proEmail: string;
	proPassword: string;
	proConfirmPassword: string;
	isProfessional: boolean;
	userCreated: boolean;
	error: string;
	proUserError: string;
}

type ConfirmEmailProps = {
	isEmailConfirmed: boolean;
	setIsEmailConfirmed: (isEmailConfirmed: boolean) => void;
}

type ErrorResponse = {
	status: number;
	statusText: string;
	message: string;
	setServerError: ({ status, statusText, message }: { status: number; statusText: string, message:string }) => void;
	resetServerError: () => void;
}


type UserFormStore = UserFormProps & {
	setEmail: (email: string) => void;
	setPassword: (password: string) => void;
	setConfirmPassword: (confirmPassword: string) => void;
	setSiret: (siret: string) => void;
	setProEmail: (proEmail: string) => void;
	setProPassword: (proPassword: string) => void;
	setProConfirmPassword: (proConfirmPassword: string) => void;

	setIsProfessional: (isProfessional: boolean) => void;
	setError: (error: string) => void;
	setProUserError: (proUserError: string) => void;
}
// store creation for email confirmation
export const confirmEmailStore = create<ConfirmEmailProps>((set) => ({
	isEmailConfirmed: false,
	setIsEmailConfirmed: (isEmailConfirmed) => set({ isEmailConfirmed })
}));

// store creation for login and register function
export const userFormStore = create<UserFormStore>((set) => ({
	email: '',
	password: '',
	confirmPassword: '',
	siret: '',
	proEmail: '',
	proPassword: '',
	proConfirmPassword: '',
	isProfessional: false,
	userCreated: false,
	error: '',
	proUserError: '',

	setEmail: (email) => set({ email }),
	setPassword: (password) => set({ password }),
	setConfirmPassword: (confirmPassword) => set({ confirmPassword }),
	setSiret: (siret) => set({ siret }),
	setProEmail: (proEmail) => set({ proEmail }),
	setProPassword: (proPassword) => set({ proPassword }),
	setProConfirmPassword: (proConfirmPassword) => set({ proConfirmPassword }),
	setIsProfessional: (isProfessional) => set({ isProfessional }),
	setError: (error) => set({ error }),
	setProUserError: (proUserError) => set({ proUserError }),

	resetForm: () => set({
		email: '', password: '', confirmPassword: '',
		siret: '', proEmail: '', proPassword: '', isProfessional: false, userCreated: false, error: '', proUserError: ''
	})

}));

export const serverErrorStore = create<ErrorResponse>((set) => ({
	status: 0,
	statusText: '',
	message: '',
	setServerError: ({ status, statusText, message }: { status: number, statusText: string, message: string }) => set({ status, statusText, message }),
	resetServerError: () => set({ status: 0, statusText: '', message: '' })
}));
