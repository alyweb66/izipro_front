type LocationProps = {
	lat: number | null;
	lng: number | null;
}

type UserDataProps = {
	id: number;
	first_name: string | null;
	last_name: string | null;
	email: string;
	address: string | null;
	postal_code: string | null;
	city: string | null;
	localization: LocationProps | null;
	siret: string;
	denomination: string | null;
	role: string;
	jobs: Array<{ job_id: number}>;
	settings: Array<{ range: number}>;
	

}


export type { UserDataProps, LocationProps };