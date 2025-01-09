type RequestProps = {
	id: number
    urgent: boolean
    title: string
    message: string
    first_name: string
    last_name: string
    denomination: string
    image: string
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
        request_id: number
        updated_at: string
    }[]
    deleted_at: string
};

type RequestSoreProps = {
    request: {
        id: number
        urgent: boolean
        title: string
        message: string
        first_name: string
        last_name: string
        denomination: string
        image: string
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
            request_id: number
            updated_at: string
        }[]
        deleted_at: string
    }
};


type CategoryProps = {
	id: number;
	name: string;
}

type JobProps = {
	id: number;
	name: string;
    category_id: number;
}

export type { CategoryProps, JobProps, RequestProps,RequestSoreProps };