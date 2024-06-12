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
                id
                user_1
                user_2
                request_id
                updated_at
            }
        }
    }
`;

export const MESSAGE_SUBSCRIPTION = gql`
    subscription Myrequest($conversation_ids: [Int!], $request_ids: [Int], $is_request: Boolean) {
        messageAdded(conversation_ids: $conversation_ids, request_ids: $request_ids, is_request: $is_request) {
            id
            content
            user_id
            conversation_id
            request_id
            created_at
            viewed
            media {
                id
                url
                name
            }
        }
    }
`;




