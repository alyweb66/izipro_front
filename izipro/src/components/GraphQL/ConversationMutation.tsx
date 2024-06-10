import { gql } from '@apollo/client';

export const CONVERSATION_MUTATION = gql`
    mutation CreateConversation($id:Int!, $input: ConversationInput!) {
      createConversation(id: $id, input: $input) {
        id
        updated_at
        user_1
        user_2
      }
}
`;

export const MESSAGE_MUTATION = gql`
    mutation Message($id: Int!, $input: NewMessageInput!) {
      createMessage(id: $id, input: $input) 
  
}
`;