
type UserDataProps = {
	id: number;
	first_name: string | null;
	last_name: string | null;
	email: string;
	address: string | null;
	postal_code: string | null;
	city: string | null;
	lng: number | null;
	lat: number | null;
	siret: string;
	denomination: string | null;
	description: string | null;
	image: string | null;
	role: string;
	CGU: boolean | null;
	jobs: Array<{ job_id: number}>;
	settings: Array<{ range: number}>;
	deleted_at: string | null;
	

}

type UserAccountDataProps = {
	id?: number;
	first_name: string | null;
	last_name: string | null;
	email: string;
	address: string | null;
	postal_code: string | null;
	city: string | null;
	siret: string;
	denomination: string | null;
	description: string | null;
	image: string | null;
	lng?: number | null;
	lat?: number | null;
	role?: string;
	CGU?: boolean | null;
	jobs?: Array<{ job_id: number}>;
	settings?: Array<{ range: number}>;
	deleted_at?: string | null;
}


export type { UserDataProps, UserAccountDataProps };