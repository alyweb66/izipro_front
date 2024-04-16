import { gql } from '@apollo/client';

export const REQUEST_SUBSCRIPTION = gql`
    subscription ClientRequests($ids: [Int!]) {
        requestAdded(ids: $ids) {
            id
            urgent
            title
            message
            lng
            lat
            city
            range
            user_id
            job_id
            job 
            media {
                id
                url
                name
            }
            created_at
        }
    }
`;



