type RequestProps = {
	id: number
    urgent: boolean
    title: string
    message: string
    first_name: string
    last_name: string
    city: string
    lng: number
	lat: number
    range: number
    user_id: number
    job_id: number
    job: string
    media: {
        id: number
		url: string
		name: string
        
	
	}[]
    created_at: string
    conversation: {
        id: number
        user_1: number
        user_2: number
        updated_at: string
    }[]
};

type RequestSoreProps = {
    request: {
        id: number
        urgent: boolean
        title: string
        message: string
        first_name: string
        last_name: string
        city: string
        lng: number
        lat: number
        range: number
        user_id: number
        job_id: number
        job: string
        media: {
            id: number
            url: string
            name: string
        
        }[]
        created_at: string
        conversation: {
            id: number
            user_1: number
            user_2: number
            updated_at: string
        }[]
    }
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

export type { CategoryPros, JobProps, RequestProps,RequestSoreProps };