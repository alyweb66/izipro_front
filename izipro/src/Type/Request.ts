type RequestProps = {
	id: number
    urgent: boolean
    title: string
    message: string
    lng: number
	lat: number
    range: number
    user_id: number
    job_id: number
    job: string
    media: [{
        id: number
		url: string
		name: string
	
	}]
    created_at: string
};


type CategoryPros = {
	id: number;
	name: string;
}

type JobProps = {
	id: number;
	name: string;
	description: string;
}

export type { CategoryPros, JobProps, RequestProps };