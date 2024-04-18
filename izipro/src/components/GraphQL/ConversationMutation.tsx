import { gql } from '@apollo/client';

export const CONVERSATION_MUTATION = gql`
    mutation CreateConversation($input: ConversationInput!) {
      createConversation(input: $input) {
        id
        user_1
        user_2
      }
}
`;