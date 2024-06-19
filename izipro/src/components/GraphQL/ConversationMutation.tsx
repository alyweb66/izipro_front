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

export const MESSAGE_MUTATION = gql`
    mutation Message($id: Int!, $input: NewMessageInput!) {
      createMessage(id: $id, input: $input) 
  
}
`;

export const UPDATE_CONVERSATION_MUTATION = gql`
  mutation UpdateConversationMutation($input: UpdateConversationInput!) {
    updateConversation(input: $input)
  }
`;