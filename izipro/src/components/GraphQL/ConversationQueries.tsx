import { gql } from '@apollo/client';

export const GET_CONVERSATION = gql`
    query Conversation($id: Int!) {
        conversation(id: $id) {
            id
            user_1
            user_2
            request_id
            sender
            updated_at
        }
    }
`;

export const NOT_VIEWED_CONVERSATIONS = gql`
    query NotViewedConversation {
    user {
        userHasNotViewedConversation {
        id
        conversation_id
        user_id
        created_at
        }
    }
}
`;

export const GET_CONVERSATION_ID = gql`
    query UserConversationId {
        user {
            conversationRequestIds
        }
    }
`;