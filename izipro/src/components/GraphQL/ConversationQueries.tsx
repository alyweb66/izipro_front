import { gql } from '@apollo/client';

export const GET_CONVERSATION = gql`
    query Conversation($id: Int!) {
        conversation(id: $id) {
            id
            user_1
            user_2
            request_id
            viewed_message
            updated_at
        }
    }
`;