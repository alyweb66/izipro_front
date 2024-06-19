import { gql } from '@apollo/client';

export const GET_MY_MESSAGES_BY_CONVERSATION = gql`
  query MessageByConversation($conversationId: Int!, $offset: Int, $limit: Int) {
    messages(conversationId: $conversationId, offset: $offset, limit: $limit) {
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

export const GET_MESSAGES_BY_CONVERSATION = gql`
  query User( $conversationId: Int!, $offset: Int!, $limit: Int!) {
      user {
        messages(conversationId: $conversationId, offset: $offset, limit: $limit) {
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
}
`;