import { gql } from '@apollo/client';

export const CONVERSATION_MUTATION = gql`
    mutation CreateConversation($id:Int!, $input: ConversationInput!) {
      createConversation(id: $id, input: $input) {
        id
        user_1
        user_2
        request_id
        updated_at
      }
}
`;

export const DELETE_NOT_VIEWED_CONVERSATION_MUTATION = gql`
  mutation DeleteNotViewedConversation($input: UserHasNotViewedConversationInput!) {
    deleteNotViewedConversation(input: $input)
  }
`;