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

type LocationProps = {
	lat: number | null;
	lng: number | null;
}

export type { UserDataProps, LocationProps };