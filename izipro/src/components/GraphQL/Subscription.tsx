import { gql } from '@apollo/client';

export const REQUEST_SUBSCRIPTION = gql`
    subscription Subscription ($ids: [Int!], $offset: Int, $limit: Int) {
        requestAdded(ids: $ids, offset: $offset, limit: $limit) {
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


