import { gql } from '@apollo/client';

export const GET_JOB_CATEGORY = gql`
    query Categories {
        categories {
            id
            name
        }
   } 
`;	

export const GET_JOBS_BY_CATEGORY = gql`
    query Jobs($categoryId: Int!) {
    category(id: $categoryId) {
        jobs {
        id
        name
        description
        }
    }
}
`;

export const GET_USER_REQUESTS = gql`
    query User($requestsId: Int) {
    user {
        id
        requests(id: $requestsId) {
            id
            urgent
            title
            message
            localization
            range
            user_id
            job_id
            job 
            media {
                url
                name
            }
            created_at
        }
    }
}
`;