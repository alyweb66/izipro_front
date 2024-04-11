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
    query User($requestsId: Int!, $offset: Int!, $limit: Int!) {
        user {
            id
            requests(id: $requestsId, offset: $offset, limit: $limit) {
                id
                urgent
                title
                message
                lng
                lat
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

export const GET_REQUEST_BY_JOB = gql`
    query RequestsByJob($ids: [Int!], $offset: Int, $limit: Int) {
        requestsByJob(ids: $ids, offset: $offset, limit: $limit) {
            id
            urgent
            title
            message
            lng
            lat
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

`;