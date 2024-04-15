import { gql } from '@apollo/client';

export const REQUEST_SUBSCRIPTION = gql`
    subscription ClientRequests {
        requestAdded {
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
                id
                url
                name
            }
            created_at
        }
    }
`;



