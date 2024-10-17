import { gql } from '@apollo/client';

export const REQUEST_SUBSCRIPTION = gql`
    subscription ClientRequests($job_ids: [Int!], $user_id: Int!) {
        requestAdded(job_ids: $job_ids, user_id: $user_id) {
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
            media {
                id
                url
                name
                thumbnail
            }
        }
    }
`;

export const LOGOUT = gql`
    subscription Logout($user_id: Int!) {
        logout(user_id: $user_id) {
            id
            value
            multiple
            session
        }
    }
`;



