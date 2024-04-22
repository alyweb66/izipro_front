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
            first_name
            last_name
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
            conversation {
                user_1
                user_2
            }
        }
    }
`;

export const MESSAGE_SUBSCRIPTION = gql`
    subscription Subscription($conversation_ids: [Int!]) {
        messageAdded(conversation_ids: $conversation_ids) {
            id
            content
            user_id
            conversation_id
            request_id
            created_at
            media {
                id
                url
                name
            }
        }
    }
`;


