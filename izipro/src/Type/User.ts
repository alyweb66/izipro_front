
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
	jobs: Array<{ job_id: number}>;
	settings: Array<{ range: number}>;
	

}


export type { UserDataProps };